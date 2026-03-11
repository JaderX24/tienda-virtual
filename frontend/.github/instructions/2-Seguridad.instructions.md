---
applyTo: '**/*'
---

# Guía de Seguridad Obligatoria del Proyecto

**DOCUMENTO DE CUMPLIMIENTO OBLIGATORIO**

Este documento establece los requisitos de seguridad que DEBEN implementarse en todo el código. El incumplimiento puede resultar en vulnerabilidades que expongan datos de clientes, transacciones financieras y generar responsabilidades legales para la empresa.

**Prioridad: MÁXIMA - Sin excepciones - Sin omisiones**

---

## Stack Tecnológico de Seguridad

| Capa | Tecnología | Uso |
|------|------------|-----|
| Backend | Node.js 18+ / NestJS | Runtime y framework |
| Lenguaje | TypeScript (strict) | Tipado fuerte obligatorio |
| ORM | Prisma | Consultas parametrizadas |
| Base de datos | MySQL 8.0+ | Almacenamiento |
| Autenticación | JWT | Access + Refresh tokens |
| Hash | bcrypt (12+ rounds) | Contraseñas |
| Seguridad HTTP | Helmet | Headers de seguridad |
| Validación | class-validator | DTOs y entrada de datos |

---

## SECCIÓN 1: VALIDACIÓN DE ENTRADA (CRÍTICO)

### 1.1 Regla de Oro
**NUNCA confiar en datos del cliente.** Todo dato que ingrese al sistema DEBE validarse.

### 1.2 Validación en DTOs (NestJS)
```typescript
// OBLIGATORIO: Usar class-validator en TODOS los DTOs
import { IsString, IsEmail, MinLength, MaxLength, IsPositive } from 'class-validator';

export class CrearUsuarioDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre: string;

    @IsEmail()
    correo: string;

    @IsString()
    @MinLength(12)
    contrasena: string;
}
```

### 1.3 Validación Global (Obligatoria)
```typescript
// main.ts - SIEMPRE activar ValidationPipe global
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Eliminar propiedades no definidas
    forbidNonWhitelisted: true, // Rechazar propiedades extra
    transform: true,           // Transformar tipos automáticamente
    transformOptions: {
        enableImplicitConversion: false // NO conversión implícita
    }
}));
```

### 1.4 Sanitización
- Escapar HTML antes de almacenar: usar librerías como `sanitize-html`
- Nunca insertar datos del usuario directamente en respuestas HTML
- Validar tipos de archivo en uploads (extensión Y contenido MIME)
- Limitar tamaño de archivos y payloads

### 1.5 Prohibiciones Absolutas
- ❌ NUNCA usar `any` en datos de entrada
- ❌ NUNCA concatenar strings para queries SQL
- ❌ NUNCA confiar en headers del cliente sin validar
- ❌ NUNCA deshabilitar validación "temporalmente"

---

## SECCIÓN 2: AUTENTICACIÓN Y AUTORIZACIÓN

### 2.1 JWT - Configuración Obligatoria
```typescript
// Configuración mínima requerida
const JWT_CONFIG = {
    accessToken: {
        secreto: process.env.JWT_ACCESS_SECRET,  // Mínimo 64 caracteres
        expiracion: '15m'                        // Máximo 15 minutos
    },
    refreshToken: {
        secreto: process.env.JWT_REFRESH_SECRET, // Diferente al access
        expiracion: '7d'                         // Máximo 7 días
    }
};
```

### 2.2 Hash de Contraseñas
```typescript
// OBLIGATORIO: bcrypt con mínimo 12 rounds
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Mínimo permitido

async function hashearContrasena(contrasena: string): Promise<string> {
    return bcrypt.hash(contrasena, SALT_ROUNDS);
}

async function verificarContrasena(contrasena: string, hash: string): Promise<boolean> {
    return bcrypt.compare(contrasena, hash);
}
```

