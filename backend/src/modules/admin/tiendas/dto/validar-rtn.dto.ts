import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidarRtnDto {
    @ApiPropertyOptional({ description: 'RTN a validar' })
    @IsString()
    rtn!: string;

    @ApiPropertyOptional({ description: 'ID de tienda a excluir de la validación' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    excluirId?: number;
}
