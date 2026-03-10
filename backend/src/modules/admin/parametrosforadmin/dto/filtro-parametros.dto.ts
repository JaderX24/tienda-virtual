import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiltroParametrosDto {
    @ApiPropertyOptional({
        description: 'Filtrar por categoría',
        example: 'seguridad',
        enum: ['seguridad', 'archivos', 'sistema', 'correo'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['seguridad', 'archivos', 'sistema', 'correo'])
    categoria?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por tipo',
        example: 'numero',
        enum: ['texto', 'numero', 'booleano', 'json'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['texto', 'numero', 'booleano', 'json'])
    tipo?: string;
}
