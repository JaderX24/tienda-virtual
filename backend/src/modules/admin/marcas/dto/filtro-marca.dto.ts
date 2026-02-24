import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class FiltroMarcaDto {
    @ApiPropertyOptional({ description: 'Búsqueda por nombre o slug' })
    @IsOptional()
    @IsString({ message: 'La búsqueda debe ser texto' })
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    @Type(() => Boolean)
    activa?: boolean;

    @ApiPropertyOptional({ description: 'Número de página', default: 1 })
    @IsOptional()
    @IsNumber({}, { message: 'La página debe ser un número' })
    @Min(VALIDACIONES.PAGINA_MINIMA, { message: 'La página mínima es 1' })
    @Type(() => Number)
    pagina?: number = 1;

    @ApiPropertyOptional({ description: 'Elementos por página', default: 20 })
    @IsOptional()
    @IsNumber({}, { message: 'El límite debe ser un número' })
    @Min(1, { message: 'El límite mínimo es 1' })
    @Max(VALIDACIONES.ELEMENTOS_POR_PAGINA_MAXIMO, { message: 'El límite máximo es 100' })
    @Type(() => Number)
    limite?: number = VALIDACIONES.ELEMENTOS_POR_PAGINA_DEFAULT;

    @ApiPropertyOptional({ description: 'Campo para ordenar', default: 'creadoEn' })
    @IsOptional()
    @IsString({ message: 'El campo de ordenamiento debe ser texto' })
    ordenarPor?: string = 'creadoEn';

    @ApiPropertyOptional({ description: 'Dirección del orden', enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsString({ message: 'El orden debe ser texto' })
    orden?: 'asc' | 'desc' = 'desc';
}
