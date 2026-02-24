export interface Producto {
    id: number;
    nombre: string;
    slug: string;
    sku: string;
    descripcionCorta: string | null;
    descripcion: string | null;
    precio: number;
    precioComparacion: number | null;
    costo: number | null;
    stock: number;
    stockMinimo: number;
    peso: number | null;
    activo: boolean;
    destacado: boolean;
    categoriaId: number;
    marcaId: number | null;
    creadoEn: string;
    actualizadoEn: string;
    categoria?: CategoriaResumen;
    marca?: MarcaResumen | null;
    imagenes?: ImagenProducto[];
}

export interface CategoriaResumen {
    id: number;
    nombre: string;
    slug: string;
    activa: boolean;
}

export interface MarcaResumen {
    id: number;
    nombre: string;
    slug: string;
    logo: string | null;
    activa: boolean;
}

export interface ImagenProducto {
    id: number;
    productoId: number;
    url: string;
    altText: string | null;
    orden: number;
    esPrincipal: boolean;
}

export interface CrearProductoDto {
    nombre: string;
    sku: string;
    descripcionCorta?: string;
    descripcion?: string;
    precio: number;
    precioComparacion?: number;
    costo?: number;
    categoriaId: number;
    marcaId?: number;
    peso?: number;
    activo?: boolean;
    destacado?: boolean;
    etiquetas?: number[];
}

export interface ActualizarProductoDto {
    nombre?: string;
    sku?: string;
    descripcionCorta?: string;
    descripcion?: string;
    precio?: number;
    precioComparacion?: number;
    costo?: number;
    categoriaId?: number;
    marcaId?: number;
    peso?: number;
    activo?: boolean;
    destacado?: boolean;
    etiquetas?: number[];
}

export interface FiltrosProducto {
    busqueda?: string;
    categoriaId?: number;
    marcaId?: number;
    precioMinimo?: number;
    precioMaximo?: number;
    conStock?: boolean;
    activo?: boolean;
    pagina: number;
    limite: number;
    ordenarPor?: string;
    orden?: 'asc' | 'desc';
}

export interface RespuestaApi<T> {
    exito: boolean;
    mensaje?: string;
    datos: T;
    meta?: {
        total?: number;
        pagina?: number;
        limite?: number;
        totalPaginas?: number;
    };
}

export interface RespuestaPaginada<T> {
    datos: T[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}
