import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EsCatalogoValido } from '../../../../common/decorators';

export class FiltroParametrosDto {
    @ApiPropertyOptional({
        description: 'Filtrar por categoría',
    })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('categoriasParametro', {
        message: 'La categoría no es válida',
    })
    categoria?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por tipo de dato',
        enum: ['texto', 'numero', 'booleano', 'json'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['texto', 'numero', 'booleano', 'json'], {
        message: 'El tipo debe ser: texto, numero, booleano o json',
    })
    tipo?: string;
}
