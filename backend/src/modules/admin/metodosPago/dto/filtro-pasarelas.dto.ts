import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';
import { EsCatalogoValido } from '../../../../common/decorators';

export class FiltroPasarelasDto {
    @ApiPropertyOptional({ description: 'Buscar por nombre, código o proveedor' })
    @IsOptional()
    @IsString()
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Filtrar por tipo de pasarela' })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposPasarela', { message: 'Tipo de pasarela no válido' })
    tipo?: string;

    @ApiPropertyOptional({ description: 'Filtrar por modo de integración' })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('modosIntegracion', { message: 'Modo de integración no válido' })
    modoIntegracion?: string;

    @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    esActivo?: boolean;

    @ApiPropertyOptional({ description: 'Filtrar por visibilidad al cliente' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    esVisibleCliente?: boolean;

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
