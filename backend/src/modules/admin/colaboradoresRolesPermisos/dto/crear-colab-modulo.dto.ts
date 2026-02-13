import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearColabModuloDto {
    @ApiProperty({ description: 'Código único del módulo', example: 'colab_inventario' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    codigo!: string;

    @ApiProperty({ description: 'Nombre visible del módulo', example: 'Inventario' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre!: string;

    @ApiPropertyOptional({ description: 'Descripción del módulo' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'Clase de icono de Bootstrap Icons', example: 'bi-box-seam' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    icono?: string;

    @ApiPropertyOptional({ description: 'Ruta del módulo en el portal', example: '/portal/inventario' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    ruta?: string;

    @ApiPropertyOptional({ description: 'ID del módulo padre para jerarquía' })
    @IsOptional()
    @IsInt()
    @Min(1)
    moduloPadreId?: number;

    @ApiPropertyOptional({ description: 'Orden de visualización', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    orden?: number;

    @ApiPropertyOptional({ description: 'Si se muestra en el menú de navegación', default: true })
    @IsOptional()
    @IsBoolean()
    esMenu?: boolean;
}
