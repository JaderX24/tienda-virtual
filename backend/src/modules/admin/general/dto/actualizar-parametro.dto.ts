import { IsString, IsOptional, IsBoolean, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarParametroDto {
    @ApiPropertyOptional({
        description: 'Valor del parámetro',
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
        message: 'El tipo debe ser: texto, numero, booleano o json' 
    })
    tipo?: string;

    @ApiPropertyOptional({
        description: 'Categoría del parámetro',
        example: 'seguridad',
        enum: ['seguridad', 'archivos', 'sistema', 'correo'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['seguridad', 'archivos', 'sistema', 'correo'], { 
        message: 'La categoría debe ser: seguridad, archivos, sistema o correo' 
    })
    categoria?: string;

    @ApiPropertyOptional({
        description: 'Descripción del parámetro',
        example: 'Tiempo de expiración del token de acceso en minutos',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'La descripción no puede exceder 255 caracteres' })
    descripcion?: string;

    @ApiPropertyOptional({
        description: 'Indica si el parámetro es editable',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    editable?: boolean;
}
