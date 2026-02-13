import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Empresa,
    CrearEmpresaDto,
    ActualizarEmpresaDto,
    FiltrosEmpresa,
    EstadisticasEmpresa
} from '../interfaces';
import { RespuestaPaginada, RespuestaApi } from '../../usuarios/interfaces';

@Injectable({
    providedIn: 'root'
})
export class EmpresasService {
    private readonly apiUrl = `${environment.apiUrl}/admin/empresas`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private empresas = signal<Empresa[]>([]);
    private totalEmpresas = signal(0);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaEmpresas = this.empresas.asReadonly();
    readonly total = this.totalEmpresas.asReadonly();

    obtenerEmpresas(filtros: FiltrosEmpresa): Observable<RespuestaPaginada<Empresa>> {
        this.cargando.set(true);

        let params = new HttpParams()
            .set('pagina', filtros.pagina.toString())
            .set('limite', filtros.limite.toString());

        if (filtros.busqueda) {
            params = params.set('busqueda', filtros.busqueda);
        }
        if (filtros.tipoNegocio) {
            params = params.set('tipoNegocio', filtros.tipoNegocio);
        }
        if (filtros.planSuscripcion) {
            params = params.set('planSuscripcion', filtros.planSuscripcion);
        }
        if (filtros.activa !== undefined) {
            params = params.set('activa', filtros.activa.toString());
        }

        return this.http.get<RespuestaApi<RespuestaPaginada<Empresa>>>(this.apiUrl, { params }).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.empresas.set(datos.datos);
                this.totalEmpresas.set(datos.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerEmpresaPorId(id: number): Observable<Empresa> {
        return this.http.get<RespuestaApi<Empresa>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    crearEmpresa(datos: CrearEmpresaDto): Observable<Empresa> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ empresa: Empresa }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos.empresa),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarEmpresa(id: number, datos: ActualizarEmpresaDto): Observable<Empresa> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ empresa: Empresa }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.empresa),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarEstado(id: number, activa: boolean): Observable<Empresa> {
        return this.http.patch<RespuestaApi<{ empresa: Empresa }>>(`${this.apiUrl}/${id}/estado`, { activa }).pipe(
            map(respuesta => respuesta.datos.empresa)
        );
    }

    obtenerEstadisticas(id: number): Observable<EstadisticasEmpresa> {
        return this.http.get<RespuestaApi<EstadisticasEmpresa>>(`${this.apiUrl}/${id}/estadisticas`).pipe(
            map(respuesta => respuesta.datos)
        );
    }
}
