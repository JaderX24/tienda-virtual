import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { VALIDACIONES } from '../../../common/constants';

export class CambiarContrasenaDto {
    @ApiProperty({
        description: 'Contraseña actual',
    })
    @IsString()
    contrasenaActual: string;

    @ApiProperty({
        description: 'Nueva contraseña',
    })
    @IsString()
    @MinLength(VALIDACIONES.CONTRASENA_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.CONTRASENA_LONGITUD_MAXIMA)
    @Matches(VALIDACIONES.CONTRASENA_REGEX, {
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    })
    nuevaContrasena: string;
}

export class RecuperarContrasenaDto {
    @ApiProperty({
        description: 'Correo electrónico del usuario',
        example: 'usuario@ejemplo.com',
    })
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    correo: string;
}

export class RestablecerContrasenaDto {
    @ApiProperty({
        description: 'Token de restablecimiento',
    })
    @IsString()
    token: string;

    @ApiProperty({
        description: 'Nueva contraseña',
    })
    @IsString()
    @MinLength(VALIDACIONES.CONTRASENA_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.CONTRASENA_LONGITUD_MAXIMA)
    @Matches(VALIDACIONES.CONTRASENA_REGEX, {
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    })
    nuevaContrasena: string;
}
