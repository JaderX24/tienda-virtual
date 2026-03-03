import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { VALIDACIONES } from '../../../../common/constants';

export class LoginColaboradorDto {
    @ApiProperty({
        description: 'Correo electrónico del colaborador',
        example: 'colaborador@empresa.com',
    })
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(VALIDACIONES.CORREO_LONGITUD_MAXIMA)
    correo!: string;

    @ApiProperty({
        description: 'Contraseña del colaborador',
        example: 'MiContrasena123!',
    })
    @IsString()
    @MinLength(VALIDACIONES.CONTRASENA_LONGITUD_MINIMA, {
        message: `La contraseña debe tener al menos ${VALIDACIONES.CONTRASENA_LONGITUD_MINIMA} caracteres`,
    })
    contrasena!: string;

    @ApiProperty({
        description: 'Código de verificación 2FA (opcional)',
        example: '123456',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    codigo2FA?: string;
}
