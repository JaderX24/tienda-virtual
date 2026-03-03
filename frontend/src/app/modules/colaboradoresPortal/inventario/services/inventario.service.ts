import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// Interfaces

export interface AlmacenAsignado {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    direccion: string | null;
    nivelAcceso: string;
    zonaAsignada: string | null;
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

export interface OperacionInventario {
    id: string;
    tipoOperacion: string;
    producto: string;
    sku: string;
    cantidad: number;
    cantidadAnterior: number;
    cantidadNueva: number;
    almacen: string;
    almacenCodigo: string;
    motivo: string;
    notas: string | null;
    documentoTipo: string | null;
    documentoNumero: string | null;
    estadoAprobacion: string | null;
    fecha: string;
}

export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface RespuestaAlmacenes {
    exito: boolean;
    datos: AlmacenAsignado[];
}

export interface RespuestaStock {
    exito: boolean;
    datos: ProductoStock[];
    paginacion: Paginacion;
}

export interface RespuestaBusquedaProductos {
    exito: boolean;
    datos: ProductoStock[];
}

export interface RespuestaOperaciones {
    exito: boolean;
    datos: OperacionInventario[];
    paginacion: Paginacion;
}

export interface RespuestaCrearOperacion {
    exito: boolean;
    mensaje: string;
    datos: OperacionInventario;
}

export interface FiltrosStock {
    busqueda?: string;
    almacenId?: number;
    pagina?: number;
    limite?: number;
}

export interface FiltrosOperaciones {
    almacenId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}

export interface DatosEntrada {
    productoId: number;
    almacenId?: number;
    cantidad: number;
    motivo: string;
    notas?: string;
    documentoTipo?: string;
    documentoNumero?: string;
}

export interface DatosSalida {
    productoId: number;
    almacenId?: number;
    cantidad: number;
    motivo: string;
    notas?: string;
    documentoTipo?: string;
    documentoNumero?: string;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/inventario`;

    cargando = signal(false);
    procesando = signal(false);

    constructor(private http: HttpClient) {}

    obtenerAlmacenes(): Observable<RespuestaAlmacenes> {
        this.cargando.set(true);
        return this.http.get<RespuestaAlmacenes>(`${this.apiUrl}/almacenes`).pipe(
            finalize(() => this.cargando.set(false)),
        );
    }

    obtenerStock(filtros: FiltrosStock = {}): Observable<RespuestaStock> {
        this.cargando.set(true);
        let params = new HttpParams();
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.almacenId) params = params.set('almacenId', filtros.almacenId.toString());
        if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
        if (filtros.limite) params = params.set('limite', filtros.limite.toString());

        return this.http.get<RespuestaStock>(`${this.apiUrl}/stock`, { params }).pipe(
            finalize(() => this.cargando.set(false)),
        );
    }

    obtenerEntradas(filtros: FiltrosOperaciones = {}): Observable<RespuestaOperaciones> {
        this.cargando.set(true);
        const params = this.construirParamsOperaciones(filtros);
        return this.http.get<RespuestaOperaciones>(`${this.apiUrl}/entradas`, { params }).pipe(
            finalize(() => this.cargando.set(false)),
        );
    }

    obtenerSalidas(filtros: FiltrosOperaciones = {}): Observable<RespuestaOperaciones> {
        this.cargando.set(true);
        const params = this.construirParamsOperaciones(filtros);
        return this.http.get<RespuestaOperaciones>(`${this.apiUrl}/salidas`, { params }).pipe(
            finalize(() => this.cargando.set(false)),
        );
    }

    crearEntrada(datos: DatosEntrada): Observable<RespuestaCrearOperacion> {
        this.procesando.set(true);
        return this.http.post<RespuestaCrearOperacion>(`${this.apiUrl}/entradas`, datos).pipe(
            finalize(() => this.procesando.set(false)),
        );
    }

    crearSalida(datos: DatosSalida): Observable<RespuestaCrearOperacion> {
        this.procesando.set(true);
        return this.http.post<RespuestaCrearOperacion>(`${this.apiUrl}/salidas`, datos).pipe(
            finalize(() => this.procesando.set(false)),
        );
    }

    buscarProductos(termino: string, limite: number = 15): Observable<RespuestaBusquedaProductos> {
        let params = new HttpParams().set('limite', limite.toString());
        if (termino) params = params.set('busqueda', termino);
        return this.http.get<RespuestaBusquedaProductos>(`${this.apiUrl}/productos/buscar`, { params });
    }

    private construirParamsOperaciones(filtros: FiltrosOperaciones): HttpParams {
        let params = new HttpParams();
        if (filtros.almacenId) params = params.set('almacenId', filtros.almacenId.toString());
        if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
        if (filtros.limite) params = params.set('limite', filtros.limite.toString());
        return params;
    }
}
