import {
    IsInt,
    IsOptional,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarRolUsuarioDto {
    @ApiProperty({ description: 'ID del colaborador al que se asignará el rol' })
    @IsInt()
    usuarioId!: number;

    @ApiPropertyOptional({ description: 'Si es el rol principal del colaborador', default: false })
    @IsOptional()
    @IsBoolean()
    esPrincipal?: boolean;
}
