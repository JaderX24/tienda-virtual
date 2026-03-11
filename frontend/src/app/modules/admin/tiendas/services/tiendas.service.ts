import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Tienda,
    CrearTiendaDto,
    ActualizarTiendaDto,
    FiltrosTienda,
    EstadisticasTienda,
    OpcionesFormulario,
    OpcionSelect,
    ResumenEstadisticas
} from '../interfaces';
import { RespuestaPaginada, RespuestaApi } from '../../usuarios/interfaces';
import { OpcionesCatalogoService } from '../../../../core/services/opciones-catalogo.service';

@Injectable({
    providedIn: 'root'
})
export class TiendasService {
    private readonly apiUrl = `${environment.apiUrl}/admin/tiendas`;
    private readonly http = inject(HttpClient);
    private readonly opcionesCatalogo = inject(OpcionesCatalogoService);

    // Señales reactivas para el estado
    private cargando = signal(false);
    private tiendas = signal<Tienda[]>([]);
    private totalTiendas = signal(0);
    private estadisticasResumen = signal<ResumenEstadisticas | null>(null);

    // Señales de solo lectura para consumo externo
    readonly estaCargando = this.cargando.asReadonly();
    readonly listaTiendas = this.tiendas.asReadonly();
    readonly total = this.totalTiendas.asReadonly();
    readonly resumenEstadisticas = this.estadisticasResumen.asReadonly();

