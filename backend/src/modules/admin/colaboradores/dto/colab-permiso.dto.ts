import {
    IsInt,
    IsOptional,
    IsString,
    IsBoolean,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarPermisoDirectoDto {
    @ApiProperty({ description: 'ID del permiso a asignar' })
    @IsInt()
    permisoId!: number;

    @ApiPropertyOptional({ description: 'Tipo de asignación', enum: ['otorgado', 'denegado'], default: 'otorgado' })
    @IsOptional()
    @IsEnum(['otorgado', 'denegado'])
    tipo?: string;

    @ApiPropertyOptional({ description: 'Fecha de fin de vigencia (formato ISO)' })
    @IsOptional()
    @IsString()
    fechaFin?: string;

    @ApiPropertyOptional({ description: 'Motivo de la asignación' })
    @IsOptional()
    @IsString()
    motivo?: string;
}

export class FiltroColabPermisosDto {
    @ApiPropertyOptional({ description: 'Filtrar por módulo' })
    @IsOptional()
    @IsInt()
    moduloId?: number;

    @ApiPropertyOptional({ description: 'Filtrar por acción' })
    @IsOptional()
    @IsString()
    accion?: string;

    @ApiPropertyOptional({ description: 'Filtrar solo activos' })
    @IsOptional()
    @IsBoolean()
    esActivo?: boolean;
}
