import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map, forkJoin, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    MovimientoInventario,
    ProductoInventario,
    ResumenInventario,
    MovimientoPorTipo,
    ProductoStockCritico,
    MovimientoPorDia,
    ValorPorCategoria,
    TopProducto,
    FiltrosMovimiento,
    FiltrosProductoInventario,
    RespuestaApi,
    RespuestaPaginada
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class InventarioService {
    private readonly apiUrl = `${environment.apiUrl}/admin/inventario`;
    private readonly productosUrl = `${environment.apiUrl}/admin/productos`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    readonly estaCargando = this.cargando.asReadonly();

    // Resumen general del inventario
    obtenerResumen(): Observable<ResumenInventario> {
        return this.http.get<RespuestaApi<ResumenInventario>>(`${this.apiUrl}/resumen`).pipe(
            map(respuesta => respuesta.datos || respuesta as unknown as ResumenInventario),
            catchError(error => throwError(() => error))
        );
    }

    // Movimientos de inventario con filtros
    obtenerMovimientos(filtros: FiltrosMovimiento): Observable<RespuestaPaginada<MovimientoInventario>> {
        this.cargando.set(true);
        let params = new HttpParams()
            .set('pagina', filtros.pagina.toString())
            .set('limite', filtros.limite.toString());

        if (filtros.busqueda?.trim()) params = params.set('busqueda', filtros.busqueda.trim());
        if (filtros.tipoMovimiento) params = params.set('tipoMovimiento', filtros.tipoMovimiento);
        if (filtros.productoId) params = params.set('productoId', filtros.productoId.toString());
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.ordenarPor) params = params.set('ordenarPor', filtros.ordenarPor);
        if (filtros.orden) params = params.set('orden', filtros.orden);

        return this.http.get<any>(`${this.apiUrl}/movimientos`, { params }).pipe(
            map(respuesta => {
                if (respuesta.datos && Array.isArray(respuesta.datos.datos)) return respuesta.datos;
                if (respuesta.datos && Array.isArray(respuesta.datos)) {
                    return { datos: respuesta.datos, total: respuesta.meta?.total || 0, pagina: filtros.pagina, limite: filtros.limite, totalPaginas: respuesta.meta?.totalPaginas || 0 };
                }
                return { datos: [], total: 0, pagina: 1, limite: filtros.limite, totalPaginas: 0 };
            }),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    // Productos con info de inventario
    obtenerProductosInventario(filtros: FiltrosProductoInventario): Observable<RespuestaPaginada<ProductoInventario>> {
        this.cargando.set(true);
        let params = new HttpParams()
            .set('pagina', filtros.pagina.toString())
            .set('limite', filtros.limite.toString());

        if (filtros.busqueda?.trim()) params = params.set('busqueda', filtros.busqueda.trim());
        if (filtros.categoriaId) params = params.set('categoriaId', filtros.categoriaId.toString());
        if (filtros.activo !== undefined) params = params.set('activo', filtros.activo.toString());

        return this.http.get<any>(this.productosUrl, { params }).pipe(
            map(respuesta => {
                if (respuesta.datos && Array.isArray(respuesta.datos.datos)) return respuesta.datos;
                if (respuesta.datos && Array.isArray(respuesta.datos)) {
                    return { datos: respuesta.datos, total: respuesta.meta?.total || 0, pagina: filtros.pagina, limite: filtros.limite, totalPaginas: respuesta.meta?.totalPaginas || 0 };
                }
                return { datos: [], total: 0, pagina: 1, limite: filtros.limite, totalPaginas: 0 };
            }),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    // Datos para gráficas del dashboard
    obtenerMovimientosPorTipo(): Observable<MovimientoPorTipo[]> {
        return this.http.get<RespuestaApi<MovimientoPorTipo[]>>(`${this.apiUrl}/estadisticas/por-tipo`).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as MovimientoPorTipo[];
                return [];
            }),
            catchError(() => of([]))
        );
    }

    obtenerProductosStockCritico(): Observable<ProductoStockCritico[]> {
        return this.http.get<RespuestaApi<ProductoStockCritico[]>>(`${this.apiUrl}/estadisticas/stock-critico`).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as ProductoStockCritico[];
                return [];
            }),
            catchError(() => of([]))
        );
    }

    obtenerMovimientosPorDia(dias: number = 30): Observable<MovimientoPorDia[]> {
        return this.http.get<RespuestaApi<MovimientoPorDia[]>>(`${this.apiUrl}/estadisticas/por-dia`, {
            params: { dias: dias.toString() }
        }).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as MovimientoPorDia[];
                return [];
            }),
            catchError(() => of([]))
        );
    }

    obtenerValorPorCategoria(): Observable<ValorPorCategoria[]> {
        return this.http.get<RespuestaApi<ValorPorCategoria[]>>(`${this.apiUrl}/estadisticas/valor-categoria`).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as ValorPorCategoria[];
                return [];
            }),
            catchError(() => of([]))
        );
    }

    obtenerTopProductos(limite: number = 10): Observable<TopProducto[]> {
        return this.http.get<RespuestaApi<TopProducto[]>>(`${this.apiUrl}/estadisticas/top-productos`, {
            params: { limite: limite.toString() }
        }).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as TopProducto[];
                return [];
            }),
            catchError(() => of([]))
        );
    }

    // Registrar movimiento manual
    registrarMovimiento(datos: { productoId: number; cantidad: number; tipoMovimiento: string; motivo: string }): Observable<MovimientoInventario> {
        return this.http.post<RespuestaApi<MovimientoInventario>>(`${this.apiUrl}/movimientos`, datos).pipe(
            map(respuesta => respuesta.datos || respuesta as unknown as MovimientoInventario),
            catchError(error => throwError(() => error))
        );
    }

    // Ajuste de stock
    ajustarStock(productoId: number, datos: { cantidad: number; motivo: string }): Observable<any> {
        return this.http.patch<RespuestaApi<any>>(`${this.apiUrl}/productos/${productoId}/ajuste`, datos).pipe(
            map(respuesta => respuesta.datos || respuesta),
            catchError(error => throwError(() => error))
        );
    }

    formatearPrecio(monto: number): string {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto);
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Tegucigalpa'
        });
    }

    obtenerEstadoStock(stock: number, stockMinimo: number): { clase: string; texto: string; icono: string } {
        if (stock <= 0) return { clase: 'sin-stock', texto: 'Sin stock', icono: 'bi-x-circle-fill' };
        if (stock <= stockMinimo) return { clase: 'stock-bajo', texto: 'Stock bajo', icono: 'bi-exclamation-triangle-fill' };
        return { clase: 'stock-ok', texto: 'En stock', icono: 'bi-check-circle-fill' };
    }

    obtenerColorTipoMovimiento(tipo: string): string {
        const colores: Record<string, string> = {
            'entrada': '#10b981',
            'salida': '#ef4444',
            'ajuste': '#f59e0b',
            'devolucion': '#3b82f6',
            'transferencia': '#8b5cf6',
        };
        return colores[tipo] || '#6b7280';
    }

    obtenerIconoTipoMovimiento(tipo: string): string {
        const iconos: Record<string, string> = {
            'entrada': 'bi-box-arrow-in-down',
            'salida': 'bi-box-arrow-up',
            'ajuste': 'bi-arrow-left-right',
            'devolucion': 'bi-arrow-return-left',
            'transferencia': 'bi-arrow-left-right',
        };
        return iconos[tipo] || 'bi-circle';
    }
}
