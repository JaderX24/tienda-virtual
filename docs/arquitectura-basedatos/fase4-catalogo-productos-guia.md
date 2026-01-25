# Fase 4: Catálogo de Productos (Escalable - Estilo Amazon)

## Descripción General

La Fase 4 implementa un catálogo de productos empresarial con capacidades avanzadas: variantes, atributos dinámicos, precios multi-moneda, inventario multi-almacén, y optimización SEO completa.

## Características Implementadas

### 1. Marcas y Fabricantes
- Gestión completa de marcas con logo y sitio web
- SEO optimizado (meta título, meta descripción)
- Marcas destacadas y ordenamiento personalizado
- Soporte global o por empresa

### 2. Categorías Jerárquicas
- **Multinivel ilimitado** con ruta completa calculada
- Imágenes, iconos y banners por categoría
- Visibilidad en menú configurable
- Templates de atributos heredables
- SEO completo con palabras clave

### 3. Atributos Dinámicos
- Grupos de atributos reutilizables
- Tipos: texto, número, select, multiselect, color, tamaño, booleano
- Atributos requeridos, filtrables y comparables
- Valores con orden personalizado

### 4. Productos Principales
- Código SKU único por variante
- Código de barras (EAN, UPC, ISBN)
- Precios: normal, comparación, costo
- Estados: borrador, activo, pausado, agotado, descontinuado
- Peso y dimensiones para cálculo de envío
- SEO completo con URL amigable (slug)

### 5. Variantes de Producto
- Múltiples variantes por producto (talla, color, etc.)
- Precio, stock e imágenes independientes por variante
- Código SKU único por variante
- Estado individual por variante

### 6. Sistema de Precios
- Precios multi-moneda
- Precios por segmento de cliente
- Historial de cambios de precio
- Precio de comparación (tachado)

### 7. Inventario Multi-almacén
- Stock por almacén y ubicación
- Stock mínimo con alertas
- Reservas de stock (carritos activos)
- Historial de movimientos

### 8. Multimedia
- Imágenes múltiples con orden
- Videos de producto
- Imagen principal destacada
- Alt text para SEO

## Estructura de Tablas

```
catalogo_marcas
catalogo_categorias (jerárquica)
catalogo_categorias_atributos
catalogo_atributos_grupos
catalogo_atributos
catalogo_atributos_valores
catalogo_productos
├── catalogo_productos_variantes
├── catalogo_productos_atributos
├── catalogo_productos_categorias
├── catalogo_productos_imagenes
├── catalogo_productos_videos
├── catalogo_productos_precios
├── catalogo_productos_precios_historial
├── catalogo_productos_relacionados
└── catalogo_productos_seo
catalogo_inventario
catalogo_inventario_movimientos
catalogo_etiquetas
catalogo_productos_etiquetas
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_actualizar_stock` | Actualiza stock con registro de movimiento |
| `sp_calcular_precio_final` | Calcula precio con descuentos aplicables |
| `sp_obtener_productos_categoria` | Lista productos con filtros |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_productos_activos` | Productos publicados con stock |
| `vista_productos_agotados` | Productos sin stock disponible |
| `vista_categorias_arbol` | Árbol completo de categorías |
| `vista_inventario_bajo` | Productos bajo stock mínimo |

## Casos de Uso

### Obtener Productos por Categoría
```sql
CALL sp_obtener_productos_categoria(
    :categoria_id,
    :empresa_id,
    :pagina,
    :por_pagina,
    :ordenar_por
);
```

### Actualizar Stock
```sql
CALL sp_actualizar_stock(
    :producto_id,
    :variante_id,
    :almacen_id,
    :cantidad,
    :tipo_movimiento,  -- 'entrada', 'salida', 'ajuste'
    :referencia,
    :usuario_id
);
```

### Buscar Productos con Filtros
```sql
SELECT p.*, v.precio, v.stock_disponible
FROM catalogo_productos p
INNER JOIN catalogo_productos_variantes v ON p.id = v.producto_id
WHERE p.estado = 'activo'
AND p.id IN (
    SELECT producto_id FROM catalogo_productos_categorias 
    WHERE categoria_id = :categoria_id
)
AND v.precio BETWEEN :precio_min AND :precio_max
ORDER BY p.es_destacado DESC, v.precio ASC;
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_producto_slug` | BEFORE INSERT | Genera slug automático |
| `trg_stock_alerta` | AFTER UPDATE | Notifica stock bajo |
| `trg_precio_historial` | AFTER UPDATE | Registra cambio de precio |

## Índices Optimizados

### Productos
- `idx_sku` - Búsqueda por SKU
- `idx_slug` - URL amigables
- `idx_estado` - Filtro por estado
- `idx_marca` - Filtro por marca
- `idx_precio` - Ordenamiento por precio
- `FULLTEXT idx_busqueda` - Búsqueda de texto completo

### Categorías
- `idx_padre` - Consultas jerárquicas
- `idx_slug` - URL amigables
- `idx_nivel` - Filtro por nivel

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 2 | Productos pertenecen a empresa |
| Fase 5 | Clientes ven y compran productos |
| Fase 6 | Productos en items de pedido |
| Fase 7 | Reseñas de productos |
| Fase 9 | Promociones aplicadas a productos |
| Fase 10 | Índice de búsqueda de productos |
| Fase 12 | Inventario en almacenes |

## Consideraciones de Rendimiento

1. **Índices FULLTEXT** para búsqueda rápida
2. **Denormalización controlada** en `nombre_completo`
3. **Columnas calculadas** para precio final
4. **Caché de conteos** (total_reseñas, promedio_calificacion)

## Verificación Post-Instalación

```sql
-- Verificar tablas de catálogo
SELECT table_name, table_rows 
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND table_name LIKE 'catalogo_%';

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name LIKE 'sp_%producto%';
```

## Archivo SQL

- **Nombre**: `4-fase-(24-01-2026)-v1-2847.sql`
- **Líneas**: ~1,471
- **Dependencias**: Fases 1, 2 y 3 instaladas
- **Script verificación**: `4-fase-verificacion.sql`
