-- ============================================================================
-- TIENDA VIRTUAL - FASE 15: DATOS DE REFERENCIA INICIALES (PRISMA)
-- ============================================================================
-- Versión: 1.0
-- Fecha: 10/03/2026
-- Descripción: Datos de referencia iniciales para las tablas gestionadas por
--              Prisma ORM. Incluye permisos, roles, usuario administrador,
--              categorías base, parámetros del sistema, catálogos dinámicos
--              y empresas de ejemplo. Reemplaza el seed.ts de TypeScript
--              para mantener toda la data de referencia en SQL versionado.
-- Dependencias: Fases 1-14 instaladas, tablas Prisma creadas (prisma db push)
-- ============================================================================
-- PRINCIPIO DE DISEÑO: Datos de referencia en SQL, no en código
-- - Todo dato de referencia vive en archivos SQL versionados
-- - El seed.ts de TypeScript queda vacío/mínimo
-- - Idempotente: se puede ejecutar múltiples veces sin duplicar datos
-- - Usa INSERT ... ON DUPLICATE KEY UPDATE para actualizaciones seguras
-- ============================================================================

USE tienda_virtual;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '-06:00';

-- ============================================================================
-- SECCIÓN 1: PERMISOS DEL SISTEMA
-- ============================================================================

INSERT INTO permisos (codigo, nombre, modulo, creado_en) VALUES
('usuarios:leer',         'Leer usuarios',         'usuarios',       NOW()),
('usuarios:crear',        'Crear usuarios',        'usuarios',       NOW()),
('usuarios:editar',       'Editar usuarios',       'usuarios',       NOW()),
('usuarios:eliminar',     'Eliminar usuarios',     'usuarios',       NOW()),
('productos:leer',        'Leer productos',        'productos',      NOW()),
('productos:crear',       'Crear productos',       'productos',      NOW()),
('productos:editar',      'Editar productos',      'productos',      NOW()),
('productos:eliminar',    'Eliminar productos',    'productos',      NOW()),
('inventario:leer',       'Leer inventario',       'inventario',     NOW()),
('inventario:gestionar',  'Gestionar inventario',  'inventario',     NOW()),
('pedidos:leer',          'Leer pedidos',          'pedidos',        NOW()),
('pedidos:crear',         'Crear pedidos',         'pedidos',        NOW()),
('pedidos:gestionar',     'Gestionar pedidos',     'pedidos',        NOW()),
('pedidos:cancelar',      'Cancelar pedidos',      'pedidos',        NOW()),
('pagos:leer',            'Leer pagos',            'pagos',          NOW()),
('pagos:procesar',        'Procesar pagos',        'pagos',          NOW()),
('pagos:reembolsar',      'Reembolsar pagos',      'pagos',          NOW()),
('reportes:leer',         'Leer reportes',         'reportes',       NOW()),
('reportes:exportar',     'Exportar reportes',     'reportes',       NOW()),
('configuracion:leer',    'Leer configuración',    'configuracion',  NOW()),
('configuracion:editar',  'Editar configuración',  'configuracion',  NOW()),
('empresas:leer',         'Leer empresas',         'empresas',       NOW()),
('empresas:crear',        'Crear empresas',        'empresas',       NOW()),
('empresas:editar',       'Editar empresas',       'empresas',       NOW()),
('empresas:eliminar',     'Eliminar empresas',     'empresas',       NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), modulo = VALUES(modulo);

SELECT CONCAT('✅ Permisos: ', COUNT(*), ' registros') AS estado FROM permisos;

-- ============================================================================
-- SECCIÓN 2: ROLES DEL SISTEMA
-- ============================================================================

INSERT INTO roles (codigo, nombre, descripcion, activo, creado_en) VALUES
('super_admin', 'Super Administrador', 'Acceso total al sistema',          1, NOW()),
('admin',       'Administrador',       'Administración general',           1, NOW()),
('gerente',     'Gerente',             'Gestión de operaciones',           1, NOW()),
('vendedor',    'Vendedor',            'Ventas y atención al cliente',     1, NOW()),
('bodeguero',   'Bodeguero',           'Control de inventario',            1, NOW()),
('cliente',     'Cliente',             'Usuario cliente de la tienda',     1, NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);

