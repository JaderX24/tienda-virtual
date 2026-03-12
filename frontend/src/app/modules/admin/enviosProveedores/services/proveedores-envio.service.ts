import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EstadoVisualizacionService } from '../../../../core/services/estado-visualizacion.service';
import {
    ProveedorEnvio,
    ContactoProveedor,
    CrearProveedorEnvioDto,
    ActualizarProveedorEnvioDto,
    CrearContactoProveedorDto,
    ActualizarContactoProveedorDto,
    FiltrosProveedorEnvio,
    ResumenProveedores,
    OpcionSelect,
    RespuestaApi,
    RespuestaPaginada
} from '../interfaces';
import { OpcionesCatalogoService } from '../../../../core/services/opciones-catalogo.service';

@Injectable({
    providedIn: 'root'
})
export class ProveedoresEnvioService {
    private readonly apiUrl = `${environment.apiUrl}/admin/proveedores-envio`;
    private readonly http = inject(HttpClient);
    private readonly opcionesCatalogo = inject(OpcionesCatalogoService);
    private readonly estadoVisualizacion = inject(EstadoVisualizacionService);

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

    // Opciones dinámicas desde catálogos
    obtenerTiposProveedor(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('tiposProveedorEnvio');
    }

    obtenerEstadosProveedor(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('estadosProveedorEnvio');
    }

    obtenerTiposServicio(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('tiposServicioEnvio');
    }

    obtenerZonasCobertura(): OpcionSelect[] {
        return this.opcionesCatalogo.obtenerGrupo('zonasCobertura');
    }

    obtenerTipoTexto(tipo: string): string {
        const opcion = this.obtenerTiposProveedor().find(o => o.valor === tipo);
        return opcion?.etiqueta || tipo;
    }

    obtenerEstadoTexto(estado: string): string {
        const opcion = this.obtenerEstadosProveedor().find(o => o.valor === estado);
        return opcion?.etiqueta || estado;
    }

    obtenerIconoTipo(tipo: string): string {
        return this.estadoVisualizacion.obtenerIcono('tipo_proveedor_envio', tipo);
    }

    obtenerIconoServicio(servicio: string): string {
        return this.estadoVisualizacion.obtenerIcono('tipo_servicio_envio', servicio);
    }

    obtenerServicioTexto(servicio: string): string {
        const opcion = this.obtenerTiposServicio().find(o => o.valor === servicio);
        return opcion?.etiqueta || servicio;
    }

    obtenerZonaTexto(zona: string): string {
        const opcion = this.obtenerZonasCobertura().find(o => o.valor === zona);
        return opcion?.etiqueta || zona;
    }

    formatearMonto(monto: number): string {
        const moneda = this.opcionesCatalogo.obtenerGrupo('monedas')[0]?.valor;
        if (!moneda) {
            return new Intl.NumberFormat('es-HN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(monto);
        }
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: moneda,
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
