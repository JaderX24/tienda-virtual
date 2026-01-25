import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { VALIDACIONES } from '../../../common/constants';

export class LoginDto {
    @ApiProperty({
        description: 'Correo electrónico del usuario',
        example: 'usuario@ejemplo.com',
    })
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(VALIDACIONES.CORREO_LONGITUD_MAXIMA)
    correo: string;

    @ApiProperty({
        description: 'Contraseña del usuario',
        example: 'MiContrasena123!',
    })
    @IsString()
    @MinLength(VALIDACIONES.CONTRASENA_LONGITUD_MINIMA, {
        message: `La contraseña debe tener al menos ${VALIDACIONES.CONTRASENA_LONGITUD_MINIMA} caracteres`,
    })
    contrasena: string;
}
