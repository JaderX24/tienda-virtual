import {
    IsString,
    IsOptional,
    IsInt,
    IsEnum,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearColabPermisoDto {
    @ApiProperty({ description: 'Código único del permiso', example: 'colab_inventario.ver' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    codigo!: string;

    @ApiProperty({ description: 'Nombre visible del permiso', example: 'Ver inventario' })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    nombre!: string;

    @ApiPropertyOptional({ description: 'Descripción del permiso' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    descripcion?: string;

    @ApiProperty({ description: 'ID del módulo al que pertenece' })
    @IsInt()
    @Min(1)
    moduloId!: number;

    @ApiProperty({ description: 'Acción del permiso', enum: ['ver', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar', 'ajustar', 'ejecutar', 'registrar'] })
    @IsString()
    @MaxLength(20)
    accion!: string;
}
