export interface Categoria {
    id: number;
    nombre: string;
    slug: string;
    descripcion?: string;
    imagen?: string;
    orden: number;
    activa: boolean;
    categoriaPadreId?: number;
    categoriaPadre?: Categoria;
    subcategorias?: Categoria[];
    creadoEn: Date | string;
    actualizadoEn: Date | string;
}

export interface CrearCategoriaDto {
    nombre: string;
    descripcion?: string;
    categoriaPadreId?: number;
}

export interface ActualizarCategoriaDto {
    nombre?: string;
    descripcion?: string;
    activa?: boolean;
}

export interface FiltrosCategoria {
    busqueda?: string;
    activa?: boolean;
}

export interface RespuestaApi<T> {
    exito: boolean;
    mensaje?: string;
    datos: T;
}
