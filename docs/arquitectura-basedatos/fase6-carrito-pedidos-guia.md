# Fase 6: Carrito y Pedidos (Proceso de Compra Completo)

## Descripción General

La Fase 6 implementa el flujo completo de compra: carrito persistente, cupones de descuento, pedidos con estados, historial de cambios, direcciones de envío/facturación, cálculos de impuestos y sistema de devoluciones.

## Características Implementadas

### 1. Sistema de Cupones
- **Tipos de descuento**:
  - Porcentaje
  - Monto fijo
  - Envío gratis
  - Compra X lleva Y
  - Segundo a descuento
- Límites de uso (total y por cliente)
- Monto mínimo de compra
- Aplicabilidad: todo, categorías, productos, marcas, primera compra
- Exclusiones configurables
- Cupones acumulables con prioridad

### 2. Carrito de Compras
- Persistente por cliente (logueado) o sesión (invitado)
- Múltiples items con cantidad
- Cupón aplicado al carrito
- Reserva de stock temporal
- Conversión de carrito invitado al registrarse
- Recordatorios de carrito abandonado

### 3. Pedidos
- Código único auto-generado
- **Estados del pedido**:
  - pendiente_pago
  - pagado
  - procesando
  - enviado
  - entregado
  - cancelado
  - reembolsado
- Snapshot de precios al momento de compra
- Notas del cliente y notas internas
- Facturación con datos fiscales

### 4. Items del Pedido
- Producto y variante específica
- Precio unitario fijado (snapshot)
- Descuentos aplicados por item
- Impuestos calculados
- Estado individual por item

### 5. Direcciones del Pedido
- Dirección de envío copiada del cliente
- Dirección de facturación separada
- Datos inmutables (histórico)

### 6. Historial de Estados
- Registro de cada cambio de estado
- Usuario que realizó el cambio
- Comentarios opcionales
- Timestamps precisos

### 7. Cálculos Financieros
- Subtotal de productos
- Descuentos (cupones + promociones)
- Impuestos (ISV 15%)
- Costo de envío
- Total final
- Propinas opcionales

### 8. Devoluciones y Reembolsos
- Solicitud con motivo
- Aprobación administrativa
- Estados: solicitada, aprobada, rechazada, completada
- Reembolso total o parcial
- Crédito en tienda o devolución a método de pago

## Estructura de Tablas

```
cupones
├── cupones_uso (historial de uso)
carritos
├── carritos_items
pedidos
├── pedidos_items
├── pedidos_direcciones
├── pedidos_historial_estados
├── pedidos_notas
├── pedidos_envios
└── pedidos_pagos
devoluciones
├── devoluciones_items
└── devoluciones_historial
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_agregar_al_carrito` | Agrega producto con validación de stock |
| `sp_aplicar_cupon` | Valida y aplica cupón al carrito |
| `sp_crear_pedido` | Convierte carrito en pedido |
| `sp_cambiar_estado_pedido` | Cambia estado con historial |
| `sp_calcular_totales` | Recalcula subtotal, impuestos, total |
| `sp_procesar_devolucion` | Gestiona solicitud de devolución |
| `sp_cancelar_pedido` | Cancela pedido y libera stock |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_carritos_activos` | Carritos con items pendientes |
| `vista_carritos_abandonados` | Carritos >24h sin actividad |
| `vista_pedidos_pendientes` | Pedidos por procesar |
| `vista_pedidos_hoy` | Pedidos del día actual |
| `vista_ventas_por_estado` | Resumen de pedidos por estado |
| `vista_devoluciones_pendientes` | Solicitudes por aprobar |

## Flujo de Compra

```
┌─────────────┐
│   Carrito   │
│  (activo)   │
└──────┬──────┘
       │ Checkout
       ▼
┌─────────────┐
│   Pedido    │
│(pend_pago)  │
└──────┬──────┘
       │ Pago exitoso
       ▼
┌─────────────┐
│   Pedido    │
│  (pagado)   │
└──────┬──────┘
       │ Preparación
       ▼
┌─────────────┐
│   Pedido    │
│(procesando) │
└──────┬──────┘
       │ Despacho
       ▼
