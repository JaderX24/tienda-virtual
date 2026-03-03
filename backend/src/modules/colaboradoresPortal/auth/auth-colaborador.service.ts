import {
    Injectable,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginColaboradorDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

// Claves de parámetros en tabla sistema_parametros
const CLAVE_INTENTOS_MAX = 'LOGIN_INTENTOS_MAX';
const CLAVE_BLOQUEO_MINUTOS = 'LOGIN_BLOQUEO_MINUTOS';

// Valores por defecto si no se encuentran en BD
const INTENTOS_MAX_DEFECTO = 5;
const BLOQUEO_MINUTOS_DEFECTO = 15;

// Duración del caché de parámetros en milisegundos (5 minutos)
const CACHE_PARAMETROS_TTL = 5 * 60 * 1000;

interface RegistroIntento {
    intentos: number;
    ultimoIntento: Date;
    bloqueadoHasta?: Date;
}

interface CacheParametro {
    valor: number;
    expiraEn: Date;
}

@Injectable()
export class AuthColaboradorService {
    private readonly logger = new Logger(AuthColaboradorService.name);
    private intentosFallidos: Map<string, RegistroIntento> = new Map();
    private cacheParametros: Map<string, CacheParametro> = new Map();

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async login(loginDto: LoginColaboradorDto, ip?: string, userAgent?: string) {
        const { correo, contrasena } = loginDto;

        await this.verificarBloqueo(correo);

        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { correo },
            include: {
                roles: {
                    where: { esPrincipal: true },
                    include: {
                        rol: {
                            include: {
                                rolesPermisos: {
                                    include: {
                                        permiso: true,
                                    },
                                },
                            },
                        },
                    },
                },
                permisosDirectos: {
                    where: {
                        tipo: 'otorgado',
                        OR: [
                            { fechaFin: null },
                            { fechaFin: { gt: new Date() } },
                        ],
                    },
                    include: {
                        permiso: true,
                    },
                },
            },
        });

        if (!usuario) {
            await this.registrarIntentoFallido(correo);
            await this.registrarBitacora(null, 'login_fallido', ip, userAgent, correo, 'warn');
            throw new UnauthorizedException(MENSAJES_ERROR.CREDENCIALES_INVALIDAS);
        }

        if (!usuario.esActivo) {
            await this.registrarBitacora(usuario.id, 'login_cuenta_inactiva', ip, userAgent, correo, 'warn');
            throw new UnauthorizedException(MENSAJES_ERROR.CUENTA_INACTIVA);
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);

        if (!contrasenaValida) {
            await this.registrarIntentoFallido(correo);
            await this.registrarBitacora(usuario.id, 'login_fallido', ip, userAgent, correo, 'warn');
            throw new UnauthorizedException(MENSAJES_ERROR.CREDENCIALES_INVALIDAS);
        }

        this.limpiarIntentosFallidos(correo);

        // Obtener rol principal
        const rolPrincipal = usuario.roles[0]?.rol || null;

        // Combinar permisos del rol y permisos directos
        const permisosRol = rolPrincipal?.rolesPermisos?.map((rp) => rp.permiso.codigo) || [];
        const permisosDirectos = usuario.permisosDirectos?.map((up) => up.permiso.codigo) || [];
        const permisos = [...new Set([...permisosRol, ...permisosDirectos])];

        const tokens = await this.generarTokens(
            usuario.id,
            usuario.correo,
            rolPrincipal?.codigo || '',
            permisos,
        );

        await this.registrarSesion(usuario.id, tokens.accessToken, tokens.refreshToken, ip || '', userAgent);

        await this.prisma.colabUsuario.update({
            where: { id: usuario.id },
            data: { ultimoAcceso: new Date() },
        });

        await this.registrarBitacora(usuario.id, 'login_exitoso', ip, userAgent, correo, 'info');

        this.logger.log(`Login colaborador exitoso: ${correo}`);

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.LOGIN_EXITOSO,
            usuario: {
                id: usuario.id,
                nombre: `${usuario.nombre} ${usuario.apellido}`,
                correo: usuario.correo,
                avatar: usuario.avatarUrl,
                rol: rolPrincipal
                    ? { codigo: rolPrincipal.codigo, nombre: rolPrincipal.nombre }
                    : null,
                permisos,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: this.obtenerTiempoExpiracion(),
        };
    }

    async cerrarSesion(usuarioId: number, token: string) {
        const tokenHash = this.hashearToken(token);

        await this.prisma.colabSesion.updateMany({
            where: {
                usuarioId,
                tokenHash,
                esActiva: true,
            },
            data: {
                esActiva: false,
                cerradaEn: new Date(),
                motivoCierre: 'logout',
            },
        });

        this.logger.log(`Sesión cerrada para colaborador ID: ${usuarioId}`);

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.LOGOUT_EXITOSO,
        };
    }

    async refrescarToken(refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
        }

        const refreshTokenHash = this.hashearToken(refreshToken);

        const sesion = await this.prisma.colabSesion.findFirst({
            where: {
                refreshTokenHash,
                esActiva: true,
            },
            include: {
                usuario: {
                    include: {
                        roles: {
                            where: { esPrincipal: true },
                            include: {
                                rol: {
                                    include: {
                                        rolesPermisos: {
                                            include: {
                                                permiso: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        permisosDirectos: {
                            where: {
                                tipo: 'otorgado',
                                OR: [
                                    { fechaFin: null },
                                    { fechaFin: { gt: new Date() } },
                                ],
                            },
                            include: {
                                permiso: true,
                            },
                        },
                    },
                },
            },
        });

        if (!sesion) {
            throw new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
        }

        if (new Date() > sesion.expiraEn) {
            await this.prisma.colabSesion.update({
                where: { id: sesion.id },
                data: {
                    esActiva: false,
                    cerradaEn: new Date(),
                    motivoCierre: 'expirada',
                },
            });
            throw new UnauthorizedException(MENSAJES_ERROR.SESION_EXPIRADA);
        }

        const usuario = sesion.usuario;

        if (!usuario.esActivo) {
            throw new UnauthorizedException(MENSAJES_ERROR.CUENTA_INACTIVA);
        }

        const rolPrincipal = usuario.roles[0]?.rol || null;
        const permisosRol = rolPrincipal?.rolesPermisos?.map((rp) => rp.permiso.codigo) || [];
        const permisosDirectos = usuario.permisosDirectos?.map((up) => up.permiso.codigo) || [];
        const permisos = [...new Set([...permisosRol, ...permisosDirectos])];

        const nuevoAccessToken = await this.generarAccessToken(
            usuario.id,
            usuario.correo,
            rolPrincipal?.codigo || '',
            permisos,
        );

        // Actualizar última actividad de la sesión
        await this.prisma.colabSesion.update({
            where: { id: sesion.id },
            data: { ultimaActividad: new Date() },
        });

        return {
            exito: true,
            accessToken: nuevoAccessToken,
            expiresIn: this.obtenerTiempoExpiracion(),
        };
    }

    async obtenerSesionesActivas(usuarioId: number) {
        const sesiones = await this.prisma.colabSesion.findMany({
            where: {
                usuarioId,
                esActiva: true,
                expiraEn: { gt: new Date() },
            },
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                creadoEn: true,
                expiraEn: true,
                ultimaActividad: true,
            },
            orderBy: { creadoEn: 'desc' },
        });

        return {
            exito: true,
            sesiones: sesiones.map((s) => ({
                id: s.id,
                ip: s.ipAddress,
                userAgent: s.userAgent,
                creadoEn: s.creadoEn,
                expiraEn: s.expiraEn,
                ultimaActividad: s.ultimaActividad,
            })),
        };
    }

    async cerrarTodasLasSesiones(usuarioId: number) {
        await this.prisma.colabSesion.updateMany({
            where: {
                usuarioId,
                esActiva: true,
            },
            data: {
                esActiva: false,
                cerradaEn: new Date(),
                motivoCierre: 'cierre_total',
            },
        });

        this.logger.log(`Todas las sesiones cerradas para colaborador ID: ${usuarioId}`);

        return {
            exito: true,
            mensaje: 'Todas las sesiones han sido cerradas',
        };
    }

    private async generarTokens(
        usuarioId: number,
        correo: string,
        rol: string,
        permisos: string[],
    ) {
        const payload = {
            sub: usuarioId,
            correo,
            rol,
            permisos,
        };

        const accessSecret = this.configService.get<string>('jwt.accessSecret');
        const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
        const accessExpiracion = this.configService.get<string>('jwt.accessExpiracion') || '15m';
        const refreshExpiracion = this.configService.get<string>('jwt.refreshExpiracion') || '7d';

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: accessSecret,
                expiresIn: accessExpiracion,
            }),
            this.jwtService.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: refreshExpiracion,
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async generarAccessToken(
        usuarioId: number,
        correo: string,
        rol: string,
        permisos: string[],
    ) {
        const payload = {
            sub: usuarioId,
            correo,
            rol,
            permisos,
        };

        const accessSecret = this.configService.get<string>('jwt.accessSecret');
        const accessExpiracion = this.configService.get<string>('jwt.accessExpiracion') || '15m';

        return this.jwtService.signAsync(payload, {
            secret: accessSecret,
            expiresIn: accessExpiracion,
        });
    }

    private async registrarSesion(
        usuarioId: number,
        accessToken: string,
        refreshToken: string,
        ip: string,
        userAgent?: string,
    ) {
        const refreshExpiracion = this.configService.get<string>('jwt.refreshExpiracion') || '7d';
        const diasExpiracion = parseInt(refreshExpiracion) || 7;
        const expiraEn = new Date();
        expiraEn.setDate(expiraEn.getDate() + diasExpiracion);

        // Limpiar sesiones expiradas o inactivas del usuario
        await this.prisma.colabSesion.updateMany({
            where: {
                usuarioId,
                OR: [
                    { expiraEn: { lt: new Date() } },
                    { esActiva: false },
                ],
            },
            data: {
                esActiva: false,
                cerradaEn: new Date(),
                motivoCierre: 'expirada',
            },
        });

        // Verificar límite de sesiones simultáneas
        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { id: usuarioId },
            select: { maxSesionesSimultaneas: true },
        });

        const sesionesActivas = await this.prisma.colabSesion.count({
            where: { usuarioId, esActiva: true },
        });

        if (usuario && sesionesActivas >= usuario.maxSesionesSimultaneas) {
            // Cerrar la sesión más antigua
            const sesionMasAntigua = await this.prisma.colabSesion.findFirst({
                where: { usuarioId, esActiva: true },
                orderBy: { creadoEn: 'asc' },
            });

            if (sesionMasAntigua) {
                await this.prisma.colabSesion.update({
                    where: { id: sesionMasAntigua.id },
                    data: {
                        esActiva: false,
                        cerradaEn: new Date(),
                        motivoCierre: 'limite_sesiones',
                    },
                });
            }
        }

        await this.prisma.colabSesion.create({
            data: {
                usuarioId,
                tokenHash: this.hashearToken(accessToken),
                refreshTokenHash: this.hashearToken(refreshToken),
                ipAddress: ip,
                userAgent,
                expiraEn,
                esActiva: true,
            },
        });
    }

    private hashearToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private async registrarBitacora(
        usuarioId: number | null,
        tipoEvento: string,
        ip?: string,
        userAgent?: string,
        correoIntento?: string,
        severidad: string = 'info',
    ) {
        try {
            await this.prisma.colabBitacoraSeguridad.create({
                data: {
                    usuarioId,
                    tipoEvento,
                    ipAddress: ip,
                    userAgent,
                    correoIntento,
                    severidad,
                },
            });
        } catch (error) {
            this.logger.error(`Error al registrar bitácora: ${error}`);
        }
    }

    private async obtenerParametroSeguridad(clave: string, valorDefecto: number): Promise<number> {
        const cache = this.cacheParametros.get(clave);

        if (cache && new Date() < cache.expiraEn) {
            return cache.valor;
        }

        try {
            const parametro = await this.prisma.parametroSistema.findUnique({
                where: { clave },
                select: { valor: true },
            });

            const valorParseado = parametro ? parseInt(parametro.valor, 10) : valorDefecto;
            const resultado = isNaN(valorParseado) ? valorDefecto : valorParseado;

            this.cacheParametros.set(clave, {
                valor: resultado,
                expiraEn: new Date(Date.now() + CACHE_PARAMETROS_TTL),
            });

            return resultado;
        } catch (error) {
            this.logger.error(`Error al obtener parámetro '${clave}': ${error}`);
            return valorDefecto;
        }
    }

    private async verificarBloqueo(correo: string) {
        const registro = this.intentosFallidos.get(correo);

        if (registro?.bloqueadoHasta && new Date() < registro.bloqueadoHasta) {
            const minutosRestantes = Math.ceil(
                (registro.bloqueadoHasta.getTime() - Date.now()) / 60000,
            );
            this.logger.warn(`Cuenta bloqueada: ${correo} - Minutos restantes: ${minutosRestantes}`);
            throw new UnauthorizedException(
                `${MENSAJES_ERROR.CUENTA_BLOQUEADA}. Intente nuevamente en ${minutosRestantes} minutos`,
            );
        }
    }

    private async registrarIntentoFallido(correo: string) {
        const intentosMaximos = await this.obtenerParametroSeguridad(CLAVE_INTENTOS_MAX, INTENTOS_MAX_DEFECTO);
        const tiempoBloqueoMinutos = await this.obtenerParametroSeguridad(CLAVE_BLOQUEO_MINUTOS, BLOQUEO_MINUTOS_DEFECTO);

        const registro = this.intentosFallidos.get(correo) || {
            intentos: 0,
            ultimoIntento: new Date(),
        };

        registro.intentos += 1;
        registro.ultimoIntento = new Date();

        if (registro.intentos >= intentosMaximos) {
            registro.bloqueadoHasta = new Date(
                Date.now() + tiempoBloqueoMinutos * 60 * 1000,
            );
            this.logger.warn(`Cuenta bloqueada por intentos fallidos: ${correo}`);
        }

        this.intentosFallidos.set(correo, registro);
    }

    private limpiarIntentosFallidos(correo: string) {
        this.intentosFallidos.delete(correo);
    }

    private obtenerTiempoExpiracion(): number {
        const expiracion = this.configService.get<string>('jwt.accessExpiracion') || '15m';
        const match = expiracion.match(/(\d+)([mhd])/);

        if (!match) return 900;

        const valor = parseInt(match[1]);
        const unidad = match[2];

        if (unidad === 'm') return valor * 60;
        if (unidad === 'h') return valor * 3600;
        if (unidad === 'd') return valor * 86400;

        return 900;
    }
}
