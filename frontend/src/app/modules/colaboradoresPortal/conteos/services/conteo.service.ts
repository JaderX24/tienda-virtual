import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AlmacenConteo {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    direccion: string | null;
}

export interface CategoriaConteo {
    id: number;
    nombre: string;
}

export interface Conteo {
    id: string;
    codigo: string;
    tipo: string;
    zonaConteo: string | null;
    estado: string;
    almacen: string;
    almacenCodigo: string;
    almacenId: number;
    responsable: string;
    fechaProgramada: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    totalProductosContados: number;
    totalDiscrepancias: number;
    totalFaltantes: number;
    totalSobrantes: number;
    productosRegistrados: number;
    notas: string | null;
    fecha: string;
}

export interface DetalleProductoConteo {
    id: string;
    producto: {
        id: number;
        nombre: string;
        sku: string;
        stockSistema: number;
        stockMinimo: number;
        categoria: string;
    };
    cantidadSistema: number;
    cantidadFisica: number;
    diferencia: number;
    ubicacion: string | null;
    numeroLote: string | null;
    estadoProducto: string;
    contadoPor: string;
    fechaConteo: string;
    notas: string | null;
}

export interface DetalleConteo {
    id: string;
    codigo: string;
    tipo: string;
    zonaConteo: string | null;
    estado: string;
    almacen: {
        id: number;
        nombre: string;
        codigo: string;
        direccion: string | null;
    };
    responsable: {
        nombre: string;
        codigo: string;
    };
    fechaProgramada: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    totalProductosContados: number;
    totalDiscrepancias: number;
    totalFaltantes: number;
    totalSobrantes: number;
    notas: string | null;
    detalles: DetalleProductoConteo[];
    fecha: string;
}

export interface ProductoParaConteo {
    id: number;
    nombre: string;
    sku: string;
    stock: number;
    stockMinimo: number;
    categoria: string;
    yaContado: boolean;
    cantidadRegistrada: number | null;
}

export interface ResumenConteos {
    programados: number;
    enProgreso: number;
    completados: number;
    totalMes: number;
}

export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface FiltrosConteos {
    almacenId?: number;
    estado?: string;
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    busqueda?: string;
    pagina?: number;
}

export interface DatosCrearConteo {
    almacenId: number;
    tipo: string;
    zonaConteo?: string;
    categoriaId?: number;
    fechaProgramada: string;
    notas?: string;
}

export interface DatosRegistrarDetalle {
    productoId: number;
    cantidadFisica: number;
    ubicacion?: string;
    numeroLote?: string;
    estadoProducto?: string;
    notas?: string;
}

export interface DatosActualizarEstado {
    estado: string;
    notas?: string;
    ajustarStock?: boolean;
}

interface RespuestaBase {
    exito: boolean;
    mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class ConteoService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/conteos`;

    cargando = signal(false);
    procesando = signal(false);

    constructor(private http: HttpClient) {}

    obtenerResumen(): Observable<RespuestaBase & { datos: ResumenConteos }> {
        return this.http.get<RespuestaBase & { datos: ResumenConteos }>(
            `${this.apiUrl}/resumen`,
        );
    }

    obtenerAlmacenes(): Observable<RespuestaBase & { datos: AlmacenConteo[] }> {
        return this.http.get<RespuestaBase & { datos: AlmacenConteo[] }>(
            `${this.apiUrl}/almacenes`,
        );
    }

    obtenerCategorias(): Observable<RespuestaBase & { datos: CategoriaConteo[] }> {
        return this.http.get<RespuestaBase & { datos: CategoriaConteo[] }>(
            `${this.apiUrl}/categorias`,
        );
    }

    obtenerConteos(filtros: FiltrosConteos): Observable<RespuestaBase & { datos: Conteo[]; paginacion: Paginacion }> {
        this.cargando.set(true);
        let params = new HttpParams();

        if (filtros.almacenId) params = params.set('almacenId', filtros.almacenId);
        if (filtros.estado) params = params.set('estado', filtros.estado);
        if (filtros.tipo) params = params.set('tipo', filtros.tipo);
        if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.pagina) params = params.set('pagina', filtros.pagina);

        return this.http.get<RespuestaBase & { datos: Conteo[]; paginacion: Paginacion }>(
            this.apiUrl, { params },
        ).pipe(finalize(() => this.cargando.set(false)));
    }

    obtenerDetalle(id: string): Observable<RespuestaBase & { datos: DetalleConteo }> {
        this.cargando.set(true);
        return this.http.get<RespuestaBase & { datos: DetalleConteo }>(
            `${this.apiUrl}/${id}`,
        ).pipe(finalize(() => this.cargando.set(false)));
    }

    obtenerProductosParaConteo(id: string): Observable<RespuestaBase & { datos: ProductoParaConteo[] }> {
        return this.http.get<RespuestaBase & { datos: ProductoParaConteo[] }>(
            `${this.apiUrl}/${id}/productos`,
        );
    }

    crearConteo(datos: DatosCrearConteo): Observable<RespuestaBase & { datos: any }> {
        this.procesando.set(true);
        return this.http.post<RespuestaBase & { datos: any }>(
            this.apiUrl, datos,
        ).pipe(finalize(() => this.procesando.set(false)));
    }

    registrarDetalle(conteoId: string, datos: DatosRegistrarDetalle): Observable<RespuestaBase & { datos: any }> {
        this.procesando.set(true);
        return this.http.post<RespuestaBase & { datos: any }>(
            `${this.apiUrl}/${conteoId}/detalles`, datos,
        ).pipe(finalize(() => this.procesando.set(false)));
    }

    registrarDetallesLote(conteoId: string, detalles: DatosRegistrarDetalle[]): Observable<RespuestaBase & { datos: any }> {
        this.procesando.set(true);
        return this.http.post<RespuestaBase & { datos: any }>(
            `${this.apiUrl}/${conteoId}/detalles/lote`, { detalles },
        ).pipe(finalize(() => this.procesando.set(false)));
    }

    actualizarEstado(conteoId: string, datos: DatosActualizarEstado): Observable<RespuestaBase> {
        this.procesando.set(true);
        return this.http.patch<RespuestaBase>(
            `${this.apiUrl}/${conteoId}/estado`, datos,
        ).pipe(finalize(() => this.procesando.set(false)));
    }
}