┌─────────────┐
│   Pedido    │
│  (enviado)  │
└──────┬──────┘
       │ Entrega confirmada
       ▼
┌─────────────┐
│   Pedido    │
│ (entregado) │
└─────────────┘
```

## Casos de Uso

### Agregar al Carrito
```sql
CALL sp_agregar_al_carrito(
    :cliente_id,      -- NULL si invitado
    :sesion_id,       -- ID de sesión para invitados
    :producto_id,
    :variante_id,
    :cantidad
);
```

### Aplicar Cupón
```sql
CALL sp_aplicar_cupon(
    :carrito_id,
    'DESCUENTO20',
    :cliente_id
);
```

### Crear Pedido desde Carrito
```sql
CALL sp_crear_pedido(
    :carrito_id,
    :direccion_envio_id,
    :direccion_facturacion_id,
    :metodo_pago_id,
    :notas_cliente
);
```

### Cambiar Estado de Pedido
```sql
CALL sp_cambiar_estado_pedido(
    :pedido_id,
    'enviado',
    :usuario_id,
    'Enviado por DHL. Tracking: ABC123'
);
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_generar_codigo_pedido` | BEFORE INSERT | Auto-genera código único |
| `trg_reservar_stock` | AFTER INSERT (carrito_item) | Reserva stock temporalmente |
| `trg_liberar_stock` | AFTER DELETE (carrito_item) | Libera stock reservado |
| `trg_descontar_stock` | AFTER UPDATE (pedido→pagado) | Descuenta stock definitivo |
| `trg_incrementar_uso_cupon` | AFTER INSERT (pedido) | Cuenta uso de cupón |
| `trg_registrar_historial` | AFTER UPDATE (pedido.estado) | Guarda en historial |

## Validaciones de Cupón

```sql
-- Validaciones automáticas en sp_aplicar_cupon:
-- 1. Cupón existe y está activo
-- 2. Dentro de fechas de vigencia
-- 3. No excede uso máximo total
-- 4. No excede uso máximo por cliente
-- 5. Monto mínimo de compra cumplido
-- 6. Productos del carrito son aplicables
-- 7. No hay productos excluidos
```

## Cálculo de Totales

```sql
-- Fórmula de cálculo:
subtotal = SUM(items.precio_unitario * items.cantidad)
descuento = calcular_descuento(subtotal, cupón, promociones)
subtotal_con_descuento = subtotal - descuento
impuestos = subtotal_con_descuento * 0.15  -- ISV Honduras
envio = calcular_envio(peso, zona, método)
total = subtotal_con_descuento + impuestos + envio
```

## Estados de Devolución

| Estado | Descripción |
|--------|-------------|
| `solicitada` | Cliente solicita devolución |
| `aprobada` | Administrador aprueba |
| `rechazada` | No cumple políticas |
| `en_transito` | Producto regresando al almacén |
| `recibida` | Producto recibido y verificado |
| `reembolsada` | Dinero devuelto al cliente |
| `credito_emitido` | Crédito en tienda otorgado |

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 4 | Items referencian productos/variantes |
| Fase 5 | Pedidos pertenecen a clientes |
| Fase 7 | Reseñas después de compra verificada |
| Fase 8 | Notificaciones de estado de pedido |
| Fase 9 | Promociones aplicadas al checkout |
| Fase 11 | Pagos procesados |
| Fase 12 | Envíos y tracking |

## Consideraciones de Rendimiento

1. **Índice en estado**: Filtros frecuentes por estado
2. **Snapshot de precios**: No depende de cambios futuros
3. **Reserva de stock**: Evita sobre-venta
4. **Caché de totales**: Evita recalcular en cada vista

## Verificación Post-Instalación

```sql
-- Verificar tablas de pedidos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND (table_name LIKE 'pedidos%' OR table_name LIKE 'carritos%' OR table_name LIKE 'cupones%');

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name IN ('sp_crear_pedido', 'sp_agregar_al_carrito', 'sp_aplicar_cupon');
```

## Archivo SQL

- **Nombre**: `6-fase-(24-01-2026)-v1-4827.sql`
- **Líneas**: ~1,584
- **Dependencias**: Fases 1-5 instaladas
- **Script verificación**: `6-fase-verificacion.sql`
