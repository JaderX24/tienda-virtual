import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { VALIDACIONES } from '../../../common/constants';

export class RegistroDto {
    @ApiProperty({
        description: 'Nombre completo del usuario',
        example: 'Juan Pérez',
    })
    @IsString()
    @MinLength(VALIDACIONES.NOMBRE_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.NOMBRE_LONGITUD_MAXIMA)
    nombre!: string;

    @ApiProperty({
        description: 'Correo electrónico del usuario',
        example: 'usuario@ejemplo.com',
    })
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(VALIDACIONES.CORREO_LONGITUD_MAXIMA)
    correo!: string;

    @ApiProperty({
        description: 'Contraseña del usuario (mínimo 12 caracteres, mayúscula, minúscula, número y carácter especial)',
        example: 'MiContrasena123!',
    })
    @IsString()
    @MinLength(VALIDACIONES.CONTRASENA_LONGITUD_MINIMA, {
        message: `La contraseña debe tener al menos ${VALIDACIONES.CONTRASENA_LONGITUD_MINIMA} caracteres`,
    })
    @MaxLength(VALIDACIONES.CONTRASENA_LONGITUD_MAXIMA)
    @Matches(VALIDACIONES.CONTRASENA_REGEX, {
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    })
    contrasena!: string;

    @ApiProperty({
        description: 'Teléfono del usuario con código de país',
        example: '+50499887766',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(VALIDACIONES.TELEFONO_REGEX, {
        message: 'El teléfono debe incluir código de país y número válido (ej: +50499887766)',
    })
    telefono?: string;
}
