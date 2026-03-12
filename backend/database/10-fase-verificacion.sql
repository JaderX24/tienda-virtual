-- ============================================================================
-- TIENDA VIRTUAL - FASE 10 - VERIFICACIÓN
-- ============================================================================
-- Script para verificar la correcta instalación de la Fase 10
-- Ejecutar después de 10-fase-(24-01-2026)-v1-4127.sql
-- ============================================================================

USE tienda_virtual;

SELECT '=================================================' AS '';
SELECT 'VERIFICACIÓN FASE 10: BÚSQUEDA AVANZADA' AS 'RESULTADO';
SELECT '=================================================' AS '';

-- ============================================================================
-- 1. VERIFICAR TABLAS PRINCIPALES
-- ============================================================================

SELECT '--- TABLAS DE ÍNDICES Y CONFIGURACIÓN ---' AS '';

SELECT 
    'Configuración' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_configuracion') AS config,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_indices_productos') AS indices;

SELECT '--- TABLAS DE SINÓNIMOS ---' AS '';

SELECT 
    'Sinónimos' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_sinonimos_grupos') AS grupos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_sinonimos_terminos') AS terminos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_palabras_excluidas') AS stopwords;

SELECT '--- TABLAS DE FILTROS ---' AS '';

SELECT 
    'Filtros' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_filtros') AS filtros,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_filtros_valores') AS valores;

SELECT '--- TABLAS DE AUTOCOMPLETADO Y SUGERENCIAS ---' AS '';

SELECT 
    'Autocompletado' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_autocompletado') AS autocompletado,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_sugerencias') AS sugerencias,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_correcciones') AS correcciones;

SELECT '--- TABLAS DE HISTORIAL Y ANALYTICS ---' AS '';

SELECT 
    'Historial/Analytics' AS modulo,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_historial') AS historial,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_clicks') AS clicks,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_guardadas') AS guardadas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'busqueda_tendencias') AS tendencias;

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
    'sp_buscar_productos',
    'sp_obtener_sugerencias',
    'sp_registrar_busqueda',
    'sp_obtener_filtros_facetados',
    'sp_actualizar_tendencias',
    'sp_limpiar_historial_antiguo'
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
    'vista_busquedas_populares',
    'vista_sugerencias_activas',
    'vista_sinonimos_activos',
    'vista_filtros_facetados',
    'vista_tendencias_busqueda'
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
    'evento_actualizar_tendencias',
    'evento_limpiar_historial'
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
    'trg_actualizar_indice_producto',
    'trg_click_conversion'
)
ORDER BY trigger_name;

-- ============================================================================
-- 6. VERIFICAR ÍNDICES FULLTEXT
-- ============================================================================

SELECT '--- ÍNDICES FULLTEXT ---' AS '';

SELECT 
    index_name AS indice,
    'OK' AS estado
FROM information_schema.statistics
WHERE table_schema = 'tienda_virtual'
AND table_name = 'busqueda_indices_productos'
AND index_type = 'FULLTEXT'
GROUP BY index_name;

-- ============================================================================
-- 7. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '--- MÓDULOS REGISTRADOS ---' AS '';

SELECT codigo, nombre, icono
FROM admin_modulos
WHERE codigo LIKE 'busqueda%'
ORDER BY orden;

SELECT '--- PERMISOS POR MÓDULO ---' AS '';

SELECT 
    m.codigo AS modulo,
    COUNT(p.id) AS total_permisos
FROM admin_modulos m
LEFT JOIN admin_permisos p ON m.id = p.modulo_id
WHERE m.codigo LIKE 'busqueda%'
GROUP BY m.codigo
ORDER BY m.codigo;

-- ============================================================================
-- 8. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '--- CONFIGURACIÓN INICIAL ---' AS '';

SELECT clave, valor, tipo_dato
FROM busqueda_configuracion
WHERE es_global = TRUE
LIMIT 10;

SELECT '--- PALABRAS EXCLUIDAS (STOPWORDS) ---' AS '';

SELECT COUNT(*) AS total_stopwords
FROM busqueda_palabras_excluidas
WHERE idioma = 'es';

SELECT '--- GRUPOS DE SINÓNIMOS ---' AS '';

SELECT g.nombre, COUNT(t.id) AS terminos
FROM busqueda_sinonimos_grupos g
LEFT JOIN busqueda_sinonimos_terminos t ON g.id = t.grupo_id
GROUP BY g.id, g.nombre
ORDER BY g.id;

SELECT '--- FILTROS FACETADOS ---' AS '';

SELECT codigo, nombre, tipo, orden
FROM busqueda_filtros
WHERE es_activo = TRUE
ORDER BY orden;

SELECT '--- CORRECCIONES ORTOGRÁFICAS ---' AS '';

SELECT termino_incorrecto, termino_correcto
FROM busqueda_correcciones
LIMIT 10;

-- ============================================================================
-- 9. CONTEO TOTAL DE OBJETOS FASE 10
-- ============================================================================

SELECT '--- RESUMEN FASE 10 ---' AS '';

SELECT 
    'Tablas Principales' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name LIKE 'busqueda_%'

UNION ALL

SELECT 
    'Procedimientos' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND routine_name IN (
    'sp_buscar_productos',
    'sp_obtener_sugerencias',
    'sp_registrar_busqueda',
    'sp_obtener_filtros_facetados',
    'sp_actualizar_tendencias',
    'sp_limpiar_historial_antiguo'
)

UNION ALL

SELECT 
    'Vistas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name LIKE 'vista_busqueda%' 
   OR table_name LIKE 'vista_sugerencias%' 
   OR table_name LIKE 'vista_sinonimos%' 
   OR table_name LIKE 'vista_filtros%'
   OR table_name LIKE 'vista_tendencias%'

UNION ALL

SELECT 
    'Triggers' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND (trigger_name LIKE 'trg_%indice%' OR trigger_name LIKE 'trg_%click%');

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
                'busqueda_configuracion', 'busqueda_indices_productos',
                'busqueda_sinonimos_grupos', 'busqueda_sinonimos_terminos',
                'busqueda_filtros', 'busqueda_historial', 
                'busqueda_autocompletado', 'busqueda_tendencias'
            )
        ) >= 8 THEN '✓ FASE 10 INSTALADA CORRECTAMENTE'
        ELSE '✗ ERROR: Faltan tablas principales'
    END AS resultado_final;

-- ============================================================================
-- FIN VERIFICACIÓN FASE 10
-- ============================================================================
