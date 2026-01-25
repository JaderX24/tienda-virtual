# Fase 11: Pagos Avanzados

## Descripción General

La Fase 11 implementa un sistema completo de pagos con múltiples pasarelas, split payments para marketplace, suscripciones recurrentes, wallets digitales y conciliación automática.

## Características Implementadas

### 1. Configuración de Pagos
- Configuración general del sistema
- Monedas soportadas con tasas de cambio
- Límites de transacción
- Políticas de reembolso

### 2. Pasarelas de Pago
- Múltiples proveedores (Stripe, PayPal, etc.)
- Credenciales por empresa y ambiente
- Comisiones configurables por pasarela
- Failover automático

### 3. Métodos de Pago del Cliente
- Tokenización segura de tarjetas
- Múltiples métodos guardados
- Método predeterminado
- Verificación 3D Secure

### 4. Wallets Digitales
- Saldo en cuenta del cliente
- Recargas desde métodos de pago
- Transferencias entre wallets
- Historial de movimientos
- Límites de saldo máximo

### 5. Transacciones
- Registro completo de cada transacción
- **Estados**: pendiente, procesando, completada, fallida, cancelada, reembolsada
- Referencia única por transacción
- Metadata de pasarela (JSON)
- Log de intentos y respuestas

### 6. Suscripciones
- Planes con diferentes ciclos (mensual, trimestral, anual)
- Período de prueba gratuito
- Renovación automática
- Cancelación con período de gracia
- Historial de facturación

### 7. Split Payments (Marketplace)
- División de pago entre vendedores
- Comisión de plataforma configurable
- Liquidación programada
- Retención por disputas

### 8. Disputas y Reembolsos
- Gestión de chargebacks
- Estados de disputa
- Evidencia adjunta
- Reembolsos totales y parciales
- Crédito en tienda alternativo

### 9. Liquidaciones
- Liquidación periódica a vendedores
- Detalle de transacciones incluidas
- Estados: pendiente, procesada, pagada
- Comprobantes de pago

## Estructura de Tablas

```
pagos_configuracion
pagos_monedas
pagos_pasarelas
├── pagos_pasarelas_credenciales
├── pagos_pasarelas_comisiones
pagos_tokens_tarjeta
pagos_metodos_cliente
pagos_wallets
├── pagos_wallets_movimientos
pagos_transacciones
├── pagos_transacciones_log
pagos_disputas
├── pagos_disputas_evidencia
pagos_reembolsos
pagos_planes_suscripcion
pagos_suscripciones
├── pagos_suscripciones_historial
pagos_splits
├── pagos_split_detalle
pagos_liquidaciones
├── pagos_liquidaciones_detalle
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_procesar_pago` | Procesa pago principal |
| `sp_crear_suscripcion` | Inicia suscripción |
| `sp_renovar_suscripcion` | Renueva automáticamente |
| `sp_cancelar_suscripcion` | Cancela con reglas |
| `sp_procesar_reembolso` | Gestiona reembolso |
| `sp_split_payment` | Divide pago marketplace |
| `sp_recargar_wallet` | Agrega saldo a wallet |
| `sp_transferir_wallet` | Transfiere entre wallets |
| `sp_liquidar_vendedor` | Genera liquidación |
| `sp_conciliar_transacciones` | Conciliación automática |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_transacciones_recientes` | Últimas transacciones |
| `vista_suscripciones_activas` | Suscripciones vigentes |
| `vista_pagos_pendientes` | Por procesar |
| `vista_reembolsos_pendientes` | Por aprobar |
| `vista_comisiones_marketplace` | Comisiones generadas |
| `vista_balance_wallets` | Saldos de wallets |

## Flujo de Pago

```
┌─────────────┐
│   Cliente   │
│  checkout   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Validar    │────►│   Wallet?   │
│   datos     │     │  suficiente │
└──────┬──────┘     └──────┬──────┘
       │                   │ Sí
       │ No                ▼
       │            ┌─────────────┐
       │            │  Descontar  │
       │            │   wallet    │
       │            └──────┬──────┘
       │                   │
       ▼                   │
┌─────────────┐            │
│  Pasarela   │◄───────────┘
│   externa   │     (diferencia)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Transacción │
│  registrada │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Split     │────►│ Liquidación │
│  payment?   │     │  vendedores │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   Pedido    │
│   pagado    │
└─────────────┘
```

## Casos de Uso

### Procesar Pago
```sql
CALL sp_procesar_pago(
    :pedido_id,
    :cliente_id,
    :metodo_pago_id,        -- método guardado del cliente
    :monto,
    'HNL',
    :usar_wallet,           -- TRUE para usar saldo wallet primero
    :ip_cliente,
    @transaccion_id,
    @resultado,
    @mensaje
);

