import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsNotEmpty,
    IsBoolean,
    IsNumber,
    IsIn,
    IsDateString,
    MinLength,
    MaxLength,
    Min,
    Max,
} from 'class-validator';

const TIPOS_CONTRATO = ['permanente', 'temporal', 'medio_tiempo', 'practicante'] as const;
const GENEROS = ['masculino', 'femenino', 'otro', 'no_especificado'] as const;
const METODOS_2FA = ['ninguno', 'app', 'sms', 'correo'] as const;

export class CrearColaboradorDto {
    @ApiProperty({ description: 'Nombre del colaborador' })
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    nombre!: string;

    @ApiProperty({ description: 'Apellido del colaborador' })
    @IsString({ message: 'El apellido debe ser texto' })
    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
    apellido!: string;

    @ApiProperty({ description: 'Correo electrónico del colaborador' })
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    @MaxLength(255, { message: 'El correo no puede exceder 255 caracteres' })
    correo!: string;

    @ApiProperty({ description: 'Código único del colaborador' })
    @IsString({ message: 'El código debe ser texto' })
    @IsNotEmpty({ message: 'El código del colaborador es obligatorio' })
    @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
    @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
    codigoColaborador!: string;

    @ApiPropertyOptional({ description: 'Número de identidad' })
    @IsOptional()
    @IsString({ message: 'El número de identidad debe ser texto' })
    @MaxLength(20, { message: 'El número de identidad no puede exceder 20 caracteres' })
    numeroIdentidad?: string;

    @ApiPropertyOptional({ description: 'Fecha de nacimiento (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato válido' })
    fechaNacimiento?: string;

    @ApiPropertyOptional({ description: 'Género del colaborador', enum: GENEROS })
    @IsOptional()
    @IsIn([...GENEROS], { message: 'El género debe ser: masculino, femenino, otro o no_especificado' })
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

    @ApiProperty({ description: 'Tipo de contrato', enum: TIPOS_CONTRATO })
    @IsIn([...TIPOS_CONTRATO], { message: 'El tipo de contrato debe ser: permanente, temporal, medio_tiempo o practicante' })
    tipoContrato!: string;

    @ApiPropertyOptional({ description: 'ID de la empresa asignada' })
    @IsOptional()
    @IsNumber({}, { message: 'El ID de empresa debe ser un número' })
    empresaId?: number;

    @ApiPropertyOptional({ description: 'Requiere autenticación 2FA' })
    @IsOptional()
    @IsBoolean({ message: 'El campo requiere2fa debe ser verdadero o falso' })
    requiere2fa?: boolean;

    @ApiPropertyOptional({ description: 'Método de autenticación 2FA', enum: METODOS_2FA })
    @IsOptional()
    @IsIn([...METODOS_2FA], { message: 'El método 2FA debe ser: ninguno, app, sms o correo' })
    metodo2fa?: string;

    @ApiPropertyOptional({ description: 'Restringir acceso solo en horario de turno' })
    @IsOptional()
    @IsBoolean({ message: 'El campo debe ser verdadero o falso' })
    accesoSoloHorarioTurno?: boolean;

    @ApiPropertyOptional({ description: 'Máximo de sesiones simultáneas' })
    @IsOptional()
    @IsNumber({}, { message: 'El máximo de sesiones debe ser un número' })
    @Min(1, { message: 'El mínimo de sesiones simultáneas es 1' })
    @Max(5, { message: 'El máximo de sesiones simultáneas es 5' })
    maxSesionesSimultaneas?: number;
}
