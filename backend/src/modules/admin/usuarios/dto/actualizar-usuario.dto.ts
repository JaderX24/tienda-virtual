import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class ActualizarUsuarioDto {
    @ApiPropertyOptional({ description: 'Nombre del usuario' })
    @IsOptional()
    @IsString({ message: 'El nombre debe ser texto' })
    @MinLength(VALIDACIONES.NOMBRE_LONGITUD_MINIMA, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(VALIDACIONES.NOMBRE_LONGITUD_MAXIMA, { message: 'El nombre no puede exceder 100 caracteres' })
    @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, { message: 'El nombre solo puede contener letras' })
    nombre?: string;

    @ApiPropertyOptional({ description: 'Correo electrónico (único, no duplicado)' })
    @IsOptional()
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(VALIDACIONES.CORREO_LONGITUD_MAXIMA, { message: 'El correo no puede exceder 255 caracteres' })
    correo?: string;

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

    @ApiPropertyOptional({ description: 'Estado activo del usuario' })
    @IsOptional()
    @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
    activo?: boolean;

    @ApiPropertyOptional({ description: 'ID del rol' })
    @IsOptional()
    @IsNumber({}, { message: 'El rol debe ser un número válido' })
    @Type(() => Number)
    rolId?: number;
}

