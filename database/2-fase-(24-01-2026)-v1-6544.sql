-- ============================================================================
-- TIENDA VIRTUAL - MEJORAS FASE 1
-- ============================================================================
-- Módulo: Gestión de Empresas (Multi-tenancy)
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script complementa el archivo principal de Fase 1
-- Debe ejecutarse DESPUÉS del script principal
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- ESQUEMA: EMPRESAS
-- Descripción: Gestión multi-empresa (multi-tenancy)
-- ============================================================================

-- Tabla principal de empresas
CREATE TABLE admin_empresas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    rtn VARCHAR(20) UNIQUE,
    
    -- Tipo de empresa
    tipo ENUM('matriz', 'sucursal', 'franquicia', 'proveedor', 'aliado') NOT NULL DEFAULT 'matriz',
    empresa_padre_id INT UNSIGNED,
    
    -- Contacto principal
    correo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    telefono_secundario VARCHAR(20),
    sitio_web VARCHAR(255),
    
    -- Dirección
    direccion TEXT,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    codigo_postal VARCHAR(20),
    pais VARCHAR(100) NOT NULL DEFAULT 'Honduras',
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Representante legal
    representante_nombre VARCHAR(200),
    representante_identidad VARCHAR(20),
    representante_telefono VARCHAR(20),
    representante_correo VARCHAR(255),
    
    -- Configuración comercial
    moneda_principal VARCHAR(10) NOT NULL DEFAULT 'HNL',
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Tegucigalpa',
    formato_fecha VARCHAR(20) NOT NULL DEFAULT 'dd/MM/yyyy',
    
    -- Límites y cuotas
    limite_usuarios INT UNSIGNED DEFAULT 10,
    limite_productos INT UNSIGNED DEFAULT 1000,
    limite_almacenamiento_mb INT UNSIGNED DEFAULT 5120,
    
    -- Estado
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_activacion DATE,
    fecha_suspension DATE,
    motivo_suspension TEXT,
    
    -- Suscripción/Plan
    plan_actual ENUM('basico', 'profesional', 'empresarial', 'personalizado') NOT NULL DEFAULT 'basico',
    plan_vence_en DATE,
    
    -- Branding
    logo_url VARCHAR(500),
    color_primario VARCHAR(7) DEFAULT '#007bff',
    color_secundario VARCHAR(7) DEFAULT '#6c757d',
    
    -- Metadata
    notas TEXT,
    datos_adicionales JSON,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    actualizado_por INT UNSIGNED,
    
    -- Índices
    INDEX idx_codigo (codigo),
    INDEX idx_nombre (nombre),
    INDEX idx_activa (es_activa),
    INDEX idx_tipo (tipo),
    INDEX idx_empresa_padre (empresa_padre_id),
    INDEX idx_pais_ciudad (pais, ciudad),
    
    -- Restricciones
    CONSTRAINT fk_empresa_padre 
        FOREIGN KEY (empresa_padre_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia: Usuarios - Empresas (un usuario puede pertenecer a múltiples empresas)
CREATE TABLE admin_usuarios_empresas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED NOT NULL,
    
    -- Rol dentro de la empresa
    rol_empresa ENUM('propietario', 'administrador', 'gerente', 'empleado', 'colaborador') NOT NULL DEFAULT 'empleado',
    cargo VARCHAR(150),
    departamento VARCHAR(100),
    
    -- Control
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    puede_cambiar_empresa BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Vigencia
    fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    asignado_por INT UNSIGNED,
    
    -- Restricciones
    UNIQUE KEY uk_usuario_empresa (usuario_id, empresa_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_rol (rol_empresa),
    INDEX idx_vigencia (fecha_inicio, fecha_fin),
    
    CONSTRAINT fk_ue_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ue_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración específica por empresa
CREATE TABLE admin_empresas_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT UNSIGNED NOT NULL,
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato ENUM('texto', 'numero', 'booleano', 'json', 'fecha') NOT NULL DEFAULT 'texto',
    descripcion TEXT,
    es_publica BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_empresa_clave (empresa_id, clave),
    INDEX idx_empresa (empresa_id),
    
    CONSTRAINT fk_config_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ACTUALIZAR TABLA DE USUARIOS PARA SOPORTAR EMPRESA
-- ============================================================================

-- Agregar columna empresa_id a admin_usuarios (empresa principal/actual)
ALTER TABLE admin_usuarios 
ADD COLUMN empresa_actual_id INT UNSIGNED AFTER empresa_id,
ADD INDEX idx_empresa_actual (empresa_actual_id),
ADD CONSTRAINT fk_usuario_empresa_actual 
    FOREIGN KEY (empresa_actual_id) REFERENCES admin_empresas(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- NUEVOS MÓDULOS PARA EMPRESAS
-- ============================================================================

-- Agregar módulo de empresas
INSERT INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('empresas', 'Empresas', 'Gestión de empresas y sucursales', 'bi-building', '/admin/empresas', 2, TRUE),
('mi_empresa', 'Mi Empresa', 'Configuración de mi empresa', 'bi-shop', '/admin/mi-empresa', 3, TRUE);

-- Reordenar módulos existentes
UPDATE admin_modulos SET orden = orden + 2 WHERE codigo NOT IN ('dashboard', 'empresas', 'mi_empresa');

-- Agregar permisos para empresas
INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'empresas.ver', 'Ver empresas', id, 'ver' FROM admin_modulos WHERE codigo = 'empresas'
UNION ALL
SELECT 'empresas.crear', 'Crear empresas', id, 'crear' FROM admin_modulos WHERE codigo = 'empresas'
UNION ALL
SELECT 'empresas.editar', 'Editar empresas', id, 'editar' FROM admin_modulos WHERE codigo = 'empresas'
UNION ALL
SELECT 'empresas.eliminar', 'Eliminar empresas', id, 'eliminar' FROM admin_modulos WHERE codigo = 'empresas'
UNION ALL
SELECT 'mi_empresa.ver', 'Ver mi empresa', id, 'ver' FROM admin_modulos WHERE codigo = 'mi_empresa'
UNION ALL
SELECT 'mi_empresa.editar', 'Editar mi empresa', id, 'editar' FROM admin_modulos WHERE codigo = 'mi_empresa';

-- Asignar permisos de empresas al super_admin
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos WHERE codigo LIKE 'empresas.%' OR codigo LIKE 'mi_empresa.%';

-- ============================================================================
-- ROLES ESPECÍFICOS PARA EMPRESAS
-- ============================================================================

-- Agregar nuevos roles
INSERT INTO admin_roles (codigo, nombre, descripcion, nivel_jerarquia, es_super_admin) VALUES
('empresario', 'Empresario', 'Propietario o administrador de empresa - Solo lectura general', 50, FALSE),
('bodega', 'Bodega', 'Encargado de inventario - Solo lectura de productos e inventarios', 30, FALSE);

-- ============================================================================
-- PERMISOS PARA ROL EMPRESARIO
-- ============================================================================

-- Empresario: Dashboard (solo lectura)
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 
    (SELECT id FROM admin_roles WHERE codigo = 'empresario'),
    id 
FROM admin_permisos 
WHERE codigo IN ('dashboard.ver', 'mi_empresa.ver', 'mi_empresa.editar', 'productos.ver');

-- ============================================================================
-- PERMISOS PARA ROL BODEGA
-- ============================================================================

-- Bodega: Productos e inventarios (solo lectura)
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 
    (SELECT id FROM admin_roles WHERE codigo = 'bodega'),
    id 
FROM admin_permisos 
WHERE codigo IN ('productos.ver');

-- Nota: El módulo de inventarios se agregará en una fase posterior

-- ============================================================================
-- VISTAS ACTUALIZADAS
-- ============================================================================

-- Vista de usuarios con empresa y roles
CREATE OR REPLACE VIEW vista_usuarios_completa AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
    u.correo,
    u.es_activo,
    u.ultimo_acceso,
    e.id AS empresa_id,
    e.nombre AS empresa_nombre,
    e.codigo AS empresa_codigo,
    ue.rol_empresa,
    GROUP_CONCAT(DISTINCT r.nombre ORDER BY r.nivel_jerarquia DESC SEPARATOR ', ') AS roles
FROM admin_usuarios u
LEFT JOIN admin_usuarios_empresas ue ON u.id = ue.usuario_id 
    AND ue.es_principal = TRUE
    AND (ue.fecha_fin IS NULL OR ue.fecha_fin >= CURRENT_DATE)
LEFT JOIN admin_empresas e ON ue.empresa_id = e.id AND e.es_activa = TRUE
LEFT JOIN admin_usuarios_roles ur ON u.id = ur.usuario_id 
    AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
LEFT JOIN admin_roles r ON ur.rol_id = r.id AND r.es_activo = TRUE
GROUP BY u.id, e.id, e.nombre, e.codigo, ue.rol_empresa;

-- Vista de permisos efectivos por usuario
CREATE OR REPLACE VIEW vista_permisos_usuario AS
SELECT DISTINCT
    u.id AS usuario_id,
    u.correo,
    m.codigo AS modulo_codigo,
    m.nombre AS modulo_nombre,
    p.codigo AS permiso_codigo,
    p.accion,
    CASE 
        WHEN up.tipo = 'denegado' THEN 'DENEGADO'
        WHEN up.id IS NOT NULL THEN 'DIRECTO'
        WHEN rp.id IS NOT NULL THEN 'POR_ROL'
        ELSE 'SIN_ACCESO'
    END AS origen_permiso,
    r.nombre AS rol_origen
FROM admin_usuarios u
-- Permisos por rol
LEFT JOIN admin_usuarios_roles ur ON u.id = ur.usuario_id 
    AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
LEFT JOIN admin_roles r ON ur.rol_id = r.id AND r.es_activo = TRUE
LEFT JOIN admin_roles_permisos rp ON r.id = rp.rol_id
-- Permisos directos
LEFT JOIN admin_usuarios_permisos up ON u.id = up.usuario_id 
    AND (up.fecha_fin IS NULL OR up.fecha_fin >= CURRENT_DATE)
-- Permisos y módulos
LEFT JOIN admin_permisos p ON (rp.permiso_id = p.id OR up.permiso_id = p.id) AND p.es_activo = TRUE
LEFT JOIN admin_modulos m ON p.modulo_id = m.id AND m.es_activo = TRUE
WHERE p.id IS NOT NULL;

-- Vista de empresas con estadísticas
CREATE OR REPLACE VIEW vista_empresas_estadisticas AS
SELECT 
    e.id,
    e.codigo,
    e.nombre,
    e.tipo,
    e.es_activa,
    e.plan_actual,
    e.limite_usuarios,
    e.limite_productos,
    COUNT(DISTINCT ue.usuario_id) AS total_usuarios,
    e.limite_usuarios - COUNT(DISTINCT ue.usuario_id) AS usuarios_disponibles,
    ep.nombre AS empresa_padre_nombre
FROM admin_empresas e
LEFT JOIN admin_usuarios_empresas ue ON e.id = ue.empresa_id 
    AND (ue.fecha_fin IS NULL OR ue.fecha_fin >= CURRENT_DATE)
LEFT JOIN admin_empresas ep ON e.empresa_padre_id = ep.id
GROUP BY e.id, ep.nombre;

-- ============================================================================
-- PROCEDIMIENTOS PARA VALIDACIÓN DE PERMISOS
-- ============================================================================

DELIMITER //

-- Función para verificar si un usuario tiene un permiso específico
CREATE FUNCTION fn_usuario_tiene_permiso(
    p_usuario_id INT UNSIGNED,
    p_codigo_permiso VARCHAR(100)
) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_tiene_permiso BOOLEAN DEFAULT FALSE;
    DECLARE v_es_super_admin BOOLEAN DEFAULT FALSE;
    DECLARE v_denegado BOOLEAN DEFAULT FALSE;
    
    -- Verificar si es super admin
    SELECT EXISTS(
        SELECT 1 FROM admin_usuarios_roles ur
        JOIN admin_roles r ON ur.rol_id = r.id
        WHERE ur.usuario_id = p_usuario_id
        AND r.es_super_admin = TRUE
        AND r.es_activo = TRUE
        AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
    ) INTO v_es_super_admin;
    
    IF v_es_super_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar si está explícitamente denegado
    SELECT EXISTS(
        SELECT 1 FROM admin_usuarios_permisos up
        JOIN admin_permisos p ON up.permiso_id = p.id
        WHERE up.usuario_id = p_usuario_id
        AND p.codigo = p_codigo_permiso
        AND up.tipo = 'denegado'
        AND (up.fecha_fin IS NULL OR up.fecha_fin >= CURRENT_DATE)
    ) INTO v_denegado;
    
    IF v_denegado THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar permiso directo
    SELECT EXISTS(
        SELECT 1 FROM admin_usuarios_permisos up
        JOIN admin_permisos p ON up.permiso_id = p.id
        WHERE up.usuario_id = p_usuario_id
        AND p.codigo = p_codigo_permiso
        AND up.tipo = 'otorgado'
        AND p.es_activo = TRUE
        AND (up.fecha_fin IS NULL OR up.fecha_fin >= CURRENT_DATE)
    ) INTO v_tiene_permiso;
    
    IF v_tiene_permiso THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permiso por rol
    SELECT EXISTS(
        SELECT 1 FROM admin_usuarios_roles ur
        JOIN admin_roles r ON ur.rol_id = r.id
        JOIN admin_roles_permisos rp ON r.id = rp.rol_id
        JOIN admin_permisos p ON rp.permiso_id = p.id
        WHERE ur.usuario_id = p_usuario_id
        AND p.codigo = p_codigo_permiso
        AND r.es_activo = TRUE
        AND p.es_activo = TRUE
        AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
    ) INTO v_tiene_permiso;
    
    RETURN v_tiene_permiso;
END //

-- Función para verificar si un usuario pertenece a una empresa
CREATE FUNCTION fn_usuario_pertenece_empresa(
    p_usuario_id INT UNSIGNED,
    p_empresa_id INT UNSIGNED
) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM admin_usuarios_empresas
        WHERE usuario_id = p_usuario_id
        AND empresa_id = p_empresa_id
        AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    );
END //

-- Procedimiento para obtener todos los permisos de un usuario
CREATE PROCEDURE sp_obtener_permisos_usuario(
    IN p_usuario_id INT UNSIGNED
)
BEGIN
    SELECT DISTINCT
        p.codigo,
        p.nombre,
        m.codigo AS modulo,
        p.accion,
        CASE 
            WHEN up.tipo = 'denegado' THEN FALSE
            ELSE TRUE
        END AS permitido
    FROM admin_permisos p
    JOIN admin_modulos m ON p.modulo_id = m.id
    LEFT JOIN admin_roles_permisos rp ON p.id = rp.permiso_id
    LEFT JOIN admin_roles r ON rp.rol_id = r.id AND r.es_activo = TRUE
    LEFT JOIN admin_usuarios_roles ur ON r.id = ur.rol_id 
        AND ur.usuario_id = p_usuario_id
        AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
    LEFT JOIN admin_usuarios_permisos up ON p.id = up.permiso_id 
        AND up.usuario_id = p_usuario_id
        AND (up.fecha_fin IS NULL OR up.fecha_fin >= CURRENT_DATE)
    WHERE p.es_activo = TRUE
    AND m.es_activo = TRUE
    AND (ur.id IS NOT NULL OR up.id IS NOT NULL)
    ORDER BY m.orden, p.accion;
END //

-- Procedimiento para obtener menú según permisos del usuario
CREATE PROCEDURE sp_obtener_menu_usuario(
    IN p_usuario_id INT UNSIGNED
)
BEGIN
    DECLARE v_es_super_admin BOOLEAN DEFAULT FALSE;
    
    -- Verificar si es super admin
    SELECT EXISTS(
        SELECT 1 FROM admin_usuarios_roles ur
        JOIN admin_roles r ON ur.rol_id = r.id
        WHERE ur.usuario_id = p_usuario_id
        AND r.es_super_admin = TRUE
        AND r.es_activo = TRUE
        AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
    ) INTO v_es_super_admin;
    
    IF v_es_super_admin THEN
        -- Super admin ve todo
        SELECT 
            m.id,
            m.codigo,
            m.nombre,
            m.icono,
            m.ruta,
            m.modulo_padre_id,
            m.orden
        FROM admin_modulos m
        WHERE m.es_activo = TRUE AND m.es_menu = TRUE
        ORDER BY m.orden;
    ELSE
        -- Usuario normal solo ve módulos con permiso de ver
        SELECT DISTINCT
            m.id,
            m.codigo,
            m.nombre,
            m.icono,
            m.ruta,
            m.modulo_padre_id,
            m.orden
        FROM admin_modulos m
        JOIN admin_permisos p ON m.id = p.modulo_id AND p.accion = 'ver'
        LEFT JOIN admin_roles_permisos rp ON p.id = rp.permiso_id
        LEFT JOIN admin_roles r ON rp.rol_id = r.id AND r.es_activo = TRUE
        LEFT JOIN admin_usuarios_roles ur ON r.id = ur.rol_id 
            AND ur.usuario_id = p_usuario_id
            AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
        LEFT JOIN admin_usuarios_permisos up ON p.id = up.permiso_id 
            AND up.usuario_id = p_usuario_id
            AND up.tipo = 'otorgado'
            AND (up.fecha_fin IS NULL OR up.fecha_fin >= CURRENT_DATE)
        WHERE m.es_activo = TRUE 
        AND m.es_menu = TRUE
        AND p.es_activo = TRUE
        AND (ur.id IS NOT NULL OR up.id IS NOT NULL)
        AND NOT EXISTS (
            SELECT 1 FROM admin_usuarios_permisos upd
            JOIN admin_permisos pd ON upd.permiso_id = pd.id
            WHERE upd.usuario_id = p_usuario_id
            AND pd.modulo_id = m.id
            AND pd.accion = 'ver'
            AND upd.tipo = 'denegado'
        )
        ORDER BY m.orden;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- DATOS DE EJEMPLO
-- ============================================================================

-- Empresa de ejemplo
INSERT INTO admin_empresas (codigo, nombre, nombre_comercial, rtn, correo, telefono, direccion, ciudad, departamento) VALUES
('EMP001', 'Empresa Demo S.A.', 'Demo Store', '0801-1234-56789', 'contacto@demostore.hn', '+504 2222-3333', 'Boulevard Morazán, Torre Empresarial, Piso 5', 'Tegucigalpa', 'Francisco Morazán');

-- ============================================================================
-- TRIGGER PARA AUDITORÍA DE EMPRESAS
-- ============================================================================

DELIMITER //

CREATE TRIGGER trg_admin_empresas_auditoria
AFTER UPDATE ON admin_empresas
FOR EACH ROW
BEGIN
    INSERT INTO sistema_bitacora (
        tabla_afectada, registro_id, accion, 
        datos_anteriores, datos_nuevos, usuario_id
    ) VALUES (
        'admin_empresas', NEW.id, 'actualizar',
        JSON_OBJECT(
            'nombre', OLD.nombre,
            'es_activa', OLD.es_activa,
            'plan_actual', OLD.plan_actual
        ),
        JSON_OBJECT(
            'nombre', NEW.nombre,
            'es_activa', NEW.es_activa,
            'plan_actual', NEW.plan_actual
        ),
        NEW.actualizado_por
    );
END //

DELIMITER ;

-- ============================================================================
-- FIN DEL SCRIPT - MEJORAS FASE 1 (EMPRESAS)
-- ============================================================================
