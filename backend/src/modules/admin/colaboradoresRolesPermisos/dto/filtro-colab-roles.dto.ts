import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    IsEnum,
    Min,
    Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FiltroColabRolesDto {
    @ApiPropertyOptional({ description: 'Búsqueda por nombre o código' })
    @IsOptional()
    @IsString()
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Filtrar solo activos/inactivos' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    esActivo?: boolean;

    @ApiPropertyOptional({ description: 'Filtrar solo supervisores' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    esSupervisor?: boolean;

    @ApiPropertyOptional({ description: 'Página actual', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina?: number;

    @ApiPropertyOptional({ description: 'Elementos por página', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limite?: number;

    @ApiPropertyOptional({ description: 'Campo de ordenamiento', enum: ['nombre', 'codigo', 'nivelJerarquia', 'creadoEn'] })
    @IsOptional()
    @IsEnum(['nombre', 'codigo', 'nivelJerarquia', 'creadoEn'])
    ordenarPor?: string;

    @ApiPropertyOptional({ description: 'Dirección del orden', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    orden?: 'asc' | 'desc';
}
