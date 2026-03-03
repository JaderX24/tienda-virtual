import {
    IsString,
    IsOptional,
    IsInt,
    IsPositive,
    IsIn,
    Min,
    Max,
    MaxLength,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConsultarProductosDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    busqueda?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    categoriaId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    marcaId?: number;

    @IsOptional()
    @IsString()
    @IsIn(['todos', 'activo', 'inactivo', 'stock_bajo', 'agotado'])
    estado?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    precioDesde?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    precioHasta?: number;

    @IsOptional()
    @IsString()
    @IsIn(['nombre', 'precio', 'stock', 'sku', 'creadoEn'])
    ordenarPor?: string;

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    ordenDireccion?: string;

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

export class ConsultarMovimientosProductoDto {
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

    @IsOptional()
    @IsString()
    @IsIn(['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'])
    tipoMovimiento?: string;
}
