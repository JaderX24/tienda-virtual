import {
    IsString,
    IsOptional,
    IsInt,
    IsPositive,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EsCatalogoValido } from '../../../../common/decorators';

export class FiltrosReporteDto {
    @IsOptional()
    @IsString()
    fechaDesde?: string;

    @IsOptional()
    @IsString()
    fechaHasta?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    categoriaId?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    busqueda?: string;

    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposOperacion')
    tipoOperacion?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limite?: number;
}

export class FiltrosExportarDto {
    @IsOptional()
    @IsString()
    fechaDesde?: string;

    @IsOptional()
    @IsString()
    fechaHasta?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    almacenId?: number;

    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposOperacion')
    tipoOperacion?: string;
}
