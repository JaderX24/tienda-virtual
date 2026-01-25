-- ============================================================================
-- TIENDA VIRTUAL - VERIFICACIÓN FASE 4
-- ============================================================================
-- Script para verificar que la Fase 4 se instaló correctamente
-- Ejecutar DESPUÉS de ejecutar el script principal de Fase 4
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- 1. VERIFICAR TABLAS DE CATÁLOGO
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TABLAS FASE 4 - CATÁLOGO ===' AS titulo;

SELECT 
    'catalogo_marcas' AS tabla,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_marcas'

UNION ALL SELECT 
    'catalogo_categorias',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_categorias'

UNION ALL SELECT 
    'catalogo_atributos_grupos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_atributos_grupos'

UNION ALL SELECT 
    'catalogo_atributos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_atributos'

UNION ALL SELECT 
    'catalogo_categorias_atributos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_categorias_atributos'

UNION ALL SELECT 
    'catalogo_productos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos'

UNION ALL SELECT 
    'catalogo_productos_variantes',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_variantes'

UNION ALL SELECT 
    'catalogo_variantes_atributos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_variantes_atributos'

UNION ALL SELECT 
    'catalogo_productos_atributos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_atributos'

UNION ALL SELECT 
    'catalogo_productos_imagenes',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_imagenes'

UNION ALL SELECT 
    'catalogo_productos_videos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_videos'

UNION ALL SELECT 
    'catalogo_productos_precios',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_precios'

UNION ALL SELECT 
    'catalogo_productos_precios_historial',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_precios_historial'

UNION ALL SELECT 
    'catalogo_etiquetas',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_etiquetas'

UNION ALL SELECT 
    'catalogo_productos_etiquetas',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_etiquetas'

UNION ALL SELECT 
    'catalogo_productos_relacionados',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_relacionados'

UNION ALL SELECT 
    'catalogo_productos_categorias',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'catalogo_productos_categorias';

-- ============================================================================
-- 2. VERIFICAR TABLAS DE INVENTARIO
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TABLAS FASE 4 - INVENTARIO ===' AS titulo;

SELECT 
    'inventario_almacenes' AS tabla,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'inventario_almacenes'

UNION ALL SELECT 
    'inventario_stock',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'inventario_stock'

UNION ALL SELECT 
    'inventario_movimientos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'inventario_movimientos'

UNION ALL SELECT 
    'inventario_reservas',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'inventario_reservas';

-- ============================================================================
-- 3. VERIFICAR PROCEDIMIENTOS Y FUNCIONES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE PROCEDIMIENTOS Y FUNCIONES ===' AS titulo;

SELECT 
    'sp_actualizar_ruta_categoria' AS objeto,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_actualizar_ruta_categoria'

UNION ALL SELECT 
    'sp_registrar_movimiento_inventario',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_registrar_movimiento_inventario'

UNION ALL SELECT 
    'fn_obtener_stock_disponible',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'fn_obtener_stock_disponible'

UNION ALL SELECT 
    'sp_generar_slug',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_generar_slug';

-- ============================================================================
-- 4. VERIFICAR VISTAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE VISTAS ===' AS titulo;

SELECT 
    'vista_productos_stock' AS vista,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_productos_stock'

UNION ALL SELECT 
    'vista_productos_bajo_stock',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_productos_bajo_stock'

UNION ALL SELECT 
    'vista_categorias_arbol',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_categorias_arbol'

UNION ALL SELECT 
    'vista_movimientos_recientes',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_movimientos_recientes';

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TRIGGERS ===' AS titulo;

SELECT 
    trigger_name AS disparador,
    event_manipulation AS evento,
    event_object_table AS tabla
FROM information_schema.triggers 
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_producto_insert_categoria',
    'trg_producto_delete_categoria',
    'trg_producto_update_categoria',
    'trg_producto_precio_historial',
    'trg_stock_actualizar_producto'
);

-- ============================================================================
-- 6. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE DATOS INICIALES ===' AS titulo;

SELECT 
    'Grupos de atributos' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 5, '✓ OK', '✗ FALTAN') AS estado
FROM catalogo_atributos_grupos;

SELECT 
    'Atributos' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 8, '✓ OK', '✗ FALTAN') AS estado
FROM catalogo_atributos;

SELECT 
    'Almacenes' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 2, '✓ OK', '✗ FALTAN') AS estado