### 2.3 Política de Contraseñas (Sin Excepciones)
- Mínimo 12 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial (!@#$%^&*()_+-=)
- No permitir contraseñas comunes (lista negra)
- No reutilizar últimas 5 contraseñas

### 2.4 Guards de Autorización
```typescript
// SIEMPRE proteger rutas sensibles
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {}
```

### 2.5 Refresh Token - Rotación Obligatoria
- Almacenar refresh tokens en BD (tabla `sesiones`)
- Rotar token en cada uso (generar nuevo, invalidar anterior)
- Invalidar TODOS los tokens al cambiar contraseña
- Límite de sesiones simultáneas por usuario

---

## SECCIÓN 3: PROTECCIÓN CONTRA ATAQUES

### 3.1 Rate Limiting (Obligatorio)
```typescript
// Configuración mínima requerida
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot({
    ttl: 60,    // Ventana de 60 segundos
    limit: 10,  // Máximo 10 peticiones
});

// Endpoints críticos: límites más estrictos
// Login: 5 intentos / 15 minutos
// Registro: 3 intentos / hora
// Recuperación contraseña: 3 intentos / hora
```

### 3.2 Bloqueo de Cuentas
- 5 intentos fallidos → bloqueo 15 minutos
- 10 intentos fallidos → bloqueo 1 hora
- 20 intentos fallidos → bloqueo 24 horas + notificación admin
- Registrar TODOS los intentos en `bitacora_seguridad`

### 3.3 Protección CSRF
- Tokens CSRF en formularios que modifican datos
- Validar header `X-CSRF-Token` en peticiones AJAX
- SameSite=Strict en cookies

### 3.4 Protección XSS
- Content-Security-Policy configurado
- Escapar TODO output al HTML
- Nunca usar `innerHTML` con datos del usuario
- HttpOnly en cookies sensibles

### 3.5 SQL Injection - Prevención
```typescript
// SIEMPRE usar Prisma con parámetros
// ✅ CORRECTO
const usuario = await prisma.usuario.findUnique({
    where: { correo: correoUsuario }
});

// ❌ PROHIBIDO - NUNCA hacer esto
const usuario = await prisma.$queryRaw`SELECT * FROM usuarios WHERE correo = ${correoUsuario}`;
```

---

## SECCIÓN 4: HEADERS DE SEGURIDAD (OBLIGATORIOS)

### 4.1 Helmet - Configuración Completa
```typescript
import helmet from 'helmet';

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}));
```

### 4.2 CORS - Configuración Estricta
```typescript
app.enableCors({
    origin: process.env.FRONTEND_URL,  // NUNCA usar '*' en producción
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 86400
});
```

---

## SECCIÓN 5: MANEJO DE ERRORES

### 5.1 Mensajes Genéricos al Usuario
```typescript
// ✅ CORRECTO - Mensaje genérico
throw new UnauthorizedException('Credenciales incorrectas');

// ❌ PROHIBIDO - Revela información
throw new UnauthorizedException('Usuario no existe');
throw new UnauthorizedException('Contraseña incorrecta');
```

### 5.2 Filtro Global de Excepciones
```typescript
// OBLIGATORIO: Capturar todas las excepciones
@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
    catch(excepcion: unknown, host: ArgumentsHost) {
        // Loggear error técnico (sin datos sensibles)
        this.logger.error(excepcion);
        
        // Responder con mensaje genérico
        response.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            codigo: 'ERROR_INTERNO'
        });
    }
}
```

### 5.3 Prohibiciones en Errores
- ❌ NUNCA mostrar stack traces en producción
- ❌ NUNCA revelar estructura de BD en errores
- ❌ NUNCA mostrar rutas de archivos del servidor
- ❌ NUNCA incluir datos sensibles en logs

---

## SECCIÓN 6: DATOS SENSIBLES

### 6.1 Variables de Entorno
```bash
# .env - NUNCA en repositorio
JWT_ACCESS_SECRET=clave_minimo_64_caracteres_aleatorios
JWT_REFRESH_SECRET=otra_clave_diferente_64_caracteres
DATABASE_URL=mysql://usuario:contrasena@host:3306/basedatos
BCRYPT_ROUNDS=12
```

### 6.2 Datos que NUNCA se registran en logs
- Contraseñas (ni hasheadas)
- Tokens JWT
- Números de tarjeta de crédito
- CVV
- Datos personales identificables (PII)
- Direcciones completas
- Números de teléfono

### 6.3 Datos que NUNCA se envían al frontend
- Hash de contraseñas
- Secrets internos
- IDs de base de datos sensibles
- Información de otros usuarios
- Datos de pago completos

---

## SECCIÓN 7: TRANSACCIONES Y PAGOS

### 7.1 Operaciones Críticas
```typescript
// OBLIGATORIO: Usar transacciones para operaciones de dinero
await prisma.$transaction(async (tx) => {
    // Crear pedido
    const pedido = await tx.pedido.create({ ... });
    
    // Actualizar inventario
    await tx.inventario.update({ ... });
    
    // Registrar pago
    await tx.pago.create({ ... });
    
    // Si algo falla, TODO se revierte automáticamente
});
```

### 7.2 Validaciones de Pago
- Verificar stock ANTES de procesar pago
- Verificar precio en backend (NUNCA confiar en precio del frontend)
- Registrar TODA transacción en auditoría
- Doble verificación en montos

---

## SECCIÓN 8: AUDITORÍA Y MONITOREO

### 8.1 Eventos que DEBEN registrarse
| Evento | Datos a registrar |
|--------|-------------------|
| Login exitoso | usuario_id, IP, timestamp, user_agent |
| Login fallido | correo_intento, IP, timestamp, razón |
| Logout | usuario_id, timestamp |
| Cambio contraseña | usuario_id, timestamp, IP |
| Pedido creado | pedido_id, usuario_id, monto, timestamp |
| Pago procesado | pago_id, pedido_id, monto, método |
| Error crítico | tipo_error, módulo, timestamp |
| Acceso denegado | usuario_id, recurso, timestamp, IP |

### 8.2 Estructura de Log
```typescript
interface RegistroAuditoria {
    fecha: Date;
    tipo: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
    evento: string;
    usuarioId?: number;
    ip?: string;
    userAgent?: string;
    datos?: Record<string, any>; // Sin datos sensibles
}
```

---

## SECCIÓN 9: CHECKLIST DE SEGURIDAD

### 9.1 Antes de Cada Commit
- [ ] Validación de entrada implementada
- [ ] Sin datos sensibles hardcodeados
- [ ] Rutas protegidas con Guards
- [ ] Errores manejados con mensajes genéricos
- [ ] Sin console.log con datos sensibles
- [ ] Rate limiting en endpoints públicos

### 9.2 Antes de Cada PR
- [ ] Tests de seguridad pasan
- [ ] No hay vulnerabilidades en dependencias (`npm audit`)
- [ ] Headers de seguridad configurados
- [ ] CORS configurado correctamente
- [ ] Transacciones en operaciones críticas

### 9.3 Antes de Deploy a Producción
- [ ] Variables de entorno configuradas
- [ ] HTTPS obligatorio
- [ ] Logs sin datos sensibles
- [ ] Backups de BD configurados
- [ ] Monitoreo de errores activo

---

## SECCIÓN 10: RESPUESTA A INCIDENTES

### 10.1 Compromiso de Cuenta Individual
1. Bloquear cuenta inmediatamente
2. Invalidar TODOS los tokens del usuario
3. Notificar al usuario por correo secundario
4. Registrar incidente en auditoría
5. Investigar origen del compromiso

### 10.2 Breach de Datos
1. Contener el incidente (bloquear acceso)
2. Evaluar alcance del daño
3. Notificar a usuarios afectados
4. Reportar a autoridades si aplica
5. Documentar y corregir vulnerabilidad

### 10.3 Ataque de Fuerza Bruta
1. Activar bloqueo automático de IPs
2. Incrementar rate limiting temporalmente
3. Activar CAPTCHA obligatorio
4. Monitorear patrones de ataque
5. Considerar WAF adicional

---

## Recordatorio Final

**Este documento NO es opcional.** Cada desarrollador es responsable de:

1. Leer y entender completamente estas directrices
2. Aplicarlas en TODO el código que escriba
3. Rechazar PRs que no cumplan estos estándares
4. Reportar vulnerabilidades encontradas inmediatamente

**La seguridad es responsabilidad de TODOS.**

---

*Última actualización: Enero 2026*
*Versión: 2.0*
*Clasificación: OBLIGATORIO*
