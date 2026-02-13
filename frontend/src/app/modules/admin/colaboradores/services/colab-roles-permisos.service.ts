import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    ColabModulo,
    ColabPermiso,
    ColabModuloConPermisos,
    ColabRolPortal,
    ColabRolDetalle,
    CrearColabRolPortalDto,
    ActualizarColabRolPortalDto,
    RespuestaApi
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class ColabRolesPermisosService {
    private readonly apiUrl = `${environment.apiUrl}/admin/colaboradores`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private roles = signal<ColabRolPortal[]>([]);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaRoles = this.roles.asReadonly();

    obtenerModulos(): Observable<ColabModulo[]> {
        return this.http.get<RespuestaApi<ColabModulo[]>>(`${this.apiUrl}/portal/modulos`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    obtenerPermisos(moduloId?: number): Observable<ColabPermiso[]> {
        const url = moduloId
            ? `${this.apiUrl}/portal/permisos?moduloId=${moduloId}`
            : `${this.apiUrl}/portal/permisos`;
        return this.http.get<RespuestaApi<ColabPermiso[]>>(url).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    obtenerPermisosAgrupados(): Observable<ColabModuloConPermisos[]> {
        return this.http.get<RespuestaApi<ColabModuloConPermisos[]>>(`${this.apiUrl}/portal/permisos/agrupados`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    obtenerRoles(): Observable<ColabRolPortal[]> {
        this.cargando.set(true);
        return this.http.get<RespuestaApi<ColabRolPortal[]>>(`${this.apiUrl}/portal/roles`).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.roles.set(datos);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerRolPorId(id: number): Observable<ColabRolDetalle> {
        return this.http.get<RespuestaApi<ColabRolDetalle>>(`${this.apiUrl}/portal/roles/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    crearRol(datos: CrearColabRolPortalDto): Observable<any> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/portal/roles`, datos).pipe(
            map(respuesta => respuesta.datos),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarRol(id: number, datos: ActualizarColabRolPortalDto): Observable<any> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<any>>(`${this.apiUrl}/portal/roles/${id}`, datos).pipe(
            map(respuesta => respuesta.datos),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerPermisosDeRol(rolId: number): Observable<ColabPermiso[]> {
        return this.http.get<RespuestaApi<ColabPermiso[]>>(`${this.apiUrl}/portal/roles/${rolId}/permisos`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    asignarPermisosARol(rolId: number, permisoIds: number[]): Observable<any> {
        return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/portal/roles/${rolId}/permisos`, { permisoIds }).pipe(
            map(respuesta => respuesta.datos)
        );
    }
}
