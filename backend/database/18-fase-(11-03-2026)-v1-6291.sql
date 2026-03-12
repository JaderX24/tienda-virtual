-- ==========================================================================
-- FASE 18: Catálogos de roles con acceso total y roles protegidos
-- Fecha: 11/03/2026
-- Versión: 1
-- Hash: 6291
-- Descripción: Agrega catálogos para eliminar hardcoding de roles en frontend
-- ==========================================================================

USE tienda_virtual;

-- Roles con acceso total al menú administrativo (no se filtran por permisos)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('rolesAdminAccesoTotal', 'super_admin', 'Super Administrador', 'Acceso total al menú administrativo', 1, 1, NOW(), NOW()),
('rolesAdminAccesoTotal', 'admin',       'Administrador',       'Acceso total al menú administrativo', 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    etiqueta = VALUES(etiqueta),
    descripcion = VALUES(descripcion),
    orden = VALUES(orden),
    activo = VALUES(activo),
    actualizado_en = NOW();

-- Roles con acceso total al menú de colaboradores (no se filtran por permisos)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('rolesColabAccesoTotal', 'jefe_bodega', 'Jefe de Bodega', 'Acceso total al menú de colaboradores', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    etiqueta = VALUES(etiqueta),
    descripcion = VALUES(descripcion),
    orden = VALUES(orden),
    activo = VALUES(activo),
    actualizado_en = NOW();

-- Roles protegidos (no se pueden eliminar ni desactivar desde la interfaz)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('rolesProtegidos', 'super_admin', 'Super Administrador', 'Rol del sistema - no se puede eliminar', 1, 1, NOW(), NOW()),
('rolesProtegidos', 'admin',       'Administrador',       'Rol del sistema - no se puede eliminar', 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    etiqueta = VALUES(etiqueta),
    descripcion = VALUES(descripcion),
    orden = VALUES(orden),
    activo = VALUES(activo),
    actualizado_en = NOW();

-- Verificación
SELECT grupo, COUNT(*) AS total
FROM catalogos
WHERE grupo IN ('rolesAdminAccesoTotal', 'rolesColabAccesoTotal', 'rolesProtegidos')
GROUP BY grupo
ORDER BY grupo;
