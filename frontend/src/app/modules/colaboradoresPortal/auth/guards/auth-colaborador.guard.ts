import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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
