import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Rol,
    Permiso,
    CrearRolDto,
    ActualizarRolDto,
    AsignarPermisosDto,
    FiltrosRol,
    RespuestaApi
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class RolesService {
    private readonly apiUrl = `${environment.apiUrl}/admin/roles`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private roles = signal<Rol[]>([]);
    private permisos = signal<Permiso[]>([]);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaRoles = this.roles.asReadonly();
    readonly listaPermisos = this.permisos.asReadonly();

    obtenerRoles(filtros?: FiltrosRol): Observable<Rol[]> {
        this.cargando.set(true);
        
        let params = new HttpParams();

        if (filtros?.activo !== undefined) {
            params = params.set('activo', filtros.activo.toString());
        }

        return this.http.get<RespuestaApi<Rol[]>>(this.apiUrl, { params }).pipe(
            map(respuesta => respuesta.datos),
            tap(roles => {
                this.roles.set(roles);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerRolPorId(id: number): Observable<Rol> {
        return this.http.get<RespuestaApi<Rol>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    crearRol(datos: CrearRolDto): Observable<Rol> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ rol: Rol }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos.rol),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarRol(id: number, datos: ActualizarRolDto): Observable<Rol> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ rol: Rol }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.rol),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarEstado(id: number, activo: boolean): Observable<Rol> {
        return this.http.patch<RespuestaApi<{ rol: Rol }>>(`${this.apiUrl}/${id}/estado`, { activo }).pipe(
            map(respuesta => respuesta.datos.rol)
        );
    }

    obtenerPermisos(): Observable<Permiso[]> {
        return this.http.get<RespuestaApi<Permiso[]>>(`${environment.apiUrl}/admin/permisos`).pipe(
            map(respuesta => respuesta.datos),
            tap(permisos => this.permisos.set(permisos))
        );
    }

    obtenerPermisosRol(rolId: number): Observable<Permiso[]> {
        return this.http.get<RespuestaApi<Permiso[]>>(`${this.apiUrl}/${rolId}/permisos`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    asignarPermisos(rolId: number, datos: AsignarPermisosDto): Observable<void> {
        return this.http.post<RespuestaApi<void>>(`${this.apiUrl}/${rolId}/permisos`, datos).pipe(
            map(() => undefined)
        );
    }
}
