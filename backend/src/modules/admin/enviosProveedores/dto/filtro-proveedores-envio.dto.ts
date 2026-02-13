import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';

const TIPOS_PROVEEDOR = ['interno', 'externo', 'freelance', 'empresa_courier'] as const;
const ZONAS_COBERTURA = ['local', 'regional', 'nacional', 'internacional'] as const;

export class FiltroProveedoresEnvioDto {
    @ApiPropertyOptional({ description: 'Buscar por nombre, código o correo' })
    @IsOptional()
    @IsString()
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Filtrar por tipo de proveedor', enum: TIPOS_PROVEEDOR })
    @IsOptional()
    @IsString()
    @IsIn([...TIPOS_PROVEEDOR], { message: 'Tipo de proveedor no válido' })
    tipo?: string;

    @ApiPropertyOptional({ description: 'Filtrar por zona de cobertura', enum: ZONAS_COBERTURA })
    @IsOptional()
    @IsString()
    cobertura?: string;

    @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    esActivo?: boolean;

    @ApiPropertyOptional({ description: 'Filtrar por visibilidad' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    esVisible?: boolean;

    @ApiPropertyOptional({ description: 'Número de página', default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(VALIDACIONES.PAGINA_MINIMA)
    @Type(() => Number)
    pagina?: number = 1;

    @ApiPropertyOptional({ description: 'Elementos por página', default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(VALIDACIONES.ELEMENTOS_POR_PAGINA_MAXIMO)
    @Type(() => Number)
    limite?: number = VALIDACIONES.ELEMENTOS_POR_PAGINA_DEFAULT;

    @ApiPropertyOptional({ description: 'Campo para ordenar' })
    @IsOptional()
    @IsString()
    orden?: string;

    @ApiPropertyOptional({ description: 'Dirección del ordenamiento', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'], { message: 'La dirección debe ser asc o desc' })
    direccion?: 'asc' | 'desc' = 'desc';
}
