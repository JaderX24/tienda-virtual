import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { MENSAJES_ERROR } from '../constants';

export interface JwtPayload {
    sub: number;
    correo: string;
    rol: string;
    permisos: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.accessSecret'),
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload.sub) {
            throw new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
        }

        return {
            id: payload.sub,
            correo: payload.correo,
            rol: payload.rol,
            permisos: payload.permisos,
        };
    }
}
