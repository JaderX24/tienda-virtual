-- ============================================================================
-- TIENDA VIRTUAL - VERIFICACIÓN FASE 15
-- ============================================================================
-- Datos de Referencia Iniciales (Prisma)
-- Fecha: 10/03/2026
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- 1. VERIFICAR TABLAS CON DATOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE DATOS FASE 15 ===' AS titulo;

SELECT
    'permisos' AS tabla,
    COUNT(*) AS registros,
    IF(COUNT(*) >= 25, '✅ OK', '⚠️ INCOMPLETO') AS estado
FROM permisos
UNION ALL
SELECT
    'roles',
    COUNT(*),
    IF(COUNT(*) >= 6, '✅ OK', '⚠️ INCOMPLETO')
FROM roles
UNION ALL
SELECT
    'roles_permisos',
    COUNT(*),
    IF(COUNT(*) >= 25, '✅ OK', '⚠️ INCOMPLETO')
FROM roles_permisos
UNION ALL
SELECT
    'usuarios',
    COUNT(*),
    IF(COUNT(*) >= 1, '✅ OK', '⚠️ INCOMPLETO')
FROM usuarios
UNION ALL
SELECT
    'categorias',
    COUNT(*),
    IF(COUNT(*) >= 4, '✅ OK', '⚠️ INCOMPLETO')
FROM categorias
UNION ALL
SELECT
    'parametros_sistema',
    COUNT(*),
    IF(COUNT(*) >= 20, '✅ OK', '⚠️ INCOMPLETO')
FROM parametros_sistema
UNION ALL
SELECT
    'catalogos',
    COUNT(*),
    IF(COUNT(*) >= 109, '✅ OK', '⚠️ INCOMPLETO')
FROM catalogos
UNION ALL
SELECT
    'empresas',
    COUNT(*),
    IF(COUNT(*) >= 6, '✅ OK', '⚠️ INCOMPLETO')
FROM empresas;

-- ============================================================================
-- 2. VERIFICAR USUARIO ADMINISTRADOR
-- ============================================================================

SELECT '=== VERIFICACIÓN USUARIO ADMIN ===' AS titulo;

SELECT
    correo,
    nombre,
    activo,
    IF(contrasena_hash IS NOT NULL AND LENGTH(contrasena_hash) > 50, '✅ HASH OK', '❌ SIN HASH') AS estado_hash,
    IF(rol_id IS NOT NULL, '✅ ROL ASIGNADO', '❌ SIN ROL') AS estado_rol
FROM usuarios
WHERE correo = 'admin@tiendavirtual.com';

-- ============================================================================
-- 3. VERIFICAR CATÁLOGOS POR GRUPO
-- ============================================================================

SELECT '=== CATÁLOGOS POR GRUPO ===' AS titulo;

SELECT
    grupo,
    COUNT(*) AS registros,
    '✅ OK' AS estado
FROM catalogos
WHERE activo = 1
GROUP BY grupo
ORDER BY grupo;

-- ============================================================================
-- 4. VERIFICAR PARÁMETROS POR CATEGORÍA
-- ============================================================================

SELECT '=== PARÁMETROS POR CATEGORÍA ===' AS titulo;

SELECT
    categoria,
    COUNT(*) AS registros,
    '✅ OK' AS estado
FROM parametros_sistema
GROUP BY categoria
ORDER BY categoria;

-- ============================================================================
-- 5. VERIFICAR ROLES Y PERMISOS
-- ============================================================================

SELECT '=== PERMISOS POR ROL ===' AS titulo;

SELECT
    r.codigo AS rol,
    r.nombre,
    COUNT(rp.permiso_id) AS total_permisos
FROM roles r
LEFT JOIN roles_permisos rp ON rp.rol_id = r.id
GROUP BY r.id, r.codigo, r.nombre
ORDER BY COUNT(rp.permiso_id) DESC;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT 'FASE 15 VERIFICACIÓN COMPLETADA' AS estado;
SELECT '========================================' AS '';
