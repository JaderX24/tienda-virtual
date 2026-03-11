import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthColaboradorService } from '../services/auth-colaborador.service';

export const authColaboradorGuard: CanActivateFn = () => {
    const authService = inject(AuthColaboradorService);
    const router = inject(Router);

    if (authService.estaAutenticado()) {
        return true;
    }

    router.navigate(['/colaborador/inicio-sesion']);
    return false;
};

export const noAuthColaboradorGuard: CanActivateFn = () => {
    const authService = inject(AuthColaboradorService);
    const router = inject(Router);

    if (!authService.estaAutenticado()) {
        return true;
    }

    router.navigate(['/colaborador/dashboard']);
    return false;
};

export const permisoColabGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthColaboradorService);
    const router = inject(Router);

    if (!authService.estaAutenticado()) {
        router.navigate(['/colaborador/inicio-sesion']);
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
            router.navigate(['/colaborador/dashboard']);
            return false;
        }),
    );
};
