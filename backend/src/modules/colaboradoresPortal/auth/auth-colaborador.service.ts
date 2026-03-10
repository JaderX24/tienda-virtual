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
import { hashearToken } from '../../../common/utils';
import { LoginColaboradorDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';
import { DobleFactorService } from './doble-factor.service';
import { ParametrosSeguridadService, CLAVES_PARAMETRO } from '../../../common/services';

interface RegistroIntento {
    intentos: number;
    ultimoIntento: Date;
    bloqueadoHasta?: Date;
}

interface Token2FATemporal {
    usuarioId: number;
    correo: string;
    ip?: string;
    userAgent?: string;
    expiraEn: Date;
}

@Injectable()
export class AuthColaboradorService {
    private readonly logger = new Logger(AuthColaboradorService.name);
    private intentosFallidos: Map<string, RegistroIntento> = new Map();
    private tokens2FA: Map<string, Token2FATemporal> = new Map();

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private dobleFactorService: DobleFactorService,
        private parametrosSeguridad: ParametrosSeguridadService,
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

        // Verificar si el usuario tiene 2FA habilitado
        if (usuario.requiere2fa && usuario.metodo2fa !== 'ninguno') {
            return this.iniciar2FA(usuario, ip, userAgent);
        }

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

    private async iniciar2FA(usuario: any, ip?: string, userAgent?: string) {
        const token2FAExpiracionMinutos = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.TOKEN_2FA_EXPIRACION_MINUTOS);

        const token2FA = crypto.randomBytes(32).toString('hex');

        this.tokens2FA.set(token2FA, {
            usuarioId: usuario.id,
            correo: usuario.correo,
            ip,
            userAgent,
            expiraEn: new Date(Date.now() + token2FAExpiracionMinutos * 60 * 1000),
        });

        // Si el método es correo, enviar el código automáticamente
        if (usuario.metodo2fa === 'correo') {
            await this.dobleFactorService.enviarCodigoCorreo(
                usuario.id,
                usuario.correo,
                usuario.nombre,
            );
        }

        await this.registrarBitacora(usuario.id, '2fa_requerido', ip, userAgent, usuario.correo, 'info');

        return {
            exito: true,
            requiere2FA: true,
            metodo2fa: usuario.metodo2fa,
            token2FA,
            mensaje: usuario.metodo2fa === 'correo'
                ? 'Se ha enviado un código de verificación a tu correo electrónico'
                : 'Ingresa el código de tu aplicación autenticadora',
        };
    }

    async verificar2FA(token2FA: string, codigo: string) {
        const registro = this.tokens2FA.get(token2FA);

        if (!registro) {
            throw new UnauthorizedException('Token de verificación inválido o expirado');
        }

        if (new Date() > registro.expiraEn) {
            this.tokens2FA.delete(token2FA);
            throw new UnauthorizedException('El tiempo de verificación ha expirado, inicie sesión nuevamente');
        }

        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { id: registro.usuarioId },
            include: {
                roles: {
                    where: { esPrincipal: true },
                    include: {
                        rol: {
                            include: {
                                rolesPermisos: {
                                    include: { permiso: true },
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
                    include: { permiso: true },
                },
            },
        });

        if (!usuario || !usuario.esActivo) {
            this.tokens2FA.delete(token2FA);
            throw new UnauthorizedException(MENSAJES_ERROR.CUENTA_INACTIVA);
        }

        // Verificar código según método
        let codigoValido = false;

        if (usuario.metodo2fa === 'app' && usuario.secreto2fa) {
            codigoValido = this.dobleFactorService.verificarCodigoApp(usuario.secreto2fa, codigo);
        } else if (usuario.metodo2fa === 'correo') {
            codigoValido = await this.dobleFactorService.verificarCodigoCorreo(usuario.id, codigo);
        }

        if (!codigoValido) {
            await this.registrarBitacora(usuario.id, '2fa_fallido', registro.ip, registro.userAgent, usuario.correo, 'warn');
            throw new UnauthorizedException('Código de verificación incorrecto');
        }

        this.tokens2FA.delete(token2FA);

        // Generar tokens de sesión completos
        const rolPrincipal = usuario.roles[0]?.rol || null;
        const permisosRol = rolPrincipal?.rolesPermisos?.map((rp) => rp.permiso.codigo) || [];
        const permisosDirectos = usuario.permisosDirectos?.map((up) => up.permiso.codigo) || [];
        const permisos = [...new Set([...permisosRol, ...permisosDirectos])];

        const tokens = await this.generarTokens(
            usuario.id,
            usuario.correo,
            rolPrincipal?.codigo || '',
            permisos,
        );

        await this.registrarSesion(usuario.id, tokens.accessToken, tokens.refreshToken, registro.ip || '', registro.userAgent);

        await this.prisma.colabUsuario.update({
            where: { id: usuario.id },
            data: { ultimoAcceso: new Date() },
        });

        await this.registrarBitacora(usuario.id, 'login_exitoso_2fa', registro.ip, registro.userAgent, usuario.correo, 'info');

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

    async reenviarCodigo2FA(token2FA: string) {
        const registro = this.tokens2FA.get(token2FA);

        if (!registro || new Date() > registro.expiraEn) {
            if (registro) this.tokens2FA.delete(token2FA);
            throw new UnauthorizedException('Token de verificación inválido o expirado');
        }

        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { id: registro.usuarioId },
            select: { id: true, nombre: true, correo: true, metodo2fa: true },
        });

        if (!usuario || usuario.metodo2fa !== 'correo') {
            throw new UnauthorizedException('No se puede reenviar el código');
        }

        const enviado = await this.dobleFactorService.enviarCodigoCorreo(
            usuario.id,
            usuario.correo,
            usuario.nombre,
        );

        if (!enviado) {
            return { exito: false, mensaje: 'No se pudo enviar el código, intente nuevamente' };
        }

        return { exito: true, mensaje: 'Se ha reenviado el código a tu correo electrónico' };
    }

    async cerrarSesion(usuarioId: number, token: string) {
        const tokenHash = hashearToken(token);

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

        const refreshTokenHash = hashearToken(refreshToken);

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

        const accessSecret = this.configService.get<string>('jwt.colabAccessSecret');
        const refreshSecret = this.configService.get<string>('jwt.colabRefreshSecret');
        const accessExpiracion = this.configService.get<string>('jwt.colabAccessExpiracion');
        const refreshExpiracion = this.configService.get<string>('jwt.colabRefreshExpiracion');

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

        const accessSecret = this.configService.get<string>('jwt.colabAccessSecret');
        const accessExpiracion = this.configService.get<string>('jwt.colabAccessExpiracion');

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
        const refreshExpiracion = this.configService.get<string>('jwt.colabRefreshExpiracion')!;
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

        // Verificar límite de sesiones simultáneas desde parámetros del sistema
        const maxSesiones = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.MAXIMO_SESIONES_USUARIO);

        const sesionesActivas = await this.prisma.colabSesion.count({
            where: { usuarioId, esActiva: true },
        });

        if (sesionesActivas >= maxSesiones) {
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

        // Registrar o actualizar dispositivo
        const dispositivoId = await this.registrarDispositivo(usuarioId, userAgent);

        await this.prisma.colabSesion.create({
            data: {
                usuarioId,
                tokenHash: hashearToken(accessToken),
                refreshTokenHash: hashearToken(refreshToken),
                dispositivoId,
                ipAddress: ip,
                userAgent,
                expiraEn,
                esActiva: true,
            },
        });
    }

    private async registrarDispositivo(usuarioId: number, userAgent?: string): Promise<number | null> {
        if (!userAgent) return null;

        const huella = this.generarHuellaDispositivo(userAgent);
        const navegador = this.extraerNavegador(userAgent);
        const sistemaOperativo = this.extraerSO(userAgent);
        const tipoDispositivo = this.detectarTipoDispositivo(userAgent);
        const nombreDispositivo = `${navegador} en ${sistemaOperativo}`;

        const dispositivoExistente = await this.prisma.colabDispositivo.findFirst({
            where: {
                usuarioId,
                huellaDispositivo: huella,
                esActivo: true,
            },
        });

        if (dispositivoExistente) {
            await this.prisma.colabDispositivo.update({
                where: { id: dispositivoExistente.id },
                data: { ultimoUso: new Date() },
            });
            return dispositivoExistente.id;
        }

        const nuevoDispositivo = await this.prisma.colabDispositivo.create({
            data: {
                usuarioId,
                huellaDispositivo: huella,
                nombreDispositivo: nombreDispositivo,
                tipoDispositivo,
                navegador,
                sistemaOperativo,
                ultimoUso: new Date(),
            },
        });

        return nuevoDispositivo.id;
    }

    private generarHuellaDispositivo(userAgent: string): string {
        return crypto.createHash('sha256').update(userAgent).digest('hex');
    }

    private extraerNavegador(userAgent: string): string {
        if (userAgent.includes('Edg/')) return 'Microsoft Edge';
        if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Google Chrome';
        if (userAgent.includes('Firefox/')) return 'Mozilla Firefox';
        if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Opera') || userAgent.includes('OPR/')) return 'Opera';
        return 'Navegador desconocido';
    }

    private extraerSO(userAgent: string): string {
        if (userAgent.includes('Windows NT 10')) return 'Windows 10/11';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac OS X')) return 'macOS';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
        if (userAgent.includes('Linux')) return 'Linux';
        return 'SO desconocido';
    }

    private detectarTipoDispositivo(userAgent: string): string {
        if (/Mobi|Android.*Mobile|iPhone/i.test(userAgent)) return 'movil';
        if (/iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent)) return 'tablet';
        if (/Macintosh|Windows NT|Linux(?!.*Android)/i.test(userAgent)) return 'escritorio';
        return 'otro';
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
        const intentosMaximos = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.INTENTOS_MAXIMOS_LOGIN);
        const tiempoBloqueoMinutos = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.TIEMPO_BLOQUEO_MINUTOS);

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
        const expiracion = this.configService.get<string>('jwt.colabAccessExpiracion')!;
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
