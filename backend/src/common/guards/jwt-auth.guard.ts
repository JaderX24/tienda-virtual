import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ES_PUBLICO_KEY } from '../decorators/publico.decorator';
import { MENSAJES_ERROR } from '../constants/mensajes.constant';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (esPublico) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err: Error | null, user: any, info: Error | null) {
        if (err || !user) {
            throw err || new UnauthorizedException(MENSAJES_ERROR.TOKEN_INVALIDO);
        }
        return user;
    }
}
