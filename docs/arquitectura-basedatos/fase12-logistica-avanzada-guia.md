# Fase 12: Logística Avanzada

## Descripción General

La Fase 12 implementa un sistema completo de logística con gestión multi-almacén, zonas de cobertura, transportistas, vehículos, rutas de entrega optimizadas, tracking en tiempo real y prueba de entrega digital.

## Características Implementadas

### 1. Configuración de Logística
- Parámetros globales del sistema
- Distancia máxima de entrega
- Intentos máximos por entrega
- Peso máximo por paquete
- Factor de peso volumétrico
- Horarios de corte

### 2. Gestión de Almacenes
- Múltiples almacenes por empresa
- **Tipos**: principal, secundario, dropshipping, cross_docking
- Ubicación geográfica (latitud/longitud)
- Radio de cobertura configurable
- Horarios de operación por día
- Ubicaciones internas (pasillos, estantes)
- Capacidad y ocupación

### 3. Stock Multi-almacén
- Stock por producto/variante/almacén
- Stock mínimo con alertas
- Stock reservado (pedidos pendientes)
- Movimientos de inventario con trazabilidad
- **Tipos de movimiento**: entrada, salida, transferencia, ajuste, devolución

### 4. Zonas de Cobertura
- Zonas geográficas definidas
- **Tipos**: urbana, suburbana, rural, remota
- Cobertura por departamento/municipio
- Códigos postales asociados
- Tiempos de entrega estimados por zona

### 5. Tarifas de Envío
- Tarifas por zona y tipo de servicio
- **Servicios**: estandar, express, mismo_dia, programado, economia
- Tarifa base + tarifa por kg
- Tarifas por rango de peso
- Tarifas especiales (frágil, refrigerado, peligroso)
- Factor dimensional para peso volumétrico

### 6. Gestión de Transportistas
- Registro de transportistas (internos/externos)
- Documentos requeridos (licencia, ID, seguro)
- Zonas de cobertura asignadas
- Horarios de disponibilidad
- Calificación y rendimiento
- Capacidad de carga

### 7. Vehículos
- Flota de vehículos
- **Tipos**: motocicleta, automovil, camioneta, camion, bicicleta
- Capacidad de peso y volumen
- Mantenimientos programados
- Disponibilidad por estado

### 8. Paquetes y Etiquetas
- Múltiples paquetes por envío
- Dimensiones y peso por paquete
- Peso volumétrico calculado
- Etiquetas de envío (código de barras/QR)
- Formatos: PDF, ZPL, PNG

### 9. Tracking en Tiempo Real
- Eventos de tracking por envío
- Ubicación GPS de cada evento
- **Estados**: recibido, procesando, en_transito, en_reparto, entregado, etc.
- Notificaciones automáticas
- Historial completo

### 10. Rutas de Entrega
- Planificación de rutas diarias
- Paradas ordenadas por secuencia
- Optimización de ruta
- Asignación de transportista y vehículo
- Estados: planificada, en_progreso, completada, cancelada

### 11. Entregas
- Intentos de entrega registrados
- Firma digital de recepción
- Fotos de prueba de entrega
- Motivos de no entrega
- Reprogramación automática

## Estructura de Tablas

```
logistica_configuracion
logistica_almacenes
├── logistica_almacenes_horarios
├── logistica_almacenes_ubicaciones
├── logistica_almacenes_stock
└── logistica_almacenes_movimientos
logistica_zonas
├── logistica_zonas_cobertura
└── logistica_zonas_cobertura_codigos
logistica_tarifas_zonas
logistica_tarifas_peso
logistica_tarifas_especiales
logistica_transportistas
├── logistica_transportistas_horarios
├── logistica_transportistas_documentos
└── logistica_transportistas_zonas
logistica_vehiculos
├── logistica_vehiculos_mantenimiento
logistica_envios_paquetes
logistica_envios_etiquetas
logistica_tracking_eventos
logistica_rutas
├── logistica_rutas_paradas
logistica_entregas_intentos
logistica_entregas_firmas
logistica_entregas_fotos
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_asignar_almacen_pedido` | Selecciona almacén óptimo |
| `sp_calcular_costo_envio` | Calcula tarifa de envío |
| `sp_crear_ruta_entrega` | Crea ruta con paradas |
| `sp_actualizar_tracking` | Registra evento de tracking |
| `sp_transferir_inventario` | Mueve stock entre almacenes |
| `sp_asignar_transportista` | Asigna transportista a ruta |
| `sp_completar_entrega` | Registra entrega exitosa |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_almacenes_stock` | Stock actual por almacén |
| `vista_envios_pendientes` | Envíos por procesar |
| `vista_rutas_activas` | Rutas en progreso |
| `vista_entregas_hoy` | Entregas programadas hoy |
| `vista_rendimiento_transportistas` | KPIs de transportistas |
| `vista_cobertura_zonas` | Cobertura geográfica |

## Flujo de Envío

```
┌─────────────┐
│   Pedido    │
│   pagado    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Asignar    │
│  almacén    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Picking   │
│  (preparar) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Empaquetar │
│  + etiqueta │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Asignar a  │
│    ruta     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ En tránsito │
│  (tracking) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  En reparto │
│   (último   │
│    tramo)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Entregado  │
│ (firma/foto)│
└─────────────┘
```

## Casos de Uso

### Asignar Almacén a Pedido
```sql
CALL sp_asignar_almacen_pedido(
    :pedido_id,
    @almacen_id,
    @mensaje
);

SELECT @almacen_id, @mensaje;
-- Selecciona el almacén más cercano con stock disponible
```

### Calcular Costo de Envío
```sql
CALL sp_calcular_costo_envio(
    :empresa_id,
    :zona_destino_id,
    2.5,                    -- peso en kg
    30, 20, 15,             -- dimensiones cm
    'express',              -- tipo servicio
    FALSE,                  -- es frágil
    @costo_envio,
    @dias_estimados,
    @mensaje
);

