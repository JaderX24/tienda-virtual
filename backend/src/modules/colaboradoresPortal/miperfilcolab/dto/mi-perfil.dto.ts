import {
    IsString,
    IsOptional,
    MinLength,
    MaxLength,
    IsEmail,
    Matches,
    IsEnum,
    IsBoolean,
} from 'class-validator';

// Actualizar información personal básica
export class ActualizarPerfilDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    apellido?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    telefono?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    telefonoEmergencia?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    contactoEmergenciaNombre?: string;

    @IsOptional()
    @IsEnum(['masculino', 'femenino', 'no_especificado'])
    genero?: string;
}

// Cambiar contraseña
export class CambiarContrasenaDto {
    @IsString()
    @MinLength(1)
    contrasenaActual!: string;

    @IsString()
    @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
    @MaxLength(128)
    @Matches(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
    @Matches(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
    @Matches(/[0-9]/, { message: 'Debe contener al menos un número' })
    @Matches(/[!@#$%^&*()_+\-=]/, { message: 'Debe contener al menos un carácter especial (!@#$%^&*()_+-=)' })
    nuevaContrasena!: string;

    @IsString()
    confirmarContrasena!: string;
}

// Actualizar preferencias de apariencia
export class ActualizarPreferenciasDto {
    @IsOptional()
    @IsString()
    @MaxLength(10)
    idioma?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    zonaHoraria?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    temaColor?: string;

    @IsOptional()
    @IsBoolean()
    sidebarCompacto?: boolean;

    @IsOptional()
    @IsBoolean()
    notificacionesSonido?: boolean;

    @IsOptional()
    @IsBoolean()
    notificacionesEscritorio?: boolean;
}

// Actualizar configuración de seguridad
export class ActualizarSeguridadDto {
    @IsOptional()
    @IsBoolean()
    requiere2fa?: boolean;

    @IsOptional()
    @IsEnum(['ninguno', 'correo', 'app'])
    metodo2fa?: string;
}

// Renombrar un dispositivo registrado
export class RenombrarDispositivoDto {
    @IsString()
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
    nombre!: string;
}