SELECT CONCAT('✅ Roles: ', COUNT(*), ' registros') AS estado FROM roles;

-- ============================================================================
-- SECCIÓN 3: ASIGNACIÓN DE PERMISOS AL SUPER ADMIN
-- ============================================================================

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.codigo = 'super_admin'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

SELECT CONCAT('✅ Permisos asignados a super_admin: ', COUNT(*), ' registros') AS estado
FROM roles_permisos rp
INNER JOIN roles r ON r.id = rp.rol_id
WHERE r.codigo = 'super_admin';

-- ============================================================================
-- SECCIÓN 4: USUARIO ADMINISTRADOR INICIAL
-- ============================================================================
-- Contraseña: Admin123456! (bcrypt 12 rounds)
-- IMPORTANTE: Cambiar esta contraseña en el primer inicio de sesión

INSERT INTO usuarios (nombre, correo, contrasena_hash, rol_id, activo, creado_en, actualizado_en) VALUES
(
    'Administrador',
    'admin@tiendavirtual.com',
    '$2b$12$Ju6Bnly9taA8bNhy7crd/.I342Suf5nhwSU.yz8Ac1h5zYTa/VOae',
    (SELECT id FROM roles WHERE codigo = 'super_admin' LIMIT 1),
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

SELECT CONCAT('✅ Usuario admin creado — correo: admin@tiendavirtual.com') AS estado;

-- ============================================================================
-- SECCIÓN 5: CATEGORÍAS DE EJEMPLO
-- ============================================================================

INSERT INTO categorias (nombre, slug, descripcion, orden, activa, creado_en, actualizado_en) VALUES
('Electrónica', 'electronica', 'Dispositivos electrónicos',  1, 1, NOW(), NOW()),
('Ropa',        'ropa',        'Prendas de vestir',          2, 1, NOW(), NOW()),
('Hogar',       'hogar',       'Artículos para el hogar',    3, 1, NOW(), NOW()),
('Deportes',    'deportes',    'Artículos deportivos',       4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);

SELECT CONCAT('✅ Categorías: ', COUNT(*), ' registros') AS estado FROM categorias;

-- ============================================================================
-- SECCIÓN 6: PARÁMETROS DEL SISTEMA
-- ============================================================================

INSERT INTO parametros_sistema (clave, valor, tipo, categoria, descripcion, editable, creado_en, actualizado_en) VALUES
('TIEMPO_EXPIRACION_TOKEN',         '15',                                                                    'numero',   'seguridad', 'Tiempo de expiración del token de acceso en minutos',            1, NOW(), NOW()),
('TIEMPO_EXPIRACION_REFRESH_TOKEN', '7',                                                                     'numero',   'seguridad', 'Tiempo de expiración del refresh token en días',                 1, NOW(), NOW()),
('MAXIMO_SESIONES_USUARIO',         '3',                                                                     'numero',   'seguridad', 'Número máximo de sesiones simultáneas por usuario',              1, NOW(), NOW()),
('INTENTOS_MAXIMOS_LOGIN',          '5',                                                                     'numero',   'seguridad', 'Intentos máximos de inicio de sesión antes de bloqueo',          1, NOW(), NOW()),
('TIEMPO_BLOQUEO_MINUTOS',          '15',                                                                    'numero',   'seguridad', 'Tiempo de bloqueo de cuenta en minutos',                         1, NOW(), NOW()),
('LONGITUD_MINIMA_CONTRASENA',      '12',                                                                    'numero',   'seguridad', 'Longitud mínima requerida para contraseñas',                     1, NOW(), NOW()),
('REQUIERE_CARACTER_ESPECIAL',      'true',                                                                  'booleano', 'seguridad', 'Requiere carácter especial en contraseñas',                      1, NOW(), NOW()),
('REQUIERE_MAYUSCULA',              'true',                                                                  'booleano', 'seguridad', 'Requiere mayúscula en contraseñas',                              1, NOW(), NOW()),
('REQUIERE_NUMERO',                 'true',                                                                  'booleano', 'seguridad', 'Requiere número en contraseñas',                                 1, NOW(), NOW()),
('TAMANO_MAXIMO_ARCHIVO_MB',        '5',                                                                     'numero',   'archivos',  'Tamaño máximo de archivo permitido en MB',                       1, NOW(), NOW()),
('EXTENSIONES_PERMITIDAS',          'jpg,jpeg,png,webp,pdf',                                                 'texto',    'archivos',  'Extensiones de archivo permitidas (separadas por coma)',          1, NOW(), NOW()),
('RUTA_ALMACENAMIENTO',             './uploads',                                                             'texto',    'archivos',  'Ruta de almacenamiento de archivos',                             0, NOW(), NOW()),
('NIVEL_LOG',                       'info',                                                                  'texto',    'sistema',   'Nivel de detalle de los logs del sistema',                       1, NOW(), NOW()),
('DIAS_RETENCION_LOGS',             '30',                                                                    'numero',   'sistema',   'Días de retención de logs antes de eliminarlos',                 1, NOW(), NOW()),
('MODO_MANTENIMIENTO',              'false',                                                                 'booleano', 'sistema',   'Activa o desactiva el modo mantenimiento',                       1, NOW(), NOW()),
('MENSAJE_MANTENIMIENTO',           'El sistema está en mantenimiento. Por favor, intente más tarde.',       'texto',    'sistema',   'Mensaje mostrado en modo mantenimiento',                         1, NOW(), NOW()),
('SMTP_ACTIVO',                     'false',                                                                 'booleano', 'correo',    'Indica si el envío de correos está activo',                      0, NOW(), NOW()),
('CORREO_REMITENTE',                'sistema@tiendavirtual.hn',                                              'texto',    'correo',    'Correo electrónico remitente del sistema',                       1, NOW(), NOW()),
('NOMBRE_SISTEMA',                  'TiendaVirtual',                                                         'texto',    'sistema',   'Nombre del sistema',                                             1, NOW(), NOW()),
('VERSION_SISTEMA',                 '1.0.0',                                                                 'texto',    'sistema',   'Versión actual del sistema',                                     0, NOW(), NOW())
ON DUPLICATE KEY UPDATE valor = VALUES(valor), tipo = VALUES(tipo), categoria = VALUES(categoria), descripcion = VALUES(descripcion);

SELECT CONCAT('✅ Parámetros del sistema: ', COUNT(*), ' registros') AS estado FROM parametros_sistema;

-- ============================================================================
-- SECCIÓN 7: CATÁLOGOS DINÁMICOS
-- ============================================================================

-- Tipos de negocio
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposNegocio', 'tienda_ropa',  'Tienda de Ropa', NULL, 1,  1, NOW(), NOW()),
('tiposNegocio', 'restaurante',  'Restaurante',    NULL, 2,  1, NOW(), NOW()),
('tiposNegocio', 'supermercado', 'Supermercado',    NULL, 3,  1, NOW(), NOW()),
('tiposNegocio', 'farmacia',     'Farmacia',        NULL, 4,  1, NOW(), NOW()),
('tiposNegocio', 'tecnologia',   'Tecnología',      NULL, 5,  1, NOW(), NOW()),
('tiposNegocio', 'ferreteria',   'Ferretería',      NULL, 6,  1, NOW(), NOW()),
('tiposNegocio', 'libreria',     'Librería',        NULL, 7,  1, NOW(), NOW()),
('tiposNegocio', 'servicios',    'Servicios',       NULL, 8,  1, NOW(), NOW()),
('tiposNegocio', 'mayorista',    'Mayorista',       NULL, 9,  1, NOW(), NOW()),
('tiposNegocio', 'otro',         'Otro',            NULL, 10, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Planes de suscripción
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('planesSuscripcion', 'basico',       'Básico',       'Funcionalidades básicas',    1, 1, NOW(), NOW()),
('planesSuscripcion', 'profesional',  'Profesional',  'Funcionalidades avanzadas',  2, 1, NOW(), NOW()),
('planesSuscripcion', 'empresarial',  'Empresarial',  'Para empresas grandes',      3, 1, NOW(), NOW()),
('planesSuscripcion', 'premium',      'Premium',      'Todas las funcionalidades',  4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Rangos de empleados
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('rangosEmpleados', '1-5',     '1-5 empleados',           NULL, 1, 1, NOW(), NOW()),
('rangosEmpleados', '6-20',    '6-20 empleados',          NULL, 2, 1, NOW(), NOW()),
('rangosEmpleados', '21-50',   '21-50 empleados',         NULL, 3, 1, NOW(), NOW()),
('rangosEmpleados', '51-100',  '51-100 empleados',        NULL, 4, 1, NOW(), NOW()),
('rangosEmpleados', '101-500', '101-500 empleados',       NULL, 5, 1, NOW(), NOW()),
('rangosEmpleados', '500+',    'Más de 500 empleados',    NULL, 6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Tipos de tienda
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposTienda', 'tienda_fisica',  'Tienda Física',  NULL, 1, 1, NOW(), NOW()),
('tiposTienda', 'tienda_virtual', 'Tienda Virtual', NULL, 2, 1, NOW(), NOW()),
('tiposTienda', 'tienda_hibrida', 'Tienda Híbrida', NULL, 3, 1, NOW(), NOW()),
('tiposTienda', 'quiosco',        'Quiosco',        NULL, 4, 1, NOW(), NOW()),
('tiposTienda', 'sucursal',       'Sucursal',       NULL, 5, 1, NOW(), NOW()),
('tiposTienda', 'franquicia',     'Franquicia',     NULL, 6, 1, NOW(), NOW()),
('tiposTienda', 'popup_store',    'Pop-up Store',   NULL, 7, 1, NOW(), NOW()),
('tiposTienda', 'outlet',         'Outlet',         NULL, 8, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Estados de tienda
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('estadosTienda', 'activa',           'Activa',            NULL, 1, 1, NOW(), NOW()),
('estadosTienda', 'inactiva',         'Inactiva',          NULL, 2, 1, NOW(), NOW()),
('estadosTienda', 'en_construccion',  'En Construcción',   NULL, 3, 1, NOW(), NOW()),
('estadosTienda', 'mantenimiento',    'Mantenimiento',     NULL, 4, 1, NOW(), NOW()),
('estadosTienda', 'cerrada_temporal', 'Cerrada Temporal',  NULL, 5, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Tipos de contrato
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposContrato', 'permanente',   'Permanente',   NULL, 1, 1, NOW(), NOW()),
('tiposContrato', 'temporal',     'Temporal',      NULL, 2, 1, NOW(), NOW()),
('tiposContrato', 'medio_tiempo', 'Medio Tiempo', NULL, 3, 1, NOW(), NOW()),
('tiposContrato', 'practicante',  'Practicante',  NULL, 4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Géneros
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('generos', 'masculino',       'Masculino',       NULL, 1, 1, NOW(), NOW()),
('generos', 'femenino',        'Femenino',        NULL, 2, 1, NOW(), NOW()),
('generos', 'otro',            'Otro',            NULL, 3, 1, NOW(), NOW()),
('generos', 'no_especificado', 'No especificado', NULL, 4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Métodos 2FA
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('metodos2fa', 'ninguno', 'Ninguno',              NULL, 1, 1, NOW(), NOW()),
('metodos2fa', 'app',     'Aplicación',           NULL, 2, 1, NOW(), NOW()),
('metodos2fa', 'sms',     'SMS',                  NULL, 3, 1, NOW(), NOW()),
('metodos2fa', 'correo',  'Correo electrónico',   NULL, 4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Tipos de proveedor de envío
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposProveedorEnvio', 'interno',          'Interno',          NULL, 1, 1, NOW(), NOW()),
('tiposProveedorEnvio', 'externo',          'Externo',          NULL, 2, 1, NOW(), NOW()),
('tiposProveedorEnvio', 'freelance',        'Freelance',        NULL, 3, 1, NOW(), NOW()),
('tiposProveedorEnvio', 'empresa_courier',  'Empresa Courier',  NULL, 4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Tipos de servicio de envío
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposServicioEnvio', 'local',          'Local',          NULL, 1, 1, NOW(), NOW()),
('tiposServicioEnvio', 'nacional',       'Nacional',       NULL, 2, 1, NOW(), NOW()),
('tiposServicioEnvio', 'internacional',  'Internacional',  NULL, 3, 1, NOW(), NOW()),
('tiposServicioEnvio', 'express',        'Express',        NULL, 4, 1, NOW(), NOW()),
('tiposServicioEnvio', 'standard',       'Standard',       NULL, 5, 1, NOW(), NOW()),
('tiposServicioEnvio', 'economico',      'Económico',      NULL, 6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Zonas de cobertura
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('zonasCobertura', 'local',          'Local',          NULL, 1, 1, NOW(), NOW()),
('zonasCobertura', 'regional',       'Regional',       NULL, 2, 1, NOW(), NOW()),
('zonasCobertura', 'nacional',       'Nacional',       NULL, 3, 1, NOW(), NOW()),
('zonasCobertura', 'internacional',  'Internacional',  NULL, 4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Tipos de pasarela
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('tiposPasarela', 'tarjeta',        'Tarjeta',                        NULL, 1, 1, NOW(), NOW()),
('tiposPasarela', 'transferencia',  'Transferencia',                  NULL, 2, 1, NOW(), NOW()),
('tiposPasarela', 'wallet_digital', 'Wallet Digital',                 NULL, 3, 1, NOW(), NOW()),
('tiposPasarela', 'efectivo',       'Efectivo',                       NULL, 4, 1, NOW(), NOW()),
('tiposPasarela', 'criptomoneda',   'Criptomoneda',                   NULL, 5, 1, NOW(), NOW()),
('tiposPasarela', 'bnpl',           'Compra ahora, paga después',     NULL, 6, 1, NOW(), NOW()),
('tiposPasarela', 'otro',           'Otro',                           NULL, 7, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Modos de integración
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('modosIntegracion', 'api',      'API',      NULL, 1, 1, NOW(), NOW()),
('modosIntegracion', 'redirect', 'Redirect', NULL, 2, 1, NOW(), NOW()),
('modosIntegracion', 'iframe',   'iFrame',   NULL, 3, 1, NOW(), NOW()),
('modosIntegracion', 'sdk',      'SDK',      NULL, 4, 1, NOW(), NOW()),
('modosIntegracion', 'webhook',  'Webhook',  NULL, 5, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Departamentos de Honduras
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('departamentos', 'Francisco Morazán',  'Francisco Morazán',  NULL, 1,  1, NOW(), NOW()),
('departamentos', 'Cortés',             'Cortés',             NULL, 2,  1, NOW(), NOW()),
('departamentos', 'Atlántida',          'Atlántida',          NULL, 3,  1, NOW(), NOW()),
('departamentos', 'Choluteca',          'Choluteca',          NULL, 4,  1, NOW(), NOW()),
('departamentos', 'Comayagua',          'Comayagua',          NULL, 5,  1, NOW(), NOW()),
('departamentos', 'Copán',              'Copán',              NULL, 6,  1, NOW(), NOW()),
('departamentos', 'El Paraíso',         'El Paraíso',         NULL, 7,  1, NOW(), NOW()),
('departamentos', 'Gracias a Dios',     'Gracias a Dios',     NULL, 8,  1, NOW(), NOW()),
('departamentos', 'Intibucá',           'Intibucá',           NULL, 9,  1, NOW(), NOW()),
('departamentos', 'Islas de la Bahía',  'Islas de la Bahía',  NULL, 10, 1, NOW(), NOW()),
('departamentos', 'La Paz',             'La Paz',             NULL, 11, 1, NOW(), NOW()),
('departamentos', 'Lempira',            'Lempira',            NULL, 12, 1, NOW(), NOW()),
('departamentos', 'Ocotepeque',         'Ocotepeque',         NULL, 13, 1, NOW(), NOW()),
('departamentos', 'Olancho',            'Olancho',            NULL, 14, 1, NOW(), NOW()),
('departamentos', 'Santa Bárbara',      'Santa Bárbara',      NULL, 15, 1, NOW(), NOW()),
('departamentos', 'Valle',              'Valle',              NULL, 16, 1, NOW(), NOW()),
('departamentos', 'Yoro',               'Yoro',               NULL, 17, 1, NOW(), NOW()),
('departamentos', 'Colón',              'Colón',              NULL, 18, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Países
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('paises', 'HN', 'Honduras',       '+504', 1, 1, NOW(), NOW()),
('paises', 'GT', 'Guatemala',      '+502', 2, 1, NOW(), NOW()),
('paises', 'SV', 'El Salvador',    '+503', 3, 1, NOW(), NOW()),
('paises', 'NI', 'Nicaragua',      '+505', 4, 1, NOW(), NOW()),
('paises', 'CR', 'Costa Rica',     '+506', 5, 1, NOW(), NOW()),
('paises', 'MX', 'México',         '+52',  6, 1, NOW(), NOW()),
('paises', 'US', 'Estados Unidos', '+1',   7, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion), orden = VALUES(orden);

-- Monedas
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('monedas', 'HNL', 'Lempira (HNL)',        NULL, 1, 1, NOW(), NOW()),
('monedas', 'USD', 'Dólar (USD)',           NULL, 2, 1, NOW(), NOW()),
('monedas', 'EUR', 'Euro (EUR)',            NULL, 3, 1, NOW(), NOW()),
('monedas', 'MXN', 'Peso Mexicano (MXN)',  NULL, 4, 1, NOW(), NOW()),
('monedas', 'GTQ', 'Quetzal (GTQ)',         NULL, 5, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

-- Zonas horarias
INSERT INTO catalogos (grupo, valor, etiqueta, descripcion, orden, activo, creado_en, actualizado_en) VALUES
('zonasHorarias', 'America/Tegucigalpa', 'Honduras (UTC-6)',      NULL, 1, 1, NOW(), NOW()),
('zonasHorarias', 'America/Guatemala',   'Guatemala (UTC-6)',     NULL, 2, 1, NOW(), NOW()),
('zonasHorarias', 'America/El_Salvador', 'El Salvador (UTC-6)',   NULL, 3, 1, NOW(), NOW()),
('zonasHorarias', 'America/Mexico_City', 'México (UTC-6)',        NULL, 4, 1, NOW(), NOW()),
('zonasHorarias', 'America/New_York',    'Este EEUU (UTC-5)',     NULL, 5, 1, NOW(), NOW()),
('zonasHorarias', 'America/Chicago',     'Centro EEUU (UTC-6)',   NULL, 6, 1, NOW(), NOW()),
('zonasHorarias', 'America/Bogota',      'Colombia (UTC-5)',      NULL, 7, 1, NOW(), NOW()),
('zonasHorarias', 'America/Lima',        'Perú (UTC-5)',          NULL, 8, 1, NOW(), NOW()),
('zonasHorarias', 'Europe/Madrid',       'España (UTC+1)',        NULL, 9, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE etiqueta = VALUES(etiqueta), orden = VALUES(orden);

SELECT CONCAT('✅ Catálogos dinámicos: ', COUNT(*), ' registros en ', COUNT(DISTINCT grupo), ' grupos') AS estado FROM catalogos;

-- ============================================================================
-- SECCIÓN 8: EMPRESAS DE EJEMPLO
-- ============================================================================

INSERT INTO empresas (nombre, rtn, correo, telefono, celular, tipo_negocio, descripcion, pais, departamento, ciudad, direccion, codigo_postal, plan_suscripcion, moneda, zona_horaria, cantidad_empleados, representante_legal, sitio_web, redes_sociales, activa, creado_en, actualizado_en) VALUES
(
    'Supermercados La Colonia',
    '0801-1990-000001',
    'admin@lacolonia.hn',
    '+50422334455',
    '+50499887766',
    'supermercado',
    'Cadena de supermercados líder en Honduras',
    'HN',
    'Francisco Morazán',
    'Tegucigalpa',
    'Boulevard Morazán, Torre 1, Piso 5',
    '11101',
    'empresarial',
    'HNL',
    'America/Tegucigalpa',
    '101-500',
    'Carlos Eduardo Mendoza',
    'https://www.lacolonia.hn',
    '{"facebook": "LaColoniaHN", "instagram": "@lacolonia_hn", "whatsapp": "+50499887766"}',
    1,
    NOW(),
    NOW()
),
(
    'Farmacia Simán',
    '0801-1985-000002',
    'info@farmaciasiman.hn',
    '+50422445566',
    NULL,
    'farmacia',
    'Red de farmacias con cobertura nacional',
    'HN',
    'Cortés',
    'San Pedro Sula',
    NULL,
    NULL,
    'profesional',
    'HNL',
    'America/Tegucigalpa',
    '51-100',
    'María Elena Simán',
    NULL,
    NULL,
    1,
    NOW(),
    NOW()
),
(
    'TechHN Solutions',
    '0501-2010-000003',
    'contacto@techhn.com',
    '+50422556677',
    NULL,
    'tecnologia',
    'Soluciones tecnológicas empresariales',
    'HN',
    'Francisco Morazán',
    'Tegucigalpa',
    NULL,
    NULL,
    'premium',
    'USD',
    'America/Tegucigalpa',
    '21-50',
    NULL,
    'https://www.techhn.com',
    '{"instagram": "@techhn_solutions"}',
    1,
    NOW(),
    NOW()
),
(
    'Restaurante El Patio',
    '0801-2005-000004',
    'reservas@elpatio.hn',
    '+50422667788',
    NULL,
    'restaurante',
    'Restaurante de comida típica hondureña',
    'HN',
    'Atlántida',
    'La Ceiba',
    NULL,
    NULL,
    'basico',
    'HNL',
    'America/Tegucigalpa',
    '6-20',
    NULL,
    NULL,
    '{"facebook": "ElPatioHN", "whatsapp": "+50499667788"}',
    1,
    NOW(),
    NOW()
),
(
    'Ferretería Honduras',
    '0501-1998-000005',
    'ventas@ferreteriahonduras.hn',
    '+50422778899',
    NULL,
    'ferreteria',
    'Materiales de construcción y ferretería en general',
    'HN',
    'Comayagua',
    'Comayagua',
    NULL,
    NULL,
    'profesional',
    'HNL',
    'America/Tegucigalpa',
    '6-20',
    NULL,
    NULL,
    NULL,
    1,
    NOW(),
    NOW()
),
(
    'Librería Cultura',
    '0801-2015-000006',
    'info@librericultura.hn',
    '+50422889900',
    NULL,
    'libreria',
    'Libros, material educativo y artículos de oficina',
    'HN',
    'Cortés',
    'San Pedro Sula',
    NULL,
    NULL,
    'basico',
    'HNL',
    'America/Tegucigalpa',
    '1-5',
    NULL,
    NULL,
    NULL,
    0,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

SELECT CONCAT('✅ Empresas de ejemplo: ', COUNT(*), ' registros') AS estado FROM empresas;

-- ============================================================================
-- FIN DE FASE 15
-- ============================================================================

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '  FASE 15 COMPLETADA EXITOSAMENTE' AS estado;
SELECT '========================================' AS '';
SELECT CONCAT('  Permisos:            ', (SELECT COUNT(*) FROM permisos)) AS detalle
UNION ALL
SELECT CONCAT('  Roles:               ', (SELECT COUNT(*) FROM roles))
UNION ALL
SELECT CONCAT('  Roles-Permisos:      ', (SELECT COUNT(*) FROM roles_permisos))
UNION ALL
SELECT CONCAT('  Usuarios:            ', (SELECT COUNT(*) FROM usuarios))
UNION ALL
SELECT CONCAT('  Categorías:          ', (SELECT COUNT(*) FROM categorias))
UNION ALL
SELECT CONCAT('  Parámetros sistema:  ', (SELECT COUNT(*) FROM parametros_sistema))
UNION ALL
SELECT CONCAT('  Catálogos:           ', (SELECT COUNT(*) FROM catalogos))
UNION ALL
SELECT CONCAT('  Empresas:            ', (SELECT COUNT(*) FROM empresas));
SELECT '========================================' AS '';
