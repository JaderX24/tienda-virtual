-- ============================================================================
-- TIENDA VIRTUAL - VERIFICACIÓN FASE 13
-- ============================================================================
-- Portal de Colaboradores (Operaciones)
-- Fecha: 10/02/2026
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- 1. VERIFICAR TABLAS CREADAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TABLAS FASE 13 ===' AS titulo;

SELECT
    'colab_configuracion' AS tabla,
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA') AS estado
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_configuracion'
UNION ALL
SELECT 'colab_usuarios',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_usuarios'
UNION ALL
SELECT 'colab_usuarios_historial_contrasenas',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_usuarios_historial_contrasenas'
UNION ALL
SELECT 'colab_modulos',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_modulos'
UNION ALL
SELECT 'colab_permisos',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_permisos'
UNION ALL
SELECT 'colab_roles',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_roles'
UNION ALL
SELECT 'colab_roles_permisos',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_roles_permisos'
UNION ALL
SELECT 'colab_usuarios_roles',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_usuarios_roles'
UNION ALL
SELECT 'colab_usuarios_permisos',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_usuarios_permisos'
UNION ALL
SELECT 'colab_tokens',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_tokens'
UNION ALL
SELECT 'colab_dispositivos',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_dispositivos'
UNION ALL
SELECT 'colab_sesiones',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_sesiones'
UNION ALL
SELECT 'colab_bitacora_seguridad',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_bitacora_seguridad'
UNION ALL
SELECT 'colab_asignaciones_almacen',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_asignaciones_almacen'
UNION ALL
SELECT 'colab_turnos',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_turnos'
UNION ALL
SELECT 'colab_actividad_inventario',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_actividad_inventario'
UNION ALL
SELECT 'colab_conteos_inventario',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_conteos_inventario'
UNION ALL
SELECT 'colab_conteos_inventario_detalle',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_conteos_inventario_detalle'
UNION ALL
SELECT 'colab_notificaciones',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual' AND table_name = 'colab_notificaciones';

-- ============================================================================
-- 2. VERIFICAR VISTAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE VISTAS ===' AS titulo;

SELECT
    'vista_colab_usuarios_completa' AS vista,
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA') AS estado
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_usuarios_completa'
UNION ALL
SELECT 'vista_colab_asignaciones_activas',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_asignaciones_activas'
UNION ALL
SELECT 'vista_colab_actividad_reciente',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_actividad_reciente'
UNION ALL
SELECT 'vista_colab_conteos_pendientes',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_conteos_pendientes'
UNION ALL
SELECT 'vista_colab_turnos_hoy',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_turnos_hoy'
UNION ALL
SELECT 'vista_colab_stock_asignado',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADA')
FROM information_schema.views
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_colab_stock_asignado';

-- ============================================================================
-- 3. VERIFICAR PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE PROCEDIMIENTOS ===' AS titulo;

SELECT
    'sp_colab_registrar_entrada_mercancia' AS procedimiento,
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO') AS estado
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_registrar_entrada_mercancia'
UNION ALL
SELECT 'sp_colab_registrar_salida_mercancia',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_registrar_salida_mercancia'
UNION ALL
SELECT 'sp_colab_iniciar_conteo_inventario',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_iniciar_conteo_inventario'
UNION ALL
SELECT 'sp_colab_cerrar_conteo_inventario',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_cerrar_conteo_inventario'
UNION ALL
SELECT 'sp_colab_transferir_entre_almacenes',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO')
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_colab_transferir_entre_almacenes';

-- ============================================================================
-- 4. VERIFICAR EVENTOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE EVENTOS ===' AS titulo;

SELECT
    'evento_colab_cerrar_sesiones_expiradas' AS evento,
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO') AS estado
FROM information_schema.events
WHERE event_schema = 'tienda_virtual' AND event_name = 'evento_colab_cerrar_sesiones_expiradas'
UNION ALL
SELECT 'evento_colab_cerrar_turnos_olvidados',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO')
FROM information_schema.events
WHERE event_schema = 'tienda_virtual' AND event_name = 'evento_colab_cerrar_turnos_olvidados'
UNION ALL
SELECT 'evento_colab_limpiar_tokens_expirados',
    IF(COUNT(*) > 0, 'EXISTE', 'NO ENCONTRADO')
FROM information_schema.events
WHERE event_schema = 'tienda_virtual' AND event_name = 'evento_colab_limpiar_tokens_expirados';

