import {
    IsString,
    IsOptional,
    IsInt,
    IsPositive,
    Min,
    Max,
    MaxLength,
    IsIn,
    IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FiltrosNotificacionesDto {
    @IsOptional()
    @IsString()
    @IsIn(['info', 'success', 'warning', 'danger', 'sistema'])
    tipo?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    leida?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    archivada?: boolean;

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

export class MarcarLeidasDto {
    @IsOptional()
    @IsString({ each: true })
    ids?: string[];
}
