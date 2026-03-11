import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EsCatalogoValido } from '../../../../common/decorators';

export class ActualizarParametroDto {
    @ApiPropertyOptional({
        description: 'Nuevo valor del parámetro',
        example: '30',
    })
    @IsOptional()
    @IsString()
    valor?: string;

    @ApiPropertyOptional({
        description: 'Tipo de dato del parámetro',
        example: 'numero',
        enum: ['texto', 'numero', 'booleano', 'json'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['texto', 'numero', 'booleano', 'json'], {
        message: 'El tipo debe ser: texto, numero, booleano o json',
    })
    tipo?: string;

    @ApiPropertyOptional({
        description: 'Categoría del parámetro',
        example: 'seguridad',
        enum: ['seguridad', 'archivos', 'sistema', 'correo'],
    })
    @IsOptional()
    @IsString()
    @EsCatalogoValido('categoriasParametro', {
        message: 'La categoría del parámetro no es válida',
    })
    categoria?: string;

    @ApiPropertyOptional({
        description: 'Descripción del parámetro',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
    descripcion?: string;
}
