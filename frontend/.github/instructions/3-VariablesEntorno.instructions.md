---
applyTo: '**/*'
---

# Guía de Variables de Entorno

**DOCUMENTO DE CUMPLIMIENTO OBLIGATORIO**

Este documento establece la configuración y manejo de variables de entorno del proyecto. Las variables de entorno son la fuente de verdad para toda configuración que no esté almacenada en base de datos.

**Regla Principal:** Si no existe una tabla de configuración o parámetros en la base de datos, se DEBE usar el archivo `.env`

---

## Reglas Fundamentales

### 1. Archivo .env
- **NUNCA** subir al repositorio (debe estar en `.gitignore`)
- **SIEMPRE** mantener un `.env.example` actualizado con valores de ejemplo
- **NUNCA** hardcodear valores de configuración en el código
- Usar nombres descriptivos en SCREAMING_SNAKE_CASE
- Agrupar variables relacionadas con prefijos comunes

### 2. Jerarquía de Configuración
1. **Variables de entorno (.env)** → Configuración principal
2. **Base de datos (tabla configuracion)** → Parámetros dinámicos que el admin puede modificar
3. **Constantes en código** → Solo para valores que NUNCA cambian

### 3. Cuándo Usar .env vs Base de Datos

| Usar .env | Usar Base de Datos |
|-----------|-------------------|
| Credenciales y secretos | Parámetros de negocio modificables |
| URLs de servicios | Configuración de UI |
| Configuración de infraestructura | Textos y mensajes personalizables |
| Datos sensibles | Valores que el admin debe poder cambiar |
| Configuración por ambiente | Configuración de funcionalidades |

---

## Variables de Entorno Obligatorias

### Aplicación General
```bash
# Identificación de la aplicación
NOMBRE_APP=TiendaVirtual
ENTORNO=desarrollo                    # desarrollo | staging | produccion
PUERTO=3000
URL_FRONTEND=http://localhost:4200
URL_BACKEND=http://localhost:3000

# Zona horaria (Honduras)
ZONA_HORARIA=America/Tegucigalpa
```

### Base de Datos (MySQL + Prisma)
```bash
# Conexión principal
DATABASE_URL=mysql://usuario:contrasena@localhost:3306/tienda_virtual

# Configuración adicional
DB_HOST=localhost
DB_PUERTO=3306
DB_USUARIO=tienda_usuario
DB_CONTRASENA=contrasena_segura_aqui
DB_NOMBRE=tienda_virtual
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Autenticación JWT
```bash
# Access Token (vida corta)
JWT_ACCESS_SECRET=clave_secreta_minimo_64_caracteres_aleatorios_muy_segura_aqui
JWT_ACCESS_EXPIRACION=15m

# Refresh Token (vida larga)
JWT_REFRESH_SECRET=otra_clave_secreta_diferente_minimo_64_caracteres_aqui
JWT_REFRESH_EXPIRACION=7d
```

### Seguridad
```bash
# Hashing de contraseñas
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGEN=http://localhost:4200

# Cookies
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
```

### Correo Electrónico
```bash
# Configuración SMTP
SMTP_HOST=smtp.ejemplo.com
SMTP_PUERTO=587
SMTP_SEGURO=true
SMTP_USUARIO=notificaciones@tienda.com
SMTP_CONTRASENA=contrasena_smtp_aqui
SMTP_REMITENTE=TiendaVirtual <no-responder@tienda.com>
```

### Almacenamiento de Archivos
```bash
# Configuración de uploads
UPLOAD_DIRECTORIO=./uploads
UPLOAD_TAMANO_MAXIMO=5242880          # 5MB en bytes
UPLOAD_TIPOS_PERMITIDOS=image/jpeg,image/png,image/webp

# CDN o almacenamiento externo (opcional)
CDN_URL=https://cdn.tienda.com
STORAGE_TIPO=local                     # local | s3 | cloudinary
```

### Pagos (cuando se implemente)
```bash
# Configuración de pasarela de pagos
PAGOS_MODO=sandbox                     # sandbox | produccion
PAGOS_API_KEY=pk_test_xxxxx
PAGOS_SECRET_KEY=sk_test_xxxxx
PAGOS_WEBHOOK_SECRET=whsec_xxxxx
```

### Logs y Monitoreo
```bash
# Configuración de logs
LOG_NIVEL=debug                        # debug | info | warn | error
LOG_FORMATO=json                       # json | simple
LOG_ARCHIVO=./logs/app.log

# Monitoreo externo (opcional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Archivo .env.example

Mantener SIEMPRE actualizado con valores de ejemplo seguros:

