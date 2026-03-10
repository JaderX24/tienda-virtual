export interface JwtPayload {
    sub: number;
    correo: string;
    rol: string;
    permisos: string[];
}