    /**
     * Obtiene la lista de tiendas aplicando filtros y paginación
     */
    obtenerTiendas(filtros: FiltrosTienda): Observable<RespuestaPaginada<Tienda>> {
        this.cargando.set(true);

        let params = new HttpParams()
            .set('pagina', (filtros.pagina || 1).toString())
            .set('limite', (filtros.limite || 20).toString());

        // Aplicar filtros opcionales
        if (filtros.busqueda?.trim()) {
            params = params.set('busqueda', filtros.busqueda.trim());
        }
        if (filtros.tipoNegocio) {
            params = params.set('tipoNegocio', filtros.tipoNegocio);
        }
        if (filtros.tipoTienda) {
            params = params.set('tipoTienda', filtros.tipoTienda);
        }
        if (filtros.estado) {
            params = params.set('estado', filtros.estado);
        }
        if (filtros.departamento?.trim()) {
            params = params.set('departamento', filtros.departamento.trim());
        }
        if (filtros.ciudad?.trim()) {
            params = params.set('ciudad', filtros.ciudad.trim());
        }
        if (filtros.planSuscripcion) {
            params = params.set('planSuscripcion', filtros.planSuscripcion);
        }
        if (filtros.soloActivas !== undefined) {
            params = params.set('activa', filtros.soloActivas.toString());
        }
        if (filtros.orden) {
            params = params.set('orden', filtros.orden);
        }
        if (filtros.direccion) {
            params = params.set('direccion', filtros.direccion);
        }

        return this.http.get<RespuestaApi<RespuestaPaginada<Tienda>>>(this.apiUrl, { params }).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.tiendas.set(datos.datos);
                this.totalTiendas.set(datos.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtiene una tienda específica por su ID
     */
    obtenerTiendaPorId(id: number): Observable<Tienda> {
        return this.http.get<RespuestaApi<Tienda>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Crear una nueva tienda
     */
    crearTienda(datos: CrearTiendaDto): Observable<Tienda> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ tienda: Tienda }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos.tienda),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Actualizar una tienda existente
     */
    actualizarTienda(id: number, datos: ActualizarTiendaDto): Observable<Tienda> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ tienda: Tienda }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.tienda),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Cambiar el estado activo/inactivo de una tienda
     */
    cambiarEstadoTienda(id: number, activa: boolean): Observable<Tienda> {
        return this.http.patch<RespuestaApi<{ tienda: Tienda }>>(`${this.apiUrl}/${id}/estado`, { activa }).pipe(
            map(respuesta => respuesta.datos.tienda),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Eliminar una tienda (soft delete)
     */
    eliminarTienda(id: number): Observable<{ mensaje: string }> {
        return this.http.delete<RespuestaApi<{ mensaje: string }>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtiene las estadísticas específicas de una tienda
     */
    obtenerEstadisticasTienda(id: number): Observable<EstadisticasTienda> {
        return this.http.get<RespuestaApi<EstadisticasTienda>>(`${this.apiUrl}/${id}/estadisticas`).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtiene resumen de estadísticas de todas las tiendas
     */
    obtenerResumenEstadisticas(): Observable<ResumenEstadisticas> {
        return this.http.get<RespuestaApi<ResumenEstadisticas>>(`${this.apiUrl}/resumen-estadisticas`).pipe(
            map(respuesta => respuesta.datos),
            tap(estadisticas => this.estadisticasResumen.set(estadisticas)),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Subir logo de la tienda
     */
    subirLogoTienda(id: number, logo: File): Observable<{ logoUrl: string }> {
        const formData = new FormData();
        formData.append('logo', logo);

        return this.http.post<RespuestaApi<{ logoUrl: string }>>(`${this.apiUrl}/${id}/logo`, formData).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Validar RTN único
     */
    validarRtnUnico(rtn: string, tiendaId?: number): Observable<{ valido: boolean; mensaje?: string }> {
        let params = new HttpParams().set('rtn', rtn);
        if (tiendaId) {
            params = params.set('excluirId', tiendaId.toString());
        }

        return this.http.get<RespuestaApi<{ valido: boolean; mensaje?: string }>>(`${this.apiUrl}/validar-rtn`, { params }).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtener tiendas cercanas por coordenadas
     */
    obtenerTiendasCercanas(latitud: number, longitud: number, radioKm: number = 10): Observable<Tienda[]> {
        const params = new HttpParams()
            .set('lat', latitud.toString())
            .set('lng', longitud.toString())
            .set('radio', radioKm.toString());

        return this.http.get<RespuestaApi<Tienda[]>>(`${this.apiUrl}/cercanas`, { params }).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtener opciones para formularios (departamentos, tipos, etc.)
     */
    obtenerOpcionesFormulario(): Observable<OpcionesFormulario> {
        return this.http.get<RespuestaApi<OpcionesFormulario>>(`${this.apiUrl}/opciones-formulario`).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    /**
     * Recargar la lista actual con los mismos filtros
     */
    recargarLista(filtros: FiltrosTienda): void {
        this.obtenerTiendas(filtros).subscribe();
    }

    /**
     * Limpiar el estado del servicio
     */
    limpiarEstado(): void {
        this.tiendas.set([]);
        this.totalTiendas.set(0);
        this.estadisticasResumen.set(null);
        this.cargando.set(false);
    }

    // Opciones dinámicas desde catálogos

    obtenerTiposTienda(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('tiposTienda');
    }

    obtenerTiposNegocio(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('tiposNegocio');
    }

    obtenerPlanesSuscripcion(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('planesSuscripcion');
    }

    obtenerEstadosTienda(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('estadosTienda');
    }

    obtenerOpcionPorValor<T>(opciones: OpcionSelect[], valor: T): OpcionSelect | undefined {
        return opciones.find(opcion => opcion.valor === valor);
    }

    formatearDireccionCompleta(tienda: Tienda): string {
        const { ubicacion } = tienda;
        const partes = [
            ubicacion.direccion,
            ubicacion.ciudad,
            ubicacion.departamento,
            ubicacion.pais === 'HN' ? 'Honduras' : ubicacion.pais
        ].filter(Boolean);
        
        return partes.join(', ');
    }

    obtenerEstadoTexto(estado: string): string {
        const opcion = this.obtenerOpcionPorValor(this.obtenerEstadosTienda(), estado);
        return opcion?.etiqueta || estado;
    }

    obtenerTipoNegocioTexto(tipoNegocio: string): string {
        const opcion = this.obtenerOpcionPorValor(this.obtenerTiposNegocio(), tipoNegocio);
        return opcion?.etiqueta || tipoNegocio;
    }

    obtenerPlanTexto(plan: string): string {
        const opcion = this.obtenerOpcionPorValor(this.obtenerPlanesSuscripcion(), plan);
        return opcion?.etiqueta || plan;
    }
}