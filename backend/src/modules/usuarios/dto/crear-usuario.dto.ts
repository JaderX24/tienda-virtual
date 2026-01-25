import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches, IsBoolean, IsNumber } from 'class-validator';
import { VALIDACIONES } from '../../../common/constants';

export class CrearUsuarioDto {
    @ApiProperty({ description: 'Nombre completo del usuario' })
    @IsString()
    @MinLength(VALIDACIONES.NOMBRE_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.NOMBRE_LONGITUD_MAXIMA)
    nombre: string;

    @ApiProperty({ description: 'Correo electrónico' })
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(VALIDACIONES.CORREO_LONGITUD_MAXIMA)
    correo: string;

    @ApiProperty({ description: 'Contraseña' })
    @IsString()
    @MinLength(VALIDACIONES.CONTRASENA_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.CONTRASENA_LONGITUD_MAXIMA)
    @Matches(VALIDACIONES.CONTRASENA_REGEX, {
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    })
    contrasena: string;

    @ApiPropertyOptional({ description: 'Teléfono' })
    @IsOptional()
    @IsString()
    @Matches(VALIDACIONES.TELEFONO_REGEX, {
        message: 'El teléfono debe tener un formato válido de Honduras',
    })
    telefono?: string;

    @ApiPropertyOptional({ description: 'ID del rol' })
    @IsOptional()
    @IsNumber()
    rolId?: number;
}
