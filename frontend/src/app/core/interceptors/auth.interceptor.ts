import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthAdminService } from '../../modules/admin/auth/services/auth-admin.service';
import { AuthColaboradorService } from '../../modules/colaboradoresPortal/auth/services/auth-colaborador.service';

let estaRefrescando = false;
const tokenRefrescado$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authAdminService = inject(AuthAdminService);
    const authColabService = inject(AuthColaboradorService);
    const router = inject(Router);

    const rutaActual = router.url;
    const esRutaColaborador = rutaActual.startsWith('/colaborador');

    const token = esRutaColaborador
        ? (authColabService.obtenerToken() || authAdminService.obtenerToken())
        : (authAdminService.obtenerToken() || authColabService.obtenerToken());

    let peticion = req;

    if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        peticion = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return next(peticion).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.includes('/auth/')) {
                const servicioAuth = esRutaColaborador ? authColabService : authAdminService;
                const rutaLogin = esRutaColaborador ? '/colaborador/inicio-sesion' : '/admin/inicio-sesion';

                if (!estaRefrescando) {
                    estaRefrescando = true;
                    tokenRefrescado$.next(null);

                    return servicioAuth.refrescarToken().pipe(
                        switchMap(() => {
                            estaRefrescando = false;
                            const nuevoToken = servicioAuth.obtenerToken();
                            tokenRefrescado$.next(nuevoToken);
                            const nuevaPeticion = req.clone({
                                setHeaders: {
                                    Authorization: `Bearer ${nuevoToken}`,
                                },
                            });
                            return next(nuevaPeticion);
                        }),
                        catchError((refreshError) => {
                            estaRefrescando = false;
                            tokenRefrescado$.next(null);
                            router.navigate([rutaLogin]);
                            return throwError(() => refreshError);
                        }),
                    );
                }

                return tokenRefrescado$.pipe(
                    filter((nuevoToken) => nuevoToken !== null),
                    take(1),
                    switchMap((nuevoToken) => {
                        const nuevaPeticion = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${nuevoToken}`,
                            },
                        });
                        return next(nuevaPeticion);
                    }),
                );
            }

            return throwError(() => error);
        }),
    );
};
