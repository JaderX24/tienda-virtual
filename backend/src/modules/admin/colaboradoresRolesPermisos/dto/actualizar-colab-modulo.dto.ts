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

export class ActualizarColabModuloDto {
    @ApiPropertyOptional({ description: 'Nombre visible del módulo' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre?: string;

    @ApiPropertyOptional({ description: 'Descripción del módulo' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'Clase de icono de Bootstrap Icons' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    icono?: string;

    @ApiPropertyOptional({ description: 'Ruta del módulo en el portal' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    ruta?: string;

    @ApiPropertyOptional({ description: 'ID del módulo padre para jerarquía' })
    @IsOptional()
    @IsInt()
    @Min(1)
    moduloPadreId?: number;

    @ApiPropertyOptional({ description: 'Orden de visualización' })
    @IsOptional()
    @IsInt()
    @Min(0)
    orden?: number;

    @ApiPropertyOptional({ description: 'Si se muestra en el menú de navegación' })
    @IsOptional()
    @IsBoolean()
    esMenu?: boolean;

    @ApiPropertyOptional({ description: 'Estado activo del módulo' })
    @IsOptional()
    @IsBoolean()
    esActivo?: boolean;
}
