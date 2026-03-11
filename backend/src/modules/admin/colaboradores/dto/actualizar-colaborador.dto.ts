import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsDateString,
    MinLength,
    MaxLength,
    Min,
    Max,
} from 'class-validator';
import { EsCatalogoValido } from '../../../../common/decorators';

export class ActualizarColaboradorDto {
    @ApiPropertyOptional({ description: 'Nombre del colaborador' })
    @IsOptional()
    @IsString({ message: 'El nombre debe ser texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    nombre?: string;

    @ApiPropertyOptional({ description: 'Apellido del colaborador' })
    @IsOptional()
    @IsString({ message: 'El apellido debe ser texto' })
    @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
    apellido?: string;

    @ApiPropertyOptional({ description: 'Correo electrónico del colaborador' })
    @IsOptional()
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(255, { message: 'El correo no puede exceder 255 caracteres' })
    correo?: string;

    @ApiPropertyOptional({ description: 'Número de identidad' })
    @IsOptional()
    @IsString({ message: 'El número de identidad debe ser texto' })
    @MaxLength(20, { message: 'El número de identidad no puede exceder 20 caracteres' })
    numeroIdentidad?: string;

    @ApiPropertyOptional({ description: 'Fecha de nacimiento (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato válido' })
    fechaNacimiento?: string;

    @ApiPropertyOptional({ description: 'Género del colaborador' })
    @IsOptional()
    @EsCatalogoValido('generos', { message: 'El género no es válido' })
    genero?: string;

    @ApiPropertyOptional({ description: 'Teléfono del colaborador' })
    @IsOptional()
    @IsString({ message: 'El teléfono debe ser texto' })
    @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
    telefono?: string;

    @ApiPropertyOptional({ description: 'Teléfono de emergencia' })
    @IsOptional()
    @IsString({ message: 'El teléfono de emergencia debe ser texto' })
    @MaxLength(20, { message: 'El teléfono de emergencia no puede exceder 20 caracteres' })
    telefonoEmergencia?: string;

    @ApiPropertyOptional({ description: 'Nombre del contacto de emergencia' })
    @IsOptional()
    @IsString({ message: 'El nombre del contacto de emergencia debe ser texto' })
    @MaxLength(200, { message: 'El nombre del contacto no puede exceder 200 caracteres' })
    contactoEmergenciaNombre?: string;

    @ApiPropertyOptional({ description: 'Cargo del colaborador' })
    @IsOptional()
    @IsString({ message: 'El cargo debe ser texto' })
    @MaxLength(150, { message: 'El cargo no puede exceder 150 caracteres' })
    cargo?: string;

    @ApiPropertyOptional({ description: 'Fecha de ingreso (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString({}, { message: 'La fecha de ingreso debe tener formato válido' })
    fechaIngreso?: string;

    @ApiPropertyOptional({ description: 'Fecha de baja (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString({}, { message: 'La fecha de baja debe tener formato válido' })
    fechaBaja?: string;

    @ApiPropertyOptional({ description: 'Tipo de contrato' })
    @IsOptional()
    @EsCatalogoValido('tiposContrato', { message: 'El tipo de contrato no es válido' })
    tipoContrato?: string;

    @ApiPropertyOptional({ description: 'ID de la empresa asignada' })
    @IsOptional()
    @IsNumber({}, { message: 'El ID de empresa debe ser un número' })
    empresaId?: number;

    @ApiPropertyOptional({ description: 'Motivo de inactivación' })
    @IsOptional()
    @IsString({ message: 'El motivo de inactivación debe ser texto' })
    @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres' })
    motivoInactivacion?: string;

    @ApiPropertyOptional({ description: 'Requiere autenticación 2FA' })
    @IsOptional()
    @IsBoolean({ message: 'El campo requiere2fa debe ser verdadero o falso' })
    requiere2fa?: boolean;

    @ApiPropertyOptional({ description: 'Método de autenticación 2FA' })
    @IsOptional()
    @EsCatalogoValido('metodos2fa', { message: 'El método 2FA no es válido' })
    metodo2fa?: string;

    @ApiPropertyOptional({ description: 'Restringir acceso solo desde IP confiable' })
    @IsOptional()
    @IsBoolean({ message: 'El campo debe ser verdadero o falso' })
    accesoSoloIpConfiable?: boolean;

    @ApiPropertyOptional({ description: 'Restringir acceso solo en horario de turno' })
    @IsOptional()
    @IsBoolean({ message: 'El campo debe ser verdadero o falso' })
    accesoSoloHorarioTurno?: boolean;

    @ApiPropertyOptional({ description: 'Restringir acceso solo desde dispositivo registrado' })
    @IsOptional()
    @IsBoolean({ message: 'El campo debe ser verdadero o falso' })
    accesoSoloDispositivoRegistrado?: boolean;

    @ApiPropertyOptional({ description: 'Máximo de sesiones simultáneas' })
    @IsOptional()
    @IsNumber({}, { message: 'El máximo de sesiones debe ser un número' })
    @Min(1, { message: 'El mínimo de sesiones simultáneas es 1' })
    @Max(5, { message: 'El máximo de sesiones simultáneas es 5' })
    maxSesionesSimultaneas?: number;
}
