import {
    IsString,
    IsOptional,
    IsInt,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EsCatalogoValido } from '../../../../common/decorators';

export class FiltrosMiActividadDto {
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
    @Max(100)
    limite?: number;
}

export class FiltrosBitacoraDto extends FiltrosMiActividadDto {
    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposEventoSeguridad')
    tipoEvento?: string;

    @IsOptional()
    @IsString()
    @EsCatalogoValido('nivelesSeveridad')
    severidad?: string;
}

export class FiltrosOperacionesDto extends FiltrosMiActividadDto {
    @IsOptional()
    @IsString()
    @EsCatalogoValido('tiposOperacion')
    tipoOperacion?: string;
}
