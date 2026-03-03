import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AlmacenInfo {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    direccion: string | null;
}

export interface ProductoStock {
    id: number;
    nombre: string;
    sku: string;
    precio: number;
    stock: number;
    stockMinimo: number;
    categoria: string;
    imagen: string | null;
    estadoStock: 'disponible' | 'bajo' | 'agotado';
}

export interface Transferencia {
    id: string;
    producto: string;
    sku: string;
    stockActual: number;
    cantidad: number;
    cantidadAnterior: number;
    cantidadNueva: number;
    almacenOrigen: string;
    almacenOrigenCodigo: string;
    almacenOrigenId: number | null;
    almacenDestino: string;
    almacenDestinoCodigo: string;
    almacenDestinoId: number | null;
    estado: string;
    motivo: string;
    notas: string | null;
    documentoTipo: string | null;
    documentoNumero: string | null;
    solicitadoPor: string;
    fecha: string;
    fechaAprobacion: string | null;
}

export interface DetalleTransferencia {
    id: string;
    producto: {
        id: number;
        nombre: string;
        sku: string;
        stockActual: number;
        stockMinimo: number;
    };
    cantidad: number;
    almacenOrigen: {
        id: number;
        nombre: string;
        codigo: string;
        direccion: string | null;
    } | null;
    almacenDestino: {
        id: number;
        nombre: string;
        codigo: string;
        direccion: string | null;
    } | null;
    estado: string;
    motivo: string;
    notas: string | null;
    documentoTipo: string | null;
    documentoNumero: string | null;
    solicitadoPor: {
        nombre: string;
        codigo: string;
    };
    fecha: string;
    fechaAprobacion: string | null;
}

export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface RespuestaAlmacenes {
    exito: boolean;
    datos: {
        asignados: AlmacenInfo[];
        todos: AlmacenInfo[];
    };
}

export interface RespuestaTransferencias {
    exito: boolean;
    datos: Transferencia[];
    paginacion: Paginacion;
}

export interface RespuestaCrearTransferencia {
    exito: boolean;
    mensaje: string;
    datos: Transferencia;
}

export interface RespuestaDetalle {
    exito: boolean;
    datos: DetalleTransferencia;
}

export interface RespuestaActualizarEstado {
    exito: boolean;
    mensaje: string;
}

export interface RespuestaBusquedaProductos {
    exito: boolean;
    datos: ProductoStock[];
}

export interface FiltrosTransferencias {
    almacenOrigenId?: number;
    almacenDestinoId?: number;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}

export interface DatosTransferencia {
    productoId: number;
    almacenOrigenId: number;
    almacenDestinoId: number;
    cantidad: number;
    motivo: string;
    notas?: string;
    documentoTipo?: string;
    documentoNumero?: string;
}

export interface DatosActualizarEstado {
    estado: string;
    notas?: string;
}

@Injectable({ providedIn: 'root' })
export class TransferenciaService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/transferencias`;
    private readonly inventarioUrl = `${environment.apiUrl}/colaborador/inventario`;

    cargando = signal(false);
    procesando = signal(false);

    constructor(private http: HttpClient) {}

    obtenerAlmacenes(): Observable<RespuestaAlmacenes> {
        this.cargando.set(true);
        return this.http.get<RespuestaAlmacenes>(`${this.apiUrl}/almacenes`).pipe(
            finalize(() => this.cargando.set(false)),
        );
    }

    obtenerTransferencias(filtros: FiltrosTransferencias = {}): Observable<RespuestaTransferencias> {
        this.cargando.set(true);
        let params = new HttpParams();
        if (filtros.almacenOrigenId) params = params.set('almacenOrigenId', filtros.almacenOrigenId.toString());
        if (filtros.almacenDestinoId) params = params.set('almacenDestinoId', filtros.almacenDestinoId.toString());
        if (filtros.estado) params = params.set('estado', filtros.estado);
        if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
        if (filtros.limite) params = params.set('limite', filtros.limite.toString());

        return this.http.get<RespuestaTransferencias>(this.apiUrl, { params }).pipe(
            finalize(() => this.cargando.set(false)),
        );
    }

    obtenerDetalle(id: string): Observable<RespuestaDetalle> {
        return this.http.get<RespuestaDetalle>(`${this.apiUrl}/${id}`);
    }

    crearTransferencia(datos: DatosTransferencia): Observable<RespuestaCrearTransferencia> {
        this.procesando.set(true);
        return this.http.post<RespuestaCrearTransferencia>(this.apiUrl, datos).pipe(
            finalize(() => this.procesando.set(false)),
        );
    }

    actualizarEstado(id: string, datos: DatosActualizarEstado): Observable<RespuestaActualizarEstado> {
        this.procesando.set(true);
        return this.http.patch<RespuestaActualizarEstado>(`${this.apiUrl}/${id}/estado`, datos).pipe(
            finalize(() => this.procesando.set(false)),
        );
    }

    buscarProductos(termino: string, limite: number = 15): Observable<RespuestaBusquedaProductos> {
        let params = new HttpParams().set('limite', limite.toString());
        if (termino) params = params.set('busqueda', termino);
        return this.http.get<RespuestaBusquedaProductos>(`${this.inventarioUrl}/productos/buscar`, { params });
    }
}
