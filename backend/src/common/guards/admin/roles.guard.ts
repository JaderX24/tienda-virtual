import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/admin/roles.decorator';
import { TipoRol } from '../../constants/admin/roles.constant';
import { MENSAJES_ERROR } from '../../constants/global/mensajes.constant';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const rolesRequeridos = this.reflector.getAllAndOverride<TipoRol[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!rolesRequeridos || rolesRequeridos.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.rol) {
            throw new ForbiddenException(MENSAJES_ERROR.SIN_PERMISOS);
        }

        const tieneRol = rolesRequeridos.some((rol) => user.rol === rol);

        if (!tieneRol) {
            throw new ForbiddenException(MENSAJES_ERROR.ROL_INSUFICIENTE);
        }

        return true;
    }
}
