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
    TipoTienda,
    TipoNegocioTienda,
    PlanSuscripcionTienda,
    EstadoTienda,
    OpcionesFormulario,
    OpcionSelect,
    ResumenEstadisticas
} from '../interfaces';
import { RespuestaPaginada, RespuestaApi } from '../../usuarios/interfaces';

@Injectable({
    providedIn: 'root'
})
export class TiendasService {
    private readonly apiUrl = `${environment.apiUrl}/admin/tiendas`;
    private readonly http = inject(HttpClient);

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
                console.error('Error al obtener tiendas:', error);
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
                console.error(`Error al obtener tienda ${id}:`, error);
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
                console.error('Error al crear tienda:', error);
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
                console.error(`Error al actualizar tienda ${id}:`, error);
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
                console.error(`Error al cambiar estado de tienda ${id}:`, error);
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
                console.error(`Error al eliminar tienda ${id}:`, error);
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
                console.error(`Error al obtener estadísticas de tienda ${id}:`, error);
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
                console.error('Error al obtener resumen estadísticas:', error);
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
                console.error(`Error al subir logo de tienda ${id}:`, error);
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
                console.error('Error al validar RTN:', error);
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
                console.error('Error al obtener tiendas cercanas:', error);
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
                console.error('Error al obtener opciones formulario:', error);
                // Retornar valores por defecto en caso de error
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

    // Métodos de utilidad para opciones estáticas

    /**
     * Obtiene las opciones de tipos de tienda
     */
    obtenerTiposTienda(): OpcionSelect[] {
        return [
            { valor: TipoTienda.TIENDA_FISICA, etiqueta: 'Tienda Física', descripcion: 'Punto de venta físico' },
            { valor: TipoTienda.TIENDA_VIRTUAL, etiqueta: 'Tienda Virtual', descripcion: 'Solo ventas online' },
            { valor: TipoTienda.TIENDA_HIBRIDA, etiqueta: 'Tienda Híbrida', descripcion: 'Física y virtual' },
            { valor: TipoTienda.QUIOSCO, etiqueta: 'Quiosco', descripcion: 'Punto de venta pequeño' },
            { valor: TipoTienda.SUCURSAL, etiqueta: 'Sucursal', descripcion: 'Sucursal de empresa matriz' },
            { valor: TipoTienda.FRANQUICIA, etiqueta: 'Franquicia', descripcion: 'Franquicia autorizada' },
            { valor: TipoTienda.POPUP_STORE, etiqueta: 'Pop-up Store', descripcion: 'Tienda temporal' },
            { valor: TipoTienda.OUTLET, etiqueta: 'Outlet', descripcion: 'Tienda de descuentos' }
        ];
    }

    /**
     * Obtiene las opciones de tipos de negocio
     */
    obtenerTiposNegocio(): OpcionSelect[] {
        return [
            { valor: TipoNegocioTienda.TIENDA_ROPA, etiqueta: 'Tienda de Ropa', descripcion: 'Venta de vestimenta' },
            { valor: TipoNegocioTienda.RESTAURANTE, etiqueta: 'Restaurante', descripcion: 'Comida y bebidas' },
            { valor: TipoNegocioTienda.SUPERMERCADO, etiqueta: 'Supermercado', descripcion: 'Productos diversos' },
            { valor: TipoNegocioTienda.FARMACIA, etiqueta: 'Farmacia', descripcion: 'Medicamentos y salud' },
            { valor: TipoNegocioTienda.TECNOLOGIA, etiqueta: 'Tecnología', descripcion: 'Productos tecnológicos' },
            { valor: TipoNegocioTienda.FERRETERIA, etiqueta: 'Ferretería', descripcion: 'Herramientas y construcción' },
            { valor: TipoNegocioTienda.LIBRERIA, etiqueta: 'Librería', descripcion: 'Libros y papelería' },
            { valor: TipoNegocioTienda.SERVICIOS, etiqueta: 'Servicios', descripcion: 'Prestación de servicios' },
            { valor: TipoNegocioTienda.MAYORISTA, etiqueta: 'Mayorista', descripcion: 'Venta al por mayor' },
            { valor: TipoNegocioTienda.OTRO, etiqueta: 'Otro', descripcion: 'Otro tipo de negocio' }
        ];
    }

    /**
     * Obtiene las opciones de planes de suscripción
     */
    obtenerPlanesSuscripcion(): OpcionSelect[] {
        return [
            { valor: PlanSuscripcionTienda.BASICO, etiqueta: 'Básico', descripcion: 'Funcionalidades básicas' },
            { valor: PlanSuscripcionTienda.PROFESIONAL, etiqueta: 'Profesional', descripcion: 'Funcionalidades avanzadas' },
            { valor: PlanSuscripcionTienda.EMPRESARIAL, etiqueta: 'Empresarial', descripcion: 'Para empresas grandes' },
            { valor: PlanSuscripcionTienda.PREMIUM, etiqueta: 'Premium', descripcion: 'Todas las funcionalidades' }
        ];
    }

    /**
     * Obtiene las opciones de estados de tienda
     */
    obtenerEstadosTienda(): OpcionSelect[] {
        return [
            { valor: EstadoTienda.ACTIVA, etiqueta: 'Activa', descripcion: 'Tienda operando normalmente' },
            { valor: EstadoTienda.INACTIVA, etiqueta: 'Inactiva', descripcion: 'Tienda deshabilitada' },
            { valor: EstadoTienda.EN_CONSTRUCCION, etiqueta: 'En Construcción', descripcion: 'En proceso de apertura' },
            { valor: EstadoTienda.MANTENIMIENTO, etiqueta: 'Mantenimiento', descripcion: 'En mantenimiento temporal' },
            { valor: EstadoTienda.CERRADA_TEMPORAL, etiqueta: 'Cerrada Temporal', descripcion: 'Cerrada temporalmente' }
        ];
    }

    /**
     * Obtiene una opción por su valor
     */
    obtenerOpcionPorValor<T>(opciones: OpcionSelect[], valor: T): OpcionSelect | undefined {
        return opciones.find(opcion => opcion.valor === valor);
    }

    /**
     * Formatea una dirección completa para mostrar
     */
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

    /**
     * Obtiene el estado de la tienda como texto legible
     */
    obtenerEstadoTexto(estado: EstadoTienda): string {
        const opcion = this.obtenerOpcionPorValor(this.obtenerEstadosTienda(), estado);
        return opcion?.etiqueta || estado;
    }

    /**
     * Obtiene el tipo de negocio como texto legible
     */
    obtenerTipoNegocioTexto(tipoNegocio: TipoNegocioTienda): string {
        const opcion = this.obtenerOpcionPorValor(this.obtenerTiposNegocio(), tipoNegocio);
        return opcion?.etiqueta || tipoNegocio;
    }

    /**
     * Obtiene el plan de suscripción como texto legible
     */
    obtenerPlanTexto(plan: PlanSuscripcionTienda): string {
        const opcion = this.obtenerOpcionPorValor(this.obtenerPlanesSuscripcion(), plan);
        return opcion?.etiqueta || plan;
    }
}