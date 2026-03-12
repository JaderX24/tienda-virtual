-- ============================================================================
-- TIENDA VIRTUAL - VERIFICACIÓN FASE 3
-- ============================================================================
-- Script para verificar que la Fase 3 se instaló correctamente
-- Ejecutar DESPUÉS de ejecutar el script principal de Fase 3
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- 1. VERIFICAR TABLAS CREADAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TABLAS FASE 3 ===' AS titulo;

SELECT 
    'seguridad_politicas_contrasena' AS tabla,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'seguridad_politicas_contrasena'

UNION ALL

SELECT 
    'seguridad_codigos_respaldo',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'seguridad_codigos_respaldo'

UNION ALL

SELECT 
    'seguridad_ips_confianza',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'seguridad_ips_confianza'

UNION ALL

SELECT 
    'seguridad_horarios_acceso',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'seguridad_horarios_acceso'

UNION ALL

SELECT 
    'notificaciones_plantillas',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'notificaciones_plantillas'

UNION ALL

SELECT 
    'notificaciones',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'notificaciones'

UNION ALL

SELECT 
    'notificaciones_preferencias',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'notificaciones_preferencias'

UNION ALL

SELECT 
    'actividad_usuarios',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'actividad_usuarios'

UNION ALL

SELECT 
    'actividad_recientes',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'actividad_recientes'

UNION ALL

SELECT 
    'actividad_favoritos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'actividad_favoritos';

-- ============================================================================
-- 2. VERIFICAR PROCEDIMIENTOS Y FUNCIONES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE PROCEDIMIENTOS Y FUNCIONES ===' AS titulo;

SELECT 
    'sp_crear_notificacion' AS objeto,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_crear_notificacion'

UNION ALL

SELECT 
    'sp_registrar_actividad',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_registrar_actividad'

UNION ALL

SELECT 
    'sp_registrar_elemento_reciente',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_registrar_elemento_reciente'

UNION ALL

SELECT 
    'sp_verificar_horario_acceso',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_verificar_horario_acceso'

UNION ALL

SELECT 
    'sp_notificar_contrasenas_expirando',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_notificar_contrasenas_expirando'

UNION ALL

SELECT 
    'fn_ip_es_confianza',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'fn_ip_es_confianza';

-- ============================================================================
-- 3. VERIFICAR EVENTOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE EVENTOS PROGRAMADOS ===' AS titulo;

SELECT 
    event_name AS evento,
    status AS estado,
    event_type AS tipo,
    interval_value AS intervalo,
    interval_field AS unidad
FROM information_schema.events 
WHERE event_schema = 'tienda_virtual'
AND event_name IN (
    'evento_notificar_contrasenas_expirando',
    'evento_limpiar_actividad_antigua',
    'evento_limpiar_notificaciones_antiguas'
);

-- ============================================================================
-- 4. VERIFICAR VISTAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE VISTAS ===' AS titulo;

SELECT 
    'vista_notificaciones_pendientes' AS vista,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_notificaciones_pendientes'

UNION ALL

SELECT 
    'vista_actividad_reciente',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_actividad_reciente'

UNION ALL

SELECT 
    'vista_contrasenas_por_expirar',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_contrasenas_por_expirar'

UNION ALL

SELECT 
    'vista_dispositivos_usuario',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_dispositivos_usuario';

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
    'trg_crear_preferencias_notificacion',
    'trg_politica_contrasena_auditoria'
);

-- ============================================================================
-- 6. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE DATOS INICIALES ===' AS titulo;

SELECT 
    'Plantillas de notificación' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 8, '✓ OK', '✗ FALTAN') AS estado
FROM notificaciones_plantillas;

SELECT 
    'Política contraseña por defecto' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 1, '✓ OK', '✗ FALTA') AS estado
FROM seguridad_politicas_contrasena 
WHERE empresa_id IS NULL;

SELECT 
    'Módulos nuevos (notificaciones, actividad, seguridad_avanzada)' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 3, '✓ OK', '✗ FALTAN') AS estado
FROM admin_modulos 
WHERE codigo IN ('notificaciones', 'actividad', 'seguridad_avanzada');

-- ============================================================================
-- 7. VERIFICAR COLUMNAS AGREGADAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE COLUMNAS NUEVAS ===' AS titulo;

SELECT 
    'admin_usuarios.debe_cambiar_contrasena' AS columna,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.columns 
WHERE table_schema = 'tienda_virtual' 
AND table_name = 'admin_usuarios' 
AND column_name = 'debe_cambiar_contrasena'

UNION ALL

SELECT 
    'admin_usuarios.contrasena_nunca_expira',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.columns 
WHERE table_schema = 'tienda_virtual' 
AND table_name = 'admin_usuarios' 
AND column_name = 'contrasena_nunca_expira'

UNION ALL

SELECT 
    'admin_empresas.politica_contrasena_id',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.columns 
WHERE table_schema = 'tienda_virtual' 
AND table_name = 'admin_empresas' 
AND column_name = 'politica_contrasena_id'

UNION ALL

SELECT 
    'admin_empresas.requiere_2fa_todos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.columns 
WHERE table_schema = 'tienda_virtual' 
AND table_name = 'admin_empresas' 
AND column_name = 'requiere_2fa_todos';

-- ============================================================================
-- 8. PRUEBA RÁPIDA DE FUNCIONALIDAD
-- ============================================================================

SELECT '=== PRUEBA DE FUNCIONALIDAD ===' AS titulo;

-- Probar función de IP de confianza (debe retornar FALSE ya que no hay IPs configuradas)
SELECT 
    'fn_ip_es_confianza(1, 1, "192.168.1.1")' AS prueba,
    fn_ip_es_confianza(1, 1, '192.168.1.1') AS resultado,
    'Esperado: 0 (FALSE)' AS esperado;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT '=== RESUMEN FASE 3 ===' AS titulo;

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name IN (
        'seguridad_politicas_contrasena', 'seguridad_codigos_respaldo',
        'seguridad_ips_confianza', 'seguridad_horarios_acceso',
        'notificaciones_plantillas', 'notificaciones', 'notificaciones_preferencias',
        'actividad_usuarios', 'actividad_recientes', 'actividad_favoritos'
     )) AS tablas_creadas,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'tienda_virtual' 
     AND routine_name IN (
        'sp_crear_notificacion', 'sp_registrar_actividad',
        'sp_registrar_elemento_reciente', 'sp_verificar_horario_acceso',
        'sp_notificar_contrasenas_expirando', 'fn_ip_es_confianza'
     )) AS procedimientos_funciones,
    (SELECT COUNT(*) FROM information_schema.events 
     WHERE event_schema = 'tienda_virtual') AS eventos_programados,
    (SELECT COUNT(*) FROM notificaciones_plantillas) AS plantillas_notificacion;

SELECT '✓ VERIFICACIÓN COMPLETADA - FASE 3 INSTALADA' AS mensaje;
