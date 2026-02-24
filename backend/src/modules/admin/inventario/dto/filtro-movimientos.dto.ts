import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class FiltroMovimientosDto {
    @ApiPropertyOptional({ description: 'Búsqueda por nombre de producto o motivo' })
    @IsOptional()
    @IsString()
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Tipo de movimiento', enum: ['entrada', 'salida', 'ajuste', 'devolucion', 'transferencia'] })
    @IsOptional()
    @IsString()
    tipoMovimiento?: string;

    @ApiPropertyOptional({ description: 'ID del producto' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    productoId?: number;

    @ApiPropertyOptional({ description: 'Fecha inicio (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    fechaInicio?: string;

    @ApiPropertyOptional({ description: 'Fecha fin (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    fechaFin?: string;

    @ApiPropertyOptional({ description: 'Página', default: 1 })
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

    @ApiPropertyOptional({ description: 'Campo para ordenar', default: 'creadoEn' })
    @IsOptional()
    @IsString()
    ordenarPor?: string = 'creadoEn';

    @ApiPropertyOptional({ description: 'Dirección de orden', enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    orden?: 'asc' | 'desc' = 'desc';
}