SELECT @costo_envio, @dias_estimados;
```

### Crear Ruta de Entrega
```sql
CALL sp_crear_ruta_entrega(
    :empresa_id,
    :transportista_id,
    :vehiculo_id,
    '2026-01-25',           -- fecha
    JSON_ARRAY(
        JSON_OBJECT('envio_id', 101, 'orden', 1),
        JSON_OBJECT('envio_id', 102, 'orden', 2),
        JSON_OBJECT('envio_id', 103, 'orden', 3)
    ),
    @ruta_id
);
```

### Actualizar Tracking
```sql
CALL sp_actualizar_tracking(
    :envio_id,
    'en_transito',
    'Paquete en camino a destino',
    14.0723,                -- latitud
    -87.1921,               -- longitud
    'Tegucigalpa, FM',
    :usuario_id
);
```

### Transferir Inventario
```sql
CALL sp_transferir_inventario(
    :producto_id,
    :variante_id,
    :almacen_origen_id,
    :almacen_destino_id,
    50,                     -- cantidad
    'Reabastecimiento sucursal',
    :usuario_id,
    @movimiento_id,
    @resultado
);
```

### Completar Entrega
```sql
CALL sp_completar_entrega(
    :envio_id,
    'Juan Pérez',           -- quien recibe
    'familiar',             -- relación
    :firma_base64,
    :foto_url,
    'Entregado sin novedad',
    :transportista_id
);
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_log_movimiento_inventario` | AFTER INSERT | Registra movimiento |
| `trg_actualizar_stock_almacen` | AFTER UPDATE | Actualiza totales |

## Eventos Programados

| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_notificar_entregas_retrasadas` | Cada hora | Alerta retrasos |
| `evento_limpiar_tracking_antiguo` | Mensual | Archiva tracking >1 año |

## Zonas de Honduras (Datos Iniciales)

| Código | Nombre | Tipo | Tiempo Entrega |
|--------|--------|------|----------------|
| TGU | Tegucigalpa Urbano | urbana | 1-2 días |
| SPS | San Pedro Sula Urbano | urbana | 1-2 días |
| FM | Francisco Morazán | suburbana | 2-3 días |
| CR | Cortés | suburbana | 2-3 días |
| AT | Atlántida | suburbana | 2-4 días |
| NORTE | Zona Norte | rural | 3-5 días |
| SUR | Zona Sur | rural | 3-5 días |
| REMOTO | Zonas Remotas | remota | 5-7 días |

## Tarifas de Ejemplo

| Zona | Servicio | Base | Por Kg | Días |
|------|----------|------|--------|------|
| TGU | Estándar | L 45 | L 8 | 1-2 |
| TGU | Express | L 85 | L 15 | Mismo día |
| SPS | Estándar | L 55 | L 10 | 1-2 |
| FM | Estándar | L 65 | L 12 | 2-3 |
| NORTE | Estándar | L 95 | L 18 | 3-5 |
| REMOTO | Estándar | L 150 | L 25 | 5-7 |

## Cálculo de Peso Volumétrico

```sql
-- Fórmula: (largo × ancho × alto) / factor
-- Factor estándar: 5000

peso_volumetrico = (largo_cm * ancho_cm * alto_cm) / 5000;
peso_facturable = MAX(peso_real, peso_volumetrico);
```

## Estados de Tracking

| Estado | Descripción |
|--------|-------------|
| `recibido` | Pedido recibido en almacén |
| `procesando` | En preparación (picking) |
| `empacado` | Listo para envío |
| `recolectado` | Recogido por transportista |
| `en_transito` | En camino (entre ciudades) |
| `en_centro_dist` | En centro de distribución local |
| `en_reparto` | En vehículo de última milla |
| `intento_entrega` | Se intentó entregar |
| `entregado` | Entrega exitosa |
| `devuelto` | Devuelto al remitente |

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 4 | Stock de productos en almacenes |
| Fase 5 | Direcciones de entrega del cliente |
| Fase 6 | Envíos de pedidos |
| Fase 8 | Notificaciones de tracking |
| Fase 11 | Cobro de envío en pago |

## Consideraciones de Rendimiento

1. **Índices geoespaciales**: Búsqueda por ubicación
2. **Particionado tracking**: Por fecha
3. **Caché de tarifas**: Por zona/servicio
4. **Cola de notificaciones**: Tracking asíncrono

## Verificación Post-Instalación

```sql
-- Ejecutar script de verificación completo
SOURCE 12-fase-verificacion.sql;

-- O verificar manualmente:

-- Tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND table_name LIKE 'logistica_%';

-- Procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name LIKE 'sp_%almacen%' OR Name LIKE 'sp_%envio%' OR Name LIKE 'sp_%ruta%';

-- Vistas
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'tienda_virtual'
AND (table_name LIKE 'vista_almacenes%' OR table_name LIKE 'vista_envios%' 
     OR table_name LIKE 'vista_rutas%' OR table_name LIKE 'vista_entregas%');

-- Zonas configuradas
SELECT codigo, nombre, tipo FROM logistica_zonas;

-- Tarifas configuradas
SELECT z.nombre, tz.tipo_servicio, tz.tarifa_base
FROM logistica_tarifas_zonas tz
INNER JOIN logistica_zonas z ON tz.zona_id = z.id;
```

## Archivo SQL

- **Nombre**: `12-fase-(24-01-2026)-v1-8347.sql`
- **Líneas**: ~2,283
- **Dependencias**: Fases 1-11 instaladas
- **Script verificación**: `12-fase-verificacion.sql`
