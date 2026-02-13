import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, Matches, IsBoolean } from 'class-validator';

export class CrearRolDto {
    @ApiProperty({ description: 'Código único del rol' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Matches(/^[a-z_]+$/, {
        message: 'El código solo puede contener letras minúsculas y guiones bajos',
    })
    codigo!: string;

    @ApiProperty({ description: 'Nombre del rol' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre!: string;

    @ApiPropertyOptional({ description: 'Descripción del rol' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'Estado del rol', default: true })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
