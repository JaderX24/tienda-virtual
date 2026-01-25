import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches, IsBoolean, IsNumber } from 'class-validator';
import { VALIDACIONES } from '../../../common/constants';

export class ActualizarUsuarioDto {
    @ApiPropertyOptional({ description: 'Nombre completo del usuario' })
    @IsOptional()
    @IsString()
    @MinLength(VALIDACIONES.NOMBRE_LONGITUD_MINIMA)
    @MaxLength(VALIDACIONES.NOMBRE_LONGITUD_MAXIMA)
    nombre?: string;

    @ApiPropertyOptional({ description: 'Correo electrónico' })
    @IsOptional()
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(VALIDACIONES.CORREO_LONGITUD_MAXIMA)
    correo?: string;

    @ApiPropertyOptional({ description: 'Teléfono' })
    @IsOptional()
    @IsString()
    @Matches(VALIDACIONES.TELEFONO_REGEX, {
        message: 'El teléfono debe tener un formato válido de Honduras',
    })
    telefono?: string;

    @ApiPropertyOptional({ description: 'Estado activo' })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @ApiPropertyOptional({ description: 'ID del rol' })
    @IsOptional()
    @IsNumber()
    rolId?: number;
}
