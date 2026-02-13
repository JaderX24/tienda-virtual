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

export class CrearColabRolDto {
    @ApiProperty({ description: 'Código único del rol', example: 'operador' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    codigo!: string;

    @ApiProperty({ description: 'Nombre del rol', example: 'Operador de Bodega' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre!: string;

    @ApiPropertyOptional({ description: 'Descripción del rol' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'Nivel de jerarquía (mayor = más autoridad)', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    nivelJerarquia?: number;

    @ApiPropertyOptional({ description: 'Indica si es un rol de supervisor', default: false })
    @IsOptional()
    @IsBoolean()
    esSupervisor?: boolean;

    @ApiPropertyOptional({ description: 'Color del rol en formato hex', example: '#0d6efd' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    color?: string;

    @ApiPropertyOptional({ description: 'IDs de permisos a asignar inicialmente', type: [Number] })
    @IsOptional()
    @IsInt({ each: true })
    permisoIds?: number[];
}
