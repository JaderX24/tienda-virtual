import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthAdminService } from '../../modules/admin/auth/services/auth-admin.service';

let estaRefrescando = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthAdminService);
    const router = inject(Router);

    const token = authService.obtenerToken();

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
                if (!estaRefrescando) {
                    estaRefrescando = true;

                    return authService.refrescarToken().pipe(
                        switchMap(() => {
                            estaRefrescando = false;
                            const nuevoToken = authService.obtenerToken();
                            const nuevaPeticion = req.clone({
                                setHeaders: {
                                    Authorization: `Bearer ${nuevoToken}`,
                                },
                            });
                            return next(nuevaPeticion);
                        }),
                        catchError((refreshError) => {
                            estaRefrescando = false;
                            router.navigate(['/admin/inicio-sesion']);
                            return throwError(() => refreshError);
                        }),
                    );
                }
            }

            return throwError(() => error);
        }),
    );
};
