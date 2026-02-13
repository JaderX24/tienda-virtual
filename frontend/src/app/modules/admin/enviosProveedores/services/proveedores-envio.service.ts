import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    ProveedorEnvio,
    ContactoProveedor,
    CrearProveedorEnvioDto,
    ActualizarProveedorEnvioDto,
    CrearContactoProveedorDto,
    ActualizarContactoProveedorDto,
    FiltrosProveedorEnvio,
    ResumenProveedores,
    TipoProveedor,
    EstadoProveedor,
    TipoServicio,
    ZonaCobertura,
    OpcionSelect,
    RespuestaApi,
    RespuestaPaginada
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class ProveedoresEnvioService {
    private readonly apiUrl = `${environment.apiUrl}/admin/proveedores-envio`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private proveedores = signal<ProveedorEnvio[]>([]);
    private totalProveedores = signal(0);
    private resumen = signal<ResumenProveedores | null>(null);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaProveedores = this.proveedores.asReadonly();
    readonly total = this.totalProveedores.asReadonly();
    readonly resumenProveedores = this.resumen.asReadonly();

    obtenerProveedores(filtros: FiltrosProveedorEnvio): Observable<RespuestaPaginada<ProveedorEnvio>> {
        this.cargando.set(true);

        let params = new HttpParams()
            .set('pagina', (filtros.pagina || 1).toString())
            .set('limite', (filtros.limite || 20).toString());

        if (filtros.busqueda?.trim()) {
            params = params.set('busqueda', filtros.busqueda.trim());
        }
        if (filtros.tipo) {
            params = params.set('tipo', filtros.tipo);
        }
        if (filtros.estado) {
            params = params.set('estado', filtros.estado);
        }
        if (filtros.esActivo !== undefined) {
            params = params.set('esActivo', filtros.esActivo.toString());
        }
        if (filtros.zonaCobertura) {
            params = params.set('zonaCobertura', filtros.zonaCobertura);
        }
        if (filtros.orden) {
            params = params.set('orden', filtros.orden);
        }
        if (filtros.direccion) {
            params = params.set('direccion', filtros.direccion);
        }

        return this.http.get<RespuestaApi<RespuestaPaginada<ProveedorEnvio>>>(this.apiUrl, { params }).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.proveedores.set(datos.datos);
                this.totalProveedores.set(datos.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerProveedorPorId(id: number): Observable<ProveedorEnvio> {
        return this.http.get<RespuestaApi<ProveedorEnvio>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => throwError(() => error))
        );
    }

    crearProveedor(datos: CrearProveedorEnvioDto): Observable<ProveedorEnvio> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ proveedor: ProveedorEnvio }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos.proveedor),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarProveedor(id: number, datos: ActualizarProveedorEnvioDto): Observable<ProveedorEnvio> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ proveedor: ProveedorEnvio }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.proveedor),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarEstadoProveedor(id: number, esActivo: boolean): Observable<ProveedorEnvio> {
        return this.http.patch<RespuestaApi<{ proveedor: ProveedorEnvio }>>(`${this.apiUrl}/${id}/estado`, { esActivo }).pipe(
            map(respuesta => respuesta.datos.proveedor),
            catchError(error => throwError(() => error))
        );
    }

    cambiarVisibilidadProveedor(id: number, esVisible: boolean): Observable<ProveedorEnvio> {
        return this.http.patch<RespuestaApi<{ proveedor: ProveedorEnvio }>>(`${this.apiUrl}/${id}/visibilidad`, { esVisible }).pipe(
            map(respuesta => respuesta.datos.proveedor),
            catchError(error => throwError(() => error))
        );
    }

    obtenerResumen(): Observable<ResumenProveedores> {
        return this.http.get<RespuestaApi<ResumenProveedores>>(`${this.apiUrl}/resumen`).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => this.resumen.set(datos)),
            catchError(error => throwError(() => error))
        );
    }

    // Contactos del proveedor
    agregarContacto(proveedorId: number, datos: CrearContactoProveedorDto): Observable<ContactoProveedor> {
        return this.http.post<RespuestaApi<{ contacto: ContactoProveedor }>>(
            `${this.apiUrl}/${proveedorId}/contactos`, datos
        ).pipe(
            map(respuesta => respuesta.datos.contacto),
            catchError(error => throwError(() => error))
        );
    }

    actualizarContacto(proveedorId: number, contactoId: number, datos: ActualizarContactoProveedorDto): Observable<ContactoProveedor> {
        return this.http.patch<RespuestaApi<{ contacto: ContactoProveedor }>>(
            `${this.apiUrl}/${proveedorId}/contactos/${contactoId}`, datos
        ).pipe(
            map(respuesta => respuesta.datos.contacto),
            catchError(error => throwError(() => error))
        );
    }

    eliminarContacto(proveedorId: number, contactoId: number): Observable<void> {
        return this.http.delete<RespuestaApi<void>>(
            `${this.apiUrl}/${proveedorId}/contactos/${contactoId}`
        ).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => throwError(() => error))
        );
    }

    // Opciones para selects
    obtenerTiposProveedor(): OpcionSelect[] {
        return [
            { valor: TipoProveedor.INTERNO, etiqueta: 'Interno' },
            { valor: TipoProveedor.EXTERNO, etiqueta: 'Externo' },
            { valor: TipoProveedor.FREELANCE, etiqueta: 'Freelance' },
            { valor: TipoProveedor.EMPRESA_COURIER, etiqueta: 'Empresa Courier' }
        ];
    }

    obtenerEstadosProveedor(): OpcionSelect[] {
        return [
            { valor: EstadoProveedor.ACTIVO, etiqueta: 'Activo' },
            { valor: EstadoProveedor.INACTIVO, etiqueta: 'Inactivo' },
            { valor: EstadoProveedor.SUSPENDIDO, etiqueta: 'Suspendido' },
            { valor: EstadoProveedor.EN_REVISION, etiqueta: 'En Revisión' }
        ];
    }

    obtenerTiposServicio(): OpcionSelect[] {
        return [
            { valor: TipoServicio.LOCAL, etiqueta: 'Local' },
            { valor: TipoServicio.NACIONAL, etiqueta: 'Nacional' },
            { valor: TipoServicio.INTERNACIONAL, etiqueta: 'Internacional' },
            { valor: TipoServicio.EXPRESS, etiqueta: 'Express' },
            { valor: TipoServicio.STANDARD, etiqueta: 'Estándar' },
            { valor: TipoServicio.ECONOMICO, etiqueta: 'Económico' }
        ];
    }

    obtenerZonasCobertura(): OpcionSelect[] {
        return [
            { valor: ZonaCobertura.LOCAL, etiqueta: 'Local' },
            { valor: ZonaCobertura.REGIONAL, etiqueta: 'Regional' },
            { valor: ZonaCobertura.NACIONAL, etiqueta: 'Nacional' },
            { valor: ZonaCobertura.INTERNACIONAL, etiqueta: 'Internacional' }
        ];
    }

    obtenerTipoTexto(tipo: TipoProveedor): string {
        const mapa: Record<TipoProveedor, string> = {
            [TipoProveedor.INTERNO]: 'Interno',
            [TipoProveedor.EXTERNO]: 'Externo',
            [TipoProveedor.FREELANCE]: 'Freelance',
            [TipoProveedor.EMPRESA_COURIER]: 'Empresa Courier'
        };
        return mapa[tipo] || tipo;
    }

    obtenerEstadoTexto(estado: EstadoProveedor): string {
        const mapa: Record<EstadoProveedor, string> = {
            [EstadoProveedor.ACTIVO]: 'Activo',
            [EstadoProveedor.INACTIVO]: 'Inactivo',
            [EstadoProveedor.SUSPENDIDO]: 'Suspendido',
            [EstadoProveedor.EN_REVISION]: 'En Revisión'
        };
        return mapa[estado] || estado;
    }

    obtenerIconoTipo(tipo: TipoProveedor): string {
        const mapa: Record<TipoProveedor, string> = {
            [TipoProveedor.INTERNO]: 'bi-building-fill',
            [TipoProveedor.EXTERNO]: 'bi-box-seam',
            [TipoProveedor.FREELANCE]: 'bi-person-badge',
            [TipoProveedor.EMPRESA_COURIER]: 'bi-truck'
        };
        return mapa[tipo] || 'bi-question-circle';
    }

    obtenerIconoServicio(servicio: TipoServicio): string {
        const mapa: Record<TipoServicio, string> = {
            [TipoServicio.LOCAL]: 'bi-geo-alt',
            [TipoServicio.NACIONAL]: 'bi-map',
            [TipoServicio.INTERNACIONAL]: 'bi-globe-americas',
            [TipoServicio.EXPRESS]: 'bi-lightning-charge',
            [TipoServicio.STANDARD]: 'bi-clock',
            [TipoServicio.ECONOMICO]: 'bi-piggy-bank'
        };
        return mapa[servicio] || 'bi-box';
    }

    obtenerServicioTexto(servicio: TipoServicio): string {
        const mapa: Record<TipoServicio, string> = {
            [TipoServicio.LOCAL]: 'Local',
            [TipoServicio.NACIONAL]: 'Nacional',
            [TipoServicio.INTERNACIONAL]: 'Internacional',
            [TipoServicio.EXPRESS]: 'Express',
            [TipoServicio.STANDARD]: 'Estándar',
            [TipoServicio.ECONOMICO]: 'Económico'
        };
        return mapa[servicio] || servicio;
    }

    obtenerZonaTexto(zona: ZonaCobertura): string {
        const mapa: Record<ZonaCobertura, string> = {
            [ZonaCobertura.LOCAL]: 'Local',
            [ZonaCobertura.REGIONAL]: 'Regional',
            [ZonaCobertura.NACIONAL]: 'Nacional',
            [ZonaCobertura.INTERNACIONAL]: 'Internacional'
        };
        return mapa[zona] || zona;
    }

    formatearMonto(monto: number): string {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto);
    }

    formatearCalificacion(calificacion: number): string {
        return calificacion.toFixed(1);
    }

    formatearPorcentaje(valor: number): string {
        return `${valor.toFixed(1)}%`;
    }
}
