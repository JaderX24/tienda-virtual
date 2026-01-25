-- ============================================================================
-- TIENDA VIRTUAL - FASE 12 - VERIFICACIÓN
-- ============================================================================
-- Script para verificar la correcta instalación de la Fase 12
-- Ejecutar después de 12-fase-(24-01-2026)-v1-8347.sql
-- ============================================================================

USE tienda_virtual;

SELECT '=================================================' AS '';
SELECT 'VERIFICACIÓN FASE 12: LOGÍSTICA AVANZADA' AS 'RESULTADO';
SELECT '=================================================' AS '';

-- ============================================================================
-- 1. VERIFICAR TABLAS PRINCIPALES
-- ============================================================================

SELECT '--- TABLAS DE ALMACENES ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_configuracion') AS config,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_almacenes') AS almacenes,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_almacenes_horarios') AS horarios,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_almacenes_ubicaciones') AS ubicaciones,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_almacenes_stock') AS stock,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_almacenes_movimientos') AS movimientos;

SELECT '--- TABLAS DE ZONAS Y TARIFAS ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_zonas') AS zonas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_zonas_cobertura') AS cobertura,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_zonas_cobertura_codigos') AS cod_postales,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_tarifas_zonas') AS tarifas_zona,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_tarifas_peso') AS tarifas_peso,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_tarifas_especiales') AS tarifas_esp;

SELECT '--- TABLAS DE TRANSPORTISTAS Y VEHÍCULOS ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_transportistas') AS transportistas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_transportistas_horarios') AS transp_horarios,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_transportistas_documentos') AS transp_docs,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_transportistas_zonas') AS transp_zonas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_vehiculos') AS vehiculos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_vehiculos_mantenimiento') AS vehic_mant;

SELECT '--- TABLAS DE ENVÍOS Y TRACKING ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_envios_paquetes') AS paquetes,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_envios_etiquetas') AS etiquetas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_tracking_eventos') AS tracking;

SELECT '--- TABLAS DE RUTAS Y ENTREGAS ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_rutas') AS rutas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_rutas_paradas') AS paradas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_entregas_intentos') AS intentos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_entregas_firmas') AS firmas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'logistica_entregas_fotos') AS fotos;

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
    'sp_asignar_almacen_pedido',
    'sp_calcular_costo_envio',
    'sp_crear_ruta_entrega',
    'sp_actualizar_tracking',
    'sp_transferir_inventario',
    'sp_asignar_transportista',
    'sp_completar_entrega'
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
    'vista_almacenes_stock',
    'vista_envios_pendientes',
    'vista_rutas_activas',
    'vista_entregas_hoy',
    'vista_rendimiento_transportistas',
    'vista_cobertura_zonas'
)
ORDER BY table_name;

-- ============================================================================
-- 4. VERIFICAR EVENTOS PROGRAMADOS
-- ============================================================================

SELECT '--- EVENTOS PROGRAMADOS ---' AS '';

SELECT 
    event_name AS evento,
    status AS estado
FROM information_schema.events
WHERE event_schema = 'tienda_virtual'
AND event_name IN (
    'evento_notificar_entregas_retrasadas',
    'evento_limpiar_tracking_antiguo'
)
ORDER BY event_name;

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '--- TRIGGERS ---' AS '';

SELECT 
    trigger_name AS trigger_nombre,
    event_manipulation AS evento,
    event_object_table AS tabla
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_log_movimiento_inventario',
    'trg_actualizar_stock_almacen'
)
ORDER BY trigger_name;

-- ============================================================================
-- 6. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '--- ZONAS DE COBERTURA ---' AS '';

SELECT codigo, nombre, tipo, tiempo_entrega_min, tiempo_entrega_max
FROM logistica_zonas
WHERE es_activo = TRUE
ORDER BY codigo;

SELECT '--- COBERTURA POR DEPARTAMENTO ---' AS '';

SELECT 
    z.codigo AS zona,
    zc.departamento,
    COUNT(*) AS municipios
FROM logistica_zonas_cobertura zc
INNER JOIN logistica_zonas z ON zc.zona_id = z.id
GROUP BY z.codigo, zc.departamento
ORDER BY z.codigo, zc.departamento;

SELECT '--- TARIFAS POR ZONA Y SERVICIO ---' AS '';

SELECT 
    z.nombre AS zona,
    tz.tipo_servicio,
    CONCAT('L ', tz.tarifa_base) AS tarifa_base,
    CONCAT('L ', tz.tarifa_por_kg, '/kg') AS por_kg,
    CONCAT(tz.dias_entrega_min, '-', tz.dias_entrega_max, ' días') AS tiempo
FROM logistica_tarifas_zonas tz
INNER JOIN logistica_zonas z ON tz.zona_id = z.id
WHERE tz.es_activo = TRUE
ORDER BY z.codigo, tz.tipo_servicio;

SELECT '--- CONFIGURACIÓN GENERAL ---' AS '';

SELECT clave, valor, tipo_dato
FROM logistica_configuracion
ORDER BY categoria, clave
LIMIT 15;

-- ============================================================================
-- 7. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '--- MÓDULOS REGISTRADOS ---' AS '';

SELECT codigo, nombre, icono
FROM admin_modulos
WHERE codigo LIKE 'logistica%'
ORDER BY orden;

SELECT '--- PERMISOS POR MÓDULO ---' AS '';

SELECT 
    m.codigo AS modulo,
    COUNT(p.id) AS total_permisos
FROM admin_modulos m
LEFT JOIN admin_permisos p ON m.id = p.modulo_id
WHERE m.codigo LIKE 'logistica%'
GROUP BY m.codigo
ORDER BY m.codigo;

-- ============================================================================
-- 8. CONTEO TOTAL DE OBJETOS FASE 12
-- ============================================================================

SELECT '--- RESUMEN FASE 12 ---' AS '';

SELECT 
    'Tablas Principales' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name LIKE 'logistica_%'

UNION ALL

SELECT 
    'Procedimientos' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND (routine_name LIKE 'sp_%almacen%' OR routine_name LIKE 'sp_%ruta%' 
     OR routine_name LIKE 'sp_%tracking%' OR routine_name LIKE 'sp_%envio%'
     OR routine_name LIKE 'sp_%transportista%' OR routine_name LIKE 'sp_%entrega%'
     OR routine_name LIKE 'sp_%inventario%')

UNION ALL

SELECT 
    'Vistas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND (table_name LIKE 'vista_almacenes%' OR table_name LIKE 'vista_envios%' 
     OR table_name LIKE 'vista_rutas%' OR table_name LIKE 'vista_entregas%'
     OR table_name LIKE 'vista_rendimiento%' OR table_name LIKE 'vista_cobertura%')

UNION ALL

SELECT 
    'Triggers' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND (trigger_name LIKE 'trg_%movimiento%' OR trigger_name LIKE 'trg_%stock%' 
     OR trigger_name LIKE 'trg_%almacen%');

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
                'logistica_almacenes', 'logistica_zonas', 'logistica_transportistas',
                'logistica_vehiculos', 'logistica_rutas', 'logistica_tracking_eventos',
                'logistica_almacenes_stock', 'logistica_envios_paquetes'
            )
        ) >= 8 THEN '✓ FASE 12 INSTALADA CORRECTAMENTE'
        ELSE '✗ ERROR: Faltan tablas principales'
    END AS resultado_final;

-- ============================================================================
-- FIN VERIFICACIÓN FASE 12
-- ============================================================================
