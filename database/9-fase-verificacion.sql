-- ============================================================================
-- TIENDA VIRTUAL - FASE 9 - VERIFICACIÓN
-- ============================================================================
-- Script para verificar la correcta instalación de la Fase 9
-- Ejecutar después de 9-fase-(24-01-2026)-v1-3952.sql
-- ============================================================================

USE tienda_virtual;

SELECT '=================================================' AS '';
SELECT 'VERIFICACIÓN FASE 9: PROMOCIONES Y OFERTAS' AS 'RESULTADO';
SELECT '=================================================' AS '';

-- ============================================================================
-- 1. VERIFICAR TABLAS PRINCIPALES
-- ============================================================================

SELECT '--- TABLAS DE CAMPAÑAS Y PROMOCIONES ---' AS '';

SELECT 
    'Campañas/Promociones' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'campanas') AS campanas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'promociones') AS promociones,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'promociones_reglas') AS reglas;

SELECT 
    'Productos/Categorías' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'promociones_productos') AS promo_prod,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'promociones_categorias') AS promo_cat,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'promociones_segmentos') AS promo_seg;

SELECT '--- TABLAS DE FLASH SALES ---' AS '';

SELECT 
    'Flash Sales' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'flash_sales') AS flash_sales,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'flash_sales_productos') AS productos;

SELECT '--- TABLAS DE BUNDLES ---' AS '';

SELECT 
    'Bundles' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'bundles') AS bundles,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'bundles_items') AS items;

SELECT '--- OTRAS TABLAS ---' AS '';

SELECT 
    'Ofertas/Descuentos' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'descuentos_volumen') AS descuentos_vol,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'ofertas_especiales') AS ofertas_esp,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'precios_segmento') AS precios_seg,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'banners') AS banners;

-- ============================================================================
-- 2. VERIFICAR PROCEDIMIENTOS
-- ============================================================================

SELECT '--- PROCEDIMIENTOS ALMACENADOS ---' AS '';

SELECT 
    routine_name AS procedimiento,
    'OK' AS estado
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND routine_name IN (
    'sp_obtener_precio_final',
    'sp_aplicar_promocion_carrito',
    'sp_verificar_promocion_valida',
    'sp_actualizar_stock_flash_sale',
    'sp_obtener_descuento_volumen'
)
ORDER BY routine_name;

-- ============================================================================
-- 3. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '--- TRIGGERS ---' AS '';

SELECT 
    trigger_name AS trigger_nombre,
    event_manipulation AS evento,
    event_object_table AS tabla
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_flash_sale_estado',
    'trg_bundle_vendido',
    'trg_banner_impresion'
)
ORDER BY trigger_name;

-- ============================================================================
-- 4. VERIFICAR VISTAS
-- ============================================================================

SELECT '--- VISTAS ---' AS '';

SELECT 
    table_name AS vista,
    'OK' AS estado
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'vista_promociones_activas',
    'vista_flash_sales_activas',
    'vista_bundles_disponibles',
    'vista_ofertas_hoy',
    'vista_banners_activos'
)
ORDER BY table_name;

-- ============================================================================
-- 5. VERIFICAR EVENTOS PROGRAMADOS
-- ============================================================================

SELECT '--- EVENTOS PROGRAMADOS ---' AS '';

SELECT 
    event_name AS evento,
    status AS estado
FROM information_schema.events
WHERE event_schema = 'tienda_virtual'
AND event_name IN (
    'evento_actualizar_flash_sales',
    'evento_actualizar_campanas'
)
ORDER BY event_name;

-- ============================================================================
-- 6. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '--- MÓDULOS REGISTRADOS ---' AS '';

SELECT codigo, nombre, icono
FROM admin_modulos
WHERE codigo IN ('promociones', 'flash_sales', 'bundles', 'campanas', 'banners')
ORDER BY orden;

SELECT '--- PERMISOS POR MÓDULO ---' AS '';

SELECT 
    m.codigo AS modulo,
    COUNT(p.id) AS total_permisos
FROM admin_modulos m
LEFT JOIN admin_permisos p ON m.id = p.modulo_id
WHERE m.codigo IN ('promociones', 'flash_sales', 'bundles', 'campanas', 'banners')
GROUP BY m.codigo
ORDER BY m.codigo;

-- ============================================================================
-- 7. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '--- CAMPAÑA DE EJEMPLO ---' AS '';

SELECT codigo, nombre, tipo, estado, es_destacada
FROM campanas
LIMIT 5;

SELECT '--- DESCUENTOS POR VOLUMEN ---' AS '';

SELECT cantidad_minima, cantidad_maxima, tipo_descuento, valor_descuento, es_activo
FROM descuentos_volumen
ORDER BY cantidad_minima;

-- ============================================================================
-- 8. CONTEO TOTAL DE OBJETOS FASE 9
-- ============================================================================

SELECT '--- RESUMEN FASE 9 ---' AS '';

SELECT 
    'Tablas Principales' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'campanas', 'promociones', 'promociones_reglas',
    'promociones_productos', 'promociones_productos_excluidos',
    'promociones_categorias', 'promociones_segmentos',
    'promociones_uso_historial',
    'flash_sales', 'flash_sales_productos',
    'bundles', 'bundles_items',
    'descuentos_volumen', 'ofertas_especiales',
    'ofertas_especiales_productos', 'precios_segmento', 'banners'
)
UNION ALL
SELECT 
    'Procedimientos' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND routine_name LIKE 'sp_%'
AND routine_name IN (
    'sp_obtener_precio_final',
    'sp_verificar_promocion_valida',
    'sp_actualizar_stock_flash_sale',
    'sp_obtener_descuento_volumen'
)
UNION ALL
SELECT 
    'Vistas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'vista_promociones_activas',
    'vista_flash_sales_activas',
    'vista_bundles_disponibles',
    'vista_ofertas_hoy',
    'vista_banners_activos'
)
UNION ALL
SELECT 
    'Triggers' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name LIKE 'trg_%'
AND trigger_name IN (
    'trg_flash_sale_estado',
    'trg_bundle_vendido'
);

-- ============================================================================
-- 9. VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=================================================' AS '';
SELECT 'VERIFICACIÓN COMPLETADA' AS 'ESTADO';
SELECT '=================================================' AS '';

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'tienda_virtual' 
            AND table_name IN (
                'campanas', 'promociones', 'flash_sales',
                'bundles', 'descuentos_volumen', 'banners'
            )
        ) >= 6 THEN '✓ FASE 9 INSTALADA CORRECTAMENTE'
        ELSE '✗ ERROR: Faltan tablas principales'
    END AS resultado_final;

-- ============================================================================
-- FIN VERIFICACIÓN FASE 9
-- ============================================================================
