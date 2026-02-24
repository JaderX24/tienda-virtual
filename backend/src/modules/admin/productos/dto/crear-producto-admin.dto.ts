import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsArray,
    Min,
    Max,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class CrearProductoAdminDto {
    @ApiProperty({ description: 'Nombre del producto' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MinLength(VALIDACIONES.NOMBRE_LONGITUD_MINIMA, {
        message: `El nombre debe tener al menos ${VALIDACIONES.NOMBRE_LONGITUD_MINIMA} caracteres`,
    })
    @MaxLength(VALIDACIONES.NOMBRE_LONGITUD_MAXIMA, {
        message: `El nombre no puede exceder ${VALIDACIONES.NOMBRE_LONGITUD_MAXIMA} caracteres`,
    })
    nombre!: string;

    @ApiProperty({ description: 'Código SKU único del producto' })
    @IsString({ message: 'El SKU debe ser una cadena de texto' })
    @MinLength(VALIDACIONES.SKU_LONGITUD_MINIMA, {
        message: `El SKU debe tener al menos ${VALIDACIONES.SKU_LONGITUD_MINIMA} caracteres`,
    })
    @MaxLength(VALIDACIONES.SKU_LONGITUD_MAXIMA, {
        message: `El SKU no puede exceder ${VALIDACIONES.SKU_LONGITUD_MAXIMA} caracteres`,
    })
    @Matches(VALIDACIONES.SKU_REGEX, {
        message: 'El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos',
    })
    sku!: string;

    @ApiPropertyOptional({ description: 'Descripción corta del producto' })
    @IsOptional()
    @IsString({ message: 'La descripción corta debe ser una cadena de texto' })
    @MaxLength(VALIDACIONES.DESCRIPCION_CORTA_MAXIMA, {
        message: `La descripción corta no puede exceder ${VALIDACIONES.DESCRIPCION_CORTA_MAXIMA} caracteres`,
    })
    descripcionCorta?: string;

    @ApiPropertyOptional({ description: 'Descripción completa del producto' })
    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @MaxLength(VALIDACIONES.DESCRIPCION_LARGA_MAXIMA, {
        message: `La descripción no puede exceder ${VALIDACIONES.DESCRIPCION_LARGA_MAXIMA} caracteres`,
    })
    descripcion?: string;

    @ApiProperty({ description: 'Precio de venta del producto' })
    @IsNumber({ maxDecimalPlaces: VALIDACIONES.DECIMALES_MONEDA }, {
        message: 'El precio debe ser un número con máximo 2 decimales',
    })
    @Min(VALIDACIONES.PRECIO_MINIMO, {
        message: `El precio debe ser al menos ${VALIDACIONES.PRECIO_MINIMO}`,
    })
    @Max(VALIDACIONES.PRECIO_MAXIMO, {
        message: `El precio no puede exceder ${VALIDACIONES.PRECIO_MAXIMO}`,
    })
    @Type(() => Number)
    precio!: number;

    @ApiPropertyOptional({ description: 'Precio de comparación (precio anterior)' })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: VALIDACIONES.DECIMALES_MONEDA }, {
        message: 'El precio de comparación debe ser un número con máximo 2 decimales',
    })
    @Min(VALIDACIONES.PRECIO_MINIMO, {
        message: `El precio de comparación debe ser al menos ${VALIDACIONES.PRECIO_MINIMO}`,
    })
    @Type(() => Number)
    precioComparacion?: number;

    @ApiPropertyOptional({ description: 'Costo del producto' })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: VALIDACIONES.DECIMALES_MONEDA }, {
        message: 'El costo debe ser un número con máximo 2 decimales',
    })
    @Min(0, { message: 'El costo no puede ser negativo' })
    @Type(() => Number)
    costo?: number;

    @ApiProperty({ description: 'ID de la categoría del producto' })
    @IsNumber({}, { message: 'El ID de categoría debe ser un número' })
    @Min(1, { message: 'El ID de categoría debe ser mayor a 0' })
    @Type(() => Number)
    categoriaId!: number;

    @ApiPropertyOptional({ description: 'ID de la marca del producto' })
    @IsOptional()
    @IsNumber({}, { message: 'El ID de marca debe ser un número' })
    @Min(1, { message: 'El ID de marca debe ser mayor a 0' })
    @Type(() => Number)
    marcaId?: number;

    @ApiPropertyOptional({ description: 'Peso del producto en kilogramos' })
    @IsOptional()
    @IsNumber({}, { message: 'El peso debe ser un número' })
    @Min(0, { message: 'El peso no puede ser negativo' })
    @Type(() => Number)
    peso?: number;

    @ApiPropertyOptional({ description: 'Indica si el producto está activo', default: true })
    @IsOptional()
    @IsBoolean({ message: 'El campo activo debe ser verdadero o falso' })
    activo?: boolean;

    @ApiPropertyOptional({ description: 'Indica si el producto es destacado', default: false })
    @IsOptional()
    @IsBoolean({ message: 'El campo destacado debe ser verdadero o falso' })
    destacado?: boolean;

    @ApiPropertyOptional({ description: 'IDs de etiquetas del producto' })
    @IsOptional()
    @IsArray({ message: 'Las etiquetas deben ser un arreglo' })
    @IsNumber({}, { each: true, message: 'Cada etiqueta debe ser un número' })
    etiquetas?: number[];
}
