import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max, MinLength, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../common/constants';

export class ActualizarProductoDto {
    @ApiPropertyOptional({ description: 'Nombre del producto' })
    @IsOptional()
    @IsString()
    @MinLength(VALIDACIONES.NOMBRE_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.NOMBRE_LONGITUD_MAXIMA)
    nombre?: string;

    @ApiPropertyOptional({ description: 'Código SKU único' })
    @IsOptional()
    @IsString()
    @MinLength(VALIDACIONES.SKU_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.SKU_LONGITUD_MAXIMA)
    @Matches(VALIDACIONES.SKU_REGEX, {
        message: 'El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos',
    })
    sku?: string;

    @ApiPropertyOptional({ description: 'Descripción corta' })
    @IsOptional()
    @IsString()
    @MaxLength(VALIDACIONES.DESCRIPCION_CORTA_MAXIMA)
    descripcionCorta?: string;

    @ApiPropertyOptional({ description: 'Descripción completa' })
    @IsOptional()
    @IsString()
    @MaxLength(VALIDACIONES.DESCRIPCION_LARGA_MAXIMA)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'Precio de venta' })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: VALIDACIONES.DECIMALES_MONEDA })
    @Min(VALIDACIONES.PRECIO_MINIMO)
    @Max(VALIDACIONES.PRECIO_MAXIMO)
    @Type(() => Number)
    precio?: number;

    @ApiPropertyOptional({ description: 'Precio de comparación' })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: VALIDACIONES.DECIMALES_MONEDA })
    @Min(VALIDACIONES.PRECIO_MINIMO)
    @Type(() => Number)
    precioComparacion?: number;

    @ApiPropertyOptional({ description: 'Costo del producto' })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: VALIDACIONES.DECIMALES_MONEDA })
    @Min(0)
    @Type(() => Number)
    costo?: number;

    @ApiPropertyOptional({ description: 'ID de la categoría' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    categoriaId?: number;

    @ApiPropertyOptional({ description: 'ID de la marca' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    marcaId?: number;

    @ApiPropertyOptional({ description: 'Peso en kilogramos' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    peso?: number;

    @ApiPropertyOptional({ description: 'Producto activo' })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @ApiPropertyOptional({ description: 'IDs de etiquetas' })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    etiquetas?: number[];
}
