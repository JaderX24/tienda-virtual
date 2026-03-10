import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { MENSAJES_ERROR } from '../../constants';
import { JwtPayload } from '../global/jwt-payload.interface';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.adminAccessSecret'),
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload.sub) {
            throw new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
        }

        // Verificar que el usuario tenga al menos una sesión activa en BD
        const sesionActiva = await this.prisma.sesion.findFirst({
            where: {
                usuarioId: payload.sub,
                expiraEn: { gt: new Date() },
            },
            select: { id: true },
        });

        if (!sesionActiva) {
            throw new UnauthorizedException(MENSAJES_ERROR.SESION_EXPIRADA);
        }

        return {
            id: payload.sub,
            correo: payload.correo,
            rol: payload.rol,
            permisos: payload.permisos,
        };
    }
}
