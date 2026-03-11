import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { EsCatalogoValido } from '../../../../common/decorators';

export class AjustarStockDto {
    @ApiProperty({ description: 'Cantidad a ajustar' })
    @IsNumber({}, { message: 'La cantidad debe ser un número' })
    @Min(1, { message: 'La cantidad debe ser al menos 1' })
    @Type(() => Number)
    cantidad!: number;

    @ApiProperty({ description: 'Motivo del ajuste' })
    @IsString({ message: 'El motivo debe ser una cadena de texto' })
    @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
    @MaxLength(255, { message: 'El motivo no puede exceder 255 caracteres' })
    motivo!: string;
}

export class RegistrarMovimientoDto {
    @ApiProperty({ description: 'ID del producto' })
    @IsNumber({}, { message: 'El ID del producto debe ser un número' })
    @Min(1, { message: 'El ID del producto debe ser válido' })
    @Type(() => Number)
    productoId!: number;

    @ApiProperty({ description: 'Cantidad del movimiento' })
    @IsNumber({}, { message: 'La cantidad debe ser un número' })
    @Min(1, { message: 'La cantidad debe ser al menos 1' })
    @Type(() => Number)
    cantidad!: number;

    @ApiProperty({ description: 'Tipo de movimiento' })
    @IsString({ message: 'El tipo de movimiento debe ser una cadena de texto' })
    @EsCatalogoValido('tiposMovimiento', { message: 'Tipo de movimiento no válido' })
    tipoMovimiento!: string;

    @ApiProperty({ description: 'Motivo del movimiento' })
    @IsString({ message: 'El motivo debe ser una cadena de texto' })
    @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
    @MaxLength(255, { message: 'El motivo no puede exceder 255 caracteres' })
    motivo!: string;
}
