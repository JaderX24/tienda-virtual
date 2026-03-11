import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EsCatalogoValido } from '../../../../common/decorators';

export class CrearParametroDto {
    @ApiProperty({
        description: 'Clave única del parámetro',
        example: 'TIEMPO_EXPIRACION_TOKEN',
    })
    @IsString()
    @IsNotEmpty({ message: 'La clave es obligatoria' })
    @MinLength(3, { message: 'La clave debe tener al menos 3 caracteres' })
    @MaxLength(100, { message: 'La clave no puede exceder 100 caracteres' })
    clave!: string;

    @ApiProperty({
        description: 'Valor del parámetro',
        example: '15',
    })
    @IsString()
    @IsNotEmpty({ message: 'El valor es obligatorio' })
    valor!: string;

    @ApiProperty({
        description: 'Tipo de dato del parámetro',
        example: 'numero',
        enum: ['texto', 'numero', 'booleano', 'json'],
    })
    @IsString()
    @IsIn(['texto', 'numero', 'booleano', 'json'], {
        message: 'El tipo debe ser: texto, numero, booleano o json',
    })
    tipo!: string;

    @ApiProperty({
        description: 'Categoría del parámetro',
        example: 'seguridad',
        enum: ['seguridad', 'archivos', 'sistema', 'correo'],
    })
    @IsString()
    @EsCatalogoValido('categoriasParametro', {
        message: 'La categoría del parámetro no es válida',
    })
    categoria!: string;

    @ApiPropertyOptional({
        description: 'Descripción del parámetro',
        example: 'Tiempo de expiración del token de acceso en minutos',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
    descripcion?: string;

    @ApiPropertyOptional({
        description: 'Indica si el parámetro es editable',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'El campo editable debe ser verdadero o falso' })
    editable?: boolean;
}
