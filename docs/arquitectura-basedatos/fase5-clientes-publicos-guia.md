# Fase 5: Clientes Públicos (Escalable - Estilo Amazon)

## Descripción General

La Fase 5 implementa un sistema completo de gestión de clientes con registro, verificación, direcciones múltiples, programa de fidelidad, membresías premium y sistema de referidos.

## Características Implementadas

### 1. Registro y Autenticación
- UUID único por cliente
- Código de cliente auto-generado
- Verificación de correo electrónico
- Verificación de teléfono (SMS)
- Autenticación de dos factores (2FA)
- Control de intentos de login fallidos
- Bloqueo temporal de cuenta

### 2. Datos del Cliente
- Información personal completa
- Datos fiscales para facturación (RTN, razón social)
- Avatar personalizable
- Preferencias de idioma, moneda y zona horaria

### 3. Direcciones Múltiples
- Direcciones de envío ilimitadas
- Direcciones de facturación separadas
- Dirección predeterminada por tipo
- Geolocalización para entregas
- Validación de cobertura de envío

### 4. Programa de Fidelidad
- **Niveles de membresía**: Bronce, Plata, Oro, Platino, Diamante
- Acumulación de puntos por compras
- Canje de puntos por descuentos
- Beneficios por nivel (descuentos, envío gratis, acceso anticipado)
- Fecha de vencimiento de puntos

### 5. Sistema de Referidos
- Código de referido único por cliente
- Tracking de invitaciones enviadas
- Recompensas para referidor y referido
- Estados: pendiente, registrado, primera_compra, recompensado

### 6. Membresías Premium
- Planes tipo Amazon Prime
- Beneficios: envío gratis, descuentos exclusivos, acceso anticipado
- Renovación automática o manual
- Período de prueba gratuito

### 7. Métodos de Pago Guardados
- Tokenización segura de tarjetas
- Múltiples métodos por cliente
- Método predeterminado
- Verificación de seguridad (CVV guardado: nunca)

### 8. Listas de Deseos (Wishlist)
- Múltiples listas por cliente
- Listas públicas o privadas
- Compartir listas por URL
- Notificación de cambios de precio
- Alertas de stock disponible

### 9. Historial de Navegación
- Productos visitados recientemente
- Tiempo de visualización
- Fuente de tráfico
- Base para recomendaciones

## Estructura de Tablas

```
clientes (tabla principal)
├── clientes_direcciones
├── clientes_metodos_pago
├── clientes_wishlist
│   └── clientes_wishlist_items
├── clientes_referidos
├── clientes_navegacion_historial
├── clientes_dispositivos
└── clientes_sesiones
membresias_niveles
membresias_clientes
membresias_beneficios
puntos_transacciones
puntos_canjes
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_registrar_cliente` | Registro con validaciones |
| `sp_verificar_correo` | Confirma verificación de email |
| `sp_acumular_puntos` | Suma puntos por compra |
| `sp_canjear_puntos` | Descuenta puntos por canje |
| `sp_subir_nivel` | Evalúa y sube nivel de membresía |
| `sp_procesar_referido` | Otorga recompensas de referidos |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_clientes_activos` | Clientes verificados y activos |
| `vista_clientes_premium` | Clientes con membresía activa |
| `vista_puntos_por_vencer` | Puntos próximos a expirar |
| `vista_referidos_pendientes` | Referidos sin recompensa |
| `vista_top_clientes` | Clientes por volumen de compra |

## Casos de Uso

### Registro de Cliente
```sql
CALL sp_registrar_cliente(
    'Juan',
    'Pérez',
    'juan@correo.com',
    '$hash_contrasena',
    '9999-8888',
    'REF123'  -- código de quien lo refirió (opcional)
);
```

### Acumular Puntos por Compra
```sql
CALL sp_acumular_puntos(
    :cliente_id,
    :pedido_id,
    :monto_compra,
    'compra'  -- tipo de transacción
);
```

### Obtener Direcciones del Cliente
```sql
SELECT * FROM clientes_direcciones
WHERE cliente_id = :cliente_id
AND es_activa = TRUE
ORDER BY es_predeterminada DESC, tipo;
```

### Verificar Nivel de Membresía
```sql
SELECT 
    c.nombre_completo,
    n.nombre AS nivel,
    n.descuento_porcentaje,
    n.envio_gratis,
    c.puntos_actuales
FROM clientes c
INNER JOIN membresias_niveles n ON c.nivel_membresia_id = n.id
WHERE c.id = :cliente_id;
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_generar_codigo_cliente` | BEFORE INSERT | Auto-genera código único |
| `trg_generar_codigo_referido` | AFTER INSERT | Crea código de referido |
| `trg_evaluar_nivel` | AFTER UPDATE | Evalúa subida de nivel |
| `trg_puntos_vencimiento` | DAILY EVENT | Expira puntos vencidos |

## Índices Optimizados

### Clientes
- `idx_uuid` - Búsqueda por identificador único
- `idx_correo` - Login y búsqueda
- `idx_codigo_cliente` - Referencia rápida
- `idx_estado` - Filtro por estado
- `idx_nivel_membresia` - Filtro por nivel
- `idx_codigo_referido` - Sistema de referidos

### Direcciones
- `idx_cliente` - Direcciones por cliente
- `idx_predeterminada` - Dirección principal
- `idx_tipo` - Envío vs facturación

## Estados del Cliente

| Estado | Descripción |
|--------|-------------|
| `pendiente_verificacion` | Recién registrado, sin verificar email |
| `activo` | Cuenta verificada y funcional |
| `suspendido` | Suspendido temporalmente (puede reactivarse) |
| `bloqueado` | Bloqueado por seguridad o violación de términos |
| `eliminado` | Cuenta eliminada (soft delete) |

## Niveles de Membresía

| Nivel | Requisito | Descuento | Envío Gratis |
|-------|-----------|-----------|--------------|
| Bronce | 0 puntos | 0% | No |
| Plata | 1,000 puntos | 5% | >L500 |
| Oro | 5,000 puntos | 10% | >L300 |
| Platino | 15,000 puntos | 15% | Sí |
| Diamante | 50,000 puntos | 20% | Sí + Express |

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 4 | Wishlist referencia productos |
| Fase 6 | Clientes crean pedidos |
| Fase 7 | Clientes escriben reseñas |
| Fase 8 | Preferencias de notificación |
| Fase 9 | Precios especiales por segmento |
| Fase 11 | Métodos de pago y wallets |

## Consideraciones de Seguridad

1. **Contraseñas**: Hash con bcrypt (12+ rounds)
2. **Tokens de verificación**: Expiran en 24 horas
3. **2FA**: TOTP compatible con Google Authenticator
4. **Sesiones**: Registro de dispositivos y ubicación
5. **Datos sensibles**: Nunca se almacena CVV

## Verificación Post-Instalación

```sql
-- Verificar tablas de clientes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND table_name LIKE 'clientes%';

-- Verificar niveles de membresía
SELECT * FROM membresias_niveles ORDER BY puntos_requeridos;

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name LIKE 'sp_%cliente%';
```

## Archivo SQL

- **Nombre**: `5-fase-(24-01-2026)-v1-3951.sql`
- **Líneas**: ~1,443
- **Dependencias**: Fases 1-4 instaladas
- **Script verificación**: `5-fase-verificacion.sql`
