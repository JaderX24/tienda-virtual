import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDACIONES } from '../../../../common/constants';
import { EsCatalogoValido } from '../../../../common/decorators';

export class FiltroTiendasDto {
    @ApiPropertyOptional({ description: 'Buscar por nombre, correo o RTN' })
    @IsOptional()
    @IsString()
    busqueda?: string;

    @ApiPropertyOptional({ description: 'Filtrar por tipo de negocio' })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposNegocio', { message: 'Tipo de negocio no válido' })
    tipoNegocio?: string;

    @ApiPropertyOptional({ description: 'Filtrar por tipo de tienda' })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposTienda', { message: 'Tipo de tienda no válido' })
    tipoTienda?: string;

    @ApiPropertyOptional({ description: 'Filtrar por estado' })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('estadosTienda', { message: 'Estado no válido' })
    estado?: string;

    @ApiPropertyOptional({ description: 'Filtrar por departamento' })
    @IsOptional()
    @IsString()
    departamento?: string;

    @ApiPropertyOptional({ description: 'Filtrar por ciudad' })
    @IsOptional()
    @IsString()
    ciudad?: string;

    @ApiPropertyOptional({ description: 'Filtrar por plan de suscripción' })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('planesSuscripcion', { message: 'Plan de suscripción no válido' })
    planSuscripcion?: string;

    @ApiPropertyOptional({ description: 'Filtrar solo activas' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    activa?: boolean;

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
