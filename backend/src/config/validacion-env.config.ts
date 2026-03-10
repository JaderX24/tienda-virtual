import { plainToInstance } from 'class-transformer';
import {
    IsEnum,
    IsNumber,
    IsString,
    MinLength,
    IsOptional,
    Min,
    Max,
    IsUrl,
    validateSync,
} from 'class-validator';

enum Entorno {
    Desarrollo = 'desarrollo',
    Staging = 'staging',
    Produccion = 'produccion',
}

class VariablesEntorno {
    // Aplicación
    @IsString()
    NOMBRE_APP!: string;

    @IsString()
    DESCRIPCION_APP!: string;

    @IsString()
    VERSION_APP!: string;

    @IsString()
    AUTOR_APP!: string;

    @IsEnum(Entorno)
    ENTORNO!: Entorno;

    @IsNumber()
    @Min(1)
    @Max(65535)
    PUERTO!: number;

    @IsString()
    URL_FRONTEND!: string;

    @IsString()
    URL_BACKEND!: string;

    @IsString()
    ZONA_HORARIA!: string;

    @IsString()
    FORMATO_FECHA!: string;

    @IsString()
    FORMATO_HORA!: string;

    @IsString()
    FORMATO_FECHA_HORA!: string;

    // Base de datos
    @IsString()
    @MinLength(10)
    DATABASE_URL!: string;

    @IsString()
    DB_HOST!: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    DB_PUERTO!: number;

    @IsString()
    DB_USUARIO!: string;

    @IsString()
    DB_CONTRASENA!: string;

    @IsString()
    DB_NOMBRE!: string;

    @IsNumber()
    @Min(1)
    DB_POOL_MIN!: number;

    @IsNumber()
    @Min(1)
    DB_POOL_MAX!: number;

    // JWT Admin
    @IsString()
    @MinLength(64)
    JWT_ADMIN_ACCESS_SECRET!: string;

    @IsString()
    JWT_ADMIN_ACCESS_EXPIRACION!: string;

    @IsString()
    @MinLength(64)
    JWT_ADMIN_REFRESH_SECRET!: string;

    @IsString()
    JWT_ADMIN_REFRESH_EXPIRACION!: string;

    // JWT Colaboradores
    @IsString()
    @MinLength(64)
    JWT_COLAB_ACCESS_SECRET!: string;

    @IsString()
    JWT_COLAB_ACCESS_EXPIRACION!: string;

    @IsString()
    @MinLength(64)
    JWT_COLAB_REFRESH_SECRET!: string;

    @IsString()
    JWT_COLAB_REFRESH_EXPIRACION!: string;

    // Seguridad
    @IsNumber()
    @Min(10)
    @Max(16)
    BCRYPT_ROUNDS!: number;

    @IsNumber()
    @Min(1)
    RATE_LIMIT_TTL!: number;

    @IsNumber()
    @Min(1)
    RATE_LIMIT_MAX!: number;

    @IsString()
    CORS_ORIGEN!: string;

    @IsString()
    COOKIE_SECURE!: string;

    @IsString()
    COOKIE_SAMESITE!: string;

    // Correo SMTP
    @IsString()
    SMTP_HOST!: string;

    @IsNumber()
    @Min(1)
    SMTP_PUERTO!: number;

    @IsString()
    SMTP_SEGURO!: string;

    @IsString()
    SMTP_USUARIO!: string;

    @IsString()
    SMTP_CONTRASENA!: string;

    @IsString()
    SMTP_REMITENTE!: string;

    // Archivos
    @IsString()
    UPLOAD_DIRECTORIO!: string;

    @IsNumber()
    @Min(1)
    UPLOAD_TAMANO_MAXIMO!: number;

    @IsString()
    UPLOAD_TIPOS_PERMITIDOS!: string;

    // Logs
    @IsString()
    LOG_NIVEL!: string;

    @IsString()
    LOG_FORMATO!: string;

    @IsString()
    LOG_ARCHIVO!: string;
}

export function validarVariablesEntorno(config: Record<string, unknown>) {
    const configuracionValidada = plainToInstance(VariablesEntorno, config, {
        enableImplicitConversion: true,
    });

    const errores = validateSync(configuracionValidada, {
        skipMissingProperties: false,
    });

    if (errores.length > 0) {
        const detalles = errores
            .map((error) => {
                const restricciones = Object.values(error.constraints || {}).join(', ');
                return `  - ${error.property}: ${restricciones}`;
            })
            .join('\n');

        throw new Error(
            `\n⛔ Variables de entorno inválidas:\n${detalles}\n\nRevise el archivo .env según .env.example\n`,
        );
    }

    return configuracionValidada;
}
