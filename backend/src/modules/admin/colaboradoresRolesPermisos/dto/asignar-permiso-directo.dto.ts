import {
    IsInt,
    IsOptional,
    IsString,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarPermisoDirectoDto {
    @ApiProperty({ description: 'ID del permiso a asignar' })
    @IsInt()
    permisoId!: number;

    @ApiPropertyOptional({ description: 'Tipo de asignación: otorgado agrega el permiso, denegado lo bloquea', enum: ['otorgado', 'denegado'], default: 'otorgado' })
    @IsOptional()
    @IsEnum(['otorgado', 'denegado'])
    tipo?: string;

    @ApiPropertyOptional({ description: 'Fecha de fin de vigencia (formato ISO 8601)' })
    @IsOptional()
    @IsString()
    fechaFin?: string;

    @ApiPropertyOptional({ description: 'Motivo de la asignación' })
    @IsOptional()
    @IsString()
    motivo?: string;
}
