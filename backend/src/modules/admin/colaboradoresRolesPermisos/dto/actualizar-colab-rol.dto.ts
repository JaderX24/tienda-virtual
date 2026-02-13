import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarColabRolDto {
    @ApiPropertyOptional({ description: 'Nombre del rol' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre?: string;

    @ApiPropertyOptional({ description: 'Descripción del rol' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    descripcion?: string;

    @ApiPropertyOptional({ description: 'Nivel de jerarquía' })
    @IsOptional()
    @IsInt()
    @Min(0)
    nivelJerarquia?: number;

    @ApiPropertyOptional({ description: 'Indica si es un rol de supervisor' })
    @IsOptional()
    @IsBoolean()
    esSupervisor?: boolean;

    @ApiPropertyOptional({ description: 'Color del rol en formato hex' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    color?: string;

    @ApiPropertyOptional({ description: 'Estado activo del rol' })
    @IsOptional()
    @IsBoolean()
    esActivo?: boolean;
}
