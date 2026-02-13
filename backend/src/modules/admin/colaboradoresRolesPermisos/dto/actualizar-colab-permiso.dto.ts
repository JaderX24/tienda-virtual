import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarColabPermisoDto {
    @ApiPropertyOptional({ description: 'Nombre visible del permiso' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    nombre?: string;

    @ApiPropertyOptional({ description: 'Descripción del permiso' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'ID del módulo al que pertenece' })
    @IsOptional()
    @IsInt()
    @Min(1)
    moduloId?: number;

    @ApiPropertyOptional({ description: 'Acción del permiso' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    accion?: string;

    @ApiPropertyOptional({ description: 'Estado activo del permiso' })
    @IsOptional()
    @IsBoolean()
    esActivo?: boolean;
}
