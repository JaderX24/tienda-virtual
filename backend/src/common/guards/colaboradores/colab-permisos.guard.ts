import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MENSAJES_ERROR } from '../../constants/global/mensajes.constant';
import { COLAB_PERMISOS_KEY } from '../../decorators/colaboradores/colab-permisos.decorator';

@Injectable()
export class ColabPermisosGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const permisosRequeridos = this.reflector.getAllAndOverride<string[]>(COLAB_PERMISOS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!permisosRequeridos || permisosRequeridos.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.permisos) {
            throw new ForbiddenException(MENSAJES_ERROR.SIN_PERMISOS);
        }

        const tienePermisos = permisosRequeridos.every((permiso) =>
            user.permisos.includes(permiso),
        );

        if (!tienePermisos) {
            throw new ForbiddenException(MENSAJES_ERROR.SIN_PERMISOS);
        }

        return true;
    }
}
