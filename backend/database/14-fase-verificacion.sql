-- ============================================================================
-- TIENDA VIRTUAL - VERIFICACIÓN FASE 14
-- ============================================================================
-- Colaboradores - Seguridad Avanzada y Gestión RRHH
-- Fecha: 24/02/2026
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- 1. VERIFICAR TABLAS CREADAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TABLAS FASE 14 ===' AS titulo;

SELECT
    'colab_intentos_login' AS tabla,
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA') AS estado
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_intentos_login'
UNION ALL
SELECT 'colab_bloqueos',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_bloqueos'
UNION ALL
SELECT 'colab_ips_confiables',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_ips_confiables'
UNION ALL
SELECT 'colab_horarios_acceso',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_horarios_acceso'
UNION ALL
SELECT 'colab_documentos',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_documentos'
UNION ALL
SELECT 'colab_capacitaciones',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_capacitaciones'
UNION ALL
SELECT 'colab_capacitaciones_participantes',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_capacitaciones_participantes'
UNION ALL
SELECT 'colab_evaluaciones',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_evaluaciones'
UNION ALL
SELECT 'colab_evaluaciones_criterios',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_evaluaciones_criterios'
UNION ALL
SELECT 'colab_equipos',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_equipos'
UNION ALL
SELECT 'colab_equipos_miembros',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_equipos_miembros'
UNION ALL
SELECT 'colab_incidencias',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_incidencias'
UNION ALL
SELECT 'colab_incidencias_seguimiento',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_incidencias_seguimiento'
UNION ALL
SELECT 'colab_alertas',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_alertas';

-- ============================================================================
-- 2. VERIFICAR COLUMNAS PRINCIPALES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE COLUMNAS ===' AS titulo;

-- colab_intentos_login
SELECT
    'colab_intentos_login' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 12, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_intentos_login';

-- colab_bloqueos
SELECT
    'colab_bloqueos' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 14, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_bloqueos';

-- colab_documentos
SELECT
    'colab_documentos' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 16, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_documentos';

-- colab_capacitaciones
SELECT
    'colab_capacitaciones' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 18, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_capacitaciones';

-- colab_evaluaciones
SELECT
    'colab_evaluaciones' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 20, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_evaluaciones';

-- colab_equipos
SELECT
    'colab_equipos' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 12, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_equipos';

-- colab_incidencias
SELECT
    'colab_incidencias' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 18, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_incidencias';

-- colab_alertas
SELECT
    'colab_alertas' AS tabla,
    COUNT(*) AS total_columnas,
    IF(COUNT(*) >= 16, '✅ COMPLETA', '⚠️ REVISAR') AS estado
FROM information_schema.columns
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_alertas';

-- ============================================================================
-- 3. VERIFICAR ÍNDICES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE ÍNDICES ===' AS titulo;

SELECT
    table_name AS tabla,
    COUNT(DISTINCT index_name) AS total_indices
FROM information_schema.statistics
WHERE table_schema = 'tienda_virtual'
    AND table_name IN (
        'colab_intentos_login', 'colab_bloqueos', 'colab_ips_confiables',
        'colab_horarios_acceso', 'colab_documentos', 'colab_capacitaciones',
        'colab_capacitaciones_participantes', 'colab_evaluaciones',
        'colab_evaluaciones_criterios', 'colab_equipos', 'colab_equipos_miembros',
        'colab_incidencias', 'colab_incidencias_seguimiento', 'colab_alertas'
    )
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- 4. VERIFICAR FOREIGN KEYS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE FOREIGN KEYS ===' AS titulo;

SELECT
    TABLE_NAME AS tabla,
    CONSTRAINT_NAME AS fk_nombre,
    COLUMN_NAME AS columna,
    REFERENCED_TABLE_NAME AS tabla_referenciada,
    REFERENCED_COLUMN_NAME AS columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'tienda_virtual'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_NAME IN (
        'colab_intentos_login', 'colab_bloqueos', 'colab_ips_confiables',
        'colab_horarios_acceso', 'colab_documentos', 'colab_capacitaciones',
        'colab_capacitaciones_participantes', 'colab_evaluaciones',
        'colab_evaluaciones_criterios', 'colab_equipos', 'colab_equipos_miembros',
        'colab_incidencias', 'colab_incidencias_seguimiento', 'colab_alertas'
    )
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- ============================================================================
-- 5. VERIFICAR VISTAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE VISTAS ===' AS titulo;

SELECT
    'vista_colab_intentos_login_recientes' AS vista,
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA') AS estado
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_intentos_login_recientes'
UNION ALL
SELECT 'vista_colab_bloqueos_activos',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_bloqueos_activos'
UNION ALL
SELECT 'vista_colab_documentos_vencidos',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_documentos_vencidos'
UNION ALL
SELECT 'vista_colab_capacitaciones_pendientes',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_capacitaciones_pendientes'
UNION ALL
SELECT 'vista_colab_evaluaciones_resumen',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_evaluaciones_resumen'
UNION ALL
SELECT 'vista_colab_equipos_completa',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_equipos_completa'
UNION ALL
SELECT 'vista_colab_incidencias_abiertas',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_incidencias_abiertas'
UNION ALL
SELECT 'vista_colab_alertas_no_leidas',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_alertas_no_leidas'
UNION ALL
SELECT 'vista_colab_seguridad_resumen',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_seguridad_resumen';

