import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';

export class ActualizarRolDto {
    @ApiPropertyOptional({ description: 'Código único del rol' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Matches(/^[a-z_]+$/, {
        message: 'El código solo puede contener letras minúsculas y guiones bajos',
    })
    codigo?: string;

    @ApiPropertyOptional({ description: 'Nombre del rol' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre?: string;

    @ApiPropertyOptional({ description: 'Descripción del rol' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'Estado activo del rol' })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
