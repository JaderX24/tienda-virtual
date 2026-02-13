import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Usuario,
    Rol,
    CrearUsuarioDto,
    ActualizarUsuarioDto,
    CambiarContrasenaDto,
    FiltrosUsuario,
    RespuestaPaginada,
    RespuestaApi
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class UsuariosService {
    private readonly apiUrl = `${environment.apiUrl}/admin/usuarios`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private usuarios = signal<Usuario[]>([]);
    private totalUsuarios = signal(0);
    private roles = signal<Rol[]>([]);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaUsuarios = this.usuarios.asReadonly();
    readonly total = this.totalUsuarios.asReadonly();
    readonly listaRoles = this.roles.asReadonly();

    obtenerUsuarios(filtros: FiltrosUsuario): Observable<RespuestaPaginada<Usuario>> {
        this.cargando.set(true);
        
        let params = new HttpParams()
            .set('pagina', filtros.pagina.toString())
            .set('limite', filtros.limite.toString());

        if (filtros.busqueda) {
            params = params.set('busqueda', filtros.busqueda);
        }
        if (filtros.rolId) {
            params = params.set('rolId', filtros.rolId.toString());
        }
        if (filtros.activo !== undefined) {
            params = params.set('activo', filtros.activo.toString());
        }

        return this.http.get<RespuestaApi<RespuestaPaginada<Usuario>>>(this.apiUrl, { params }).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.usuarios.set(datos.datos);
                this.totalUsuarios.set(datos.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerUsuarioPorId(id: number): Observable<Usuario> {
        return this.http.get<RespuestaApi<Usuario>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    crearUsuario(datos: CrearUsuarioDto): Observable<{ usuario: Usuario; correoEnviado: boolean }> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ usuario: Usuario; correoEnviado: boolean }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarUsuario(id: number, datos: ActualizarUsuarioDto): Observable<Usuario> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ usuario: Usuario }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.usuario),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarContrasena(id: number, datos: CambiarContrasenaDto): Observable<void> {
        return this.http.patch<RespuestaApi<void>>(`${this.apiUrl}/${id}/contrasena`, datos).pipe(
            map(() => undefined)
        );
    }

    cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
        return this.http.patch<RespuestaApi<{ usuario: Usuario }>>(`${this.apiUrl}/${id}/estado`, { activo }).pipe(
            map(respuesta => respuesta.datos.usuario)
        );
    }

    obtenerRoles(): Observable<Rol[]> {
        return this.http.get<RespuestaApi<Rol[]>>(`${environment.apiUrl}/admin/roles`).pipe(
            map(respuesta => respuesta.datos),
            tap(roles => this.roles.set(roles))
        );
    }
}
