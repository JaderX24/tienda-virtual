import {
    IsString,
    IsOptional,
    IsInt,
    IsPositive,
    IsIn,
    Min,
    Max,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearTransferenciaDto {
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    productoId!: number;

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenOrigenId!: number;

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenDestinoId!: number;

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    cantidad!: number;

    @IsString()
    @MinLength(3)
    @MaxLength(255)
    motivo!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notas?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    documentoTipo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    documentoNumero?: string;
}

export class ConsultarTransferenciasDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenOrigenId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenDestinoId?: number;

    @IsOptional()
    @IsString()
    @IsIn(['pendiente', 'en_transito', 'completada', 'cancelada'])
    estado?: string;

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

export class ActualizarEstadoTransferenciaDto {
    @IsString()
    @IsIn(['en_transito', 'completada', 'cancelada'])
    estado!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notas?: string;
}
