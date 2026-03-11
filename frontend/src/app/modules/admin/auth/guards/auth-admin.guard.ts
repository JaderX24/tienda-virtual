import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthAdminService } from '../services/auth-admin.service';

export const authAdminGuard: CanActivateFn = () => {
    const authService = inject(AuthAdminService);
    const router = inject(Router);

    if (authService.estaAutenticado()) {
        return true;
    }

    router.navigate(['/admin/inicio-sesion']);
    return false;
};

export const noAuthAdminGuard: CanActivateFn = () => {
    const authService = inject(AuthAdminService);
    const router = inject(Router);

    if (!authService.estaAutenticado()) {
        return true;
    }

    router.navigate(['/admin/dashboard']);
    return false;
};

export const permisoGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthAdminService);
    const router = inject(Router);

    if (!authService.estaAutenticado()) {
        router.navigate(['/admin/inicio-sesion']);
        return false;
    }

    const permisosRequeridos: string[] = route.data['permisos'] || [];

    if (permisosRequeridos.length === 0) {
        return true;
    }

    return authService.refrescarPermisos().pipe(
        map(() => {
            if (authService.tieneAlgunPermiso(permisosRequeridos)) {
                return true;
            }
            router.navigate(['/admin/sin-permisos']);
            return false;
        }),
    );
};
