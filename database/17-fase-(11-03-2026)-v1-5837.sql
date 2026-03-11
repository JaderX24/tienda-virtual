-- =====================================================
-- FASE 17: Catálogo de estados de proveedor de envío
-- Fecha: 11/03/2026
-- Versión: 1.0
-- =====================================================

USE tienda_virtual;

-- Estados de proveedor de envío
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('estadosProveedorEnvio', 'activo',      'Activo',      'Proveedor operando normalmente', 1, 1, NOW(), NOW()),
('estadosProveedorEnvio', 'inactivo',    'Inactivo',    'Proveedor deshabilitado',        2, 1, NOW(), NOW()),
('estadosProveedorEnvio', 'suspendido',  'Suspendido',  'Proveedor suspendido',           3, 1, NOW(), NOW()),
('estadosProveedorEnvio', 'en_revision', 'En Revisión', 'Proveedor en proceso de revisión', 4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Verificación
SELECT grupo, COUNT(*) as total FROM catalogos WHERE grupo = 'estadosProveedorEnvio' AND activo = 1 GROUP BY grupo;
