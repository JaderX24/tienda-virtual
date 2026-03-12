import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
    CredencialesLogin,
    RespuestaLoginAdmin,
    RespuestaRefreshToken,
    UsuarioAdmin,
    RespuestaSesiones,
} from '../../../../core/models';

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'tv_access_token',
    REFRESH_TOKEN: 'tv_refresh_token',
    USUARIO: 'tv_usuario_admin',
    EXPIRACION: 'tv_token_expiracion',
};

@Injectable({
    providedIn: 'root',
})
export class AuthAdminService {
    private readonly apiUrl = `${environment.apiUrl}/admin/auth`;
    
    private usuarioActual = signal<UsuarioAdmin | null>(null);
    private cargando = signal(false);
    private autenticado = signal(false);
    private ultimoRefrescoPermisos = 0;
    private readonly INTERVALO_REFRESCO_MS = 5 * 60 * 1000;
    private timerRefresco: ReturnType<typeof setInterval> | null = null;

    readonly usuario = this.usuarioActual.asReadonly();
    readonly estaCargando = this.cargando.asReadonly();
    readonly estaAutenticado = this.autenticado.asReadonly();
    
    readonly permisos = computed(() => this.usuarioActual()?.permisos || []);
    readonly rol = computed(() => this.usuarioActual()?.rol?.codigo || '');
    readonly nombreUsuario = computed(() => this.usuarioActual()?.nombre || '');

    constructor(
        private http: HttpClient,
        private router: Router,
    ) {
        this.inicializarSesion();
    }

    private inicializarSesion(): void {
        const tokenGuardado = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const usuarioGuardado = localStorage.getItem(STORAGE_KEYS.USUARIO);
        const expiracion = localStorage.getItem(STORAGE_KEYS.EXPIRACION);

        if (tokenGuardado && usuarioGuardado && expiracion) {
            const expiraEn = new Date(expiracion);
            
            if (expiraEn > new Date()) {
                try {
                    const usuario = JSON.parse(usuarioGuardado) as UsuarioAdmin;
                    this.usuarioActual.set(usuario);
                    this.autenticado.set(true);
                    this.iniciarTimerRefresco();
                } catch {
                    this.limpiarSesion();
                }
            } else {
                this.intentarRefrescarToken();
            }
        }
    }

    iniciarSesion(credenciales: CredencialesLogin): Observable<RespuestaLoginAdmin> {
        this.cargando.set(true);

        return this.http.post<RespuestaLoginAdmin>(`${this.apiUrl}/login`, credenciales).pipe(
            tap((respuesta) => {
                if (respuesta.exito) {
                    this.guardarSesion(respuesta);
                }
            }),
            finalize(() => this.cargando.set(false)),
        );
    }

    cerrarSesion(): Observable<{ exito: boolean; mensaje: string }> {
        return this.http.post<{ exito: boolean; mensaje: string }>(`${this.apiUrl}/logout`, {}).pipe(
            tap(() => {
                this.limpiarSesion();
                this.router.navigate(['/admin/inicio-sesion']);
            }),
            catchError((error) => {
                this.limpiarSesion();
                this.router.navigate(['/admin/inicio-sesion']);
                return throwError(() => error);
            }),
        );
    }

    refrescarToken(): Observable<RespuestaRefreshToken> {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
            return throwError(() => new Error('No hay token de refresco'));
        }

