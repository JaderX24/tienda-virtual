import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../prisma/prisma.service';
import { LoginAdminDto } from './dto';
import { MENSAJES_ERROR, ROLES, PERMISOS_POR_ROL, TipoRol } from '../../../../common/constants';
import { JwtPayload } from '../../../../common/strategies';

const ROLES_ADMINISTRATIVOS = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.GERENTE,
    ROLES.VENDEDOR,
    ROLES.BODEGUERO,
];

const INTENTOS_MAXIMOS = 5;
const TIEMPO_BLOQUEO_MINUTOS = 15;

interface RegistroIntento {
    intentos: number;
    ultimoIntento: Date;
    bloqueadoHasta?: Date;
}

@Injectable()
export class InicioSesionAdministrativoService {
    private readonly logger = new Logger(InicioSesionAdministrativoService.name);
    private intentosFallidos: Map<string, RegistroIntento> = new Map();

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async login(loginDto: LoginAdminDto, ip?: string, userAgent?: string) {
        const { correo, contrasena } = loginDto;

        this.verificarBloqueo(correo);

        const usuario = await this.prisma.usuario.findUnique({
            where: { correo },
            include: {
                rol: {
                    include: {
                        permisos: {
                            include: {
                                permiso: true,
                            },
                        },
                    },
                },
            },
        });

        if (!usuario) {
            this.registrarIntentoFallido(correo);
            this.logger.warn(`Intento de login fallido - correo no existe: ${correo}`);
            throw new UnauthorizedException(MENSAJES_ERROR.CREDENCIALES_INVALIDAS);
        }

        if (!usuario.activo) {
            this.logger.warn(`Intento de login con cuenta inactiva: ${correo}`);
            throw new UnauthorizedException(MENSAJES_ERROR.CUENTA_INACTIVA);
        }

        if (!usuario.rol || !ROLES_ADMINISTRATIVOS.includes(usuario.rol.codigo as any)) {
            this.logger.warn(`Intento de acceso admin con rol no autorizado: ${correo} - rol: ${usuario.rol?.codigo}`);
            throw new ForbiddenException('No tiene permisos para acceder al panel administrativo');
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);

        if (!contrasenaValida) {
            this.registrarIntentoFallido(correo);
            this.logger.warn(`Contraseña incorrecta para: ${correo}`);
            throw new UnauthorizedException(MENSAJES_ERROR.CREDENCIALES_INVALIDAS);
        }

        this.limpiarIntentosFallidos(correo);

        // Obtener permisos de la BD o usar los permisos por defecto del rol
        let permisos = usuario.rol?.permisos?.map((rp) => rp.permiso.codigo) || [];
        
        if (permisos.length === 0 && usuario.rol?.codigo) {
            permisos = PERMISOS_POR_ROL[usuario.rol.codigo as TipoRol] || [];
        }

        const tokens = await this.generarTokens(
            usuario.id,
            usuario.correo,
            usuario.rol.codigo,
            permisos,
        );

        await this.registrarSesion(usuario.id, tokens.refreshToken, ip, userAgent);

        await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: { ultimoAcceso: new Date() },
        });

        this.logger.log(`Login administrativo exitoso: ${correo} - Rol: ${usuario.rol.codigo}`);

        return {
            exito: true,
            mensaje: 'Inicio de sesión administrativo exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                avatar: usuario.avatar,
                rol: {
                    codigo: usuario.rol.codigo,
                    nombre: usuario.rol.nombre,
                },
                permisos,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: this.obtenerTiempoExpiracion(),
        };
    }

    async cerrarSesion(usuarioId: number, token: string) {
        await this.prisma.sesion.deleteMany({
            where: {
                usuarioId,
                token,
            },
        });

        this.logger.log(`Sesión cerrada para usuario ID: ${usuarioId}`);

        return {
            exito: true,
            mensaje: 'Sesión cerrada correctamente',
        };
    }

    async refrescarToken(refreshToken: string) {
        const sesion = await this.prisma.sesion.findFirst({
            where: { token: refreshToken },
            include: {
                usuario: {
                    include: {
                        rol: {
                            include: {
                                permisos: {
                                    include: {
                                        permiso: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!sesion) {
            throw new UnauthorizedException('Token de refresco inválido');
        }

        if (new Date() > sesion.expiraEn) {
            await this.prisma.sesion.delete({ where: { id: sesion.id } });
            throw new UnauthorizedException(MENSAJES_ERROR.SESION_EXPIRADA);
        }

        const usuario = sesion.usuario;

        if (!usuario.activo) {
            throw new UnauthorizedException(MENSAJES_ERROR.CUENTA_INACTIVA);
        }

        // Obtener permisos de la BD o usar los permisos por defecto del rol
        let permisos = usuario.rol?.permisos?.map((rp) => rp.permiso.codigo) || [];
        
        if (permisos.length === 0 && usuario.rol?.codigo) {
            permisos = PERMISOS_POR_ROL[usuario.rol.codigo as TipoRol] || [];
        }

        const nuevoAccessToken = await this.generarAccessToken(
            usuario.id,
            usuario.correo,
            usuario.rol?.codigo || '',
            permisos,
        );

        return {
            exito: true,
            accessToken: nuevoAccessToken,
            expiresIn: this.obtenerTiempoExpiracion(),
        };
    }

    async obtenerSesionesActivas(usuarioId: number) {
        const sesiones = await this.prisma.sesion.findMany({
            where: {
                usuarioId,
                expiraEn: { gt: new Date() },
            },
            select: {
                id: true,
                ip: true,
                userAgent: true,
                creadoEn: true,
                expiraEn: true,
            },
            orderBy: { creadoEn: 'desc' },
        });

        return {
            exito: true,
            sesiones,
        };
    }

    async cerrarTodasLasSesiones(usuarioId: number) {
        await this.prisma.sesion.deleteMany({
            where: { usuarioId },
        });

        this.logger.log(`Todas las sesiones cerradas para usuario ID: ${usuarioId}`);

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
        const payload: JwtPayload = {
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
        const payload: JwtPayload = {
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
        token: string,
        ip?: string,
        userAgent?: string,
    ) {
        const refreshExpiracion = this.configService.get<string>('jwt.refreshExpiracion') || '7d';
        const diasExpiracion = parseInt(refreshExpiracion) || 7;
        const expiraEn = new Date();
        expiraEn.setDate(expiraEn.getDate() + diasExpiracion);

        // Eliminar sesiones expiradas o anteriores del mismo usuario
        await this.prisma.sesion.deleteMany({
            where: {
                usuarioId,
                expiraEn: { lt: new Date() },
            },
        });

        await this.prisma.sesion.create({
            data: {
                usuarioId,
                token,
                ip,
                userAgent,
                expiraEn,
            },
        });
    }

    private verificarBloqueo(correo: string) {
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

    private registrarIntentoFallido(correo: string) {
        const registro = this.intentosFallidos.get(correo) || {
            intentos: 0,
            ultimoIntento: new Date(),
        };

        registro.intentos += 1;
        registro.ultimoIntento = new Date();

        if (registro.intentos >= INTENTOS_MAXIMOS) {
            registro.bloqueadoHasta = new Date(
                Date.now() + TIEMPO_BLOQUEO_MINUTOS * 60 * 1000,
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

        switch (unidad) {
            case 'm':
                return valor * 60;
            case 'h':
                return valor * 3600;
            case 'd':
                return valor * 86400;
            default:
                return 900;
        }
    }
}