-- ============================================================================
-- 5. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '=== DATOS INICIALES: MÓDULOS ===' AS titulo;
SELECT id, codigo, nombre, icono, ruta, orden FROM colab_modulos ORDER BY orden;

SELECT '=== DATOS INICIALES: ROLES ===' AS titulo;
SELECT id, codigo, nombre, nivel_jerarquia, es_supervisor, color FROM colab_roles ORDER BY nivel_jerarquia DESC;

SELECT '=== DATOS INICIALES: PERMISOS POR ROL ===' AS titulo;
SELECT
    r.nombre AS rol,
    COUNT(rp.permiso_id) AS total_permisos
FROM colab_roles r
LEFT JOIN colab_roles_permisos rp ON r.id = rp.rol_id
GROUP BY r.id, r.nombre
ORDER BY r.nivel_jerarquia DESC;

SELECT '=== DATOS INICIALES: CONFIGURACIÓN ===' AS titulo;
SELECT clave, valor, tipo_dato, categoria FROM colab_configuracion ORDER BY categoria, clave;

-- ============================================================================
-- 6. VERIFICAR PERMISOS EN MÓDULO ADMIN
-- ============================================================================

SELECT '=== MÓDULO ADMIN: PERMISOS COLABORADORES ===' AS titulo;
SELECT id, codigo, nombre, modulo FROM permisos WHERE codigo LIKE 'colaboradores.%';

-- ============================================================================
-- 7. VERIFICAR INTEGRIDAD DE FK
-- ============================================================================

SELECT '=== VERIFICACIÓN FK ===' AS titulo;
SELECT
    TABLE_NAME AS tabla,
    CONSTRAINT_NAME AS restriccion,
    REFERENCED_TABLE_NAME AS tabla_referenciada
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'tienda_virtual'
    AND TABLE_NAME LIKE 'colab_%'
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- ============================================================================
-- 8. VERIFICAR ÍNDICES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE ÍNDICES ===' AS titulo;
SELECT
    TABLE_NAME AS tabla,
    COUNT(*) AS total_indices
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'tienda_virtual'
    AND TABLE_NAME LIKE 'colab_%'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

-- ============================================================================
-- 9. CONTEO TOTAL DE AISLAMIENTO
-- ============================================================================

SELECT '=== RESUMEN DE AISLAMIENTO ===' AS titulo;

SELECT
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'tienda_virtual' AND table_name LIKE 'colab_%') AS tablas_colab,
    (SELECT COUNT(*) FROM information_schema.views
     WHERE table_schema = 'tienda_virtual' AND table_name LIKE 'vista_colab_%') AS vistas_colab,
    (SELECT COUNT(*) FROM information_schema.routines
     WHERE routine_schema = 'tienda_virtual' AND routine_name LIKE 'sp_colab_%') AS procedimientos_colab,
    (SELECT COUNT(*) FROM information_schema.events
     WHERE event_schema = 'tienda_virtual' AND event_name LIKE 'evento_colab_%') AS eventos_colab,
    (SELECT COUNT(*) FROM colab_modulos) AS modulos_registrados,
    (SELECT COUNT(*) FROM colab_roles) AS roles_registrados,
    (SELECT COUNT(*) FROM colab_permisos) AS permisos_registrados,
    (SELECT COUNT(*) FROM colab_configuracion) AS parametros_configuracion;

-- Verificar que NO hay FK cruzadas con admin_usuarios (aislamiento)
SELECT '=== VERIFICACIÓN DE AISLAMIENTO (no debe haber FK a admin_usuarios) ===' AS titulo;
SELECT
    TABLE_NAME AS tabla,
    CONSTRAINT_NAME AS restriccion,
    COLUMN_NAME AS columna,
    REFERENCED_TABLE_NAME AS tabla_referenciada,
    CASE
        WHEN REFERENCED_TABLE_NAME = 'admin_usuarios' THEN 'ALERTA: FK hacia admin_usuarios'
        ELSE 'OK: Aislado correctamente'
    END AS estado_aislamiento
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'tienda_virtual'
    AND TABLE_NAME LIKE 'colab_%'
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY REFERENCED_TABLE_NAME;

SELECT '========================================' AS '';
SELECT 'VERIFICACIÓN FASE 13 COMPLETADA' AS estado;
SELECT NOW() AS fecha_verificacion;
SELECT '========================================' AS '';