-- ============================================================================
-- 6. VERIFICAR PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE PROCEDIMIENTOS ===' AS titulo;

SELECT
    'sp_colab_registrar_intento_login' AS procedimiento,
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO') AS estado
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_registrar_intento_login' AND routine_type = 'PROCEDURE'
UNION ALL
SELECT 'sp_colab_verificar_bloqueo',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_verificar_bloqueo' AND routine_type = 'PROCEDURE'
UNION ALL
SELECT 'sp_colab_bloquear_cuenta',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_bloquear_cuenta' AND routine_type = 'PROCEDURE'
UNION ALL
SELECT 'sp_colab_desbloquear_cuenta',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_desbloquear_cuenta' AND routine_type = 'PROCEDURE'
UNION ALL
SELECT 'sp_colab_generar_alerta_seguridad',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_generar_alerta_seguridad' AND routine_type = 'PROCEDURE'
UNION ALL
SELECT 'sp_colab_registrar_incidencia',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_registrar_incidencia' AND routine_type = 'PROCEDURE'
UNION ALL
SELECT 'sp_colab_cerrar_incidencia',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_cerrar_incidencia' AND routine_type = 'PROCEDURE';

-- ============================================================================
-- 7. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TRIGGERS ===' AS titulo;

SELECT
    'trg_colab_auto_bloqueo_login' AS trigger_nombre,
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO') AS estado
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual' AND trigger_name = 'trg_colab_auto_bloqueo_login'
UNION ALL
SELECT 'trg_colab_auditoria_cambio_estado',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual' AND trigger_name = 'trg_colab_auditoria_cambio_estado';

-- ============================================================================
-- 8. VERIFICAR EVENTOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE EVENTOS ===' AS titulo;

SELECT
    'evento_colab_limpiar_intentos_login' AS evento,
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO') AS estado
FROM information_schema.events
WHERE event_schema = 'tienda_virtual' AND event_name = 'evento_colab_limpiar_intentos_login'
UNION ALL
SELECT 'evento_colab_alertar_documentos_vencidos',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.events
WHERE event_schema = 'tienda_virtual' AND event_name = 'evento_colab_alertar_documentos_vencidos'
UNION ALL
SELECT 'evento_colab_alertar_capacitaciones_vencidas',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.events
WHERE event_schema = 'tienda_virtual' AND event_name = 'evento_colab_alertar_capacitaciones_vencidas'
UNION ALL
SELECT 'evento_colab_alertar_evaluaciones_pendientes',
    IF(COUNT(*) > 0, '✅ EXISTE', '❌ NO ENCONTRADO')
FROM information_schema.events
WHERE event_schema = 'tienda_virtual' AND event_name = 'evento_colab_alertar_evaluaciones_pendientes';

-- ============================================================================
-- 9. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE DATOS INICIALES ===' AS titulo;

-- Módulos nuevos
SELECT
    'Módulos nuevos del portal' AS verificacion,
    COUNT(*) AS total,
    IF(COUNT(*) >= 6, '✅ COMPLETO', '⚠️ FALTAN') AS estado
FROM colab_modulos
WHERE codigo IN (
    'colab_seguridad', 'colab_documentos', 'colab_capacitaciones',
    'colab_evaluaciones', 'colab_mi_equipo', 'colab_incidencias'
);

-- Permisos nuevos
SELECT
    'Permisos nuevos del portal' AS verificacion,
    COUNT(*) AS total,
    IF(COUNT(*) >= 18, '✅ COMPLETO', '⚠️ FALTAN') AS estado
FROM colab_permisos
WHERE codigo LIKE 'colab_seguridad.%'
   OR codigo LIKE 'colab_documentos.%'
   OR codigo LIKE 'colab_capacitaciones.%'
   OR codigo LIKE 'colab_evaluaciones.%'
   OR codigo LIKE 'colab_equipo.%'
   OR codigo LIKE 'colab_incidencias.%';

-- Configuración de seguridad avanzada
SELECT
    'Configuración seguridad avanzada' AS verificacion,
    COUNT(*) AS total,
    IF(COUNT(*) >= 15, '✅ COMPLETO', '⚠️ FALTAN') AS estado
FROM colab_configuracion
WHERE clave IN (
    'bloqueo_nivel1_minutos', 'bloqueo_nivel2_minutos', 'bloqueo_nivel3_minutos',
    'intentos_nivel1', 'intentos_nivel2', 'intentos_nivel3',
    'alerta_login_sospechoso', 'alerta_acceso_fuera_horario',
    'documentos_tamano_maximo_mb', 'evaluacion_periodo_defecto'
);

