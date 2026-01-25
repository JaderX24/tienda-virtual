-- ============================================================================
-- TIENDA VIRTUAL - FASE 7 - VERIFICACIÓN
-- ============================================================================
-- Script para verificar la correcta instalación de la Fase 7
-- Ejecutar después de 7-fase-(24-01-2026)-v1-5293.sql
-- ============================================================================

USE tienda_virtual;

SELECT '=============================================' AS '';
SELECT 'VERIFICACIÓN FASE 7: RESEÑAS Y VALORACIONES' AS 'RESULTADO';
SELECT '=============================================' AS '';

-- ============================================================================
-- 1. VERIFICAR TABLAS CREADAS
-- ============================================================================

SELECT '--- TABLAS CREADAS ---' AS '';

SELECT 
    'Reseñas' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'resenas') AS resenas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'resenas_medios') AS medios,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'resenas_votos') AS votos;

SELECT 
    'Interacción' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'resenas_respuestas') AS respuestas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'resenas_reportes') AS reportes,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'resenas_moderacion_historial') AS historial_mod;

SELECT 
    'Preguntas y Respuestas' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'productos_preguntas') AS preguntas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'productos_respuestas') AS respuestas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'productos_qa_votos') AS qa_votos;

SELECT 
    'Estadísticas y Config' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'productos_estadisticas_resenas') AS estadisticas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name = 'resenas_configuracion') AS configuracion;

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
    'sp_actualizar_estadisticas_resenas',
    'sp_crear_resena',
    'sp_acumular_puntos_resena',
    'sp_moderar_resena',
    'sp_votar_resena',
    'sp_responder_resena',
    'sp_reportar_resena'
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
    'trg_resena_aprobada',
    'trg_resena_medio_insert',
    'trg_respuesta_pregunta_insert'
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
    'vista_resenas_completas',
    'vista_resenas_pendientes',
    'vista_productos_mejor_valorados',
    'vista_resenas_negativas',
    'vista_preguntas_sin_responder',
    'vista_resenas_diarias'
)
ORDER BY table_name;

-- ============================================================================
-- 5. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '--- MÓDULOS REGISTRADOS ---' AS '';

SELECT codigo, nombre, icono
FROM admin_modulos
WHERE codigo IN ('resenas', 'preguntas_respuestas')
ORDER BY orden;

SELECT '--- PERMISOS CREADOS ---' AS '';

SELECT 
    m.codigo AS modulo,
    COUNT(p.id) AS total_permisos
FROM admin_modulos m
LEFT JOIN admin_permisos p ON m.id = p.modulo_id
WHERE m.codigo IN ('resenas', 'preguntas_respuestas')
GROUP BY m.codigo
ORDER BY m.codigo;

-- ============================================================================
-- 6. VERIFICAR CONFIGURACIÓN INICIAL
-- ============================================================================

SELECT '--- CONFIGURACIÓN DE RESEÑAS ---' AS '';

SELECT 
    'Puntos por reseña' AS configuracion,
    puntos_por_resena AS valor
FROM resenas_configuracion WHERE es_activo = TRUE
UNION ALL
SELECT 
    'Puntos reseña con foto',
    puntos_por_resena_con_foto
FROM resenas_configuracion WHERE es_activo = TRUE
UNION ALL
SELECT 
    'Auto-aprobar verificadas',
    IF(auto_aprobar_verificadas, 'Sí', 'No')
FROM resenas_configuracion WHERE es_activo = TRUE
UNION ALL
SELECT 
    'Máx. imágenes permitidas',
    max_imagenes
FROM resenas_configuracion WHERE es_activo = TRUE;

-- ============================================================================
-- 7. VERIFICAR COLUMNAS EN PRODUCTOS
-- ============================================================================

SELECT '--- COLUMNAS EN CATALOGO_PRODUCTOS ---' AS '';

SELECT 
    COLUMN_NAME AS columna,
    DATA_TYPE AS tipo,
    COLUMN_DEFAULT AS valor_default
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'tienda_virtual' 
AND TABLE_NAME = 'catalogo_productos' 
AND COLUMN_NAME IN ('calificacion_promedio', 'total_resenas');

-- ============================================================================
-- 8. CONTEO TOTAL DE OBJETOS FASE 7
-- ============================================================================

SELECT '--- RESUMEN FASE 7 ---' AS '';

SELECT 
    'Tablas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'resenas', 'resenas_medios', 'resenas_votos',
    'resenas_respuestas', 'resenas_reportes', 'resenas_moderacion_historial',
    'productos_preguntas', 'productos_respuestas', 'productos_qa_votos',
    'productos_estadisticas_resenas', 'resenas_configuracion'
)
UNION ALL
SELECT 
    'Procedimientos' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND routine_name IN (
    'sp_actualizar_estadisticas_resenas',
    'sp_crear_resena',
    'sp_acumular_puntos_resena',
    'sp_moderar_resena',
    'sp_votar_resena',
    'sp_responder_resena',
    'sp_reportar_resena'
)
UNION ALL
SELECT 
    'Vistas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name LIKE 'vista_%'
AND table_name IN (
    'vista_resenas_completas',
    'vista_resenas_pendientes',
    'vista_productos_mejor_valorados',
    'vista_resenas_negativas',
    'vista_preguntas_sin_responder',
    'vista_resenas_diarias'
)
UNION ALL
SELECT 
    'Triggers' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_resena_aprobada',
    'trg_resena_medio_insert',
    'trg_respuesta_pregunta_insert'
);

-- ============================================================================
-- 9. VERIFICACIÓN FINAL
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
                'resenas', 'resenas_medios', 'resenas_votos',
                'resenas_respuestas', 'productos_preguntas',
                'productos_estadisticas_resenas', 'resenas_configuracion'
            )
        ) >= 7 THEN '✓ FASE 7 INSTALADA CORRECTAMENTE'
        ELSE '✗ ERROR: Faltan tablas principales'
    END AS resultado_final;

-- ============================================================================
-- FIN VERIFICACIÓN FASE 7
-- ============================================================================
