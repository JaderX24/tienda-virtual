import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { VALIDACIONES } from '../../../../common/constants';

export class CambiarContrasenaDto {
    @ApiProperty({ description: 'Nueva contraseña' })
    @IsString()
    @MinLength(VALIDACIONES.CONTRASENA_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.CONTRASENA_LONGITUD_MAXIMA)
    @Matches(VALIDACIONES.CONTRASENA_REGEX, {
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    })
    nuevaContrasena!: string;
}
