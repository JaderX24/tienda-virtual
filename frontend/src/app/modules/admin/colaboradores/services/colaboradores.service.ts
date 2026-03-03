import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Colaborador,
    ColaboradorRol,
    Almacen,
    AsignacionAlmacen,
    TurnoColaborador,
    CrearColaboradorDto,
    ActualizarColaboradorDto,
    FiltrosColaborador,
    RespuestaPaginada,
    RespuestaApi
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class ColaboradoresService {
    private readonly apiUrl = `${environment.apiUrl}/admin/colaboradores`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private colaboradores = signal<Colaborador[]>([]);
    private totalColaboradores = signal(0);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaColaboradores = this.colaboradores.asReadonly();
    readonly total = this.totalColaboradores.asReadonly();

    obtenerColaboradores(filtros: FiltrosColaborador): Observable<RespuestaPaginada<Colaborador>> {
        this.cargando.set(true);

        let params = new HttpParams()
            .set('pagina', filtros.pagina.toString())
            .set('limite', filtros.limite.toString());

        if (filtros.busqueda) {
            params = params.set('busqueda', filtros.busqueda);
        }
        if (filtros.empresaId) {
            params = params.set('empresaId', filtros.empresaId.toString());
        }
        if (filtros.tipoContrato) {
            params = params.set('tipoContrato', filtros.tipoContrato);
        }
        if (filtros.activo !== undefined) {
            params = params.set('activo', filtros.activo.toString());
        }
        if (filtros.almacenId) {
            params = params.set('almacenId', filtros.almacenId.toString());
        }

        return this.http.get<RespuestaApi<RespuestaPaginada<Colaborador>>>(this.apiUrl, { params }).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.colaboradores.set(datos.datos);
                this.totalColaboradores.set(datos.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerColaboradorPorId(id: number): Observable<Colaborador> {
        return this.http.get<RespuestaApi<Colaborador>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    crearColaborador(datos: CrearColaboradorDto): Observable<{ colaborador: Colaborador; correoEnviado: boolean }> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ colaborador: Colaborador; correoEnviado: boolean }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarColaborador(id: number, datos: ActualizarColaboradorDto): Observable<Colaborador> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ colaborador: Colaborador }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.colaborador),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarEstado(id: number, activo: boolean, motivo?: string): Observable<Colaborador> {
        return this.http.patch<RespuestaApi<{ colaborador: Colaborador }>>(
            `${this.apiUrl}/${id}/estado`,
            { activo, motivoInactivacion: motivo }
        ).pipe(
            map(respuesta => respuesta.datos.colaborador)
        );
    }

    obtenerRolesColaborador(): Observable<ColaboradorRol[]> {
        return this.http.get<RespuestaApi<ColaboradorRol[]>>(`${this.apiUrl}/roles`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    obtenerAlmacenes(): Observable<Almacen[]> {
        return this.http.get<RespuestaApi<Almacen[]>>(`${environment.apiUrl}/admin/almacenes`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    asignarAlmacen(colaboradorId: number, almacenId: number, esPrincipal: boolean): Observable<AsignacionAlmacen> {
        return this.http.post<RespuestaApi<AsignacionAlmacen>>(
            `${this.apiUrl}/${colaboradorId}/almacenes`,
            { almacenId, esPrincipal }
        ).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    eliminarAsignacionAlmacen(colaboradorId: number, asignacionId: number): Observable<void> {
        return this.http.delete<RespuestaApi<void>>(
            `${this.apiUrl}/${colaboradorId}/almacenes/${asignacionId}`
        ).pipe(
            map(() => undefined)
        );
    }

    obtenerTurnos(colaboradorId: number): Observable<TurnoColaborador[]> {
        return this.http.get<RespuestaApi<TurnoColaborador[]>>(
            `${this.apiUrl}/${colaboradorId}/turnos`
        ).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    obtenerEmpresas(): Observable<{ id: number; nombre: string }[]> {
        return this.http.get<RespuestaApi<RespuestaPaginada<{ id: number; nombre: string }>>>(
            `${environment.apiUrl}/admin/empresas`
        ).pipe(
            map(respuesta => respuesta.datos.datos)
        );
    }
}
