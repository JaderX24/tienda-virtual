import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ResumenInventario {
    totalProductos: number;
    productosActivos: number;
    agotados: number;
    stockBajo: number;
    inactivos: number;
    totalEntradas: number;
    totalSalidas: number;
    valorInventario: number;
    topProductos: ProductoMovido[];
}

export interface ProductoMovido {
    id: number;
    nombre: string;
    sku: string;
    totalMovimientos: number;
    totalUnidades: number;
}

export interface MovimientoReporte {
    id: string;
    tipoOperacion: string;
    tipoOperacionTexto: string;
    producto: string;
    sku: string;
    cantidad: number;
    cantidadAnterior: number;
    cantidadNueva: number;
    almacen: string;
    almacenCodigo: string;
    colaborador: string;
    motivo: string;
    notas: string | null;
    documentoTipo: string | null;
    documentoNumero: string | null;
    estadoAprobacion: string | null;
    fecha: string;
}

export interface ProductoCritico {
    id: number;
    nombre: string;
    sku: string;
    stock: number;
    stockMinimo: number;
    diferencia: number;
    precio: number;
    estado: 'agotado' | 'bajo';
    categoria: string;
    marca: string | null;
    imagen: string | null;
}

export interface ResumenStockCritico {
    totalAgotados: number;
    totalStockBajo: number;
}

export interface ResumenMiActividad {
    totalOperaciones: number;
    entradas: number;
    salidas: number;
    ajustes: number;
    conteosRealizados: number;
}

export interface CategoriaMovimiento {
    categoriaId: number;
    categoria: string;
    totalMovimientos: number;
    entradas: number;
    salidas: number;
    unidadesEntrada: number;
    unidadesSalida: number;
}

export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface FiltrosReporte {
    fechaDesde?: string;
    fechaHasta?: string;
    almacenId?: number;
    categoriaId?: number;
    busqueda?: string;
    tipoOperacion?: string;
    pagina?: number;
    limite?: number;
}

export interface RespuestaResumen {
    exito: boolean;
    datos: ResumenInventario;
}

export interface RespuestaMovimientos {
    exito: boolean;
    datos: MovimientoReporte[];
    paginacion: Paginacion;
}

export interface RespuestaStockCritico {
    exito: boolean;
    datos: ProductoCritico[];
    resumen: ResumenStockCritico;
    paginacion: Paginacion;
}

export interface RespuestaMiActividad {
    exito: boolean;
    datos: {
        resumen: ResumenMiActividad;
        operaciones: MovimientoReporte[];
    };
    paginacion: Paginacion;
}

export interface RespuestaCategoriasMovimiento {
    exito: boolean;
    datos: CategoriaMovimiento[];
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/reportes`;

    cargando = signal(false);

    constructor(private http: HttpClient) {}

    obtenerResumen(filtros: FiltrosReporte = {}): Observable<RespuestaResumen> {
        this.cargando.set(true);
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaResumen>(`${this.apiUrl}/resumen`, { params })
            .pipe(finalize(() => this.cargando.set(false)));
    }

    obtenerMovimientos(filtros: FiltrosReporte = {}): Observable<RespuestaMovimientos> {
        this.cargando.set(true);
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaMovimientos>(`${this.apiUrl}/movimientos`, { params })
            .pipe(finalize(() => this.cargando.set(false)));
    }

    obtenerStockCritico(filtros: FiltrosReporte = {}): Observable<RespuestaStockCritico> {
        this.cargando.set(true);
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaStockCritico>(`${this.apiUrl}/stock-critico`, { params })
            .pipe(finalize(() => this.cargando.set(false)));
    }

    obtenerMiActividad(filtros: FiltrosReporte = {}): Observable<RespuestaMiActividad> {
        this.cargando.set(true);
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaMiActividad>(`${this.apiUrl}/mi-actividad`, { params })
            .pipe(finalize(() => this.cargando.set(false)));
    }

    obtenerMovimientosPorCategoria(filtros: FiltrosReporte = {}): Observable<RespuestaCategoriasMovimiento> {
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaCategoriasMovimiento>(`${this.apiUrl}/movimientos-por-categoria`, { params });
    }

    exportarMovimientosCsv(filtros: FiltrosReporte = {}): void {
        const params = this.construirParams(filtros);
        this.http.get(`${this.apiUrl}/exportar/movimientos`, {
            params,
            responseType: 'blob',
        }).subscribe({
            next: (blob) => this.descargarArchivo(blob, 'movimientos.csv'),
        });
    }

    exportarStockCriticoCsv(): void {
        this.http.get(`${this.apiUrl}/exportar/stock-critico`, {
            responseType: 'blob',
        }).subscribe({
            next: (blob) => this.descargarArchivo(blob, 'stock_critico.csv'),
        });
    }

    private construirParams(filtros: FiltrosReporte): HttpParams {
        let params = new HttpParams();
        if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
        if (filtros.almacenId) params = params.set('almacenId', filtros.almacenId.toString());
        if (filtros.categoriaId) params = params.set('categoriaId', filtros.categoriaId.toString());
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.tipoOperacion) params = params.set('tipoOperacion', filtros.tipoOperacion);
        if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
        if (filtros.limite) params = params.set('limite', filtros.limite.toString());
        return params;
    }

    private descargarArchivo(blob: Blob, nombreArchivo: string): void {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        enlace.click();
        window.URL.revokeObjectURL(url);
    }
}
