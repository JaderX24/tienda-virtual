import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class FiltroProductosAdminDto {
    @ApiPropertyOptional({ description: 'Buscar por nombre, SKU o descripción corta' })
    @IsOptional()
    @IsString()
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Filtrar por categoría' })
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'El ID de categoría debe ser mayor a 0' })
    @Type(() => Number)
    categoriaId?: number;

    @ApiPropertyOptional({ description: 'Filtrar por marca' })
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'El ID de marca debe ser mayor a 0' })
    @Type(() => Number)
    marcaId?: number;

    @ApiPropertyOptional({ description: 'Precio mínimo' })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'El precio mínimo no puede ser negativo' })
    @Type(() => Number)
    precioMinimo?: number;

    @ApiPropertyOptional({ description: 'Precio máximo' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    precioMaximo?: number;

    @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    activo?: boolean;

    @ApiPropertyOptional({ description: 'Filtrar por producto destacado' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    destacado?: boolean;

    @ApiPropertyOptional({ description: 'Número de página', default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(VALIDACIONES.PAGINA_MINIMA)
    @Type(() => Number)
    pagina?: number = 1;

    @ApiPropertyOptional({ description: 'Elementos por página', default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(VALIDACIONES.ELEMENTOS_POR_PAGINA_MAXIMO)
    @Type(() => Number)
    limite?: number = VALIDACIONES.ELEMENTOS_POR_PAGINA_DEFAULT;

    @ApiPropertyOptional({ description: 'Campo para ordenar' })
    @IsOptional()
    @IsString()
    ordenarPor?: string = 'creadoEn';

    @ApiPropertyOptional({ description: 'Dirección del ordenamiento', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'], { message: 'La dirección debe ser asc o desc' })
    orden?: 'asc' | 'desc' = 'desc';
}
