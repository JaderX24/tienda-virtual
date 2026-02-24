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
            catchError(() => of(this.datosDemoPorTipo()))
        );
    }

    obtenerProductosStockCritico(): Observable<ProductoStockCritico[]> {
        return this.http.get<RespuestaApi<ProductoStockCritico[]>>(`${this.apiUrl}/estadisticas/stock-critico`).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as ProductoStockCritico[];
                return [];
            }),
            catchError(() => of(this.datosDemoStockCritico()))
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
            catchError(() => of(this.datosDemoMovimientosPorDia()))
        );
    }

    obtenerValorPorCategoria(): Observable<ValorPorCategoria[]> {
        return this.http.get<RespuestaApi<ValorPorCategoria[]>>(`${this.apiUrl}/estadisticas/valor-categoria`).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as ValorPorCategoria[];
                return [];
            }),
            catchError(() => of(this.datosDemoValorCategoria()))
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
            catchError(() => of(this.datosDemoTopProductos()))
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

    // Datos de demostración para cuando el backend aún no tiene los endpoints de estadísticas
    private datosDemoPorTipo(): MovimientoPorTipo[] {
        return [
            { tipo: 'entrada', cantidad: 245, porcentaje: 42 },
            { tipo: 'salida', cantidad: 186, porcentaje: 32 },
            { tipo: 'ajuste', cantidad: 89, porcentaje: 15 },
            { tipo: 'devolucion', cantidad: 43, porcentaje: 7 },
            { tipo: 'transferencia', cantidad: 22, porcentaje: 4 },
        ];
    }

    private datosDemoStockCritico(): ProductoStockCritico[] {
        return [
            { id: 1, nombre: 'Camiseta Deportiva XL', sku: 'CAM-DEP-XL', stock: 0, stockMinimo: 10, precio: 450.00, categoria: 'Ropa', estado: 'sin-stock' },
            { id: 2, nombre: 'Tenis Running Pro', sku: 'TEN-RUN-001', stock: 2, stockMinimo: 15, precio: 1850.00, categoria: 'Calzado', estado: 'stock-bajo' },
            { id: 3, nombre: 'Mochila Escolar 30L', sku: 'MOC-ESC-30', stock: 3, stockMinimo: 20, precio: 680.00, categoria: 'Accesorios', estado: 'stock-bajo' },
            { id: 4, nombre: 'Audífonos Bluetooth', sku: 'AUD-BT-001', stock: 0, stockMinimo: 8, precio: 520.00, categoria: 'Electrónica', estado: 'sin-stock' },
            { id: 5, nombre: 'Reloj Digital Sport', sku: 'REL-DIG-SP', stock: 1, stockMinimo: 5, precio: 1200.00, categoria: 'Accesorios', estado: 'stock-bajo' },
            { id: 6, nombre: 'Pantalón Cargo M', sku: 'PAN-CAR-M', stock: 0, stockMinimo: 12, precio: 750.00, categoria: 'Ropa', estado: 'sin-stock' },
            { id: 7, nombre: 'Gorra Snapback', sku: 'GOR-SNP-01', stock: 4, stockMinimo: 25, precio: 280.00, categoria: 'Accesorios', estado: 'stock-bajo' },
            { id: 8, nombre: 'Termo Acero 750ml', sku: 'TER-ACE-75', stock: 2, stockMinimo: 10, precio: 420.00, categoria: 'Hogar', estado: 'stock-bajo' },
        ];
    }

    private datosDemoMovimientosPorDia(): MovimientoPorDia[] {
        const datos: MovimientoPorDia[] = [];
        const hoy = new Date();
        for (let i = 29; i >= 0; i--) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() - i);
            datos.push({
                fecha: fecha.toISOString().split('T')[0],
                entradas: Math.floor(Math.random() * 20) + 5,
                salidas: Math.floor(Math.random() * 15) + 3,
                ajustes: Math.floor(Math.random() * 5),
            });
        }
        return datos;
    }

    private datosDemoValorCategoria(): ValorPorCategoria[] {
        return [
            { categoria: 'Electrónica', valorInventario: 285000, cantidadProductos: 45, porcentaje: 35 },
            { categoria: 'Ropa', valorInventario: 156000, cantidadProductos: 120, porcentaje: 19 },
            { categoria: 'Calzado', valorInventario: 142000, cantidadProductos: 38, porcentaje: 17 },
            { categoria: 'Accesorios', valorInventario: 98000, cantidadProductos: 85, porcentaje: 12 },
            { categoria: 'Hogar', valorInventario: 75000, cantidadProductos: 52, porcentaje: 9 },
            { categoria: 'Deportes', valorInventario: 65000, cantidadProductos: 30, porcentaje: 8 },
        ];
    }

    private datosDemoTopProductos(): TopProducto[] {
        return [
            { id: 1, nombre: 'iPhone 15 Pro Max', sku: 'IPH-15PM', stock: 25, totalMovimientos: 89, valorInventario: 625000 },
            { id: 2, nombre: 'Samsung Galaxy S24', sku: 'SAM-S24', stock: 32, totalMovimientos: 76, valorInventario: 480000 },
            { id: 3, nombre: 'MacBook Air M3', sku: 'MAC-AIR-M3', stock: 12, totalMovimientos: 54, valorInventario: 360000 },
            { id: 4, nombre: 'AirPods Pro 2', sku: 'AIR-PRO2', stock: 48, totalMovimientos: 120, valorInventario: 288000 },
            { id: 5, nombre: 'Nike Air Max 90', sku: 'NIK-AM90', stock: 35, totalMovimientos: 95, valorInventario: 157500 },
            { id: 6, nombre: 'iPad Air 5', sku: 'IPAD-A5', stock: 18, totalMovimientos: 42, valorInventario: 198000 },
            { id: 7, nombre: 'JBL Flip 6', sku: 'JBL-FL6', stock: 40, totalMovimientos: 68, valorInventario: 120000 },
            { id: 8, nombre: 'Adidas Ultraboost', sku: 'ADI-UB22', stock: 28, totalMovimientos: 62, valorInventario: 112000 },
        ];
    }
}
