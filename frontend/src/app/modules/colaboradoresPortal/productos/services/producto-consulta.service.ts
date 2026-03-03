import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ResumenProductos {
    totalProductos: number;
    productosActivos: number;
    agotados: number;
    stockBajo: number;
    inactivos: number;
}

export interface CategoriaProducto {
    id: number;
    nombre: string;
    categoriaPadreId: number | null;
    totalProductos: number;
}

export interface MarcaProducto {
    id: number;
    nombre: string;
    logo: string | null;
    totalProductos: number;
}

export interface ProductoLista {
    id: number;
    nombre: string;
    sku: string;
    descripcionCorta: string | null;
    precio: number;
    precioComparacion: number | null;
    costo: number | null;
    stock: number;
    stockMinimo: number;
    estadoStock: 'disponible' | 'bajo' | 'agotado';
    activo: boolean;
    destacado: boolean;
    categoria: string;
    categoriaId: number | null;
    marca: string | null;
    marcaId: number | null;
    imagen: string | null;
}

export interface ImagenProducto {
    id: number;
    url: string;
    altText: string | null;
    esPrincipal: boolean;
}

export interface MovimientoProducto {
    id: number;
    tipo: string;
    cantidad: number;
    stockAnterior: number;
    stockNuevo: number;
    motivo: string;
    usuario: string;
    fecha: string;
}

export interface DetalleProducto {
    id: number;
    nombre: string;
    sku: string;
    slug: string;
    descripcionCorta: string | null;
    descripcion: string | null;
    precio: number;
    precioComparacion: number | null;
    costo: number | null;
    margenGanancia: number | null;
    stock: number;
    stockMinimo: number;
    estadoStock: string;
    peso: number | null;
    activo: boolean;
    destacado: boolean;
    categoria: {
        id: number;
        nombre: string;
        padre: { id: number; nombre: string } | null;
    } | null;
    marca: {
        id: number;
        nombre: string;
        logo: string | null;
    } | null;
    imagenes: ImagenProducto[];
    ultimosMovimientos: MovimientoProducto[];
    creadoEn: string;
    actualizadoEn: string;
}

export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface FiltrosProductos {
    busqueda?: string;
    categoriaId?: number;
    marcaId?: number;
    estado?: string;
    precioDesde?: number;
    precioHasta?: number;
    ordenarPor?: string;
    ordenDireccion?: string;
    pagina?: number;
    limite?: number;
}

export interface FiltrosMovimientos {
    pagina?: number;
    limite?: number;
    tipoMovimiento?: string;
}

export interface RespuestaResumen {
    exito: boolean;
    datos: ResumenProductos;
}

export interface RespuestaProductos {
    exito: boolean;
    datos: ProductoLista[];
    paginacion: Paginacion;
}

export interface RespuestaDetalle {
    exito: boolean;
    datos: DetalleProducto;
}

export interface RespuestaCategorias {
    exito: boolean;
    datos: CategoriaProducto[];
}

export interface RespuestaMarcas {
    exito: boolean;
    datos: MarcaProducto[];
}

export interface RespuestaMovimientos {
    exito: boolean;
    datos: MovimientoProducto[];
    paginacion: Paginacion;
}

@Injectable({ providedIn: 'root' })
export class ProductoConsultaService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/productos`;

    cargando = signal(false);

    constructor(private http: HttpClient) {}

    obtenerResumen(): Observable<RespuestaResumen> {
        return this.http.get<RespuestaResumen>(`${this.apiUrl}/resumen`);
    }

    obtenerCategorias(): Observable<RespuestaCategorias> {
        return this.http.get<RespuestaCategorias>(`${this.apiUrl}/categorias`);
    }

    obtenerMarcas(): Observable<RespuestaMarcas> {
        return this.http.get<RespuestaMarcas>(`${this.apiUrl}/marcas`);
    }

    obtenerProductos(filtros: FiltrosProductos = {}): Observable<RespuestaProductos> {
        this.cargando.set(true);
        let params = new HttpParams();

        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.categoriaId) params = params.set('categoriaId', filtros.categoriaId.toString());
        if (filtros.marcaId) params = params.set('marcaId', filtros.marcaId.toString());
        if (filtros.estado) params = params.set('estado', filtros.estado);
        if (filtros.precioDesde !== undefined) params = params.set('precioDesde', filtros.precioDesde.toString());
        if (filtros.precioHasta !== undefined) params = params.set('precioHasta', filtros.precioHasta.toString());
        if (filtros.ordenarPor) params = params.set('ordenarPor', filtros.ordenarPor);
        if (filtros.ordenDireccion) params = params.set('ordenDireccion', filtros.ordenDireccion);
        if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
        if (filtros.limite) params = params.set('limite', filtros.limite.toString());

        return this.http.get<RespuestaProductos>(this.apiUrl, { params })
            .pipe(finalize(() => this.cargando.set(false)));
    }

    obtenerDetalle(id: number): Observable<RespuestaDetalle> {
        return this.http.get<RespuestaDetalle>(`${this.apiUrl}/${id}`);
    }

    obtenerMovimientos(id: number, filtros: FiltrosMovimientos = {}): Observable<RespuestaMovimientos> {
        let params = new HttpParams();
        if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
        if (filtros.limite) params = params.set('limite', filtros.limite.toString());
        if (filtros.tipoMovimiento) params = params.set('tipoMovimiento', filtros.tipoMovimiento);

        return this.http.get<RespuestaMovimientos>(`${this.apiUrl}/${id}/movimientos`, { params });
    }
}
