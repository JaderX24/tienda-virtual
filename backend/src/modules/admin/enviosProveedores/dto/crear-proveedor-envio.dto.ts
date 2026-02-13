import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsArray,
    IsIn,
    MinLength,
    MaxLength,
    Min,
    Max,
    Matches,
    IsEmail,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIPOS_PROVEEDOR = ['interno', 'externo', 'freelance', 'empresa_courier'] as const;

const TIPOS_SERVICIO = ['local', 'nacional', 'internacional', 'express', 'standard', 'economico'] as const;

const ZONAS_COBERTURA = ['local', 'regional', 'nacional', 'internacional'] as const;

export class CrearContactoProveedorDto {
    @ApiProperty({ description: 'Nombre completo del contacto' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
    nombreCompleto!: string;

    @ApiProperty({ description: 'Cargo del contacto en la empresa' })
    @IsString({ message: 'El cargo debe ser una cadena de texto' })
    @MinLength(2, { message: 'El cargo debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El cargo no puede exceder 100 caracteres' })
    cargo!: string;

    @ApiPropertyOptional({ description: 'Departamento dentro de la empresa' })
    @IsOptional()
    @IsString({ message: 'El departamento debe ser una cadena de texto' })
    @MaxLength(100, { message: 'El departamento no puede exceder 100 caracteres' })
    departamento?: string;

    @ApiProperty({ description: 'Teléfono principal del contacto' })
    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    @MinLength(8, { message: 'El teléfono debe tener al menos 8 caracteres' })
    @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
    telefonoPrincipal!: string;

    @ApiPropertyOptional({ description: 'Teléfono secundario del contacto' })
    @IsOptional()
    @IsString({ message: 'El teléfono secundario debe ser una cadena de texto' })
    @MaxLength(20, { message: 'El teléfono secundario no puede exceder 20 caracteres' })
    telefonoSecundario?: string;

    @ApiProperty({ description: 'Correo electrónico del contacto' })
    @IsEmail({}, { message: 'El correo debe tener un formato válido' })
    @MaxLength(255, { message: 'El correo no puede exceder 255 caracteres' })
    correo!: string;

    @ApiPropertyOptional({ description: 'Correo secundario del contacto' })
    @IsOptional()
    @IsEmail({}, { message: 'El correo secundario debe tener un formato válido' })
    @MaxLength(255, { message: 'El correo secundario no puede exceder 255 caracteres' })
    correoSecundario?: string;

    @ApiPropertyOptional({ description: 'Si es el contacto principal' })
    @IsOptional()
    @IsBoolean({ message: 'esPrincipal debe ser verdadero o falso' })
    esPrincipal?: boolean;

    @ApiPropertyOptional({ description: 'Notas sobre el contacto' })
    @IsOptional()
    @IsString({ message: 'Las notas deben ser una cadena de texto' })
    @MaxLength(500, { message: 'Las notas no pueden exceder 500 caracteres' })
    notas?: string;
}

export class CrearProveedorEnvioDto {
    @ApiProperty({ description: 'Código único del proveedor' })
    @IsString({ message: 'El código debe ser una cadena de texto' })
    @MinLength(2, { message: 'El código debe tener al menos 2 caracteres' })
    @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
    @Matches(/^[a-z0-9_-]+$/, {
        message: 'El código solo permite letras minúsculas, números, guiones y guiones bajos',
    })
    codigo!: string;

    @ApiProperty({ description: 'Nombre comercial del proveedor' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    nombre!: string;

    @ApiPropertyOptional({ description: 'Razón social registrada' })
    @IsOptional()
    @IsString({ message: 'La razón social debe ser una cadena de texto' })
    @MaxLength(200, { message: 'La razón social no puede exceder 200 caracteres' })
    razonSocial?: string;

    @ApiPropertyOptional({ description: 'RTN del proveedor' })
    @IsOptional()
    @IsString({ message: 'El RTN debe ser una cadena de texto' })
    @MaxLength(20, { message: 'El RTN no puede exceder 20 caracteres' })
    rtn?: string;

    @ApiProperty({ description: 'Tipo de proveedor', enum: TIPOS_PROVEEDOR })
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    @IsIn([...TIPOS_PROVEEDOR], { message: 'Tipo de proveedor no válido' })
    tipo!: string;

    @ApiPropertyOptional({ description: 'Descripción del proveedor' })
    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
    descripcion?: string;

    @ApiPropertyOptional({ description: 'URL del logo' })
    @IsOptional()
    @IsString({ message: 'La URL del logo debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La URL del logo no puede exceder 500 caracteres' })
    logoUrl?: string;

    @ApiPropertyOptional({ description: 'Sitio web del proveedor' })
    @IsOptional()
    @IsString({ message: 'El sitio web debe ser una cadena de texto' })
    @MaxLength(500, { message: 'El sitio web no puede exceder 500 caracteres' })
    sitioWeb?: string;

    // Ubicación
    @ApiPropertyOptional({ description: 'Dirección física' })
    @IsOptional()
    @IsString({ message: 'La dirección debe ser una cadena de texto' })
    @MaxLength(300, { message: 'La dirección no puede exceder 300 caracteres' })
    direccion?: string;

    @ApiPropertyOptional({ description: 'Ciudad' })
    @IsOptional()
    @IsString({ message: 'La ciudad debe ser una cadena de texto' })
    @MaxLength(100, { message: 'La ciudad no puede exceder 100 caracteres' })
    ciudad?: string;

    @ApiPropertyOptional({ description: 'Departamento de Honduras' })
    @IsOptional()
    @IsString({ message: 'El departamento debe ser una cadena de texto' })
    @MaxLength(100, { message: 'El departamento no puede exceder 100 caracteres' })
    departamento?: string;

    @ApiPropertyOptional({ description: 'País' })
    @IsOptional()
    @IsString({ message: 'El país debe ser una cadena de texto' })
    @MaxLength(100, { message: 'El país no puede exceder 100 caracteres' })
    pais?: string;

    @ApiPropertyOptional({ description: 'Código postal' })
    @IsOptional()
    @IsString({ message: 'El código postal debe ser una cadena de texto' })
    @MaxLength(10, { message: 'El código postal no puede exceder 10 caracteres' })
    codigoPostal?: string;

    // Contacto general
    @ApiProperty({ description: 'Teléfono principal de la empresa' })
    @IsString({ message: 'El teléfono principal debe ser una cadena de texto' })
    @MinLength(8, { message: 'El teléfono debe tener al menos 8 caracteres' })
    @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
    telefonoPrincipal!: string;

    @ApiPropertyOptional({ description: 'Teléfono secundario' })
    @IsOptional()
    @IsString({ message: 'El teléfono secundario debe ser una cadena de texto' })
    @MaxLength(20, { message: 'El teléfono secundario no puede exceder 20 caracteres' })
    telefonoSecundario?: string;

    @ApiProperty({ description: 'Correo electrónico general' })
    @IsEmail({}, { message: 'El correo general debe tener un formato válido' })
    @MaxLength(255, { message: 'El correo general no puede exceder 255 caracteres' })
    correoGeneral!: string;

    @ApiPropertyOptional({ description: 'Correo de operaciones' })
    @IsOptional()
    @IsEmail({}, { message: 'El correo de operaciones debe tener un formato válido' })
    @MaxLength(255, { message: 'El correo de operaciones no puede exceder 255 caracteres' })
    correoOperaciones?: string;

    // Servicios y cobertura
    @ApiPropertyOptional({ description: 'Tipos de servicio ofrecidos' })
    @IsOptional()
    @IsArray({ message: 'Los servicios deben ser un arreglo' })
    @IsString({ each: true, message: 'Cada servicio debe ser una cadena de texto' })
    servicios?: string[];

    @ApiPropertyOptional({ description: 'Zonas de cobertura' })
    @IsOptional()
    @IsArray({ message: 'Las zonas de cobertura deben ser un arreglo' })
    @IsString({ each: true, message: 'Cada zona debe ser una cadena de texto' })
    zonasCobertura?: string[];

    @ApiPropertyOptional({ description: 'Departamentos de Honduras cubiertos' })
    @IsOptional()
    @IsArray({ message: 'Los departamentos deben ser un arreglo' })
    @IsString({ each: true, message: 'Cada departamento debe ser una cadena de texto' })
    departamentosCobertura?: string[];

    // Operativa
    @ApiProperty({ description: 'Tiempo de entrega mínimo en días' })
    @IsNumber({}, { message: 'El tiempo de entrega mínimo debe ser un número' })
    @Min(1, { message: 'El tiempo de entrega mínimo debe ser al menos 1 día' })
    tiempoEntregaMinimo!: number;

    @ApiProperty({ description: 'Tiempo de entrega máximo en días' })
    @IsNumber({}, { message: 'El tiempo de entrega máximo debe ser un número' })
    @Min(1, { message: 'El tiempo de entrega máximo debe ser al menos 1 día' })
    tiempoEntregaMaximo!: number;

    @ApiProperty({ description: 'Costo base del envío' })
    @IsNumber({}, { message: 'El costo base debe ser un número' })
    @Min(0, { message: 'El costo base no puede ser negativo' })
    costoBase!: number;

    @ApiPropertyOptional({ description: 'Costo por kilogramo adicional' })
    @IsOptional()
    @IsNumber({}, { message: 'El costo por kg adicional debe ser un número' })
    @Min(0, { message: 'El costo por kg adicional no puede ser negativo' })
    costoKgAdicional?: number;

    @ApiPropertyOptional({ description: 'Moneda para los costos', default: 'HNL' })
    @IsOptional()
    @IsString({ message: 'La moneda debe ser una cadena de texto' })
    @MaxLength(10, { message: 'La moneda no puede exceder 10 caracteres' })
    moneda?: string;

    @ApiPropertyOptional({ description: 'Capacidad diaria de paquetes' })
    @IsOptional()
    @IsNumber({}, { message: 'La capacidad diaria debe ser un número' })
    @Min(1, { message: 'La capacidad diaria debe ser al menos 1' })
    capacidadDiaria?: number;

    @ApiPropertyOptional({ description: 'Peso máximo por paquete en kg' })
    @IsOptional()
    @IsNumber({}, { message: 'El peso máximo debe ser un número' })
    @Min(0.1, { message: 'El peso máximo debe ser al menos 0.1 kg' })
    pesoMaximoPaquete?: number;

    @ApiPropertyOptional({ description: 'Horario de atención' })
    @IsOptional()
    @IsString({ message: 'El horario debe ser una cadena de texto' })
    @MaxLength(200, { message: 'El horario no puede exceder 200 caracteres' })
    horarioAtencion?: string;

    // Capacidades
    @ApiPropertyOptional({ description: 'Soporta rastreo en tiempo real' })
    @IsOptional()
    @IsBoolean({ message: 'soportaRastreo debe ser verdadero o falso' })
    soportaRastreo?: boolean;

    @ApiPropertyOptional({ description: 'Soporta seguro de envío' })
    @IsOptional()
    @IsBoolean({ message: 'soportaSeguro debe ser verdadero o falso' })
    soportaSeguro?: boolean;

    @ApiPropertyOptional({ description: 'Soporta contra entrega' })
    @IsOptional()
    @IsBoolean({ message: 'soportaContraEntrega debe ser verdadero o falso' })
    soportaContraEntrega?: boolean;

    @ApiPropertyOptional({ description: 'Soporta devoluciones' })
    @IsOptional()
    @IsBoolean({ message: 'soportaDevolucion debe ser verdadero o falso' })
    soportaDevolucion?: boolean;

    @ApiPropertyOptional({ description: 'Soporta entrega programada' })
    @IsOptional()
    @IsBoolean({ message: 'soportaEntregaProgramada debe ser verdadero o falso' })
    soportaEntregaProgramada?: boolean;

    @ApiPropertyOptional({ description: 'Soporta recogida a domicilio' })
    @IsOptional()
    @IsBoolean({ message: 'soportaRecogidaDomicilio debe ser verdadero o falso' })
    soportaRecogidaDomicilio?: boolean;

    // Integración
    @ApiPropertyOptional({ description: 'URL para rastreo de envíos' })
    @IsOptional()
    @IsString({ message: 'La URL de rastreo debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La URL de rastreo no puede exceder 500 caracteres' })
    urlRastreo?: string;

    @ApiPropertyOptional({ description: 'URL del API del proveedor' })
    @IsOptional()
    @IsString({ message: 'La URL del API debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La URL del API no puede exceder 500 caracteres' })
    apiUrl?: string;

    // Estado y configuración
    @ApiPropertyOptional({ description: 'Orden de prioridad' })
    @IsOptional()
    @IsNumber({}, { message: 'El orden de prioridad debe ser un número' })
    @Min(0, { message: 'El orden de prioridad no puede ser negativo' })
    @Max(1000, { message: 'El orden de prioridad no puede exceder 1000' })
    ordenPrioridad?: number;

    @ApiPropertyOptional({ description: 'Si el proveedor está activo' })
    @IsOptional()
    @IsBoolean({ message: 'esActivo debe ser verdadero o falso' })
    esActivo?: boolean;

    @ApiPropertyOptional({ description: 'Si es visible para los clientes' })
    @IsOptional()
    @IsBoolean({ message: 'esVisible debe ser verdadero o falso' })
    esVisible?: boolean;

    @ApiPropertyOptional({ description: 'Notas internas del proveedor' })
    @IsOptional()
    @IsString({ message: 'Las notas deben ser una cadena de texto' })
    @MaxLength(2000, { message: 'Las notas no pueden exceder 2000 caracteres' })
    notas?: string;

    // Contactos
    @ApiPropertyOptional({ description: 'Personas de contacto del proveedor', type: [CrearContactoProveedorDto] })
    @IsOptional()
    @IsArray({ message: 'Los contactos deben ser un arreglo' })
    @ValidateNested({ each: true })
    @Type(() => CrearContactoProveedorDto)
    contactos?: CrearContactoProveedorDto[];
}
