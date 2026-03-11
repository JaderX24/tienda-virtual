import {
    IsString,
    IsOptional,
    IsInt,
    IsPositive,
    IsArray,
    ValidateNested,
    Min,
    Max,
    MinLength,
    MaxLength,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EsCatalogoValido } from '../../../../common/decorators';

export class CrearConteoDto {
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenId!: number;

    @IsString()
    @EsCatalogoValido('tiposConteo')
    tipo!: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    zonaConteo?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    categoriaId?: number;

    @IsDateString()
    fechaProgramada!: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notas?: string;
}

export class ConsultarConteosDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenId?: number;

    @IsOptional()
    @IsString()
    @EsCatalogoValido('estadosConteo')
    estado?: string;

    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposConteo')
    tipo?: string;

    @IsOptional()
    @IsString()
    fechaDesde?: string;

    @IsOptional()
    @IsString()
    fechaHasta?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    busqueda?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limite?: number;
}

export class RegistrarDetalleConteoDto {
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    productoId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    cantidadFisica!: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    ubicacion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    numeroLote?: string;

    @IsOptional()
    @IsString()
    @EsCatalogoValido('condicionesProducto')
    estadoProducto?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notas?: string;
}

export class RegistrarDetallesLoteDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RegistrarDetalleConteoDto)
    detalles!: RegistrarDetalleConteoDto[];
}

export class ActualizarEstadoConteoDto {
    @IsString()
    @EsCatalogoValido('estadosConteo')
    estado!: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    notas?: string;

    @IsOptional()
    ajustarStock?: boolean;
}
