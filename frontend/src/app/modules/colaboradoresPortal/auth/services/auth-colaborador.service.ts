import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
    CredencialesLogin,
    RespuestaLoginAdmin,
    RespuestaRefreshToken,
    UsuarioAdmin,
} from '../../../../core/models';

export interface Respuesta2FA {
    exito: boolean;
    mensaje: string;
    codigo?: string;
}

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'tv_colab_access_token',
    REFRESH_TOKEN: 'tv_colab_refresh_token',
    USUARIO: 'tv_colab_usuario',
    EXPIRACION: 'tv_colab_token_expiracion',
};

@Injectable({
    providedIn: 'root',
})
export class AuthColaboradorService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/auth`;

    private usuarioActual = signal<UsuarioAdmin | null>(null);
    private cargando = signal(false);
    private autenticado = signal(false);
    private ultimoRefrescoPermisos = 0;
    private readonly INTERVALO_REFRESCO_MS = 5 * 60 * 1000;

    readonly usuario = this.usuarioActual.asReadonly();
    readonly estaCargando = this.cargando.asReadonly();
    readonly estaAutenticado = this.autenticado.asReadonly();

    readonly rol = computed(() => this.usuarioActual()?.rol?.codigo || '');
    readonly nombreUsuario = computed(() => this.usuarioActual()?.nombre || '');
    readonly permisos = computed(() => this.usuarioActual()?.permisos || []);

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
                if (respuesta.exito && !respuesta.requiere2FA) {
                    this.guardarSesion(respuesta);
                }
            }),
            finalize(() => this.cargando.set(false)),
        );
    }

    verificar2FA(token2FA: string, codigo: string): Observable<RespuestaLoginAdmin> {
        this.cargando.set(true);

        return this.http.post<RespuestaLoginAdmin>(`${this.apiUrl}/verificar-2fa`, {
            token2FA,
            codigo,
        }).pipe(
            tap((respuesta) => {
                if (respuesta.exito) {
                    this.guardarSesion(respuesta);
                }
            }),
            finalize(() => this.cargando.set(false)),
        );
    }

    reenviarCodigo2FA(token2FA: string): Observable<Respuesta2FA> {
        return this.http.post<Respuesta2FA>(`${this.apiUrl}/reenviar-2fa`, { token2FA });
    }

    cerrarSesion(): Observable<{ exito: boolean; mensaje: string }> {
        return this.http.post<{ exito: boolean; mensaje: string }>(`${this.apiUrl}/logout`, {}).pipe(
            tap(() => {
                this.limpiarSesion();
                this.router.navigate(['/colaborador/inicio-sesion']);
            }),
            catchError((error) => {
                this.limpiarSesion();
                this.router.navigate(['/colaborador/inicio-sesion']);
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
                this.router.navigate(['/colaborador/inicio-sesion']);
                return throwError(() => error);
            }),
        );
    }

    obtenerToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    tienePermiso(permiso: string): boolean {
        return this.permisos().includes(permiso);
    }

    tieneAlgunPermiso(permisos: string[]): boolean {
        return permisos.some((p) => this.tienePermiso(p));
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
    }

    private actualizarExpiracion(segundos: number): void {
        const expiracion = new Date();
        expiracion.setSeconds(expiracion.getSeconds() + segundos);
        localStorage.setItem(STORAGE_KEYS.EXPIRACION, expiracion.toISOString());
    }

    limpiarSesion(): void {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USUARIO);
        localStorage.removeItem(STORAGE_KEYS.EXPIRACION);

        this.usuarioActual.set(null);
        this.autenticado.set(false);
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
}