SELECT @transaccion_id, @resultado, @mensaje;
```

### Crear Suscripción
```sql
CALL sp_crear_suscripcion(
    :cliente_id,
    :plan_id,               -- plan mensual/anual
    :metodo_pago_id,
    :aplicar_prueba,        -- período de prueba
    @suscripcion_id,
    @resultado
);
```

### Recargar Wallet
```sql
CALL sp_recargar_wallet(
    :cliente_id,
    1500.00,                -- monto a recargar
    'HNL',
    :metodo_pago_id,
    'Recarga desde tarjeta',
    @transaccion_id,
    @resultado
);
```

### Split Payment (Marketplace)
```sql
CALL sp_split_payment(
    :transaccion_id,
    JSON_ARRAY(
        JSON_OBJECT('vendedor_id', 1, 'monto', 800.00),
        JSON_OBJECT('vendedor_id', 2, 'monto', 500.00)
    ),
    150.00,                 -- comisión plataforma
    @split_id
);
```

### Procesar Reembolso
```sql
CALL sp_procesar_reembolso(
    :transaccion_id,
    :monto_reembolso,       -- NULL para total
    'solicitud_cliente',    -- motivo
    :aprobado_por,
    FALSE,                  -- como crédito en tienda
    @reembolso_id,
    @resultado
);
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_actualizar_balance_wallet` | AFTER INSERT (movimiento) | Actualiza saldo |
| `trg_log_transaccion` | AFTER UPDATE | Registra cambios |
| `trg_notificar_pago` | AFTER INSERT | Dispara notificación |

## Eventos Programados

| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_renovar_suscripciones` | Diario 00:01 | Renueva suscripciones vencidas |
| `evento_verificar_pagos_pendientes` | Cada hora | Verifica estado en pasarela |
| `evento_liquidacion_vendedores` | Semanal | Genera liquidaciones |
| `evento_limpiar_tokens_expirados` | Diario | Elimina tokens vencidos |

## Estados de Transacción

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Iniciada, esperando procesamiento |
| `procesando` | En proceso con pasarela |
| `completada` | Pago exitoso |
| `fallida` | Error en procesamiento |
| `cancelada` | Cancelada antes de procesar |
| `reembolsada` | Dinero devuelto |
| `disputada` | En proceso de disputa |

## Estados de Suscripción

| Estado | Descripción |
|--------|-------------|
| `prueba` | En período de prueba gratuito |
| `activa` | Suscripción vigente |
| `pausada` | Temporalmente pausada |
| `cancelada` | Cancelada por cliente |
| `vencida` | Pago fallido, en gracia |
| `expirada` | Terminada definitivamente |

## Configuración de Pasarela

```sql
-- Registrar pasarela
INSERT INTO pagos_pasarelas (
    codigo, nombre, tipo, es_activa, orden_prioridad
) VALUES (
    'stripe', 'Stripe', 'tarjeta', TRUE, 1
);

-- Credenciales por ambiente
INSERT INTO pagos_pasarelas_credenciales (
    pasarela_id, empresa_id, ambiente, credenciales
) VALUES (
    :pasarela_id, 
    :empresa_id,
    'sandbox',
    JSON_OBJECT(
        'public_key', 'pk_test_xxx',
        'secret_key', 'sk_test_xxx',
        'webhook_secret', 'whsec_xxx'
    )
);

-- Comisiones
INSERT INTO pagos_pasarelas_comisiones (
    pasarela_id, tipo_comision, valor, es_porcentaje
) VALUES 
    (:pasarela_id, 'transaccion', 2.9, TRUE),
    (:pasarela_id, 'fijo', 0.30, FALSE);
```

## Planes de Suscripción

```sql
INSERT INTO pagos_planes_suscripcion (
    codigo, nombre, precio, moneda, 
    ciclo, intervalo_ciclo, dias_prueba
) VALUES 
    ('premium_mensual', 'Premium Mensual', 199.00, 'HNL', 'mensual', 1, 7),
    ('premium_anual', 'Premium Anual', 1999.00, 'HNL', 'anual', 1, 14);
```

## Seguridad

### Tokenización
- Tarjetas nunca se almacenan completas
- Solo últimos 4 dígitos visibles
- Token de pasarela para cobros
- CVV nunca almacenado

### PCI DSS Compliance
- Datos sensibles encriptados
- Logs sin datos de tarjeta
- Acceso restringido a credenciales

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 5 | Métodos de pago del cliente |
| Fase 6 | Pagos de pedidos |
| Fase 8 | Notificaciones de pago |
| Fase 12 | Pago de envío |

## Consideraciones de Rendimiento

1. **Índices en estado**: Filtros frecuentes
2. **Particionado por fecha**: Transacciones históricas
3. **Caché de configuración**: Pasarelas activas
4. **Cola de webhooks**: Procesamiento asíncrono

## Verificación Post-Instalación

```sql
-- Verificar tablas de pagos
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND table_name LIKE 'pagos_%';

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name LIKE 'sp_%pago%' OR Name LIKE 'sp_%suscripcion%';

-- Verificar eventos
SELECT event_name, status FROM information_schema.events 
WHERE event_schema = 'tienda_virtual'
AND event_name LIKE 'evento_%pago%' OR event_name LIKE 'evento_%suscripcion%';
```

## Archivo SQL

- **Nombre**: `11-fase-(24-01-2026)-v1-7892.sql`
- **Líneas**: ~2,019
- **Dependencias**: Fases 1-10 instaladas
- **Script verificación**: `11-fase-verificacion.sql`
