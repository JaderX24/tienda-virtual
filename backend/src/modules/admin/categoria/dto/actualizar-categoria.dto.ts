import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsInt,
    IsBoolean,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActualizarCategoriaDto {
    @ApiPropertyOptional({ description: 'Nombre de la categoría' })
    @IsOptional()
    @IsString({ message: 'El nombre debe ser texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    nombre?: string;

    @ApiPropertyOptional({ description: 'Descripción de la categoría' })
    @IsOptional()
    @IsString({ message: 'La descripción debe ser texto' })
    @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
    descripcion?: string;

    @ApiPropertyOptional({ description: 'URL de la imagen de la categoría' })
    @IsOptional()
    @IsString({ message: 'La imagen debe ser texto' })
    @MaxLength(500, { message: 'La URL de imagen no puede exceder 500 caracteres' })
    imagen?: string;

    @ApiPropertyOptional({ description: 'ID de la categoría padre' })
    @IsOptional()
    @IsInt({ message: 'El ID de categoría padre debe ser un número entero' })
    @Min(1, { message: 'El ID de categoría padre debe ser mayor a 0' })
    @Type(() => Number)
    categoriaPadreId?: number;

    @ApiPropertyOptional({ description: 'Orden de la categoría' })
    @IsOptional()
    @IsInt({ message: 'El orden debe ser un número entero' })
    @Min(0, { message: 'El orden no puede ser negativo' })
    @Type(() => Number)
    orden?: number;

    @ApiPropertyOptional({ description: 'Estado activo de la categoría' })
    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activa?: boolean;
}
