-- ============================================================================
-- TIENDA VIRTUAL - FASE 6 - VERIFICACIÓN
-- ============================================================================
-- Script para verificar la correcta instalación de la Fase 6
-- Ejecutar después de 6-fase-(24-01-2026)-v1-4827.sql
-- ============================================================================

USE tienda_virtual;

SELECT '=============================================' AS '';
SELECT 'VERIFICACIÓN FASE 6: CARRITO Y PEDIDOS' AS 'RESULTADO';
SELECT '=============================================' AS '';

-- ============================================================================
-- 1. VERIFICAR TABLAS CREADAS
-- ============================================================================

SELECT '--- TABLAS CREADAS ---' AS '';

SELECT 
    'Cupones y Descuentos' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'cupones') AS cupones,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'cupones_usos') AS cupones_usos;

SELECT 
    'Carrito' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'carritos') AS carritos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'carritos_items') AS carritos_items;

SELECT 
    'Pedidos' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos') AS pedidos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_items') AS pedidos_items,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_historial_estados') AS historial_estados;

SELECT 
    'Pagos' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_pagos') AS pedidos_pagos;

SELECT 
    'Envíos' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'envios_metodos') AS envios_metodos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_envios') AS pedidos_envios,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_envios_tracking') AS envios_tracking;

SELECT 
    'Devoluciones' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_devoluciones') AS devoluciones,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_devoluciones_items') AS devoluciones_items;

SELECT 
    'Notas' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'pedidos_notas') AS pedidos_notas;

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
    'sp_generar_numero_pedido',
    'sp_generar_numero_devolucion',
    'sp_calcular_totales_carrito',
    'sp_agregar_item_carrito',
    'sp_convertir_carrito_a_pedido',
    'sp_cambiar_estado_pedido',
    'sp_validar_cupon'
)
ORDER BY routine_name;

-- ============================================================================
-- 3. VERIFICAR VISTAS
-- ============================================================================

SELECT '--- VISTAS ---' AS '';

SELECT 
    table_name AS vista,
    'OK' AS estado
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'vista_pedidos_resumen',
    'vista_pedidos_por_enviar',
    'vista_ventas_hoy',
    'vista_carritos_abandonados',
    'vista_productos_mas_vendidos'
)
ORDER BY table_name;

-- ============================================================================
-- 4. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '--- MÓDULOS REGISTRADOS ---' AS '';

SELECT codigo, nombre, icono
FROM admin_modulos
WHERE codigo IN ('pedidos', 'pedidos_devoluciones', 'cupones', 'envios')
ORDER BY orden;

SELECT '--- PERMISOS CREADOS ---' AS '';

SELECT 
    m.codigo AS modulo,
    COUNT(p.id) AS total_permisos
FROM admin_modulos m
LEFT JOIN admin_permisos p ON m.id = p.modulo_id
WHERE m.codigo IN ('pedidos', 'pedidos_devoluciones', 'cupones', 'envios')
GROUP BY m.codigo
ORDER BY m.codigo;

-- ============================================================================
-- 5. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '--- MÉTODOS DE ENVÍO ---' AS '';

SELECT codigo, nombre, tipo, costo_base, es_activo
FROM envios_metodos
ORDER BY orden;

SELECT '--- CUPÓN DE BIENVENIDA ---' AS '';

SELECT codigo, nombre, tipo_descuento, valor_descuento, es_activo
FROM cupones
WHERE codigo = 'BIENVENIDO10';

-- ============================================================================
-- 6. VERIFICAR EVENTOS PROGRAMADOS
-- ============================================================================

SELECT '--- EVENTOS PROGRAMADOS ---' AS '';

SELECT 
    event_name AS evento,
    status AS estado,
    event_type AS tipo,
    interval_value AS intervalo,
    interval_field AS unidad
FROM information_schema.events
WHERE event_schema = 'tienda_virtual'
AND event_name IN (
    'evento_marcar_carritos_abandonados',
    'evento_expirar_carritos'
)
ORDER BY event_name;

-- ============================================================================
-- 7. CONTEO TOTAL DE OBJETOS FASE 6
-- ============================================================================

SELECT '--- RESUMEN FASE 6 ---' AS '';

SELECT 
    'Tablas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'cupones', 'cupones_usos',
    'carritos', 'carritos_items',
    'pedidos', 'pedidos_items', 'pedidos_historial_estados',
    'pedidos_pagos',
    'envios_metodos', 'pedidos_envios', 'pedidos_envios_tracking',
    'pedidos_devoluciones', 'pedidos_devoluciones_items',
    'pedidos_notas'
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
    'sp_generar_numero_pedido',
    'sp_generar_numero_devolucion',
    'sp_calcular_totales_carrito',
    'sp_agregar_item_carrito',
    'sp_convertir_carrito_a_pedido',
    'sp_cambiar_estado_pedido',
    'sp_validar_cupon'
)
UNION ALL
SELECT 
    'Vistas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name LIKE 'vista_%'
AND table_name IN (
    'vista_pedidos_resumen',
    'vista_pedidos_por_enviar',
    'vista_ventas_hoy',
    'vista_carritos_abandonados',
    'vista_productos_mas_vendidos'
)
UNION ALL
SELECT 
    'Métodos Envío' AS tipo,
    COUNT(*) AS cantidad
FROM envios_metodos;

-- ============================================================================
-- 8. VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=============================================' AS '';
SELECT 'VERIFICACIÓN COMPLETADA' AS 'ESTADO';
SELECT '=============================================' AS '';

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'tienda_virtual' 
            AND table_name IN (
                'cupones', 'carritos', 'pedidos', 'pedidos_items',
                'pedidos_pagos', 'envios_metodos', 'pedidos_envios',
                'pedidos_devoluciones'
            )
        ) >= 8 THEN '✓ FASE 6 INSTALADA CORRECTAMENTE'
        ELSE '✗ ERROR: Faltan tablas principales'
    END AS resultado_final;

-- ============================================================================
-- FIN VERIFICACIÓN FASE 6
-- ============================================================================
