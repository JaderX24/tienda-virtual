export interface Rol {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    creadoEn: Date | string;
    permisos?: RolPermiso[];
}

export interface Permiso {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    modulo: string;
    creadoEn: Date | string;
}

export interface RolPermiso {
    rolId: number;
    permisoId: number;
    permiso: Permiso;
}

export interface CrearRolDto {
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
}

export interface ActualizarRolDto {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
}

export interface AsignarPermisosDto {
    permisoIds: number[];
}

export interface FiltrosRol {
    busqueda?: string;
    activo?: boolean;
}

export interface RespuestaApi<T> {
    exito: boolean;
    mensaje?: string;
    datos: T;
}
