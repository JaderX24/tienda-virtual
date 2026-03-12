-- ============================================================================
-- TIENDA VIRTUAL - FASE 8 - VERIFICACIÓN
-- ============================================================================
-- Script para verificar la correcta instalación de la Fase 8
-- Ejecutar después de 8-fase-(24-01-2026)-v1-7841.sql
-- ============================================================================

USE tienda_virtual;

SELECT '=================================================' AS '';
SELECT 'VERIFICACIÓN FASE 8: NOTIFICACIONES + ANALYTICS' AS 'RESULTADO';
SELECT '=================================================' AS '';

-- ============================================================================
-- 1. VERIFICAR TABLAS DE NOTIFICACIONES
-- ============================================================================

SELECT '--- TABLAS DE NOTIFICACIONES ---' AS '';

SELECT 
    'Notificaciones Core' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'notificaciones_plantillas') AS plantillas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'notificaciones_cola') AS cola,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'notificaciones_cliente') AS cliente;

SELECT 
    'Config Notificaciones' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'notificaciones_proveedores') AS proveedores,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'notificaciones_eventos') AS eventos;

-- ============================================================================
-- 2. VERIFICAR TABLAS DE ANALYTICS
-- ============================================================================

SELECT '--- TABLAS DE ANALYTICS ---' AS '';

SELECT 
    'Métricas Ventas' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_ventas_diarias') AS diarias,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_ventas_mensuales') AS mensuales;

SELECT 
    'Analytics Entidades' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_productos') AS productos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_clientes') AS clientes,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_categorias') AS categorias;

SELECT 
    'Analytics Extra' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_conversion') AS conversion,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_kpis') AS kpis,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'analytics_eventos') AS eventos;

SELECT 
    'Reportes' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'reportes_programados') AS programados,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'reportes_historial') AS historial;

-- ============================================================================
-- 3. VERIFICAR PROCEDIMIENTOS
-- ============================================================================

SELECT '--- PROCEDIMIENTOS ALMACENADOS ---' AS '';

SELECT 
    routine_name AS procedimiento,
    'OK' AS estado
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND routine_name IN (
    'sp_encolar_notificacion',
    'sp_notificar_evento_pedido',
    'sp_calcular_metricas_diarias',
    'sp_calcular_rfm_clientes',
    'sp_actualizar_kpis',
    'sp_procesar_cola_notificaciones',
    'sp_marcar_notificacion_enviada',
    'sp_marcar_notificacion_fallida'
)
ORDER BY routine_name;

-- ============================================================================
-- 4. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '--- TRIGGERS ---' AS '';

SELECT 
    trigger_name AS trigger_nombre,
    event_manipulation AS evento,
    event_object_table AS tabla
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_pedido_notificar_estado',
    'trg_producto_visto'
)
ORDER BY trigger_name;

-- ============================================================================
-- 5. VERIFICAR VISTAS
-- ============================================================================

SELECT '--- VISTAS ---' AS '';

SELECT 
    table_name AS vista,
    'OK' AS estado
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'vista_dashboard_hoy',
    'vista_ventas_periodo',
    'vista_productos_top_ventas',
    'vista_notificaciones_pendientes',
    'vista_clientes_segmentos'
)
ORDER BY table_name;

-- ============================================================================
-- 6. VERIFICAR EVENTOS PROGRAMADOS
-- ============================================================================

SELECT '--- EVENTOS PROGRAMADOS ---' AS '';

SELECT 
    event_name AS evento,
    event_type AS tipo,
    interval_value AS intervalo,
    interval_field AS unidad,
    status AS estado
FROM information_schema.events
WHERE event_schema = 'tienda_virtual'
AND event_name IN (
    'evento_calcular_metricas_diarias',
    'evento_actualizar_kpis',
    'evento_calcular_rfm',
    'evento_notificar_carritos_abandonados'
)
ORDER BY event_name;

