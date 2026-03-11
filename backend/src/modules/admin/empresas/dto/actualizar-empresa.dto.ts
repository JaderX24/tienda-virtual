import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsBoolean,
    IsObject,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { EsCatalogoValido } from '../../../../common/decorators';

export class ActualizarEmpresaDto {
    @ApiPropertyOptional({ description: 'Nombre de la empresa' })
    @IsOptional()
    @IsString({ message: 'El nombre debe ser texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
    nombre?: string;

    @ApiPropertyOptional({ description: 'RTN de la empresa (formato XXXX-XXXX-XXXXXX)' })
    @IsOptional()
    @IsString({ message: 'El RTN debe ser texto' })
    @Matches(/^\d{4}-\d{4}-\d{6}$/, { message: 'Formato de RTN inválido (XXXX-XXXX-XXXXXX)' })
    rtn?: string;

    @ApiPropertyOptional({ description: 'NIT de la empresa' })
    @IsOptional()
    @IsString({ message: 'El NIT debe ser texto' })
    @MaxLength(50, { message: 'El NIT no puede exceder 50 caracteres' })
    nit?: string;

    @ApiPropertyOptional({ description: 'Correo electrónico de la empresa' })
    @IsOptional()
    @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
    @MaxLength(255, { message: 'El correo no puede exceder 255 caracteres' })
    correo?: string;

    @ApiPropertyOptional({ description: 'Teléfono de la empresa' })
    @IsOptional()
    @IsString({ message: 'El teléfono debe ser texto' })
    @MinLength(8, { message: 'El teléfono debe tener al menos 8 caracteres' })
    @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
    telefono?: string;

    @ApiPropertyOptional({ description: 'Celular de la empresa' })
    @IsOptional()
    @IsString({ message: 'El celular debe ser texto' })
    @MaxLength(20, { message: 'El celular no puede exceder 20 caracteres' })
    celular?: string;

    @ApiPropertyOptional({ description: 'Tipo de negocio' })
    @IsOptional()
    @IsString({ message: 'El tipo de negocio debe ser texto' })
    @EsCatalogoValido('tiposNegocio', { message: 'Tipo de negocio no válido' })
    tipoNegocio?: string;

    @ApiPropertyOptional({ description: 'Descripción de la empresa' })
    @IsOptional()
    @IsString({ message: 'La descripción debe ser texto' })
    @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
    descripcion?: string;

    @ApiPropertyOptional({ description: 'País (código ISO)' })
    @IsOptional()
    @IsString({ message: 'El país debe ser texto' })
    @MaxLength(5, { message: 'El código de país no puede exceder 5 caracteres' })
    pais?: string;

    @ApiPropertyOptional({ description: 'Departamento o estado' })
    @IsOptional()
    @IsString({ message: 'El departamento debe ser texto' })
    @MaxLength(100, { message: 'El departamento no puede exceder 100 caracteres' })
    departamento?: string;

    @ApiPropertyOptional({ description: 'Ciudad' })
    @IsOptional()
    @IsString({ message: 'La ciudad debe ser texto' })
    @MinLength(2, { message: 'La ciudad debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'La ciudad no puede exceder 100 caracteres' })
    ciudad?: string;

    @ApiPropertyOptional({ description: 'Código postal' })
    @IsOptional()
    @IsString({ message: 'El código postal debe ser texto' })
    @MaxLength(15, { message: 'El código postal no puede exceder 15 caracteres' })
    codigoPostal?: string;

    @ApiPropertyOptional({ description: 'Dirección completa' })
    @IsOptional()
    @IsString({ message: 'La dirección debe ser texto' })
    @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
    direccion?: string;

    @ApiPropertyOptional({ description: 'URL del logo' })
    @IsOptional()
    @IsString({ message: 'El logo debe ser una URL válida' })
    @MaxLength(500, { message: 'La URL del logo no puede exceder 500 caracteres' })
    logo?: string;

    @ApiPropertyOptional({ description: 'Sitio web de la empresa' })
    @IsOptional()
    @IsString({ message: 'El sitio web debe ser texto' })
    @MaxLength(500, { message: 'El sitio web no puede exceder 500 caracteres' })
    sitioWeb?: string;

    @ApiPropertyOptional({ description: 'Redes sociales (facebook, instagram, whatsapp)' })
    @IsOptional()
    @IsObject({ message: 'Las redes sociales deben ser un objeto' })
    redesSociales?: Record<string, string>;

    @ApiPropertyOptional({ description: 'Representante legal' })
    @IsOptional()
    @IsString({ message: 'El representante legal debe ser texto' })
    @MaxLength(200, { message: 'El representante legal no puede exceder 200 caracteres' })
    representanteLegal?: string;

    @ApiPropertyOptional({ description: 'Plan de suscripción' })
    @IsOptional()
    @IsString({ message: 'El plan de suscripción debe ser texto' })
    @EsCatalogoValido('planesSuscripcion', { message: 'Plan de suscripción no válido' })
    planSuscripcion?: string;

    @ApiPropertyOptional({ description: 'Moneda (código ISO)' })
    @IsOptional()
    @IsString({ message: 'La moneda debe ser texto' })
    @MaxLength(5, { message: 'El código de moneda no puede exceder 5 caracteres' })
    moneda?: string;

    @ApiPropertyOptional({ description: 'Zona horaria' })
    @IsOptional()
    @IsString({ message: 'La zona horaria debe ser texto' })
    @MaxLength(50, { message: 'La zona horaria no puede exceder 50 caracteres' })
    zonaHoraria?: string;

    @ApiPropertyOptional({ description: 'Rango de cantidad de empleados' })
    @IsOptional()
    @IsString({ message: 'La cantidad de empleados debe ser texto' })
    @EsCatalogoValido('rangosEmpleados', { message: 'Rango de empleados no válido' })
    cantidadEmpleados?: string;

    @ApiPropertyOptional({ description: 'Estado activo de la empresa' })
    @IsOptional()
    @IsBoolean({ message: 'El estado activa debe ser verdadero o falso' })
    activa?: boolean;
}
