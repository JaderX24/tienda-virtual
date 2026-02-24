import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsBoolean,
    MinLength,
    MaxLength,
} from 'class-validator';

export class ActualizarMarcaDto {
    @ApiPropertyOptional({ description: 'Nombre de la marca' })
    @IsOptional()
    @IsString({ message: 'El nombre debe ser texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    nombre?: string;

    @ApiPropertyOptional({ description: 'Descripción de la marca' })
    @IsOptional()
    @IsString({ message: 'La descripción debe ser texto' })
    @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
    descripcion?: string;

    @ApiPropertyOptional({ description: 'URL del logo de la marca' })
    @IsOptional()
    @IsString({ message: 'El logo debe ser texto' })
    @MaxLength(500, { message: 'La URL del logo no puede exceder 500 caracteres' })
    logo?: string;

    @ApiPropertyOptional({ description: 'Estado activo de la marca' })
    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activa?: boolean;
}
