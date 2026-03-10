import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { MENSAJES_ERROR } from '../../constants';
import { hashearToken } from '../../utils';
import { JwtPayload } from '../global/jwt-payload.interface';

@Injectable()
export class JwtColaboradorStrategy extends PassportStrategy(Strategy, 'jwt-colaborador') {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.colabAccessSecret'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload) {
        if (!payload.sub) {
            throw new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
        }

        // Verificar que la sesión siga activa en BD
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token) {
            const tokenHash = hashearToken(token);
            const sesion = await this.prisma.colabSesion.findUnique({
                where: { tokenHash },
                select: { esActiva: true },
            });

            if (sesion && !sesion.esActiva) {
                throw new UnauthorizedException(MENSAJES_ERROR.SESION_EXPIRADA);
            }
        }

        return {
            id: payload.sub,
            correo: payload.correo,
            rol: payload.rol,
            permisos: payload.permisos,
        };
    }
}
