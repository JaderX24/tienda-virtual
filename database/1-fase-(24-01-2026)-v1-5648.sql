-- ============================================================================
-- TIENDA VIRTUAL - BASE DE DATOS
-- ============================================================================
-- Fase 1: Módulo Administrativo y Seguridad
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- Charset: utf8mb4 (soporte completo Unicode)
-- ============================================================================

-- Configuración inicial
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '-06:00';

-- ============================================================================
-- CREACIÓN DE BASE DE DATOS
-- ============================================================================
CREATE DATABASE IF NOT EXISTS tienda_virtual
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tienda_virtual;

-- ============================================================================
-- ESQUEMA: SISTEMA
-- Descripción: Parámetros globales y configuración del sistema
-- ============================================================================

-- Tabla de parámetros del sistema
CREATE TABLE sistema_parametros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato ENUM('texto', 'numero', 'booleano', 'json', 'fecha') NOT NULL DEFAULT 'texto',
    descripcion TEXT,
    categoria VARCHAR(100) NOT NULL,
    es_editable BOOLEAN NOT NULL DEFAULT TRUE,
    es_visible BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración general
CREATE TABLE sistema_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    modulo VARCHAR(100) NOT NULL,
    clave VARCHAR(200) NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato ENUM('texto', 'numero', 'booleano', 'json', 'fecha') NOT NULL DEFAULT 'texto',
    descripcion TEXT,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_modulo_clave (modulo, clave),
    INDEX idx_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de bitácora general del sistema
