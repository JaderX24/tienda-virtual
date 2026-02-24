import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsBoolean,
    MinLength,
    MaxLength,
} from 'class-validator';

export class CrearMarcaDto {
    @ApiProperty({ description: 'Nombre de la marca', example: 'Samsung' })
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    nombre!: string;

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

    @ApiPropertyOptional({ description: 'Estado activo de la marca', default: true })
    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activa?: boolean;
}
