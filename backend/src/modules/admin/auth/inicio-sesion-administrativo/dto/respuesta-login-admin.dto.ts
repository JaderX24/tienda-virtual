import { ApiProperty } from '@nestjs/swagger';

export class UsuarioAdminDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Juan Pérez' })
    nombre!: string;

    @ApiProperty({ example: 'admin@tiendavirtual.com' })
    correo!: string;

    @ApiProperty({ example: 'admin' })
    rol!: string;

    @ApiProperty({ example: ['usuarios:leer', 'productos:leer'] })
    permisos!: string[];
}

export class RespuestaLoginAdminDto {
    @ApiProperty({ example: true })
    exito!: boolean;

    @ApiProperty({ example: 'Inicio de sesión administrativo exitoso' })
    mensaje!: string;

    @ApiProperty({ type: UsuarioAdminDto })
    usuario!: UsuarioAdminDto;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken!: string;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    refreshToken!: string;

    @ApiProperty({ example: 900 })
    expiresIn!: number;
}

export class RespuestaErrorLoginDto {
    @ApiProperty({ example: false })
    exito!: boolean;

    @ApiProperty({ example: 'Credenciales incorrectas' })
    mensaje!: string;

    @ApiProperty({ example: 'CREDENCIALES_INVALIDAS', required: false })
    codigo?: string;

    @ApiProperty({ example: 2, required: false })
    intentosRestantes?: number;
}
