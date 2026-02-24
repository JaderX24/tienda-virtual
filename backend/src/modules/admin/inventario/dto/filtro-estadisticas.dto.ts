import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

export class FiltroEstadisticasDto {
    @ApiPropertyOptional({ description: 'Cantidad de días para estadísticas', default: 30 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(365)
    @Type(() => Number)
    dias?: number = 30;

    @ApiPropertyOptional({ description: 'Límite de resultados', default: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    @Type(() => Number)
    limite?: number = 10;
}