        return this.http.post<RespuestaRefreshToken>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
            tap((respuesta) => {
                if (respuesta.exito) {
                    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, respuesta.accessToken);
                    this.actualizarExpiracion(respuesta.expiresIn);
                }
            }),
            catchError((error) => {
                this.limpiarSesion();
                this.router.navigate(['/admin/inicio-sesion']);
                return throwError(() => error);
            }),
        );
    }

    obtenerSesionesActivas(): Observable<RespuestaSesiones> {
        return this.http.get<RespuestaSesiones>(`${this.apiUrl}/sesiones`).pipe(
            catchError((error) => this.manejarError(error)),
        );
    }

    cerrarTodasLasSesiones(): Observable<{ exito: boolean; mensaje: string }> {
        return this.http.delete<{ exito: boolean; mensaje: string }>(`${this.apiUrl}/sesiones`).pipe(
            tap(() => {
                this.limpiarSesion();
                this.router.navigate(['/admin/inicio-sesion']);
            }),
            catchError((error) => this.manejarError(error)),
        );
    }

    tienePermiso(permiso: string): boolean {
        return this.permisos().includes(permiso);
    }

    tieneAlgunPermiso(permisos: string[]): boolean {
        return permisos.some((permiso) => this.tienePermiso(permiso));
    }

    tieneTodosLosPermisos(permisos: string[]): boolean {
        return permisos.every((permiso) => this.tienePermiso(permiso));
    }

    obtenerToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    refrescarPermisos(): Observable<void> {
        if (!this.estaAutenticado()) {
            return of(undefined);
        }

        const ahora = Date.now();
        if (ahora - this.ultimoRefrescoPermisos < this.INTERVALO_REFRESCO_MS) {
            return of(undefined);
        }

        this.ultimoRefrescoPermisos = ahora;

        return this.http.get<{ exito: boolean; usuario: UsuarioAdmin }>(`${this.apiUrl}/perfil`).pipe(
            tap((respuesta) => {
                if (respuesta.exito && respuesta.usuario) {
                    this.usuarioActual.set(respuesta.usuario);
                    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(respuesta.usuario));
                }
            }),
            catchError(() => of(undefined)),
        ) as Observable<void>;
    }

    private guardarSesion(respuesta: RespuestaLoginAdmin): void {
        if (!respuesta.accessToken || !respuesta.refreshToken || !respuesta.usuario) {
            return;
        }
        
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, respuesta.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, respuesta.refreshToken);
        localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(respuesta.usuario));
        this.actualizarExpiracion(respuesta.expiresIn || 900);

        this.usuarioActual.set(respuesta.usuario);
        this.autenticado.set(true);
        this.iniciarTimerRefresco();
    }

    private actualizarExpiracion(segundos: number): void {
        const expiracion = new Date();
        expiracion.setSeconds(expiracion.getSeconds() + segundos);
        localStorage.setItem(STORAGE_KEYS.EXPIRACION, expiracion.toISOString());
    }

    private limpiarSesion(): void {
        this.detenerTimerRefresco();
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USUARIO);
        localStorage.removeItem(STORAGE_KEYS.EXPIRACION);

        this.usuarioActual.set(null);
        this.autenticado.set(false);
    }

    private iniciarTimerRefresco(): void {
        this.detenerTimerRefresco();
        this.timerRefresco = setInterval(() => {
            this.refrescarPermisos().subscribe();
        }, this.INTERVALO_REFRESCO_MS);
    }

    private detenerTimerRefresco(): void {
        if (this.timerRefresco) {
            clearInterval(this.timerRefresco);
            this.timerRefresco = null;
        }
    }

    private intentarRefrescarToken(): void {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (refreshToken) {
            this.refrescarToken().subscribe({
                error: () => this.limpiarSesion(),
            });
        } else {
            this.limpiarSesion();
        }
    }

    private manejarError(error: HttpErrorResponse): Observable<never> {
        let mensajeError = 'Ocurrió un error inesperado';

        if (error.error?.mensaje) {
            mensajeError = error.error.mensaje;
        } else if (error.status === 0) {
            mensajeError = 'No se pudo conectar con el servidor';
        } else if (error.status === 401) {
            mensajeError = error.error?.mensaje || 'Credenciales incorrectas';
        } else if (error.status === 403) {
            mensajeError = error.error?.mensaje || 'No tiene permisos para acceder';
        } else if (error.status === 429) {
            mensajeError = error.error?.mensaje || 'Demasiados intentos. Espere unos minutos';
        } else if (error.status === 400) {
            mensajeError = error.error?.mensaje || 'Datos de entrada inválidos';
        }

        return throwError(() => ({ mensaje: mensajeError, status: error.status, errores: error.error?.errores }));
    }
}