FROM inventario_almacenes;

SELECT 
    'Categorías principales' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 4, '✓ OK', '✗ FALTAN') AS estado
FROM catalogo_categorias WHERE nivel = 1;

SELECT 
    'Subcategorías' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 6, '✓ OK', '✗ FALTAN') AS estado
FROM catalogo_categorias WHERE nivel = 2;

SELECT 
    'Marcas' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 8, '✓ OK', '✗ FALTAN') AS estado
FROM catalogo_marcas;

SELECT 
    'Etiquetas' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 6, '✓ OK', '✗ FALTAN') AS estado
FROM catalogo_etiquetas;

-- ============================================================================
-- 7. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE MÓDULOS Y PERMISOS ===' AS titulo;

SELECT 
    'Módulos nuevos' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 5, '✓ OK', '✗ FALTAN') AS estado
FROM admin_modulos 
WHERE codigo IN ('catalogo', 'catalogo_categorias', 'catalogo_marcas', 'inventario', 'almacenes');

SELECT 
    'Permisos de catálogo' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 20, '✓ OK', '✗ FALTAN') AS estado
FROM admin_permisos 
WHERE codigo LIKE 'catalogo%' OR codigo LIKE 'inventario%' OR codigo LIKE 'almacenes%';

-- ============================================================================
-- 8. VERIFICAR ESTRUCTURA DE CATEGORÍAS
-- ============================================================================

SELECT '=== ESTRUCTURA DE CATEGORÍAS ===' AS titulo;

SELECT 
    id,
    codigo,
    nombre,
    nivel,
    ruta_completa,
    ruta_ids,
    es_activa
FROM catalogo_categorias
ORDER BY ruta_ids, orden;

-- ============================================================================
-- 9. VERIFICAR ÍNDICES IMPORTANTES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE ÍNDICES CRÍTICOS ===' AS titulo;

SELECT 
    table_name AS tabla,
    index_name AS indice,
    'EXISTE' AS estado
FROM information_schema.statistics
WHERE table_schema = 'tienda_virtual'
AND table_name = 'catalogo_productos'
AND index_name IN ('idx_sku', 'idx_slug', 'idx_categoria', 'idx_marca', 'idx_busqueda')
GROUP BY table_name, index_name;

-- ============================================================================
-- 10. PRUEBA RÁPIDA DE FUNCIONALIDAD
-- ============================================================================

SELECT '=== PRUEBA DE FUNCIONALIDAD ===' AS titulo;

-- Probar función de stock (debe retornar 0 ya que no hay stock)
SELECT 
    'fn_obtener_stock_disponible(1, NULL, NULL)' AS prueba,
    fn_obtener_stock_disponible(1, NULL, NULL) AS resultado,
    'Esperado: 0' AS esperado;

-- Probar generación de slug
SET @slug_test = '';
CALL sp_generar_slug('Producto de Prueba', 'catalogo_productos', @slug_test);
SELECT 
    'sp_generar_slug("Producto de Prueba")' AS prueba,
    @slug_test AS resultado,
    'Esperado: producto-de-prueba' AS esperado;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT '=== RESUMEN FASE 4 ===' AS titulo;

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name LIKE 'catalogo_%') AS tablas_catalogo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name LIKE 'inventario_%') AS tablas_inventario,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'tienda_virtual' 
     AND (routine_name LIKE 'sp_actualizar%' 
          OR routine_name LIKE 'sp_registrar_movimiento%'
          OR routine_name LIKE 'sp_generar%'
          OR routine_name LIKE 'fn_obtener%')) AS procedimientos_funciones,
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'tienda_virtual'
     AND table_name LIKE 'vista_productos%' OR table_name LIKE 'vista_categorias%' OR table_name LIKE 'vista_movimientos%') AS vistas,
    (SELECT COUNT(*) FROM catalogo_categorias) AS categorias,
    (SELECT COUNT(*) FROM catalogo_marcas) AS marcas,
    (SELECT COUNT(*) FROM catalogo_atributos) AS atributos,
    (SELECT COUNT(*) FROM inventario_almacenes) AS almacenes;

SELECT '✓ VERIFICACIÓN COMPLETADA - FASE 4 INSTALADA' AS mensaje;

-- ============================================================================
-- FIN DE VERIFICACIÓN
-- ============================================================================