-- ============================================================================
-- 7. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '--- MÓDULOS REGISTRADOS ---' AS '';

SELECT codigo, nombre, icono
FROM admin_modulos
WHERE codigo IN ('notificaciones_admin', 'reportes', 'analytics')
ORDER BY orden;

SELECT '--- PERMISOS CREADOS ---' AS '';

SELECT 
    m.codigo AS modulo,
    COUNT(p.id) AS total_permisos
FROM admin_modulos m
LEFT JOIN admin_permisos p ON m.id = p.modulo_id
WHERE m.codigo IN ('notificaciones_admin', 'reportes', 'analytics')
GROUP BY m.codigo
ORDER BY m.codigo;

-- ============================================================================
-- 8. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '--- PLANTILLAS DE NOTIFICACIÓN ---' AS '';

SELECT codigo, nombre, categoria, prioridad
FROM notificaciones_plantillas
ORDER BY es_obligatoria DESC, prioridad DESC
LIMIT 10;

SELECT '--- EVENTOS DE NOTIFICACIÓN ---' AS '';

SELECT codigo, nombre, email_habilitado, push_habilitado, in_app_habilitado
FROM notificaciones_eventos
LIMIT 10;

SELECT '--- KPIs CONFIGURADOS ---' AS '';

SELECT codigo, nombre, formato, periodo
FROM analytics_kpis
ORDER BY orden;

SELECT '--- REPORTES PROGRAMADOS ---' AS '';

SELECT codigo, nombre, tipo, frecuencia, es_activo
FROM reportes_programados;

SELECT '--- PROVEEDORES ---' AS '';

SELECT codigo, nombre, tipo, es_activo, es_default
FROM notificaciones_proveedores;

-- ============================================================================
-- 9. CONTEO TOTAL DE OBJETOS FASE 8
-- ============================================================================

SELECT '--- RESUMEN FASE 8 ---' AS '';

SELECT 
    'Tablas Notificaciones' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'notificaciones_plantillas', 'notificaciones_cola', 
    'notificaciones_cliente', 'notificaciones_proveedores', 
    'notificaciones_eventos'
)
UNION ALL
SELECT 
    'Tablas Analytics' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'analytics_ventas_diarias', 'analytics_ventas_mensuales',
    'analytics_productos', 'analytics_clientes', 
    'analytics_categorias', 'analytics_conversion',
    'analytics_kpis', 'analytics_eventos',
    'reportes_programados', 'reportes_historial'
)
UNION ALL
SELECT 
    'Procedimientos' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND routine_name IN (
    'sp_encolar_notificacion', 'sp_notificar_evento_pedido',
    'sp_calcular_metricas_diarias', 'sp_calcular_rfm_clientes',
    'sp_actualizar_kpis', 'sp_procesar_cola_notificaciones',
    'sp_marcar_notificacion_enviada', 'sp_marcar_notificacion_fallida'
)
UNION ALL
SELECT 
    'Vistas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'vista_dashboard_hoy', 'vista_ventas_periodo',
    'vista_productos_top_ventas', 'vista_notificaciones_pendientes',
    'vista_clientes_segmentos'
)
UNION ALL
SELECT 
    'Triggers' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_pedido_notificar_estado', 'trg_producto_visto'
)
UNION ALL
SELECT 
    'Eventos Programados' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.events
WHERE event_schema = 'tienda_virtual'
AND event_name LIKE 'evento_%';

-- ============================================================================
-- 10. VERIFICACIÓN FINAL
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
                'notificaciones_plantillas', 'notificaciones_cola',
                'analytics_ventas_diarias', 'analytics_clientes',
                'analytics_kpis', 'reportes_programados'
            )
        ) >= 6 THEN '✓ FASE 8 INSTALADA CORRECTAMENTE'
        ELSE '✗ ERROR: Faltan tablas principales'
    END AS resultado_final;

-- ============================================================================
-- FIN VERIFICACIÓN FASE 8
-- ============================================================================
