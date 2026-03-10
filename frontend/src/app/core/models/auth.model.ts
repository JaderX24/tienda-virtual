export interface RolUsuario {
    nombre: string;
    codigo: string;
}

export interface UsuarioAdmin {
    id: number;
    nombre: string;
    correo: string;
    avatar?: string;
    rol?: RolUsuario;
    permisos: string[];
}

export interface RespuestaLoginAdmin {
    exito: boolean;
    mensaje: string;
    codigo?: string;
    errores?: string[];
    usuario?: UsuarioAdmin;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    requiere2FA?: boolean;
    metodo2fa?: string;
    token2FA?: string;
}

export interface RespuestaRefreshToken {
    exito: boolean;
    accessToken: string;
    expiresIn: number;
}

export interface CredencialesLogin {
    correo: string;
    contrasena: string;
}

export interface SesionActiva {
    id: number;
    ip: string;
    userAgent: string;
    creadoEn: string;
    expiraEn: string;
}

export interface RespuestaSesiones {
    exito: boolean;
    sesiones: SesionActiva[];
}
