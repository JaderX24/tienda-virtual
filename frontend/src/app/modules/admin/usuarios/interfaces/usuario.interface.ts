export interface Usuario {
    id: number;
    nombre: string;
    apellido?: string;
    correo: string;
    telefono?: string;
    celular?: string;
    avatar?: string;
    
    tipoDocumento?: string;
    numeroDocumento?: string;
    
    cargo?: string;
    departamento?: string;
    fechaIngreso?: Date | string;
    
    pais?: string;
    direccion?: string;
    ciudad?: string;
    estado?: string;
    departamentoGeo?: string;
    codigoPostal?: string;
    
    fechaNacimiento?: Date | string;
    genero?: string;
    notas?: string;
    
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
    apellido: string;
    correo: string;
    telefono: string;
    celular?: string;
    
    tipoDocumento: string;
    numeroDocumento: string;
    
    cargo: string;
    departamento: string;
    fechaIngreso?: string;
    
    pais?: string;
    direccion?: string;
    ciudad?: string;
    estado?: string;
    codigoPostal?: string;
    
    fechaNacimiento?: string;
    genero?: string;
    notas?: string;
    
    rolId: number;
}

export interface ActualizarUsuarioDto {
    nombre?: string;
    apellido?: string;
    correo?: string;
    telefono?: string;
    celular?: string;
    
    tipoDocumento?: string;
    numeroDocumento?: string;
    
    cargo?: string;
    departamento?: string;
    fechaIngreso?: string;
    
    pais?: string;
    direccion?: string;
    ciudad?: string;
    estado?: string;
    codigoPostal?: string;
    
    fechaNacimiento?: string;
    genero?: string;
    notas?: string;
    
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

export interface RespuestaCrearUsuario {
    mensaje: string;
    usuario: Usuario;
    correoEnviado: boolean;
}
