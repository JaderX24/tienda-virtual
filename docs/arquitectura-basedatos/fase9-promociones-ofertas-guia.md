# Fase 9: Promociones y Ofertas Avanzadas

## Descripción General

La Fase 9 implementa un sistema completo de promociones estilo Amazon: flash sales, bundles, descuentos por tiempo/volumen, ofertas especiales, campañas y precios segmentados.

## Características Implementadas

### 1. Campañas Promocionales
- **Tipos de campaña**:
  - Temporada (verano, invierno)
  - Evento (Black Friday, Cyber Monday)
  - Liquidación
  - Lanzamiento de producto
  - Aniversario
  - Fechas especiales (Navidad, San Valentín, Día de la Madre)
- Presupuesto máximo y tracking de uso
- Métricas: ventas, pedidos, descuentos otorgados
- Diseño visual: colores, banners desktop y móvil

### 2. Flash Sales (Ventas Relámpago)
- Duración limitada (horas)
- Stock limitado por oferta
- Contador regresivo en tiempo real
- Precio especial vs precio normal
- Límite por cliente
- Barra de progreso (vendidos/disponibles)

### 3. Bundles y Combos
- Agrupación de productos
- **Tipos de precio**:
  - Fijo (precio del bundle)
  - Descuento porcentaje
  - Descuento monto
- Productos obligatorios y opcionales
- Ahorro mostrado al cliente
- Stock sincronizado con componentes

### 4. Descuentos por Volumen
- "Compra más, ahorra más"
- Escalas configurables:
  - 2-4 unidades: 5% descuento
  - 5-9 unidades: 10% descuento
  - 10+ unidades: 15% descuento
- Por producto o categoría
- Acumulable o exclusivo

### 5. Ofertas Especiales
- **Tipos de oferta**:
  - 2x1 (segundo gratis)
  - 3x2 (tercero gratis)
  - Regalo con compra
  - Segundo a mitad de precio
  - Envío gratis por monto
- Productos participantes configurables
- Productos regalo (si aplica)

### 6. Promociones Generales
- Reglas complejas con condiciones
- **Tipos**:
  - Descuento en carrito
  - Descuento en producto
  - Envío gratis
  - Puntos extra
- Condiciones: monto mínimo, cantidad mínima, categoría, cliente
- Prioridad y acumulabilidad

### 7. Banners Publicitarios
- Posiciones: home_hero, home_secundario, categoría, producto, checkout
- Desktop y móvil diferenciados
- URL de destino con tracking
- Impresiones y clics registrados
- A/B testing incorporado

### 8. Precios por Segmento
- Precios especiales por nivel de cliente
- Descuentos para mayoristas
- Precios para empleados
- Precios por membresía premium

## Estructura de Tablas

```
campanas
├── campanas_metricas
promociones
├── promociones_reglas
├── promociones_productos
├── promociones_productos_excluidos
├── promociones_categorias
├── promociones_segmentos
└── promociones_uso_historial
flash_sales
├── flash_sales_productos
bundles
├── bundles_items
descuentos_volumen
ofertas_especiales
├── ofertas_especiales_productos
banners
precios_segmento
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_calcular_descuentos_carrito` | Aplica todas las promociones válidas |
| `sp_obtener_flash_sales_activas` | Lista flash sales en curso |
| `sp_verificar_bundle_stock` | Valida disponibilidad de bundle |
| `sp_calcular_precio_volumen` | Calcula precio por cantidad |
| `sp_aplicar_oferta_especial` | Procesa 2x1, 3x2, etc. |
| `sp_registrar_uso_promocion` | Tracking de uso |
| `sp_obtener_banners_posicion` | Banners para una posición |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_promociones_activas` | Promociones vigentes |
| `vista_flash_sales_activas` | Flash sales en curso |
| `vista_bundles_disponibles` | Bundles con stock |
| `vista_productos_en_oferta` | Todos los productos con descuento |
| `vista_banners_activos` | Banners por posición |
| `vista_rendimiento_campanas` | ROI de campañas |

## Motor de Promociones

### Orden de Aplicación
1. Descuentos por volumen (se aplican primero)
2. Promociones de producto específicas
3. Ofertas especiales (2x1, 3x2)
4. Promociones de carrito
5. Cupón del cliente
6. Descuento por membresía/segmento

### Reglas de Acumulación
```sql
-- Verificar si promociones son acumulables
IF promocion1.es_acumulable = TRUE 
   AND promocion2.es_acumulable = TRUE 
   AND promocion1.prioridad != promocion2.prioridad
THEN
    aplicar_ambas();
ELSE
    aplicar_mejor_descuento();
END IF;
```

## Casos de Uso

### Crear Flash Sale
```sql
INSERT INTO flash_sales (
    nombre, fecha_inicio, fecha_fin, 
    es_activa, mostrar_contador
) VALUES (
    'Flash Friday', 
    '2026-01-24 18:00:00', 
    '2026-01-24 23:59:59',
    TRUE, TRUE
);

-- Agregar productos
INSERT INTO flash_sales_productos (
    flash_sale_id, producto_id, variante_id,
    precio_flash, precio_original, stock_flash, limite_por_cliente
) VALUES 
    (:flash_id, 100, NULL, 299.00, 599.00, 50, 2),
    (:flash_id, 101, NULL, 149.00, 299.00, 100, 3);
