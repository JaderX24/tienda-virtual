import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class CrearUsuarioDto {
    @ApiProperty({ description: 'Nombre del usuario' })
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(VALIDACIONES.NOMBRE_LONGITUD_MINIMA, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(VALIDACIONES.NOMBRE_LONGITUD_MAXIMA, { message: 'El nombre no puede exceder 100 caracteres' })
    @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, { message: 'El nombre solo puede contener letras' })
    nombre!: string;

    @ApiProperty({ description: 'Correo electrónico (único, no duplicado)' })
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    @MaxLength(VALIDACIONES.CORREO_LONGITUD_MAXIMA, { message: 'El correo no puede exceder 255 caracteres' })
    correo!: string;

    @ApiPropertyOptional({ description: 'Teléfono con código de país' })
    @IsOptional()
    @IsString({ message: 'El teléfono debe ser texto' })
    @Matches(VALIDACIONES.TELEFONO_REGEX, {
        message: 'El teléfono debe incluir código de país y número válido (ej: +50422221234)',
    })
    @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
    telefono?: string;

    @ApiPropertyOptional({ description: 'URL del avatar del usuario' })
    @IsOptional()
    @IsString({ message: 'El avatar debe ser una URL válida' })
    @MaxLength(500, { message: 'La URL del avatar no puede exceder 500 caracteres' })
    avatar?: string;

    @ApiProperty({ description: 'ID del rol (obligatorio)' })
    @IsNotEmpty({ message: 'El rol es obligatorio' })
    @IsNumber({}, { message: 'El rol debe ser un número válido' })
    @Type(() => Number)
    rolId!: number;
}
