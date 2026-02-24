export interface Marca {
    id: number;
    nombre: string;
    slug: string;
    logo?: string;
    descripcion?: string;
    activa: boolean;
    creadoEn: Date | string;
    _count?: {
        productos: number;
    };
}

export interface CrearMarcaDto {
    nombre: string;
    descripcion?: string;
    logo?: string;
}

export interface ActualizarMarcaDto {
    nombre?: string;
    descripcion?: string;
    logo?: string;
    activa?: boolean;
}

export interface FiltrosMarca {
    busqueda?: string;
    activa?: boolean;
}

export interface RespuestaApi<T> {
    exito: boolean;
    mensaje?: string;
    datos: T;
}
