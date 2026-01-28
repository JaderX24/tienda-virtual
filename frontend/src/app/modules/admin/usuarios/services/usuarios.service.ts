import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Usuario,
    Rol,
    CrearUsuarioDto,
    ActualizarUsuarioDto,
    CambiarContrasenaDto,
    FiltrosUsuario,
    RespuestaPaginada
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

        return this.http.get<RespuestaPaginada<Usuario>>(this.apiUrl, { params }).pipe(
            tap(respuesta => {
                this.usuarios.set(respuesta.datos);
                this.totalUsuarios.set(respuesta.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerUsuarioPorId(id: number): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
    }

    crearUsuario(datos: CrearUsuarioDto): Observable<Usuario> {
        this.cargando.set(true);
        return this.http.post<Usuario>(this.apiUrl, datos).pipe(
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarUsuario(id: number, datos: ActualizarUsuarioDto): Observable<Usuario> {
        this.cargando.set(true);
        return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, datos).pipe(
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarContrasena(id: number, datos: CambiarContrasenaDto): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/contrasena`, datos);
    }

    cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
        return this.http.patch<Usuario>(`${this.apiUrl}/${id}/estado`, { activo });
    }

    eliminarUsuario(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    obtenerRoles(): Observable<Rol[]> {
        return this.http.get<Rol[]>(`${environment.apiUrl}/admin/roles`).pipe(
            tap(roles => this.roles.set(roles))
        );
    }
}
