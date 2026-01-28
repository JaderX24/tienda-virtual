import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class FiltroUsuariosDto {
    @ApiPropertyOptional({ description: 'Buscar por nombre o correo' })
    @IsOptional()
    @IsString()
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Filtrar por rol' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    rolId?: number;

    @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    activo?: boolean;

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
    orden?: 'asc' | 'desc' = 'desc';
}