```bash
# ========================================
# CONFIGURACIÓN DE TIENDA VIRTUAL
# ========================================
# Copiar este archivo como .env y configurar valores reales
# NUNCA subir .env al repositorio

# --- APLICACIÓN ---
NOMBRE_APP=TiendaVirtual
ENTORNO=desarrollo
PUERTO=3000
URL_FRONTEND=http://localhost:4200
URL_BACKEND=http://localhost:3000
ZONA_HORARIA=America/Tegucigalpa

# --- BASE DE DATOS ---
DATABASE_URL=mysql://usuario:contrasena@localhost:3306/tienda_virtual
DB_HOST=localhost
DB_PUERTO=3306
DB_USUARIO=tu_usuario
DB_CONTRASENA=tu_contrasena
DB_NOMBRE=tienda_virtual
DB_POOL_MIN=2
DB_POOL_MAX=10

# --- JWT (generar claves únicas para producción) ---
JWT_ACCESS_SECRET=cambiar_por_clave_segura_minimo_64_caracteres
JWT_ACCESS_EXPIRACION=15m
JWT_REFRESH_SECRET=cambiar_por_otra_clave_segura_diferente
JWT_REFRESH_EXPIRACION=7d

# --- SEGURIDAD ---
BCRYPT_ROUNDS=12
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
CORS_ORIGEN=http://localhost:4200
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# --- CORREO ---
SMTP_HOST=smtp.ejemplo.com
SMTP_PUERTO=587
SMTP_SEGURO=true
SMTP_USUARIO=correo@ejemplo.com
SMTP_CONTRASENA=tu_contrasena_smtp
SMTP_REMITENTE=TiendaVirtual <no-responder@ejemplo.com>

# --- ARCHIVOS ---
UPLOAD_DIRECTORIO=./uploads
UPLOAD_TAMANO_MAXIMO=5242880
UPLOAD_TIPOS_PERMITIDOS=image/jpeg,image/png,image/webp

# --- LOGS ---
LOG_NIVEL=debug
LOG_FORMATO=simple
LOG_ARCHIVO=./logs/app.log
```

---

## Uso en NestJS

### Módulo de Configuración
```typescript
// src/config/configuracion.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            cache: true,
        }),
    ],
})
export class ConfiguracionModule {}
```

### Acceso a Variables
```typescript
// ✅ CORRECTO - Usar ConfigService
@Injectable()
export class ServicioEjemplo {
    constructor(private configService: ConfigService) {}

    obtenerConfiguracion() {
        const puerto = this.configService.get<number>('PUERTO');
        const entorno = this.configService.get<string>('ENTORNO');
        return { puerto, entorno };
    }
}

// ❌ PROHIBIDO - Acceso directo a process.env
const puerto = process.env.PUERTO; // NO hacer esto
```

### Validación de Variables
```typescript
// src/config/validacion-env.ts
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, MinLength, validateSync } from 'class-validator';

enum Entorno {
    Desarrollo = 'desarrollo',
    Staging = 'staging',
    Produccion = 'produccion',
}

class VariablesEntorno {
    @IsEnum(Entorno)
    ENTORNO: Entorno;

    @IsNumber()
    PUERTO: number;

    @IsString()
    @MinLength(64)
    JWT_ACCESS_SECRET: string;

    @IsString()
    @MinLength(64)
    JWT_REFRESH_SECRET: string;

    @IsString()
    DATABASE_URL: string;
}

export function validarVariablesEntorno(config: Record<string, unknown>) {
    const configuracionValidada = plainToInstance(VariablesEntorno, config, {
        enableImplicitConversion: true,
    });
    
    const errores = validateSync(configuracionValidada, {
        skipMissingProperties: false,
    });

    if (errores.length > 0) {
        throw new Error(`Variables de entorno inválidas: ${errores.toString()}`);
    }
    
    return configuracionValidada;
}
```

---

## Diferencias por Ambiente

### Desarrollo
```bash
ENTORNO=desarrollo
LOG_NIVEL=debug
COOKIE_SECURE=false
CORS_ORIGEN=http://localhost:4200
BCRYPT_ROUNDS=10                       # Más rápido para desarrollo
```

### Staging
```bash
ENTORNO=staging
LOG_NIVEL=info
COOKIE_SECURE=true
CORS_ORIGEN=https://staging.tienda.com
BCRYPT_ROUNDS=12
```

### Producción
```bash
ENTORNO=produccion
LOG_NIVEL=warn
COOKIE_SECURE=true
CORS_ORIGEN=https://www.tienda.com
BCRYPT_ROUNDS=12
```

---

## Checklist de Variables de Entorno

### Antes de Commit
- [ ] No hay valores hardcodeados en el código
- [ ] .env está en .gitignore
- [ ] .env.example actualizado con nuevas variables
- [ ] Variables sensibles no tienen valores reales en .env.example

### Antes de Deploy
- [ ] Todas las variables obligatorias configuradas
- [ ] Secrets generados únicos para el ambiente
- [ ] URLs apuntan al ambiente correcto
- [ ] COOKIE_SECURE=true en producción
- [ ] LOG_NIVEL apropiado para el ambiente

### Seguridad
- [ ] JWT secrets tienen mínimo 64 caracteres
- [ ] Cada ambiente tiene secrets diferentes
- [ ] No hay credenciales en logs
- [ ] Variables de BD correctamente configuradas

---

## Prohibiciones

- ❌ **NUNCA** subir `.env` al repositorio
- ❌ **NUNCA** hardcodear credenciales en código
- ❌ **NUNCA** usar `process.env` directamente (usar ConfigService)
- ❌ **NUNCA** compartir secrets entre ambientes
- ❌ **NUNCA** usar secrets de producción en desarrollo
- ❌ **NUNCA** loggear variables sensibles

---

*Última actualización: Enero 2026*
*Versión: 1.0*
*Clasificación: OBLIGATORIO* 