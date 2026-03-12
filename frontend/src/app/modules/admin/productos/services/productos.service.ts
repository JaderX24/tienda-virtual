import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { OpcionesCatalogoService } from '../../../../core/services/opciones-catalogo.service';
import {
    Producto,
    CategoriaResumen,
    MarcaResumen,
    CrearProductoDto,
    ActualizarProductoDto,
    FiltrosProducto,
    RespuestaPaginada,
    RespuestaApi
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class ProductosService {
    private readonly apiUrl = `${environment.apiUrl}/admin/productos`;
    private readonly http = inject(HttpClient);
    private readonly opcionesCatalogo = inject(OpcionesCatalogoService);

    private cargando = signal(false);
    private productos = signal<Producto[]>([]);
    private totalProductos = signal(0);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaProductos = this.productos.asReadonly();
    readonly total = this.totalProductos.asReadonly();

    obtenerProductos(filtros: FiltrosProducto): Observable<RespuestaPaginada<Producto>> {
        this.cargando.set(true);

        let params = new HttpParams()
            .set('pagina', filtros.pagina.toString())
            .set('limite', filtros.limite.toString());

        if (filtros.busqueda?.trim()) {
            params = params.set('busqueda', filtros.busqueda.trim());
        }
        if (filtros.categoriaId) {
            params = params.set('categoriaId', filtros.categoriaId.toString());
        }
        if (filtros.marcaId) {
            params = params.set('marcaId', filtros.marcaId.toString());
        }
        if (filtros.precioMinimo !== undefined) {
            params = params.set('precioMinimo', filtros.precioMinimo.toString());
        }
        if (filtros.precioMaximo !== undefined) {
            params = params.set('precioMaximo', filtros.precioMaximo.toString());
        }
        if (filtros.conStock !== undefined) {
            params = params.set('conStock', filtros.conStock.toString());
        }
        if (filtros.activo !== undefined) {
            params = params.set('activo', filtros.activo.toString());
        }
        if (filtros.ordenarPor) {
            params = params.set('ordenarPor', filtros.ordenarPor);
        }
        if (filtros.orden) {
            params = params.set('orden', filtros.orden);
        }

        return this.http.get<RespuestaApi<RespuestaPaginada<Producto>>>(this.apiUrl, { params }).pipe(
            map(respuesta => {
                if (respuesta.datos) return respuesta.datos;
                return {
                    datos: respuesta.datos as unknown as Producto[],
                    total: respuesta.meta?.total || 0,
                    pagina: respuesta.meta?.pagina || 1,
                    limite: respuesta.meta?.limite || filtros.limite,
                    totalPaginas: respuesta.meta?.totalPaginas || 0
                } as RespuestaPaginada<Producto>;
            }),
            tap(datos => {
                this.productos.set(datos.datos);
                this.totalProductos.set(datos.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerProductoPorId(id: number): Observable<Producto> {
        return this.http.get<RespuestaApi<Producto>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => {
                if (respuesta.datos) return respuesta.datos;
                return respuesta as unknown as Producto;
            }),
            catchError(error => throwError(() => error))
        );
    }

    crearProducto(datos: CrearProductoDto): Observable<Producto> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ producto: Producto }>>(this.apiUrl, datos).pipe(
            map(respuesta => {
                if (respuesta.datos?.producto) return respuesta.datos.producto;
                return respuesta.datos as unknown as Producto;
            }),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarProducto(id: number, datos: ActualizarProductoDto): Observable<Producto> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ producto: Producto }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => {
                if (respuesta.datos?.producto) return respuesta.datos.producto;
                return respuesta.datos as unknown as Producto;
            }),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    eliminarProducto(id: number): Observable<void> {
        return this.http.delete<RespuestaApi<void>>(`${this.apiUrl}/${id}`).pipe(
            map(() => undefined),
            catchError(error => throwError(() => error))
        );
    }

    obtenerCategorias(): Observable<CategoriaResumen[]> {
        return this.http.get<RespuestaApi<CategoriaResumen[]>>(`${this.apiUrl}/categorias`).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as CategoriaResumen[];
                return [];
            }),
            catchError(error => throwError(() => error))
        );
    }

    obtenerMarcas(): Observable<MarcaResumen[]> {
        return this.http.get<RespuestaApi<MarcaResumen[]>>(`${this.apiUrl}/marcas`).pipe(
            map(respuesta => {
                if (Array.isArray(respuesta.datos)) return respuesta.datos;
                if (Array.isArray(respuesta)) return respuesta as unknown as MarcaResumen[];
                return [];
            }),
            catchError(error => throwError(() => error))
        );
    }

    formatearPrecio(monto: number): string {
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

    obtenerEstadoStock(stock: number, stockMinimo: number): { clase: string; texto: string; icono: string } {
        if (stock <= 0) {
            return { clase: 'sin-stock', texto: 'Sin stock', icono: 'bi-x-circle-fill' };
        }
        if (stock <= stockMinimo) {
            return { clase: 'stock-bajo', texto: 'Stock bajo', icono: 'bi-exclamation-triangle-fill' };
        }
        return { clase: 'stock-ok', texto: 'En stock', icono: 'bi-check-circle-fill' };
    }
}