```

### Calcular Descuentos del Carrito
```sql
CALL sp_calcular_descuentos_carrito(
    :carrito_id,
    @descuento_productos,
    @descuento_carrito,
    @envio_gratis,
    @puntos_extra,
    @promociones_aplicadas  -- JSON con detalle
);

SELECT @descuento_productos, @descuento_carrito, @envio_gratis;
```

### Obtener Productos en Flash Sale
```sql
SELECT 
    p.nombre,
    fsp.precio_original,
    fsp.precio_flash,
    ROUND((1 - fsp.precio_flash / fsp.precio_original) * 100) AS porcentaje_descuento,
    fsp.stock_flash - fsp.vendidos AS stock_disponible,
    ROUND(fsp.vendidos / fsp.stock_flash * 100) AS porcentaje_vendido
FROM flash_sales_productos fsp
INNER JOIN catalogo_productos p ON fsp.producto_id = p.id
INNER JOIN flash_sales fs ON fsp.flash_sale_id = fs.id
WHERE fs.es_activa = TRUE
AND NOW() BETWEEN fs.fecha_inicio AND fs.fecha_fin
AND fsp.vendidos < fsp.stock_flash;
```

### Aplicar Descuento por Volumen
```sql
-- Obtener descuento según cantidad
SELECT descuento_porcentaje
FROM descuentos_volumen
WHERE (producto_id = :producto_id OR categoria_id = :categoria_id)
AND :cantidad >= cantidad_minima
AND (:cantidad <= cantidad_maxima OR cantidad_maxima IS NULL)
AND es_activo = TRUE
AND NOW() BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
ORDER BY cantidad_minima DESC
LIMIT 1;
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_actualizar_vendidos_flash` | AFTER INSERT (pedido_item) | Incrementa contador flash sale |
| `trg_validar_stock_bundle` | BEFORE INSERT (carrito_item) | Valida stock de componentes |
| `trg_registrar_impresion_banner` | Automático | Cuenta vistas de banner |
| `trg_actualizar_metricas_campana` | AFTER INSERT (pedido) | Suma a métricas de campaña |

## Eventos Programados

| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_activar_flash_sales` | Cada minuto | Activa/desactiva por horario |
| `evento_notificar_flash_pronto` | Cada hora | Notifica flash sales próximas |
| `evento_cerrar_campanas` | Diario | Cierra campañas vencidas |
| `evento_calcular_roi_campanas` | Diario | Actualiza ROI |

## Configuración de Bundle

```sql
-- Ejemplo: Bundle "Gaming Setup"
INSERT INTO bundles (
    codigo, nombre, slug, tipo_precio, 
    precio_fijo, porcentaje_descuento
) VALUES (
    'GAMING-SETUP-2026',
    'Setup Gamer Completo',
    'setup-gamer-completo',
    'descuento_porcentaje',
    NULL,
    25.00  -- 25% de descuento
);

-- Items del bundle
INSERT INTO bundles_items (
    bundle_id, producto_id, cantidad, 
    es_obligatorio, precio_individual
) VALUES 
    (:bundle_id, 10, 1, TRUE, 15000.00),   -- Monitor
    (:bundle_id, 20, 1, TRUE, 8000.00),    -- Teclado
    (:bundle_id, 30, 1, TRUE, 3000.00),    -- Mouse
    (:bundle_id, 40, 1, FALSE, 2000.00);   -- Mousepad (opcional)
```

## Reglas de Promoción (JSON)

```json
{
    "condiciones": [
        {"tipo": "monto_minimo", "valor": 500},
        {"tipo": "categoria", "valor": [1, 2, 3]},
        {"tipo": "cliente_nivel", "valor": ["oro", "platino"]}
    ],
    "acciones": [
        {"tipo": "descuento_porcentaje", "valor": 15},
        {"tipo": "envio_gratis", "valor": true}
    ],
    "es_acumulable": false,
    "prioridad": 10
}
```

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 4 | Promociones aplican a productos |
| Fase 5 | Precios por segmento de cliente |
| Fase 6 | Descuentos se aplican en checkout |
| Fase 8 | Notificaciones de promociones |
| Fase 10 | Búsqueda filtra por "en oferta" |

## Consideraciones de Rendimiento

1. **Índices en fechas**: Consultas por vigencia
2. **Caché de promociones activas**: Evita recalcular
3. **Precálculo de precios**: Para listados
4. **Limitar promociones acumulables**: Máximo 3

## Verificación Post-Instalación

```sql
-- Verificar tablas de promociones
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND (table_name LIKE 'promociones%' 
     OR table_name LIKE 'flash_sales%' 
     OR table_name LIKE 'bundles%'
     OR table_name LIKE 'campanas%');

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name LIKE 'sp_%promocion%' OR Name LIKE 'sp_%descuento%';
```

## Archivo SQL

- **Nombre**: `9-fase-(24-01-2026)-v1-3952.sql`
- **Líneas**: ~1,231
- **Dependencias**: Fases 1-8 instaladas
- **Script verificación**: `9-fase-verificacion.sql`
