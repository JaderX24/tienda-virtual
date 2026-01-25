import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegistroDto, CambiarContrasenaDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../common/constants';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async login(loginDto: LoginDto) {
        const { correo, contrasena } = loginDto;

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
            throw new UnauthorizedException(MENSAJES_ERROR.CREDENCIALES_INVALIDAS);
        }

        if (!usuario.activo) {
            throw new UnauthorizedException(MENSAJES_ERROR.CUENTA_INACTIVA);
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);

        if (!contrasenaValida) {
            throw new UnauthorizedException(MENSAJES_ERROR.CREDENCIALES_INVALIDAS);
        }

        const permisos = usuario.rol?.permisos?.map((p) => p.permiso.codigo) || [];
        const tokens = await this.generarTokens(usuario.id, usuario.correo, usuario.rol?.codigo || '', permisos);

        await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: { ultimoAcceso: new Date() },
        });

        return {
            mensaje: MENSAJES_EXITO.LOGIN_EXITOSO,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol?.codigo,
            },
            ...tokens,
        };
    }

    async registro(registroDto: RegistroDto) {
        const { correo, contrasena, nombre, telefono } = registroDto;

        const usuarioExistente = await this.prisma.usuario.findUnique({
            where: { correo },
        });

        if (usuarioExistente) {
            throw new ConflictException(MENSAJES_ERROR.USUARIO_YA_EXISTE);
        }

        const bcryptRounds = this.configService.get<number>('seguridad.bcryptRounds') || 12;
        const contrasenaHash = await bcrypt.hash(contrasena, bcryptRounds);

        const rolCliente = await this.prisma.rol.findUnique({
            where: { codigo: 'cliente' },
        });

        const usuario = await this.prisma.usuario.create({
            data: {
                nombre,
                correo,
                contrasenaHash,
                telefono,
                rolId: rolCliente?.id,
                activo: true,
            },
        });

        return {
            mensaje: MENSAJES_EXITO.REGISTRO_EXITOSO,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
            },
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
            });

            const usuario = await this.prisma.usuario.findUnique({
                where: { id: payload.sub },
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

            if (!usuario || !usuario.activo) {
                throw new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
            }

            const permisos = usuario.rol?.permisos?.map((p) => p.permiso.codigo) || [];
            return this.generarTokens(usuario.id, usuario.correo, usuario.rol?.codigo || '', permisos);
        } catch {
            throw new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
        }
    }

    async cambiarContrasena(usuarioId: number, cambiarContrasenaDto: CambiarContrasenaDto) {
        const { contrasenaActual, nuevaContrasena } = cambiarContrasenaDto;

        const usuario = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
        });

        if (!usuario) {
            throw new UnauthorizedException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasenaHash);

        if (!contrasenaValida) {
            throw new BadRequestException(MENSAJES_ERROR.CREDENCIALES_INVALIDAS);
        }

        const bcryptRounds = this.configService.get<number>('seguridad.bcryptRounds') || 12;
        const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, bcryptRounds);

        await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { contrasenaHash: nuevaContrasenaHash },
        });

        return { mensaje: MENSAJES_EXITO.CONTRASENA_CAMBIADA };
    }

    async logout(usuarioId: number) {
        this.logger.log(`Usuario ${usuarioId} cerró sesión`);
        return { mensaje: MENSAJES_EXITO.LOGOUT_EXITOSO };
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

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: this.configService.get<string>('jwt.accessExpiracion'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
                expiresIn: this.configService.get<string>('jwt.refreshExpiracion'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            tipoToken: 'Bearer',
        };
    }
}
