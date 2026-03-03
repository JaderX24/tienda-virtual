import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarEntradaDto {
    @ApiPropertyOptional({ description: 'Notas al registrar entrada', maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notas?: string;
}

export class RegistrarSalidaDto {
    @ApiPropertyOptional({ description: 'Notas al registrar salida', maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notas?: string;
}
