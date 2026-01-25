# Guía de Implementación - Fase 3: Seguridad Avanzada y Notificaciones

**Versión:** 1.0.0  
**Fecha:** 24/01/2026  
**Autor:** Equipo de Arquitectura  

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Nuevas Tablas y Componentes](#nuevas-tablas-y-componentes)
3. [Diagrama de Arquitectura](#diagrama-de-arquitectura)
4. [Sistema de Notificaciones](#sistema-de-notificaciones)
5. [Seguridad Avanzada](#seguridad-avanzada)
6. [Registro de Actividad](#registro-de-actividad)
7. [Instrucciones de Implementación](#instrucciones-de-implementación)
8. [Integración con Backend](#integración-con-backend)

---

## 1. Resumen Ejecutivo

### Objetivo
Implementar un sistema completo de seguridad avanzada, notificaciones y registro de actividad para la tienda virtual.

### Alcance Fase 3
- ✅ Políticas de contraseña configurables por empresa
- ✅ Códigos de respaldo para 2FA
- ✅ IPs de confianza (globales, por empresa, por usuario)
- ✅ Restricciones de horario de acceso
- ✅ Sistema de notificaciones con plantillas
- ✅ Preferencias de notificación por usuario
- ✅ Registro detallado de actividad
- ✅ Elementos recientes y favoritos
- ✅ Vistas analíticas y eventos programados

### Dependencias
| Fase | Estado | Requerido |
|------|--------|-----------|
| Fase 1: RBAC y Usuarios | ✅ Completada | Sí |
| Fase 2: Multi-tenancy | ✅ Completada | Sí |

---

## 2. Nuevas Tablas y Componentes

### 2.1 Resumen de Tablas

| Esquema | Tabla | Propósito |
|---------|-------|-----------|
| Seguridad | `seguridad_politicas_contrasena` | Políticas de contraseña por empresa |
| Seguridad | `seguridad_codigos_respaldo` | Códigos de respaldo para 2FA |
| Seguridad | `seguridad_ips_confianza` | IPs de confianza configurables |
| Seguridad | `seguridad_horarios_acceso` | Restricciones de horario |
| Notificaciones | `notificaciones_plantillas` | Plantillas de notificación |
| Notificaciones | `notificaciones` | Notificaciones enviadas |
| Notificaciones | `notificaciones_preferencias` | Preferencias por usuario |
| Actividad | `actividad_usuarios` | Registro detallado de acciones |
| Actividad | `actividad_recientes` | Elementos visitados recientemente |
| Actividad | `actividad_favoritos` | Marcadores del usuario |

### 2.2 Modificaciones a Tablas Existentes

**admin_usuarios:**
- `debe_cambiar_contrasena` - Forzar cambio en siguiente login
- `contrasena_nunca_expira` - Excluir de política de expiración
- `bloqueos_consecutivos` - Contador de bloqueos

**admin_empresas:**
- `politica_contrasena_id` - Política de contraseña asociada
- `requiere_2fa_todos` - 2FA obligatorio para empleados
- `permite_acceso_externo` - Permitir acceso fuera de IPs de confianza
- `notificar_login_nuevo_dispositivo` - Enviar notificación de seguridad

---

## 3. Diagrama de Arquitectura

### 3.1 Sistema de Notificaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                   SISTEMA DE NOTIFICACIONES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   PLANTILLAS    │───▶│  NOTIFICACIÓN   │                     │
│  │  (templates)    │    │   (instancia)   │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│                    ┌─────────────┼─────────────┐                │
│                    ▼             ▼             ▼                 │
│              ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│              │ INTERNO  │ │  CORREO  │ │   PUSH   │             │
│              │  (app)   │ │  (smtp)  │ │  (fcm)   │             │
│              └──────────┘ └──────────┘ └──────────┘             │
│                    │             │             │                 │
│                    └─────────────┼─────────────┘                │
│                                  ▼                               │
│                    ┌─────────────────────────┐                  │
│                    │    PREFERENCIAS         │                  │
│                    │    DEL USUARIO          │                  │
│                    │  ┌─────────────────┐    │                  │
│                    │  │ ✓ Interno       │    │                  │
│                    │  │ ✓ Correo        │    │                  │
│                    │  │ ✗ SMS           │    │                  │
│                    │  │ ✓ Push          │    │                  │
│                    │  └─────────────────┘    │                  │
│                    └─────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Seguridad Avanzada

```
┌──────────┐     ┌────────────────────────────────────────────────┐
│  LOGIN   │────▶│           VALIDACIONES DE SEGURIDAD            │
└──────────┘     └───────────────────────┬────────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│  VERIFICAR IP   │            │VERIFICAR HORARIO│            │VERIFICAR BLOQUEO│
│  DE CONFIANZA   │            │   DE ACCESO     │            │   DE CUENTA     │
│                 │            │                 │            │                 │
│  Global ────┐   │            │  Empresa ───┐   │            │  Intentos ───┐  │
│  Empresa ───┼──▶│            │  Rol ───────┼──▶│            │  IP ─────────┼─▶│
│  Usuario ───┘   │            │  Usuario ───┘   │            │  Dispositivo ┘  │
└────────┬────────┘            └────────┬────────┘            └────────┬────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   ¿NUEVO DISPOSITIVO?│
                              └──────────┬──────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │ SÍ                           NO │
                        ▼                                 ▼
              ┌─────────────────┐               ┌─────────────────┐
              │   NOTIFICAR     │               │   ACCESO        │
              │   USUARIO       │               │   CONCEDIDO     │
              └─────────────────┘               └─────────────────┘
```

### 3.3 Registro de Actividad

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRO DE ACTIVIDAD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACCIÓN DEL USUARIO                                             │
│  ─────────────────                                              │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   actividad_usuarios                     │    │
│  │  ┌─────────────┬─────────────┬─────────────────────┐    │    │
│  │  │ tipo_accion │   modulo    │     descripcion     │    │    │
│  │  ├─────────────┼─────────────┼─────────────────────┤    │    │
│  │  │ ver         │ productos   │ Vio producto #123   │    │    │
│  │  │ crear       │ usuarios    │ Creó usuario X      │    │    │
│  │  │ editar      │ pedidos     │ Editó pedido #456   │    │    │
│  │  └─────────────┴─────────────┴─────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ├──────────────────────────────┐                        │
│         ▼                              ▼                        │
│  ┌─────────────────┐          ┌─────────────────┐              │
│  │ actividad_      │          │ actividad_      │              │
│  │ recientes       │          │ favoritos       │              │
│  │ (últimos 50)    │          │ (marcados)      │              │
│  └─────────────────┘          └─────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Sistema de Notificaciones

### 4.1 Tipos de Notificación

| Tipo | Descripción | Prioridad Default |
|------|-------------|-------------------|
| `info` | Información general | Baja |
| `exito` | Acción completada | Normal |
| `advertencia` | Requiere atención | Normal |
| `error` | Problema detectado | Alta |
| `seguridad` | Alerta de seguridad | Urgente |

### 4.2 Canales de Entrega

| Canal | Descripción | Implementación |
|-------|-------------|----------------|
| `interno` | En la aplicación | WebSocket/Polling |
| `correo` | Email SMTP | Nodemailer |
| `sms` | Mensaje de texto | Twilio (futuro) |
| `push` | Notificación push | FCM (futuro) |

### 4.3 Plantillas Disponibles

| Código | Nombre | Canal | Uso |
|--------|--------|-------|-----|
| `BIENVENIDA_USUARIO` | Bienvenida | Correo | Al crear cuenta |
| `LOGIN_NUEVO_DISPOSITIVO` | Nuevo dispositivo | Correo | Login sospechoso |
| `CONTRASENA_CAMBIADA` | Contraseña modificada | Correo | Cambio de contraseña |
| `CONTRASENA_POR_EXPIRAR` | Próxima expiración | Interno/Correo | 7, 3, 1 días antes |
| `CUENTA_BLOQUEADA` | Cuenta bloqueada | Correo | Tras bloqueo |
| `RECUPERACION_CONTRASENA` | Recuperar contraseña | Correo | Solicitud de reset |
| `MANTENIMIENTO_PROGRAMADO` | Mantenimiento | Todos | Avisos del sistema |

### 4.4 Crear Notificación (Procedimiento)

```sql
-- Crear notificación usando plantilla
CALL sp_crear_notificacion(
    1,                              -- usuario_id
    'LOGIN_NUEVO_DISPOSITIVO',      -- código de plantilla
    '{"dispositivo": "Windows PC", "navegador": "Chrome", "ubicacion": "Tegucigalpa"}',
    'alta'                          -- prioridad
);
```

---

## 5. Seguridad Avanzada

### 5.1 Políticas de Contraseña

Configuración personalizable por empresa:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `longitud_minima` | 12 | Caracteres mínimos |
| `longitud_maxima` | 128 | Caracteres máximos |
| `requiere_mayuscula` | Sí | Al menos una mayúscula |
| `requiere_minuscula` | Sí | Al menos una minúscula |
| `requiere_numero` | Sí | Al menos un número |
| `requiere_especial` | Sí | Al menos un carácter especial |
| `historial_contrasenas` | 5 | No reutilizar últimas N |
| `dias_expiracion` | 90 | Días antes de expirar |
| `intentos_maximos` | 5 | Antes de bloquear |
| `minutos_bloqueo` | 15 | Duración del bloqueo |

### 5.2 IPs de Confianza

Tres niveles de configuración:

```
┌─────────────────────────────────────────────┐
│              IPs DE CONFIANZA               │
├─────────────────────────────────────────────┤
│                                             │
│  GLOBAL (tipo = 'global')                   │
│  ├── 192.168.1.0/24 (Oficina central)       │
│  └── 10.0.0.0/8 (VPN corporativa)           │
│                                             │
│  EMPRESA (tipo = 'empresa')                 │
│  ├── Empresa A: 200.100.50.10               │
│  └── Empresa B: 200.100.60.0/28             │
│                                             │
│  USUARIO (tipo = 'usuario')                 │
│  └── Usuario X: 190.80.70.5 (Casa)          │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.3 Verificar IP de Confianza

```sql
-- Función para verificar
SELECT fn_ip_es_confianza(1, 1, '192.168.1.100');
-- Retorna: TRUE si es IP de confianza
```

### 5.4 Horarios de Acceso

Restricciones por día y hora:

```sql
-- Ejemplo: Solo permitir acceso L-V de 7am a 7pm
INSERT INTO seguridad_horarios_acceso 
(tipo, empresa_id, dia_semana, hora_inicio, hora_fin) VALUES
('empresa', 1, 'lunes', '07:00:00', '19:00:00'),
('empresa', 1, 'martes', '07:00:00', '19:00:00'),
('empresa', 1, 'miercoles', '07:00:00', '19:00:00'),
('empresa', 1, 'jueves', '07:00:00', '19:00:00'),
('empresa', 1, 'viernes', '07:00:00', '19:00:00');
```

### 5.5 Verificar Horario de Acceso

```sql
-- Procedimiento para verificar
CALL sp_verificar_horario_acceso(1, 1, @permitido, @mensaje);
SELECT @permitido, @mensaje;
```

---

## 6. Registro de Actividad

### 6.1 Tipos de Acción

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `login` | Inicio de sesión | Usuario inició sesión |
| `logout` | Cierre de sesión | Usuario cerró sesión |
| `ver` | Consulta de datos | Vio producto #123 |
| `crear` | Creación de registro | Creó usuario nuevo |
| `editar` | Modificación | Editó precio producto |
| `eliminar` | Eliminación | Eliminó categoría |
| `exportar` | Exportación de datos | Exportó reporte PDF |
| `importar` | Importación de datos | Importó productos CSV |
| `aprobar` | Aprobación | Aprobó pedido |
| `rechazar` | Rechazo | Rechazó devolución |
| `buscar` | Búsqueda | Buscó "laptop" |
| `filtrar` | Aplicar filtros | Filtró por categoría |
| `descargar` | Descarga de archivo | Descargó factura |
| `subir` | Subida de archivo | Subió imagen producto |
| `configurar` | Cambio de config | Cambió tema a oscuro |

### 6.2 Registrar Actividad (Procedimiento)

```sql
CALL sp_registrar_actividad(
    1,                      -- usuario_id
    100,                    -- sesion_id
    1,                      -- empresa_id
    'ver',                  -- tipo_accion
    'productos',            -- modulo
    'producto',             -- entidad
    123,                    -- entidad_id
    'Vio detalles del producto Laptop HP',  -- descripcion
    '{"precio": 15000, "stock": 50}',       -- datos_accion (JSON)
    '192.168.1.100',        -- ip_address
    'Mozilla/5.0...',       -- user_agent
    TRUE,                   -- exitoso
    150                     -- tiempo_ejecucion (ms)
);
```

### 6.3 Elementos Recientes

```sql
-- Registrar elemento visitado
CALL sp_registrar_elemento_reciente(
    1,                      -- usuario_id
    'productos',            -- modulo
    'producto',             -- entidad
    123,                    -- entidad_id
    'Laptop HP Pavilion',   -- titulo
    'Electrónicos > Laptops', -- subtitulo
    'bi-laptop',            -- icono
    '/admin/productos/123', -- url
    '{"imagen": "/productos/123.jpg", "precio": 15000}' -- preview
);
```

---

## 7. Instrucciones de Implementación

### 7.1 Ejecutar Script SQL

```bash
# 1. Conectar a MySQL
mysql -u root -p

# 2. Verificar que Fase 1 y 2 están instaladas
USE tienda_virtual;
SHOW TABLES LIKE 'admin_%';
SHOW TABLES LIKE 'seguridad_%';

# 3. Ejecutar Fase 3
source /ruta/database/3-fase-(24-01-2026)-v1-8392.sql

# 4. Verificar nuevas tablas
SHOW TABLES LIKE 'notificaciones%';
SHOW TABLES LIKE 'actividad%';
SHOW TABLES LIKE 'seguridad_politicas%';
```

### 7.2 Verificar Instalación

```sql
-- Verificar plantillas de notificación
SELECT codigo, nombre, canal FROM notificaciones_plantillas;

-- Verificar política de contraseña por defecto
SELECT * FROM seguridad_politicas_contrasena WHERE empresa_id IS NULL;

-- Verificar nuevos módulos
SELECT codigo, nombre FROM admin_modulos WHERE codigo IN ('notificaciones', 'actividad', 'seguridad_avanzada');

-- Verificar nuevos permisos
SELECT codigo FROM admin_permisos WHERE codigo LIKE 'notificaciones.%' OR codigo LIKE 'actividad.%';
```

### 7.3 Orden de Ejecución de Scripts

```
1. 1-fase-(24-01-2026)-v1-5648.sql   ← RBAC y Usuarios
2. 2-fase-(24-01-2026)-v1-6544.sql   ← Multi-tenancy
3. 3-fase-(24-01-2026)-v1-8392.sql   ← Seguridad y Notificaciones ✓
```

---

## 8. Integración con Backend

### 8.1 Actualizar Schema Prisma

Agregar los nuevos modelos al schema de Prisma:

```prisma
// Política de contraseña
model SeguridadPoliticaContrasena {
  id                    Int       @id @default(autoincrement()) @db.UnsignedInt
  empresaId             Int?      @map("empresa_id") @db.UnsignedInt
  longitudMinima        Int       @default(12) @map("longitud_minima") @db.UnsignedTinyInt
  requiereMayuscula     Boolean   @default(true) @map("requiere_mayuscula")
  requiereMinuscula     Boolean   @default(true) @map("requiere_minuscula")
  requiereNumero        Boolean   @default(true) @map("requiere_numero")
  requiereEspecial      Boolean   @default(true) @map("requiere_especial")
  diasExpiracion        Int       @default(90) @map("dias_expiracion") @db.UnsignedInt
  intentosMaximos       Int       @default(5) @map("intentos_maximos") @db.UnsignedTinyInt
  
  empresa               AdminEmpresa? @relation(fields: [empresaId], references: [id])
  
  @@map("seguridad_politicas_contrasena")
}

// Notificación
model Notificacion {
  id            BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  usuarioId     Int       @map("usuario_id") @db.UnsignedInt
  plantillaId   Int?      @map("plantilla_id") @db.UnsignedInt
  titulo        String    @db.VarChar(255)
  mensaje       String    @db.Text
  tipo          String    @default("info") @db.VarChar(20)
  prioridad     String    @default("normal") @db.VarChar(20)
  canal         String    @default("interno") @db.VarChar(20)
  estado        String    @default("pendiente") @db.VarChar(20)
  leidoEn       DateTime? @map("leido_en")
  creadoEn      DateTime  @default(now()) @map("creado_en")
  
  usuario       AdminUsuario               @relation(fields: [usuarioId], references: [id])
  plantilla     NotificacionPlantilla?     @relation(fields: [plantillaId], references: [id])
  
  @@map("notificaciones")
}

// Actividad de usuario
model ActividadUsuario {
  id            BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  usuarioId     Int       @map("usuario_id") @db.UnsignedInt
  tipoAccion    String    @map("tipo_accion") @db.VarChar(50)
  modulo        String    @db.VarChar(100)
  entidad       String?   @db.VarChar(100)
  entidadId     BigInt?   @map("entidad_id") @db.UnsignedBigInt
  descripcion   String?   @db.VarChar(500)
  ipAddress     String?   @map("ip_address") @db.VarChar(45)
  exitoso       Boolean   @default(true)
  creadoEn      DateTime  @default(now()) @map("creado_en")
  
  usuario       AdminUsuario @relation(fields: [usuarioId], references: [id])
  
  @@map("actividad_usuarios")
}
```

### 8.2 Servicio de Notificaciones (NestJS)

```typescript
// src/notificaciones/notificaciones.servicio.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacionesServicio {
    constructor(private prisma: PrismaService) {}

    async crearNotificacion(
        usuarioId: number,
        titulo: string,
        mensaje: string,
        tipo: 'info' | 'exito' | 'advertencia' | 'error' | 'seguridad' = 'info',
        prioridad: 'baja' | 'normal' | 'alta' | 'urgente' = 'normal'
    ) {
        return this.prisma.notificacion.create({
            data: {
                usuarioId,
                titulo,
                mensaje,
                tipo,
                prioridad,
                canal: 'interno',
                estado: 'pendiente'
            }
        });
    }

    async obtenerNoLeidas(usuarioId: number) {
        return this.prisma.notificacion.findMany({
            where: {
                usuarioId,
                leidoEn: null,
                OR: [
                    { expiraEn: null },
                    { expiraEn: { gt: new Date() } }
                ]
            },
            orderBy: [
                { prioridad: 'desc' },
                { creadoEn: 'desc' }
            ]
        });
    }

    async marcarComoLeida(notificacionId: bigint, usuarioId: number) {
        return this.prisma.notificacion.updateMany({
            where: {
                id: notificacionId,
                usuarioId
            },
            data: {
                leidoEn: new Date(),
                estado: 'leido'
            }
        });
    }
}
```

### 8.3 Servicio de Actividad (NestJS)

```typescript
// src/actividad/actividad.servicio.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActividadServicio {
    constructor(private prisma: PrismaService) {}

    async registrar(datos: {
        usuarioId: number;
        tipoAccion: string;
        modulo: string;
        entidad?: string;
        entidadId?: number;
        descripcion?: string;
        ipAddress?: string;
        userAgent?: string;
        exitoso?: boolean;
    }) {
        return this.prisma.actividadUsuario.create({
            data: {
                usuarioId: datos.usuarioId,
                tipoAccion: datos.tipoAccion,
                modulo: datos.modulo,
                entidad: datos.entidad,
                entidadId: datos.entidadId ? BigInt(datos.entidadId) : null,
                descripcion: datos.descripcion,
                ipAddress: datos.ipAddress,
                exitoso: datos.exitoso ?? true
            }
        });
    }

    async obtenerRecientes(usuarioId: number, limite: number = 20) {
        return this.prisma.actividadUsuario.findMany({
            where: { usuarioId },
            orderBy: { creadoEn: 'desc' },
            take: limite
        });
    }
}
```

---

## 9. Vistas Disponibles

| Vista | Propósito | Uso |
|-------|-----------|-----|
| `vista_notificaciones_pendientes` | Notificaciones sin leer | Dashboard, Bell icon |
| `vista_actividad_reciente` | Últimas 24h de actividad | Admin, Auditoría |
| `vista_contrasenas_por_expirar` | Usuarios con contraseña próxima a expirar | Alertas admin |
| `vista_dispositivos_usuario` | Dispositivos por usuario | Seguridad, Perfil |

---

## 10. Eventos Programados

| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_notificar_contrasenas_expirando` | Diario 8:00 AM | Notifica 7, 3, 1 días antes |
| `evento_limpiar_actividad_antigua` | Diario 2:00 AM | Elimina actividad > 180 días |
| `evento_limpiar_notificaciones_antiguas` | Diario 4:00 AM | Elimina notificaciones leídas > 90 días |

---

## 11. Próximos Pasos (Fase 4)

Pendientes para la siguiente fase:
- [ ] Productos y categorías
- [ ] Inventarios y almacenes
- [ ] Precios y promociones
- [ ] Imágenes y multimedia

---

*Documento actualizado: 24/01/2026*
*Versión: 1.0.0*
