export interface Usuario {
    id: number;
    nombre: string;
    correo: string;
    telefono?: string;
    avatar?: string;
    activo: boolean;
    ultimoAcceso?: Date | string;
    rolId?: number;
    rol?: Rol;
    creadoEn: Date | string;
    actualizadoEn: Date | string;
}

export interface Rol {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}

export interface CrearUsuarioDto {
    nombre: string;
    correo: string;
    contrasena: string;
    telefono?: string;
    rolId?: number;
    activo?: boolean;
}

export interface ActualizarUsuarioDto {
    nombre?: string;
    correo?: string;
    telefono?: string;
    rolId?: number;
    activo?: boolean;
}

export interface CambiarContrasenaDto {
    contrasenaActual?: string;
    nuevaContrasena: string;
}

export interface FiltrosUsuario {
    busqueda?: string;
    rolId?: number;
    activo?: boolean;
    pagina: number;
    limite: number;
}

export interface RespuestaPaginada<T> {
    datos: T[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}
