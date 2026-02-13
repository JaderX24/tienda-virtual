import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsIn,
    IsArray,
    MinLength,
    MaxLength,
    Min,
    Max,
    Matches,
} from 'class-validator';

const TIPOS_PASARELA = [
    'tarjeta', 'transferencia', 'wallet_digital',
    'efectivo', 'criptomoneda', 'bnpl', 'otro',
] as const;

const MODOS_INTEGRACION = [
    'api', 'redirect', 'iframe', 'sdk', 'webhook',
] as const;

export class CrearPasarelaDto {
    @ApiProperty({ description: 'Código único de la pasarela' })
    @IsString({ message: 'El código debe ser una cadena de texto' })
    @MinLength(2, { message: 'El código debe tener al menos 2 caracteres' })
    @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
    @Matches(/^[a-z0-9_-]+$/, {
        message: 'El código solo permite letras minúsculas, números, guiones y guiones bajos',
    })
    codigo!: string;

    @ApiProperty({ description: 'Nombre de la pasarela de pago' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
    nombre!: string;

    @ApiPropertyOptional({ description: 'Descripción de la pasarela' })
    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
    descripcion?: string;

    @ApiProperty({ description: 'Tipo de pasarela', enum: TIPOS_PASARELA })
    @IsString({ message: 'El tipo debe ser una cadena de texto' })
    @IsIn([...TIPOS_PASARELA], { message: 'Tipo de pasarela no válido' })
    tipo!: string;

    @ApiPropertyOptional({ description: 'Nombre del proveedor' })
    @IsOptional()
    @IsString({ message: 'El proveedor debe ser una cadena de texto' })
    @MaxLength(100, { message: 'El proveedor no puede exceder 100 caracteres' })
    proveedor?: string;

    @ApiPropertyOptional({ description: 'URL del logo de la pasarela' })
    @IsOptional()
    @IsString({ message: 'La URL del logo debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La URL del logo no puede exceder 500 caracteres' })
    logoUrl?: string;

    @ApiPropertyOptional({ description: 'URL de la documentación oficial' })
    @IsOptional()
    @IsString({ message: 'La URL de documentación debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La URL de documentación no puede exceder 500 caracteres' })
    urlDocumentacion?: string;

    @ApiProperty({ description: 'Modo de integración', enum: MODOS_INTEGRACION })
    @IsString({ message: 'El modo de integración debe ser una cadena de texto' })
    @IsIn([...MODOS_INTEGRACION], { message: 'Modo de integración no válido' })
    modoIntegracion!: string;

    @ApiPropertyOptional({ description: 'URL del API en ambiente sandbox' })
    @IsOptional()
    @IsString({ message: 'La URL API sandbox debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La URL API sandbox no puede exceder 500 caracteres' })
    urlApiSandbox?: string;

    @ApiPropertyOptional({ description: 'URL del API en ambiente de producción' })
    @IsOptional()
    @IsString({ message: 'La URL API producción debe ser una cadena de texto' })
    @MaxLength(500, { message: 'La URL API producción no puede exceder 500 caracteres' })
    urlApiProduccion?: string;

    @ApiPropertyOptional({ description: 'Versión del API de la pasarela' })
    @IsOptional()
    @IsString({ message: 'La versión API debe ser una cadena de texto' })
    @MaxLength(20, { message: 'La versión API no puede exceder 20 caracteres' })
    versionApi?: string;

    @ApiPropertyOptional({ description: 'Soporta tokenización de tarjetas' })
    @IsOptional()
    @IsBoolean({ message: 'soportaTokenizacion debe ser verdadero o falso' })
    soportaTokenizacion?: boolean;

    @ApiPropertyOptional({ description: 'Soporta autenticación 3D Secure' })
    @IsOptional()
    @IsBoolean({ message: 'soporta3ds debe ser verdadero o falso' })
    soporta3ds?: boolean;

    @ApiPropertyOptional({ description: 'Soporta reembolsos' })
    @IsOptional()
    @IsBoolean({ message: 'soportaReembolsos debe ser verdadero o falso' })
    soportaReembolsos?: boolean;

    @ApiPropertyOptional({ description: 'Soporta reembolsos parciales' })
    @IsOptional()
    @IsBoolean({ message: 'soportaReembolsosParciales debe ser verdadero o falso' })
    soportaReembolsosParciales?: boolean;

    @ApiPropertyOptional({ description: 'Soporta suscripciones recurrentes' })
    @IsOptional()
    @IsBoolean({ message: 'soportaSuscripciones debe ser verdadero o falso' })
    soportaSuscripciones?: boolean;

    @ApiPropertyOptional({ description: 'Soporta split payment (pagos divididos)' })
    @IsOptional()
    @IsBoolean({ message: 'soportaSplitPayment debe ser verdadero o falso' })
    soportaSplitPayment?: boolean;

    @ApiPropertyOptional({ description: 'Soporta preautorización de pagos' })
    @IsOptional()
    @IsBoolean({ message: 'soportaPreautorizacion debe ser verdadero o falso' })
    soportaPreautorizacion?: boolean;

    @ApiPropertyOptional({ description: 'Soporta captura diferida de pagos' })
    @IsOptional()
    @IsBoolean({ message: 'soportaCapturaDiferida debe ser verdadero o falso' })
    soportaCapturaDiferida?: boolean;

    @ApiPropertyOptional({ description: 'Lista de códigos de monedas soportadas' })
    @IsOptional()
    @IsArray({ message: 'monedasSoportadas debe ser un arreglo' })
    @IsString({ each: true, message: 'Cada moneda debe ser una cadena de texto' })
    monedasSoportadas?: string[];

    @ApiPropertyOptional({ description: 'Monto mínimo permitido por transacción' })
    @IsOptional()
    @IsNumber({}, { message: 'El monto mínimo debe ser un número' })
    @Min(0.01, { message: 'El monto mínimo debe ser al menos 0.01' })
    montoMinimo?: number;

    @ApiPropertyOptional({ description: 'Monto máximo permitido por transacción' })
    @IsOptional()
    @IsNumber({}, { message: 'El monto máximo debe ser un número' })
    @Max(999999999.99, { message: 'El monto máximo no puede exceder 999,999,999.99' })
    montoMaximo?: number;

    @ApiPropertyOptional({ description: 'Orden de prioridad para mostrar al cliente' })
    @IsOptional()
    @IsNumber({}, { message: 'El orden de prioridad debe ser un número' })
    @Min(0, { message: 'El orden de prioridad no puede ser negativo' })
    ordenPrioridad?: number;

    @ApiPropertyOptional({ description: 'Indica si la pasarela está activa' })
    @IsOptional()
    @IsBoolean({ message: 'esActivo debe ser verdadero o falso' })
    esActivo?: boolean;

    @ApiPropertyOptional({ description: 'Indica si es visible para el cliente' })
    @IsOptional()
    @IsBoolean({ message: 'esVisibleCliente debe ser verdadero o falso' })
    esVisibleCliente?: boolean;

    @ApiPropertyOptional({ description: 'Indica si requiere configuración adicional' })
    @IsOptional()
    @IsBoolean({ message: 'requiereConfiguracion debe ser verdadero o falso' })
    requiereConfiguracion?: boolean;
}
