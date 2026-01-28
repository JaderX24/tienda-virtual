import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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

export const permisoGuard = (permisosRequeridos: string[]): CanActivateFn => {
    return () => {
        const authService = inject(AuthAdminService);
        const router = inject(Router);

        if (!authService.estaAutenticado()) {
            router.navigate(['/admin/inicio-sesion']);
            return false;
        }

        if (authService.tieneAlgunPermiso(permisosRequeridos)) {
            return true;
        }

        router.navigate(['/admin/sin-permisos']);
        return false;
    };
};
