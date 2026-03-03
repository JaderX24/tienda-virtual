import {
    IsString,
    IsOptional,
    IsInt,
    Min,
    Max,
    MaxLength,
    IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrosMiActividadDto {
    @IsOptional()
    @IsString()
    fechaDesde?: string;

    @IsOptional()
    @IsString()
    fechaHasta?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    busqueda?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limite?: number;
}

export class FiltrosBitacoraDto extends FiltrosMiActividadDto {
    @IsOptional()
    @IsString()
    @IsIn([
        'login_exitoso', 'login_fallido', 'logout',
        'cambio_contrasena', 'recuperacion_contrasena',
        'bloqueo_cuenta', 'desbloqueo_cuenta',
        'verificacion_2fa', 'fallo_2fa',
        'dispositivo_nuevo', 'dispositivo_rechazado',
        'ip_no_autorizada', 'acceso_fuera_horario',
        'sesion_forzada', 'intento_escalacion',
        'acceso_denegado', 'multiples_intentos',
    ])
    tipoEvento?: string;

    @IsOptional()
    @IsString()
    @IsIn(['info', 'warn', 'error', 'critical'])
    severidad?: string;
}

export class FiltrosOperacionesDto extends FiltrosMiActividadDto {
    @IsOptional()
    @IsString()
    @IsIn([
        'entrada', 'salida', 'ajuste_positivo', 'ajuste_negativo',
        'transferencia', 'recepcion', 'despacho',
    ])
    tipoOperacion?: string;
}