-- Permisos admin nuevos
SELECT
    'Permisos admin para nuevas funcionalidades' AS verificacion,
    COUNT(*) AS total,
    IF(COUNT(*) >= 7, '✅ COMPLETO', '⚠️ FALTAN') AS estado
FROM permisos
WHERE codigo IN (
    'colaboradores.documentos', 'colaboradores.capacitaciones',
    'colaboradores.evaluaciones', 'colaboradores.equipos',
    'colaboradores.incidencias', 'colaboradores.seguridad',
    'colaboradores.alertas'
);

-- Permisos asignados a roles de colaboradores
SELECT
    'Permisos F14 asignados a Jefe Bodega' AS verificacion,
    COUNT(*) AS total
FROM colab_roles_permisos rp
JOIN colab_roles r ON rp.rol_id = r.id
JOIN colab_permisos p ON rp.permiso_id = p.id
WHERE r.codigo = 'jefe_bodega'
    AND (p.codigo LIKE 'colab_seguridad.%'
      OR p.codigo LIKE 'colab_documentos.%'
      OR p.codigo LIKE 'colab_capacitaciones.%'
      OR p.codigo LIKE 'colab_evaluaciones.%'
      OR p.codigo LIKE 'colab_equipo.%'
      OR p.codigo LIKE 'colab_incidencias.%');

-- ============================================================================
-- 10. RESUMEN DE INTEGRIDAD REFERENCIAL
-- ============================================================================

SELECT '=== RESUMEN DE INTEGRIDAD ===' AS titulo;

SELECT
    'Total tablas Fase 14' AS metrica,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
    AND table_name IN (
        'colab_intentos_login', 'colab_bloqueos', 'colab_ips_confiables',
        'colab_horarios_acceso', 'colab_documentos', 'colab_capacitaciones',
        'colab_capacitaciones_participantes', 'colab_evaluaciones',
        'colab_evaluaciones_criterios', 'colab_equipos', 'colab_equipos_miembros',
        'colab_incidencias', 'colab_incidencias_seguimiento', 'colab_alertas'
    )
UNION ALL
SELECT
    'Total FK Fase 14',
    COUNT(*)
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'tienda_virtual'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND TABLE_NAME IN (
        'colab_intentos_login', 'colab_bloqueos', 'colab_ips_confiables',
        'colab_horarios_acceso', 'colab_documentos', 'colab_capacitaciones',
        'colab_capacitaciones_participantes', 'colab_evaluaciones',
        'colab_evaluaciones_criterios', 'colab_equipos', 'colab_equipos_miembros',
        'colab_incidencias', 'colab_incidencias_seguimiento', 'colab_alertas'
    )
UNION ALL
SELECT
    'Total vistas Fase 14',
    COUNT(*)
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
    AND table_name IN (
        'vista_colab_intentos_login_recientes', 'vista_colab_bloqueos_activos',
        'vista_colab_documentos_vencidos', 'vista_colab_capacitaciones_pendientes',
        'vista_colab_evaluaciones_resumen', 'vista_colab_equipos_completa',
        'vista_colab_incidencias_abiertas', 'vista_colab_alertas_no_leidas',
        'vista_colab_seguridad_resumen'
    )
UNION ALL
SELECT
    'Total procedimientos Fase 14',
    COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
    AND routine_type = 'PROCEDURE'
    AND routine_name IN (
        'sp_colab_registrar_intento_login', 'sp_colab_verificar_bloqueo',
        'sp_colab_bloquear_cuenta', 'sp_colab_desbloquear_cuenta',
        'sp_colab_generar_alerta_seguridad', 'sp_colab_registrar_incidencia',
        'sp_colab_cerrar_incidencia'
    );

-- ============================================================================
-- 11. CONTEO TOTAL DE OBJETOS DEL MÓDULO COLABORADORES (F13 + F14)
-- ============================================================================

SELECT '=== RESUMEN TOTAL MÓDULO COLABORADORES ===' AS titulo;

SELECT
    'Total tablas colab_*' AS metrica,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
    AND table_name LIKE 'colab_%';

SELECT
    'Total vistas colaboradores' AS metrica,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
    AND table_name LIKE 'vista_colab_%';

SELECT
    'Total procedimientos colaboradores' AS metrica,
    COUNT(*) AS cantidad
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
    AND routine_type = 'PROCEDURE'
    AND routine_name LIKE 'sp_colab_%';

SELECT
    'Total eventos colaboradores' AS metrica,
    COUNT(*) AS cantidad
FROM information_schema.events
WHERE event_schema = 'tienda_virtual'
    AND event_name LIKE 'evento_colab_%';

SELECT
    'Total triggers colaboradores' AS metrica,
    COUNT(*) AS cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
    AND trigger_name LIKE 'trg_colab_%';

-- ============================================================================
-- FIN DE VERIFICACIÓN
-- ============================================================================

SELECT '========================================' AS '';
SELECT 'VERIFICACIÓN FASE 14 COMPLETADA' AS estado;
SELECT NOW() AS fecha_verificacion;
SELECT '========================================' AS '';
