-- ============================================================================
-- TIENDA VIRTUAL - FASE 16: CATÁLOGOS DINÁMICOS OPERACIONALES
-- ============================================================================
-- Versión: 1.0
-- Fecha: 11/03/2026
-- Descripción: Catálogos dinámicos para estados, tipos y clasificaciones
--              operacionales usados en DTOs de backend. Complementa los
--              catálogos de la fase 15 con grupos necesarios para validación
--              dinámica (@EsCatalogoValido) en transferencias, conteos,
--              productos, movimientos, notificaciones y seguridad.
-- Dependencias: Fase 15 instalada, tabla catalogos existente
-- ============================================================================

USE tienda_virtual;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '-06:00';

-- ============================================================================
-- CATÁLOGOS OPERACIONALES
-- ============================================================================

-- Estados de transferencia
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('estadosTransferencia', 'pendiente',   'Pendiente',   'Transferencia creada, pendiente de envío',  1, 1, NOW(), NOW()),
('estadosTransferencia', 'en_transito', 'En Tránsito', 'Mercancía en camino al destino',            2, 1, NOW(), NOW()),
('estadosTransferencia', 'completada',  'Completada',  'Transferencia recibida y confirmada',       3, 1, NOW(), NOW()),
('estadosTransferencia', 'cancelada',   'Cancelada',   'Transferencia anulada',                     4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Tipos de conteo
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposConteo', 'parcial',  'Parcial',  'Conteo de una sección o categoría específica', 1, 1, NOW(), NOW()),
('tiposConteo', 'completo', 'Completo', 'Conteo total del almacén',                     2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Estados de conteo
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('estadosConteo', 'programado',  'Programado',  'Conteo programado para fecha futura',     1, 1, NOW(), NOW()),
('estadosConteo', 'en_progreso', 'En Progreso', 'Conteo en ejecución',                     2, 1, NOW(), NOW()),
('estadosConteo', 'completado',  'Completado',  'Conteo finalizado, pendiente aprobación',  3, 1, NOW(), NOW()),
('estadosConteo', 'aprobado',    'Aprobado',    'Conteo revisado y aprobado',               4, 1, NOW(), NOW()),
('estadosConteo', 'rechazado',   'Rechazado',   'Conteo rechazado, requiere reconteo',      5, 1, NOW(), NOW()),
('estadosConteo', 'cancelado',   'Cancelado',   'Conteo anulado',                           6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Condiciones de producto (estado físico al contar)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('condicionesProducto', 'bueno',      'Bueno',      'Producto en buen estado',                  1, 1, NOW(), NOW()),
('condicionesProducto', 'danado',     'Dañado',     'Producto con daño físico',                 2, 1, NOW(), NOW()),
('condicionesProducto', 'vencido',    'Vencido',    'Producto fuera de fecha de caducidad',     3, 1, NOW(), NOW()),
('condicionesProducto', 'defectuoso', 'Defectuoso', 'Producto con defecto de fabricación',      4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Filtros de estado de producto (para consultas)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('filtrosEstadoProducto', 'todos',      'Todos',      'Sin filtro de estado',     1, 1, NOW(), NOW()),
('filtrosEstadoProducto', 'activo',     'Activo',     'Productos activos',        2, 1, NOW(), NOW()),
('filtrosEstadoProducto', 'inactivo',   'Inactivo',   'Productos desactivados',   3, 1, NOW(), NOW()),
('filtrosEstadoProducto', 'stock_bajo', 'Stock Bajo', 'Productos con stock bajo', 4, 1, NOW(), NOW()),
('filtrosEstadoProducto', 'agotado',    'Agotado',    'Productos sin stock',      5, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Tipos de movimiento de inventario
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposMovimiento', 'entrada',       'Entrada',       'Ingreso de mercancía al almacén',       1, 1, NOW(), NOW()),
('tiposMovimiento', 'salida',        'Salida',        'Egreso de mercancía del almacén',       2, 1, NOW(), NOW()),
('tiposMovimiento', 'ajuste',        'Ajuste',        'Ajuste de inventario por diferencia',   3, 1, NOW(), NOW()),
('tiposMovimiento', 'devolucion',    'Devolución',    'Retorno de mercancía',                  4, 1, NOW(), NOW()),
('tiposMovimiento', 'transferencia', 'Transferencia', 'Movimiento entre almacenes',            5, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Tipos de operación (movimientos detallados para reportes)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposOperacion', 'entrada',          'Entrada',          'Ingreso de mercancía',              1, 1, NOW(), NOW()),
('tiposOperacion', 'salida',           'Salida',           'Egreso de mercancía',               2, 1, NOW(), NOW()),
('tiposOperacion', 'ajuste_positivo',  'Ajuste Positivo',  'Incremento por ajuste',             3, 1, NOW(), NOW()),
('tiposOperacion', 'ajuste_negativo',  'Ajuste Negativo',  'Decremento por ajuste',             4, 1, NOW(), NOW()),
('tiposOperacion', 'transferencia',    'Transferencia',    'Movimiento entre almacenes',        5, 1, NOW(), NOW()),
('tiposOperacion', 'recepcion',        'Recepción',        'Recepción de mercancía entrante',   6, 1, NOW(), NOW()),
('tiposOperacion', 'despacho',         'Despacho',         'Despacho de mercancía saliente',    7, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Tipos de notificación
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposNotificacion', 'info',    'Información',  'Notificación informativa',         1, 1, NOW(), NOW()),
('tiposNotificacion', 'success', 'Éxito',        'Operación completada con éxito',   2, 1, NOW(), NOW()),
('tiposNotificacion', 'warning', 'Advertencia',  'Notificación de advertencia',      3, 1, NOW(), NOW()),
('tiposNotificacion', 'danger',  'Peligro',      'Notificación de error o peligro',  4, 1, NOW(), NOW()),
('tiposNotificacion', 'sistema', 'Sistema',      'Notificación del sistema',         5, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Niveles de severidad (bitácora de seguridad)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('nivelesSeveridad', 'info',     'Información', 'Evento informativo',                    1, 1, NOW(), NOW()),
('nivelesSeveridad', 'warn',     'Advertencia', 'Evento que requiere atención',          2, 1, NOW(), NOW()),
('nivelesSeveridad', 'error',    'Error',       'Error en operación',                    3, 1, NOW(), NOW()),
('nivelesSeveridad', 'critical', 'Crítico',     'Evento crítico que requiere acción',    4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Tipos de evento de seguridad (bitácora)
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposEventoSeguridad', 'login_exitoso',           'Inicio de Sesión',          'Acceso exitoso al sistema',                 1,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'login_fallido',           'Intento Fallido',           'Intento de acceso fallido',                 2,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'logout',                  'Cierre de Sesión',          'Salida voluntaria del sistema',             3,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'cambio_contrasena',       'Cambio de Contraseña',      'Contraseña modificada por el usuario',      4,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'recuperacion_contrasena',  'Recuperación Contraseña',   'Solicitud de recuperación de contraseña',   5,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'bloqueo_cuenta',          'Bloqueo de Cuenta',         'Cuenta bloqueada por intentos fallidos',    6,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'desbloqueo_cuenta',       'Desbloqueo de Cuenta',      'Cuenta desbloqueada por administrador',     7,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'verificacion_2fa',        'Verificación 2FA',          'Verificación de doble factor exitosa',      8,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'fallo_2fa',               'Fallo 2FA',                 'Verificación de doble factor fallida',      9,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'dispositivo_nuevo',       'Dispositivo Nuevo',         'Acceso desde dispositivo no reconocido',   10,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'dispositivo_rechazado',   'Dispositivo Rechazado',     'Dispositivo rechazado por el usuario',     11,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'ip_no_autorizada',        'IP No Autorizada',          'Acceso desde IP no autorizada',            12,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'acceso_fuera_horario',    'Acceso Fuera de Horario',   'Intento fuera del horario permitido',      13,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'sesion_forzada',          'Sesión Forzada',            'Sesión cerrada forzosamente',              14,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'intento_escalacion',      'Intento Escalación',        'Intento de escalación de privilegios',     15,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'acceso_denegado',         'Acceso Denegado',           'Acceso denegado a recurso protegido',      16,  1, NOW(), NOW()),
('tiposEventoSeguridad', 'multiples_intentos',      'Múltiples Intentos',        'Múltiples intentos de acceso detectados',  17,  1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Categorías de parámetros del sistema
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('categoriasParametro', 'seguridad', 'Seguridad', 'Parámetros de seguridad del sistema',     1, 1, NOW(), NOW()),
('categoriasParametro', 'archivos',  'Archivos',  'Configuración de archivos y uploads',     2, 1, NOW(), NOW()),
('categoriasParametro', 'sistema',   'Sistema',   'Parámetros generales del sistema',        3, 1, NOW(), NOW()),
('categoriasParametro', 'correo',    'Correo',    'Configuración de correo electrónico',     4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT grupo, COUNT(*) AS total
FROM catalogos
WHERE grupo IN (
    'estadosTransferencia', 'tiposConteo', 'estadosConteo',
    'condicionesProducto', 'filtrosEstadoProducto', 'tiposMovimiento',
    'tiposOperacion', 'tiposNotificacion', 'nivelesSeveridad',
    'tiposEventoSeguridad', 'categoriasParametro'
)
GROUP BY grupo
ORDER BY grupo;