CREATE TABLE sistema_bitacora (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id BIGINT UNSIGNED NOT NULL,
    accion ENUM('crear', 'actualizar', 'eliminar', 'consultar') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    usuario_id INT UNSIGNED,
    ip_address VARCHAR(45),
    user_agent TEXT,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tabla_registro (tabla_afectada, registro_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_creado_en (creado_en),
    INDEX idx_accion (accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ADMIN
-- Descripción: Gestión de usuarios administrativos, roles y permisos
-- ============================================================================

-- Tabla de módulos del sistema
CREATE TABLE admin_modulos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(100),
    ruta VARCHAR(200),
    modulo_padre_id INT UNSIGNED,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    es_menu BOOLEAN NOT NULL DEFAULT TRUE,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_modulo_padre (modulo_padre_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (es_activo),
    CONSTRAINT fk_modulo_padre 
        FOREIGN KEY (modulo_padre_id) REFERENCES admin_modulos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de permisos
CREATE TABLE admin_permisos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    modulo_id INT UNSIGNED NOT NULL,
    accion ENUM('ver', 'crear', 'editar', 'eliminar', 'exportar', 'importar', 'aprobar', 'ejecutar') NOT NULL,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_modulo (modulo_id),
    INDEX idx_accion (accion),
    INDEX idx_activo (es_activo),
    CONSTRAINT fk_permiso_modulo 
        FOREIGN KEY (modulo_id) REFERENCES admin_modulos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de roles administrativos
CREATE TABLE admin_roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel_jerarquia INT UNSIGNED NOT NULL DEFAULT 0,
    es_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_jerarquia (nivel_jerarquia),
    INDEX idx_activo (es_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia: Roles - Permisos
CREATE TABLE admin_roles_permisos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rol_id INT UNSIGNED NOT NULL,
    permiso_id INT UNSIGNED NOT NULL,
    otorgado_por INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rol_permiso (rol_id, permiso_id),
    INDEX idx_rol (rol_id),
    INDEX idx_permiso (permiso_id),
    CONSTRAINT fk_rp_rol 
        FOREIGN KEY (rol_id) REFERENCES admin_roles(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rp_permiso 
        FOREIGN KEY (permiso_id) REFERENCES admin_permisos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de usuarios administrativos
CREATE TABLE admin_usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Datos personales
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    numero_identidad VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    genero ENUM('masculino', 'femenino', 'otro', 'no_especificado') DEFAULT 'no_especificado',
    
    -- Datos de contacto
    correo VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    telefono_secundario VARCHAR(20),
    
    -- Datos laborales
    cargo VARCHAR(150),
    departamento VARCHAR(100),
    empresa_id INT UNSIGNED,
    codigo_empleado VARCHAR(50) UNIQUE,
    fecha_ingreso DATE,
    
    -- Credenciales
    contrasena_hash VARCHAR(255) NOT NULL,
    contrasena_temporal BOOLEAN NOT NULL DEFAULT FALSE,
    contrasena_expira_en DATETIME,
    ultimo_cambio_contrasena DATETIME,
    
    -- Estado y control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    verificado_en DATETIME,
    motivo_inactivacion TEXT,
    inactivado_en DATETIME,
    inactivado_por INT UNSIGNED,
    
    -- Preferencias
    idioma VARCHAR(10) NOT NULL DEFAULT 'es',
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Tegucigalpa',
    formato_fecha VARCHAR(20) NOT NULL DEFAULT 'dd/MM/yyyy',
    tema VARCHAR(20) NOT NULL DEFAULT 'claro',
    
    -- Seguridad
    requiere_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    secreto_2fa VARCHAR(255),
    metodo_2fa ENUM('ninguno', 'app', 'sms', 'correo') NOT NULL DEFAULT 'ninguno',
    
    -- Metadata
    avatar_url VARCHAR(500),
    notas TEXT,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    actualizado_por INT UNSIGNED,
    ultimo_acceso DATETIME,
    
    -- Índices
    INDEX idx_correo (correo),
    INDEX idx_activo (es_activo),
    INDEX idx_empresa (empresa_id),
    INDEX idx_nombre_apellido (nombre, apellido),
    INDEX idx_ultimo_acceso (ultimo_acceso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de contraseñas
CREATE TABLE admin_usuarios_historial_contrasenas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    CONSTRAINT fk_historial_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia: Usuarios - Roles
CREATE TABLE admin_usuarios_roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    rol_id INT UNSIGNED NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    otorgado_por INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_usuario_rol (usuario_id, rol_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_rol (rol_id),
    INDEX idx_vigencia (fecha_inicio, fecha_fin),
    CONSTRAINT fk_ur_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ur_rol 
        FOREIGN KEY (rol_id) REFERENCES admin_roles(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de permisos específicos por usuario (sobrescribe rol)
CREATE TABLE admin_usuarios_permisos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    permiso_id INT UNSIGNED NOT NULL,
    tipo ENUM('otorgado', 'denegado') NOT NULL DEFAULT 'otorgado',
    fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    motivo TEXT,
    otorgado_por INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_usuario_permiso (usuario_id, permiso_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_permiso (permiso_id),
    CONSTRAINT fk_up_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_up_permiso 
        FOREIGN KEY (permiso_id) REFERENCES admin_permisos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: SEGURIDAD
-- Descripción: Control de acceso, sesiones, auditoría de seguridad
-- ============================================================================

-- Tabla de dispositivos conocidos
CREATE TABLE seguridad_dispositivos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    huella_dispositivo VARCHAR(255) NOT NULL,
    nombre_dispositivo VARCHAR(200),
    tipo_dispositivo ENUM('desktop', 'tablet', 'mobile', 'otro') NOT NULL DEFAULT 'otro',
    navegador VARCHAR(100),
    version_navegador VARCHAR(50),
    sistema_operativo VARCHAR(100),
    version_so VARCHAR(50),
    es_confiable BOOLEAN NOT NULL DEFAULT FALSE,
    confirmado_en DATETIME,
    ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_huella (huella_dispositivo),
    UNIQUE KEY uk_usuario_huella (usuario_id, huella_dispositivo),
    CONSTRAINT fk_dispositivo_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones activas
CREATE TABLE seguridad_sesiones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) UNIQUE,
    dispositivo_id INT UNSIGNED,
    
    -- Información de conexión
    ip_address VARCHAR(45) NOT NULL,
    ip_pais VARCHAR(100),
    ip_ciudad VARCHAR(100),
    ip_isp VARCHAR(200),
    
    -- User Agent
    user_agent TEXT,
    
    -- Control de tiempo
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME NOT NULL,
    ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Estado
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    cerrada_en DATETIME,
    motivo_cierre ENUM('logout', 'expiracion', 'forzado', 'cambio_contrasena', 'seguridad') DEFAULT NULL,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (token_hash),
    INDEX idx_activa (es_activa),
    INDEX idx_expira (expira_en),
    INDEX idx_dispositivo (dispositivo_id),
    CONSTRAINT fk_sesion_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sesion_dispositivo 
        FOREIGN KEY (dispositivo_id) REFERENCES seguridad_dispositivos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de intentos de inicio de sesión
CREATE TABLE seguridad_intentos_login (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(255) NOT NULL,
    usuario_id INT UNSIGNED,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    huella_dispositivo VARCHAR(255),
    
    -- Resultado
    exitoso BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_fallo ENUM(
        'usuario_no_existe',
        'contrasena_incorrecta',
        'cuenta_inactiva',
        'cuenta_bloqueada',
        'sesion_expirada',
        '2fa_fallido',
        'ip_bloqueada',
        'dispositivo_no_confiable'
    ),
    
    -- Geolocalización
    ip_pais VARCHAR(100),
    ip_ciudad VARCHAR(100),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_correo (correo),
    INDEX idx_usuario (usuario_id),
    INDEX idx_ip (ip_address),
    INDEX idx_creado (creado_en),
    INDEX idx_exitoso (exitoso),
    CONSTRAINT fk_intento_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de bloqueos de seguridad
CREATE TABLE seguridad_bloqueos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo_bloqueo ENUM('usuario', 'ip', 'dispositivo', 'correo') NOT NULL,
    valor_bloqueado VARCHAR(255) NOT NULL,
    usuario_id INT UNSIGNED,
    
    motivo ENUM(
        'intentos_fallidos',
        'actividad_sospechosa',
        'reporte_abuso',
        'administrativo',
        'automatico'
    ) NOT NULL,
    descripcion TEXT,
    
    -- Duración
    bloqueado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME,
    es_permanente BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Gestión
    desbloqueado_en DATETIME,
    desbloqueado_por INT UNSIGNED,
    motivo_desbloqueo TEXT,
    
    -- Contadores
    intentos_durante_bloqueo INT UNSIGNED NOT NULL DEFAULT 0,
    
    INDEX idx_tipo_valor (tipo_bloqueo, valor_bloqueado),
    INDEX idx_usuario (usuario_id),
    INDEX idx_expira (expira_en),
    INDEX idx_activo (desbloqueado_en),
    CONSTRAINT fk_bloqueo_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de auditoría de acciones de seguridad
CREATE TABLE seguridad_auditoria (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED,
    sesion_id INT UNSIGNED,
    
    evento ENUM(
        'login_exitoso',
        'login_fallido',
        'logout',
        'cambio_contrasena',
        'recuperacion_contrasena',
        'activacion_2fa',
        'desactivacion_2fa',
        'nuevo_dispositivo',
        'dispositivo_confiable',
        'sesion_forzada',
        'bloqueo_cuenta',
        'desbloqueo_cuenta',
        'cambio_permisos',
        'cambio_rol',
        'acceso_denegado',
        'exportacion_datos'
    ) NOT NULL,
    
    descripcion TEXT,
    datos_adicionales JSON,
    
    -- Contexto
    ip_address VARCHAR(45),
    user_agent TEXT,
    modulo VARCHAR(100),
    recurso VARCHAR(200),
    
    -- Nivel de severidad
    severidad ENUM('info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'info',
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_sesion (sesion_id),
    INDEX idx_evento (evento),
    INDEX idx_severidad (severidad),
    INDEX idx_creado (creado_en),
    INDEX idx_ip (ip_address),
    CONSTRAINT fk_auditoria_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_auditoria_sesion 
        FOREIGN KEY (sesion_id) REFERENCES seguridad_sesiones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tokens de recuperación y verificación
CREATE TABLE seguridad_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    tipo ENUM(
        'verificacion_correo',
        'recuperacion_contrasena',
        'confirmacion_dispositivo',
        'invitacion'
    ) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    usado_en DATETIME,
    ip_solicitud VARCHAR(45),
    ip_uso VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (token_hash),
    INDEX idx_tipo (tipo),
    INDEX idx_expira (expira_en),
    CONSTRAINT fk_token_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Parámetros del sistema
INSERT INTO sistema_parametros (codigo, nombre, valor, tipo_dato, descripcion, categoria) VALUES
('SESION_DURACION_MINUTOS', 'Duración de sesión', '30', 'numero', 'Tiempo de inactividad antes de cerrar sesión (minutos)', 'seguridad'),
('SESION_MAXIMAS_POR_USUARIO', 'Sesiones máximas', '3', 'numero', 'Número máximo de sesiones simultáneas por usuario', 'seguridad'),
('LOGIN_INTENTOS_MAX', 'Intentos máximos de login', '5', 'numero', 'Intentos antes de bloquear cuenta', 'seguridad'),
('LOGIN_BLOQUEO_MINUTOS', 'Tiempo de bloqueo', '15', 'numero', 'Minutos de bloqueo tras exceder intentos', 'seguridad'),
('CONTRASENA_LONGITUD_MIN', 'Longitud mínima contraseña', '12', 'numero', 'Caracteres mínimos requeridos', 'seguridad'),
('CONTRASENA_REQUIERE_MAYUSCULA', 'Requiere mayúscula', 'true', 'booleano', 'Contraseña debe contener mayúsculas', 'seguridad'),
('CONTRASENA_REQUIERE_NUMERO', 'Requiere número', 'true', 'booleano', 'Contraseña debe contener números', 'seguridad'),
('CONTRASENA_REQUIERE_ESPECIAL', 'Requiere carácter especial', 'true', 'booleano', 'Contraseña debe contener caracteres especiales', 'seguridad'),
('CONTRASENA_HISTORIAL', 'Historial contraseñas', '5', 'numero', 'Cantidad de contraseñas anteriores que no se pueden reutilizar', 'seguridad'),
('CONTRASENA_EXPIRACION_DIAS', 'Expiración contraseña', '90', 'numero', 'Días antes de requerir cambio de contraseña', 'seguridad'),
('2FA_OBLIGATORIO', '2FA obligatorio', 'false', 'booleano', 'Requiere autenticación de dos factores', 'seguridad'),
('MONEDA_PRINCIPAL', 'Moneda principal', 'HNL', 'texto', 'Código de moneda principal del sistema', 'general'),
('MONEDA_SIMBOLO', 'Símbolo moneda', 'L', 'texto', 'Símbolo de la moneda principal', 'general'),
('ZONA_HORARIA', 'Zona horaria', 'America/Tegucigalpa', 'texto', 'Zona horaria del sistema', 'general'),
('FORMATO_FECHA', 'Formato fecha', 'dd/MM/yyyy', 'texto', 'Formato de fecha por defecto', 'general'),
('FORMATO_HORA', 'Formato hora', 'HH:mm:ss', 'texto', 'Formato de hora por defecto', 'general');

-- Módulos del sistema
INSERT INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('dashboard', 'Panel Principal', 'Vista general del sistema', 'bi-speedometer2', '/admin/dashboard', 1, TRUE),
('usuarios', 'Usuarios', 'Gestión de usuarios administrativos', 'bi-people', '/admin/usuarios', 2, TRUE),
('roles', 'Roles', 'Gestión de roles y permisos', 'bi-shield-lock', '/admin/roles', 3, TRUE),
('productos', 'Productos', 'Gestión de catálogo de productos', 'bi-box-seam', '/admin/productos', 4, TRUE),
('categorias', 'Categorías', 'Gestión de categorías', 'bi-tags', '/admin/categorias', 5, TRUE),
('pedidos', 'Pedidos', 'Gestión de pedidos', 'bi-cart', '/admin/pedidos', 6, TRUE),
('clientes', 'Clientes', 'Gestión de clientes', 'bi-person-badge', '/admin/clientes', 7, TRUE),
('reportes', 'Reportes', 'Reportes y estadísticas', 'bi-graph-up', '/admin/reportes', 8, TRUE),
('configuracion', 'Configuración', 'Configuración del sistema', 'bi-gear', '/admin/configuracion', 9, TRUE),
('auditoria', 'Auditoría', 'Registros de auditoría', 'bi-journal-text', '/admin/auditoria', 10, TRUE);

-- Permisos base por módulo
INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) VALUES
-- Dashboard
('dashboard.ver', 'Ver panel principal', 1, 'ver'),
-- Usuarios
('usuarios.ver', 'Ver usuarios', 2, 'ver'),
('usuarios.crear', 'Crear usuarios', 2, 'crear'),
('usuarios.editar', 'Editar usuarios', 2, 'editar'),
('usuarios.eliminar', 'Eliminar usuarios', 2, 'eliminar'),
('usuarios.exportar', 'Exportar usuarios', 2, 'exportar'),
-- Roles
('roles.ver', 'Ver roles', 3, 'ver'),
('roles.crear', 'Crear roles', 3, 'crear'),
('roles.editar', 'Editar roles', 3, 'editar'),
('roles.eliminar', 'Eliminar roles', 3, 'eliminar'),
-- Productos
('productos.ver', 'Ver productos', 4, 'ver'),
('productos.crear', 'Crear productos', 4, 'crear'),
('productos.editar', 'Editar productos', 4, 'editar'),
('productos.eliminar', 'Eliminar productos', 4, 'eliminar'),
('productos.exportar', 'Exportar productos', 4, 'exportar'),
('productos.importar', 'Importar productos', 4, 'importar'),
-- Categorías
('categorias.ver', 'Ver categorías', 5, 'ver'),
('categorias.crear', 'Crear categorías', 5, 'crear'),
('categorias.editar', 'Editar categorías', 5, 'editar'),
('categorias.eliminar', 'Eliminar categorías', 5, 'eliminar'),
-- Pedidos
('pedidos.ver', 'Ver pedidos', 6, 'ver'),
('pedidos.editar', 'Editar pedidos', 6, 'editar'),
('pedidos.aprobar', 'Aprobar pedidos', 6, 'aprobar'),
('pedidos.exportar', 'Exportar pedidos', 6, 'exportar'),
-- Clientes
('clientes.ver', 'Ver clientes', 7, 'ver'),
('clientes.editar', 'Editar clientes', 7, 'editar'),
('clientes.exportar', 'Exportar clientes', 7, 'exportar'),
-- Reportes
('reportes.ver', 'Ver reportes', 8, 'ver'),
('reportes.exportar', 'Exportar reportes', 8, 'exportar'),
-- Configuración
('configuracion.ver', 'Ver configuración', 9, 'ver'),
('configuracion.editar', 'Editar configuración', 9, 'editar'),
-- Auditoría
('auditoria.ver', 'Ver auditoría', 10, 'ver'),
('auditoria.exportar', 'Exportar auditoría', 10, 'exportar');

-- Roles base
INSERT INTO admin_roles (codigo, nombre, descripcion, nivel_jerarquia, es_super_admin) VALUES
('super_admin', 'Super Administrador', 'Acceso total al sistema', 100, TRUE),
('administrador', 'Administrador', 'Gestión general del sistema', 80, FALSE),
('gerente', 'Gerente', 'Supervisión y reportes', 60, FALSE),
('operador', 'Operador', 'Operaciones diarias', 40, FALSE),
('soporte', 'Soporte', 'Atención al cliente', 20, FALSE);

-- Asignar todos los permisos al super_admin
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de usuarios con sus roles
CREATE OR REPLACE VIEW vista_usuarios_roles AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
    u.correo,
    u.es_activo,
    u.ultimo_acceso,
    GROUP_CONCAT(r.nombre ORDER BY r.nivel_jerarquia DESC SEPARATOR ', ') AS roles
FROM admin_usuarios u
LEFT JOIN admin_usuarios_roles ur ON u.id = ur.usuario_id 
    AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
LEFT JOIN admin_roles r ON ur.rol_id = r.id AND r.es_activo = TRUE
GROUP BY u.id;

-- Vista de sesiones activas
CREATE OR REPLACE VIEW vista_sesiones_activas AS
SELECT 
    s.id,
    s.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS usuario,
    s.ip_address,
    s.ip_pais,
    s.ip_ciudad,
    d.nombre_dispositivo,
    d.navegador,
    d.sistema_operativo,
    s.creado_en AS inicio_sesion,
    s.ultima_actividad,
    s.expira_en,
    TIMESTAMPDIFF(MINUTE, s.ultima_actividad, NOW()) AS minutos_inactivo
FROM seguridad_sesiones s
JOIN admin_usuarios u ON s.usuario_id = u.id
LEFT JOIN seguridad_dispositivos d ON s.dispositivo_id = d.id
WHERE s.es_activa = TRUE AND s.expira_en > NOW();

-- Vista de intentos de login recientes
CREATE OR REPLACE VIEW vista_intentos_login_recientes AS
SELECT 
    i.correo,
    i.ip_address,
    i.exitoso,
    i.motivo_fallo,
    i.ip_pais,
    i.ip_ciudad,
    i.creado_en,
    u.nombre AS nombre_usuario,
    u.es_activo AS usuario_activo
FROM seguridad_intentos_login i
LEFT JOIN admin_usuarios u ON i.usuario_id = u.id
WHERE i.creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY i.creado_en DESC;

-- Vista de bloqueos activos
CREATE OR REPLACE VIEW vista_bloqueos_activos AS
SELECT 
    b.id,
    b.tipo_bloqueo,
    b.valor_bloqueado,
    b.motivo,
    b.descripcion,
    b.bloqueado_en,
    b.expira_en,
    b.es_permanente,
    b.intentos_durante_bloqueo,
    CONCAT(u.nombre, ' ', u.apellido) AS usuario_afectado
FROM seguridad_bloqueos b
LEFT JOIN admin_usuarios u ON b.usuario_id = u.id
WHERE b.desbloqueado_en IS NULL 
    AND (b.es_permanente = TRUE OR b.expira_en > NOW());

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Procedimiento para registrar intento de login
CREATE PROCEDURE sp_registrar_intento_login(
    IN p_correo VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_huella_dispositivo VARCHAR(255),
    IN p_exitoso BOOLEAN,
    IN p_motivo_fallo VARCHAR(50)
)
BEGIN
    DECLARE v_usuario_id INT UNSIGNED;
    
    SELECT id INTO v_usuario_id FROM admin_usuarios WHERE correo = p_correo LIMIT 1;
    
    INSERT INTO seguridad_intentos_login (
        correo, usuario_id, ip_address, user_agent, 
        huella_dispositivo, exitoso, motivo_fallo
    ) VALUES (
        p_correo, v_usuario_id, p_ip_address, p_user_agent,
        p_huella_dispositivo, p_exitoso, p_motivo_fallo
    );
    
    IF p_exitoso THEN
        UPDATE admin_usuarios SET ultimo_acceso = NOW() WHERE id = v_usuario_id;
    END IF;
END //

-- Procedimiento para verificar bloqueo
CREATE PROCEDURE sp_verificar_bloqueo(
    IN p_correo VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    OUT p_bloqueado BOOLEAN,
    OUT p_motivo VARCHAR(100)
)
BEGIN
    SET p_bloqueado = FALSE;
    SET p_motivo = NULL;
    
    -- Verificar bloqueo por correo
    IF EXISTS (
        SELECT 1 FROM seguridad_bloqueos 
        WHERE tipo_bloqueo = 'correo' 
        AND valor_bloqueado = p_correo
        AND desbloqueado_en IS NULL
        AND (es_permanente = TRUE OR expira_en > NOW())
    ) THEN
        SET p_bloqueado = TRUE;
        SET p_motivo = 'Correo bloqueado';
    -- Verificar bloqueo por IP
    ELSEIF EXISTS (
        SELECT 1 FROM seguridad_bloqueos 
        WHERE tipo_bloqueo = 'ip' 
        AND valor_bloqueado = p_ip_address
        AND desbloqueado_en IS NULL
        AND (es_permanente = TRUE OR expira_en > NOW())
    ) THEN
        SET p_bloqueado = TRUE;
        SET p_motivo = 'IP bloqueada';
    -- Verificar intentos fallidos recientes
    ELSEIF (
        SELECT COUNT(*) FROM seguridad_intentos_login
        WHERE correo = p_correo
        AND exitoso = FALSE
        AND creado_en >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    ) >= 5 THEN
        SET p_bloqueado = TRUE;
        SET p_motivo = 'Demasiados intentos fallidos';
    END IF;
END //

-- Procedimiento para limpiar sesiones expiradas
CREATE PROCEDURE sp_limpiar_sesiones_expiradas()
BEGIN
    UPDATE seguridad_sesiones 
    SET es_activa = FALSE, 
        cerrada_en = NOW(), 
        motivo_cierre = 'expiracion'
    WHERE es_activa = TRUE AND expira_en < NOW();
    
    SELECT ROW_COUNT() AS sesiones_cerradas;
END //

DELIMITER ;

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Habilitar el programador de eventos
SET GLOBAL event_scheduler = ON;

-- Evento para limpiar sesiones expiradas cada hora
CREATE EVENT IF NOT EXISTS evento_limpiar_sesiones
ON SCHEDULE EVERY 1 HOUR
DO CALL sp_limpiar_sesiones_expiradas();

-- Evento para limpiar intentos de login antiguos (más de 90 días)
CREATE EVENT IF NOT EXISTS evento_limpiar_intentos_login
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 3 HOUR
DO DELETE FROM seguridad_intentos_login WHERE creado_en < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger para auditar cambios en usuarios
CREATE TRIGGER trg_admin_usuarios_auditoria
AFTER UPDATE ON admin_usuarios
FOR EACH ROW
BEGIN
    INSERT INTO sistema_bitacora (
        tabla_afectada, registro_id, accion, 
        datos_anteriores, datos_nuevos, usuario_id
    ) VALUES (
        'admin_usuarios', NEW.id, 'actualizar',
        JSON_OBJECT(
            'nombre', OLD.nombre,
            'apellido', OLD.apellido,
            'correo', OLD.correo,
            'es_activo', OLD.es_activo
        ),
        JSON_OBJECT(
            'nombre', NEW.nombre,
            'apellido', NEW.apellido,
            'correo', NEW.correo,
            'es_activo', NEW.es_activo
        ),
        NEW.actualizado_por
    );
END //

-- Trigger para guardar historial de contraseñas
CREATE TRIGGER trg_guardar_historial_contrasena
BEFORE UPDATE ON admin_usuarios
FOR EACH ROW
BEGIN
    IF OLD.contrasena_hash <> NEW.contrasena_hash THEN
        INSERT INTO admin_usuarios_historial_contrasenas (usuario_id, contrasena_hash)
        VALUES (OLD.id, OLD.contrasena_hash);
        
        SET NEW.ultimo_cambio_contrasena = NOW();
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- FIN DEL SCRIPT - FASE 1
-- ============================================================================
