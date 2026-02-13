-- ============================================================================
-- TIENDA VIRTUAL - FASE 13: PORTAL DE COLABORADORES (OPERACIONES)
-- ============================================================================
-- Versión: 1.0
-- Fecha: 10/02/2026
-- Descripción: Sistema independiente de colaboradores con autenticación,
--              roles, permisos y auditoría completamente aislados del
--              módulo administrativo. Enfocado en operaciones de inventario,
--              bodega y logística con seguridad por separación de dominios.
-- Dependencias: Fases 1-12 instaladas
-- ============================================================================
-- PRINCIPIO DE DISEÑO: Aislamiento total
-- - Autenticación independiente (JWT secrets separados)
-- - RBAC propio (roles y permisos no comparten tablas con admin)
-- - Sesiones y auditoría en tablas separadas
-- - Sin referencias FK a admin_usuarios (previene escalación lateral)
-- - Acceso restringido por almacén asignado
-- ============================================================================

USE tienda_virtual;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '-06:00';

-- ============================================================================
-- LIMPIEZA DE OBJETOS EXISTENTES (idempotencia)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Vistas
DROP VIEW IF EXISTS vista_colab_usuarios_completa;
DROP VIEW IF EXISTS vista_colab_asignaciones_activas;
DROP VIEW IF EXISTS vista_colab_actividad_reciente;
DROP VIEW IF EXISTS vista_colab_conteos_pendientes;
DROP VIEW IF EXISTS vista_colab_turnos_hoy;
DROP VIEW IF EXISTS vista_colab_stock_asignado;

-- Procedimientos
DROP PROCEDURE IF EXISTS sp_colab_registrar_entrada_mercancia;
DROP PROCEDURE IF EXISTS sp_colab_registrar_salida_mercancia;
DROP PROCEDURE IF EXISTS sp_colab_iniciar_conteo_inventario;
DROP PROCEDURE IF EXISTS sp_colab_cerrar_conteo_inventario;
DROP PROCEDURE IF EXISTS sp_colab_transferir_entre_almacenes;

-- Eventos
DROP EVENT IF EXISTS evento_colab_cerrar_sesiones_expiradas;
DROP EVENT IF EXISTS evento_colab_cerrar_turnos_olvidados;
DROP EVENT IF EXISTS evento_colab_limpiar_tokens_expirados;

-- Tablas (orden inverso de dependencias)
DROP TABLE IF EXISTS colab_notificaciones;
DROP TABLE IF EXISTS colab_conteos_inventario_detalle;
DROP TABLE IF EXISTS colab_conteos_inventario;
DROP TABLE IF EXISTS colab_actividad_inventario;
DROP TABLE IF EXISTS colab_turnos;
DROP TABLE IF EXISTS colab_asignaciones_almacen;
DROP TABLE IF EXISTS colab_bitacora_seguridad;
DROP TABLE IF EXISTS colab_sesiones;
DROP TABLE IF EXISTS colab_dispositivos;
DROP TABLE IF EXISTS colab_tokens;
DROP TABLE IF EXISTS colab_usuarios_permisos;
DROP TABLE IF EXISTS colab_usuarios_roles;
DROP TABLE IF EXISTS colab_roles_permisos;
DROP TABLE IF EXISTS colab_permisos;
DROP TABLE IF EXISTS colab_modulos;
DROP TABLE IF EXISTS colab_roles;
DROP TABLE IF EXISTS colab_usuarios_historial_contrasenas;
DROP TABLE IF EXISTS colab_usuarios;
DROP TABLE IF EXISTS colab_configuracion;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLAS PREREQUISITO: Almacenes y Stock (requeridas por el portal)
-- Se crean solo si no existen para no afectar instalaciones previas
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventario_almacenes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    tipo ENUM('principal', 'secundario', 'temporal', 'devolucion', 'cross_docking') NOT NULL DEFAULT 'principal',
    descripcion TEXT,

    direccion VARCHAR(300),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    pais VARCHAR(100) NOT NULL DEFAULT 'Honduras',
    codigo_postal VARCHAR(10),
    latitud DECIMAL(10,7),
    longitud DECIMAL(10,7),

    telefono VARCHAR(20),
    correo VARCHAR(255),
    responsable VARCHAR(200),

    capacidad_maxima INT UNSIGNED,
    horario_operacion VARCHAR(200),

    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id INT,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_almacen_codigo (codigo),
    INDEX idx_almacen_activo (es_activo),
    INDEX idx_almacen_ciudad (ciudad),
    INDEX idx_almacen_empresa (empresa_id),
    CONSTRAINT fk_almacen_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventario_stock (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    variante_id INT,
    almacen_id INT UNSIGNED NOT NULL,

    cantidad_disponible INT NOT NULL DEFAULT 0,
    cantidad_reservada INT NOT NULL DEFAULT 0,
    cantidad_en_transito INT NOT NULL DEFAULT 0,
    cantidad_danada INT NOT NULL DEFAULT 0,

    stock_minimo INT NOT NULL DEFAULT 0,
    punto_reorden INT,

    ubicacion_pasillo VARCHAR(20),
    ubicacion_estante VARCHAR(20),
    ubicacion_nivel VARCHAR(20),
    ubicacion_bin VARCHAR(20),

    ultimo_costo DECIMAL(15,4),
    ultimo_movimiento DATETIME,
    ultimo_conteo DATETIME,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_stock_producto_almacen (producto_id, variante_id, almacen_id),
    INDEX idx_stock_producto (producto_id),
    INDEX idx_stock_almacen (almacen_id),
    INDEX idx_stock_disponible (cantidad_disponible),
    CONSTRAINT fk_stock_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_stock_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar almacén por defecto si la tabla está vacía
INSERT INTO inventario_almacenes (codigo, nombre, tipo, ciudad, departamento)
SELECT 'ALM-PRINCIPAL', 'Almacén Principal', 'principal', 'Tegucigalpa', 'Francisco Morazán'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM inventario_almacenes LIMIT 1);

-- ============================================================================
-- TABLA: colab_configuracion
-- Configuración independiente del portal de colaboradores
-- ============================================================================

CREATE TABLE colab_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo_dato ENUM('texto', 'numero', 'booleano', 'json', 'fecha') NOT NULL DEFAULT 'texto',
    descripcion VARCHAR(500),
    categoria VARCHAR(50) NOT NULL DEFAULT 'general',
    es_editable BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_config_categoria (categoria),
    INDEX idx_colab_config_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_usuarios
-- Usuarios del portal de colaboradores (COMPLETAMENTE AISLADO de admin_usuarios)
-- ============================================================================

CREATE TABLE colab_usuarios (
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
    telefono_emergencia VARCHAR(20),
    contacto_emergencia_nombre VARCHAR(200),

    -- Datos laborales
    codigo_colaborador VARCHAR(50) NOT NULL UNIQUE,
    cargo VARCHAR(150),
    fecha_ingreso DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_baja DATE,
    tipo_contrato ENUM('permanente', 'temporal', 'medio_tiempo', 'practicante') NOT NULL DEFAULT 'permanente',

    -- Empresa asignada
    empresa_id INT,

    -- Credenciales (independientes del sistema admin)
    contrasena_hash VARCHAR(255) NOT NULL,
    contrasena_temporal BOOLEAN NOT NULL DEFAULT TRUE,
    contrasena_expira_en DATETIME,
    ultimo_cambio_contrasena DATETIME,

    -- Estado y control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    verificado_en DATETIME,
    motivo_inactivacion TEXT,
    inactivado_en DATETIME,

    -- Preferencias
    idioma VARCHAR(10) NOT NULL DEFAULT 'es',
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Tegucigalpa',

    -- Seguridad
    requiere_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    secreto_2fa VARCHAR(255),
    metodo_2fa ENUM('ninguno', 'app', 'sms', 'correo') NOT NULL DEFAULT 'ninguno',

    -- Restricciones de acceso
    acceso_solo_ip_confiable BOOLEAN NOT NULL DEFAULT FALSE,
    acceso_solo_horario_turno BOOLEAN NOT NULL DEFAULT FALSE,
    acceso_solo_dispositivo_registrado BOOLEAN NOT NULL DEFAULT FALSE,
    max_sesiones_simultaneas TINYINT UNSIGNED NOT NULL DEFAULT 1,

    -- Avatar
    avatar_url VARCHAR(500),

    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por_admin INT UNSIGNED,
    ultimo_acceso DATETIME,

    INDEX idx_colab_correo (correo),
    INDEX idx_colab_codigo (codigo_colaborador),
    INDEX idx_colab_activo (es_activo),
    INDEX idx_colab_empresa (empresa_id),
    INDEX idx_colab_nombre (nombre, apellido),
    INDEX idx_colab_ultimo_acceso (ultimo_acceso),
    CONSTRAINT fk_colab_usuario_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_usuarios_historial_contrasenas
-- Historial para prevenir reutilización
-- ============================================================================

CREATE TABLE colab_usuarios_historial_contrasenas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_hist_usuario (usuario_id),
    CONSTRAINT fk_colab_hist_contra_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_modulos
-- Módulos disponibles en el portal de colaboradores
-- ============================================================================

CREATE TABLE colab_modulos (
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

    INDEX idx_colab_mod_padre (modulo_padre_id),
    INDEX idx_colab_mod_orden (orden),
    INDEX idx_colab_mod_activo (es_activo),
    CONSTRAINT fk_colab_modulo_padre
        FOREIGN KEY (modulo_padre_id) REFERENCES colab_modulos(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_permisos
-- Permisos del portal de colaboradores (INDEPENDIENTES de admin_permisos)
-- ============================================================================

CREATE TABLE colab_permisos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    modulo_id INT UNSIGNED NOT NULL,
    accion ENUM('ver', 'crear', 'editar', 'eliminar', 'aprobar', 'ejecutar', 'exportar') NOT NULL,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_perm_modulo (modulo_id),
    INDEX idx_colab_perm_accion (accion),
    INDEX idx_colab_perm_activo (es_activo),
    CONSTRAINT fk_colab_permiso_modulo
        FOREIGN KEY (modulo_id) REFERENCES colab_modulos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_roles
-- Roles del portal de colaboradores (INDEPENDIENTES de admin_roles)
-- ============================================================================

CREATE TABLE colab_roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel_jerarquia INT UNSIGNED NOT NULL DEFAULT 0,
    es_supervisor BOOLEAN NOT NULL DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#6c757d',
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_rol_jerarquia (nivel_jerarquia),
    INDEX idx_colab_rol_activo (es_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_roles_permisos
-- Asignación de permisos a roles de colaboradores
-- ============================================================================

CREATE TABLE colab_roles_permisos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rol_id INT UNSIGNED NOT NULL,
    permiso_id INT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_rol_permiso (rol_id, permiso_id),
    INDEX idx_colab_rp_rol (rol_id),
    INDEX idx_colab_rp_permiso (permiso_id),
    CONSTRAINT fk_colab_rp_rol
        FOREIGN KEY (rol_id) REFERENCES colab_roles(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_rp_permiso
        FOREIGN KEY (permiso_id) REFERENCES colab_permisos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_usuarios_roles
-- Asignación de roles a colaboradores
-- ============================================================================

CREATE TABLE colab_usuarios_roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    rol_id INT UNSIGNED NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    asignado_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_usuario_rol (usuario_id, rol_id),
    INDEX idx_colab_ur_usuario (usuario_id),
    INDEX idx_colab_ur_rol (rol_id),
    INDEX idx_colab_ur_vigencia (fecha_inicio, fecha_fin),
    CONSTRAINT fk_colab_ur_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_ur_rol
        FOREIGN KEY (rol_id) REFERENCES colab_roles(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_usuarios_permisos
-- Permisos específicos por colaborador (sobrescribe rol)
-- ============================================================================

CREATE TABLE colab_usuarios_permisos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    permiso_id INT UNSIGNED NOT NULL,
    tipo ENUM('otorgado', 'denegado') NOT NULL DEFAULT 'otorgado',
    fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    motivo TEXT,
    asignado_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_usuario_permiso (usuario_id, permiso_id),
    INDEX idx_colab_up_usuario (usuario_id),
    INDEX idx_colab_up_permiso (permiso_id),
    CONSTRAINT fk_colab_up_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_up_permiso
        FOREIGN KEY (permiso_id) REFERENCES colab_permisos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_tokens
-- Tokens de recuperación y verificación para colaboradores
-- ============================================================================

CREATE TABLE colab_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    tipo ENUM(
        'verificacion_correo',
        'recuperacion_contrasena',
        'activacion_cuenta',
        'verificacion_2fa'
    ) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    usado_en DATETIME,
    ip_solicitud VARCHAR(45),
    ip_uso VARCHAR(45),

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_token_usuario (usuario_id),
    INDEX idx_colab_token_hash (token_hash),
    INDEX idx_colab_token_tipo (tipo),
    INDEX idx_colab_token_expira (expira_en),
    CONSTRAINT fk_colab_token_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_dispositivos
-- Dispositivos registrados de colaboradores
-- ============================================================================

CREATE TABLE colab_dispositivos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    huella_dispositivo VARCHAR(255) NOT NULL,
    nombre_dispositivo VARCHAR(200),
    tipo_dispositivo ENUM('desktop', 'tablet', 'mobile', 'escaner', 'terminal', 'otro') NOT NULL DEFAULT 'otro',
    navegador VARCHAR(100),
    sistema_operativo VARCHAR(100),
    es_confiable BOOLEAN NOT NULL DEFAULT FALSE,
    confirmado_en DATETIME,
    ultimo_uso DATETIME,

    -- Restricción: dispositivo aprobado por admin
    aprobado_por_admin INT UNSIGNED,
    fecha_aprobacion DATETIME,

    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_disp_usuario (usuario_id),
    INDEX idx_colab_disp_huella (huella_dispositivo),
    INDEX idx_colab_disp_activo (es_activo),
    CONSTRAINT fk_colab_dispositivo_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_sesiones
-- Sesiones activas de colaboradores (AISLADAS de seguridad_sesiones)
-- ============================================================================

CREATE TABLE colab_sesiones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) UNIQUE,
    dispositivo_id INT UNSIGNED,

    -- Información de conexión
    ip_address VARCHAR(45) NOT NULL,
    ip_pais VARCHAR(100),
    ip_ciudad VARCHAR(100),
    user_agent TEXT,

    -- Control de tiempo
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME NOT NULL,
    ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Turno asociado
    turno_id INT UNSIGNED,

    -- Estado
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    cerrada_en DATETIME,
    motivo_cierre ENUM('logout', 'expiracion', 'forzado', 'cambio_contrasena', 'seguridad', 'fin_turno') DEFAULT NULL,

    INDEX idx_colab_ses_usuario (usuario_id),
    INDEX idx_colab_ses_token (token_hash),
    INDEX idx_colab_ses_activa (es_activa),
    INDEX idx_colab_ses_expira (expira_en),
    INDEX idx_colab_ses_dispositivo (dispositivo_id),
    CONSTRAINT fk_colab_sesion_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_sesion_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES colab_dispositivos(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_bitacora_seguridad
-- Auditoría de seguridad independiente para colaboradores
-- ============================================================================

CREATE TABLE colab_bitacora_seguridad (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED,
    sesion_id INT UNSIGNED,

    -- Evento
    tipo_evento ENUM(
        'login_exitoso',
        'login_fallido',
        'logout',
        'cambio_contrasena',
        'recuperacion_contrasena',
        'bloqueo_cuenta',
        'desbloqueo_cuenta',
        'verificacion_2fa',
        'fallo_2fa',
        'dispositivo_nuevo',
        'dispositivo_rechazado',
        'ip_no_autorizada',
        'acceso_fuera_horario',
        'sesion_forzada',
        'intento_escalacion',
        'acceso_denegado',
        'multiples_intentos'
    ) NOT NULL,

    -- Detalles
    descripcion TEXT,
    datos_extra JSON,

    -- Contexto
    ip_address VARCHAR(45),
    user_agent TEXT,
    correo_intento VARCHAR(255),

    -- Severidad
    severidad ENUM('info', 'advertencia', 'critico') NOT NULL DEFAULT 'info',

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_bit_usuario (usuario_id),
    INDEX idx_colab_bit_tipo (tipo_evento),
    INDEX idx_colab_bit_severidad (severidad),
    INDEX idx_colab_bit_ip (ip_address),
    INDEX idx_colab_bit_fecha (creado_en),
    CONSTRAINT fk_colab_bitacora_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_bitacora_sesion
        FOREIGN KEY (sesion_id) REFERENCES colab_sesiones(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_asignaciones_almacen
-- Asignación de colaboradores a almacenes específicos (scope de acceso)
-- ============================================================================

CREATE TABLE colab_asignaciones_almacen (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    almacen_id INT UNSIGNED NOT NULL,

    -- Nivel de acceso en este almacén
    nivel_acceso ENUM('lectura', 'operacion', 'administracion') NOT NULL DEFAULT 'operacion',

    -- Vigencia
    fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,

    -- Zona específica dentro del almacén (opcional)
    zona_asignada VARCHAR(50),

    -- Auditoría
    asignado_por_admin INT UNSIGNED,
    motivo TEXT,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_asignacion (usuario_id, almacen_id),
    INDEX idx_colab_asig_usuario (usuario_id),
    INDEX idx_colab_asig_almacen (almacen_id),
    INDEX idx_colab_asig_activa (es_activa),
    INDEX idx_colab_asig_vigencia (fecha_inicio, fecha_fin),
    CONSTRAINT fk_colab_asig_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_asig_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_turnos
-- Control de turnos de trabajo de colaboradores
-- ============================================================================

CREATE TABLE colab_turnos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    almacen_id INT UNSIGNED NOT NULL,

    -- Horario programado
    fecha DATE NOT NULL,
    hora_inicio_programada TIME NOT NULL,
    hora_fin_programada TIME NOT NULL,

    -- Horario real
    hora_entrada DATETIME,
    hora_salida DATETIME,

    -- Estado
    estado ENUM('programado', 'en_curso', 'completado', 'ausencia', 'cancelado') NOT NULL DEFAULT 'programado',

    -- Notas
    notas_entrada TEXT,
    notas_salida TEXT,

    -- IP de registro
    ip_entrada VARCHAR(45),
    ip_salida VARCHAR(45),

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_turno_usuario (usuario_id),
    INDEX idx_colab_turno_almacen (almacen_id),
    INDEX idx_colab_turno_fecha (fecha),
    INDEX idx_colab_turno_estado (estado),
    INDEX idx_colab_turno_usuario_fecha (usuario_id, fecha),
    CONSTRAINT fk_colab_turno_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_turno_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_actividad_inventario
-- Registro detallado de toda operación de inventario por colaboradores
-- ============================================================================

CREATE TABLE colab_actividad_inventario (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    turno_id INT UNSIGNED,
    almacen_id INT UNSIGNED NOT NULL,

    -- Tipo de operación
    tipo_operacion ENUM(
        'entrada_mercancia',
        'salida_mercancia',
        'ajuste_positivo',
        'ajuste_negativo',
        'transferencia_salida',
        'transferencia_entrada',
        'conteo_fisico',
        'reubicacion',
        'marca_danado',
        'devolucion_proveedor',
        'recepcion_devolucion_cliente'
    ) NOT NULL,

    -- Producto afectado
    producto_id INT NOT NULL,
    variante_id INT,

    -- Cantidades
    cantidad INT NOT NULL,
    cantidad_anterior INT NOT NULL DEFAULT 0,
    cantidad_nueva INT NOT NULL DEFAULT 0,

    -- Referencia al documento
    documento_tipo VARCHAR(50),
    documento_numero VARCHAR(50),
    documento_id BIGINT UNSIGNED,

    -- Proveedor o destino
    referencia_externa VARCHAR(200),

    -- Ubicación en almacén
    ubicacion_origen VARCHAR(50),
    ubicacion_destino VARCHAR(50),

    -- Lote y vencimiento
    numero_lote VARCHAR(100),
    fecha_vencimiento DATE,

    -- Costos
    costo_unitario DECIMAL(15,4),

    -- Notas y evidencia
    motivo TEXT,
    notas TEXT,
    foto_evidencia_url VARCHAR(500),

    -- Aprobación (para ajustes que requieren autorización)
    requiere_aprobacion BOOLEAN NOT NULL DEFAULT FALSE,
    estado_aprobacion ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT NULL,
    aprobado_por INT UNSIGNED,
    fecha_aprobacion DATETIME,
    motivo_rechazo TEXT,

    -- Contexto
    ip_address VARCHAR(45),
    dispositivo_id INT UNSIGNED,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_act_usuario (usuario_id),
    INDEX idx_colab_act_turno (turno_id),
    INDEX idx_colab_act_almacen (almacen_id),
    INDEX idx_colab_act_tipo (tipo_operacion),
    INDEX idx_colab_act_producto (producto_id),
    INDEX idx_colab_act_variante (variante_id),
    INDEX idx_colab_act_fecha (creado_en),
    INDEX idx_colab_act_documento (documento_tipo, documento_id),
    INDEX idx_colab_act_aprobacion (estado_aprobacion),
    INDEX idx_colab_act_lote (numero_lote),
    CONSTRAINT fk_colab_act_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_act_turno
        FOREIGN KEY (turno_id) REFERENCES colab_turnos(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_act_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_act_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_conteos_inventario
-- Conteos físicos de inventario (auditorías de stock)
-- ============================================================================

CREATE TABLE colab_conteos_inventario (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    almacen_id INT UNSIGNED NOT NULL,

    -- Identificación del conteo
    codigo VARCHAR(30) NOT NULL UNIQUE,
    tipo ENUM('completo', 'parcial', 'ciclico', 'aleatorio') NOT NULL DEFAULT 'parcial',

    -- Alcance
    zona_conteo VARCHAR(50),
    categoria_id INT UNSIGNED,

    -- Responsable
    responsable_id INT UNSIGNED NOT NULL,

    -- Estado
    estado ENUM('programado', 'en_progreso', 'pausado', 'completado', 'cancelado', 'aprobado') NOT NULL DEFAULT 'programado',

    -- Fechas
    fecha_programada DATE NOT NULL,
    fecha_inicio DATETIME,
    fecha_fin DATETIME,

    -- Resultados
    total_productos_contados INT UNSIGNED NOT NULL DEFAULT 0,
    total_discrepancias INT UNSIGNED NOT NULL DEFAULT 0,
    total_faltantes INT UNSIGNED NOT NULL DEFAULT 0,
    total_sobrantes INT UNSIGNED NOT NULL DEFAULT 0,

    -- Aprobación
    aprobado_por INT UNSIGNED,
    fecha_aprobacion DATETIME,

    notas TEXT,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_conteo_almacen (almacen_id),
    INDEX idx_colab_conteo_estado (estado),
    INDEX idx_colab_conteo_fecha (fecha_programada),
    INDEX idx_colab_conteo_responsable (responsable_id),
    CONSTRAINT fk_colab_conteo_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_conteo_responsable
        FOREIGN KEY (responsable_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_conteos_inventario_detalle
-- Detalle línea por línea de cada conteo
-- ============================================================================

CREATE TABLE colab_conteos_inventario_detalle (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conteo_id BIGINT UNSIGNED NOT NULL,
    producto_id INT NOT NULL,
    variante_id INT,

    -- Ubicación contada
    ubicacion VARCHAR(50),

    -- Cantidades
    cantidad_sistema INT NOT NULL DEFAULT 0,
    cantidad_fisica INT NOT NULL DEFAULT 0,
    diferencia INT GENERATED ALWAYS AS (cantidad_fisica - cantidad_sistema) STORED,

    -- Lote
    numero_lote VARCHAR(100),

    -- Estado del producto
    estado_producto ENUM('bueno', 'danado', 'vencido', 'deteriorado') NOT NULL DEFAULT 'bueno',

    -- Contado por
    contado_por INT UNSIGNED NOT NULL,
    fecha_conteo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Notas
    notas TEXT,
    foto_evidencia_url VARCHAR(500),

    INDEX idx_colab_det_conteo (conteo_id),
    INDEX idx_colab_det_producto (producto_id),
    INDEX idx_colab_det_variante (variante_id),
    INDEX idx_colab_det_diferencia (diferencia),
    CONSTRAINT fk_colab_det_conteo
        FOREIGN KEY (conteo_id) REFERENCES colab_conteos_inventario(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_det_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_det_contado_por
        FOREIGN KEY (contado_por) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_notificaciones
-- Notificaciones internas del portal de colaboradores
-- ============================================================================

CREATE TABLE colab_notificaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,

    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,

    tipo ENUM('info', 'exito', 'advertencia', 'error', 'tarea') NOT NULL DEFAULT 'info',
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') NOT NULL DEFAULT 'normal',

    -- Referencia a la acción
    url_accion VARCHAR(500),
    texto_accion VARCHAR(100),

    -- Estado
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    leida_en DATETIME,
    archivada BOOLEAN NOT NULL DEFAULT FALSE,
    archivada_en DATETIME,

    -- Expiración
    expira_en DATETIME,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_notif_usuario (usuario_id),
    INDEX idx_colab_notif_tipo (tipo),
    INDEX idx_colab_notif_leida (leida),
    INDEX idx_colab_notif_fecha (creado_en),
    CONSTRAINT fk_colab_notif_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS INICIALES: MÓDULOS DEL PORTAL DE COLABORADORES
-- ============================================================================

INSERT INTO colab_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('colab_dashboard',        'Inicio',                'Panel principal del colaborador',            'bi-speedometer2',     '/colaborador/inicio',             1,  TRUE),
('colab_mi_turno',         'Mi Turno',              'Registro de entrada/salida y turno actual',  'bi-clock-history',    '/colaborador/mi-turno',           2,  TRUE),
('colab_inventario',       'Inventario',            'Gestión de inventario del almacén',          'bi-boxes',            '/colaborador/inventario',         3,  TRUE),
('colab_entradas',         'Entradas',              'Recepción de mercancía',                     'bi-box-arrow-in-down','/colaborador/inventario/entradas', 4,  TRUE),
('colab_salidas',          'Salidas',               'Despacho de mercancía',                      'bi-box-arrow-up',     '/colaborador/inventario/salidas',  5,  TRUE),
('colab_transferencias',   'Transferencias',        'Transferencias entre almacenes',             'bi-arrow-left-right', '/colaborador/transferencias',      6,  TRUE),
('colab_conteos',          'Conteos',               'Conteo físico de inventario',                'bi-clipboard-check',  '/colaborador/conteos',            7,  TRUE),
('colab_productos',        'Productos',             'Consulta de catálogo de productos',          'bi-grid-3x3-gap',    '/colaborador/productos',          8,  TRUE),
('colab_reportes',         'Reportes',              'Reportes operativos',                        'bi-bar-chart-line',   '/colaborador/reportes',           9,  TRUE),
('colab_mi_actividad',     'Mi Actividad',          'Historial de mis operaciones',               'bi-journal-text',     '/colaborador/mi-actividad',       10, TRUE),
('colab_notificaciones',   'Notificaciones',        'Centro de notificaciones',                   'bi-bell',             '/colaborador/notificaciones',     11, TRUE),
('colab_mi_perfil',        'Mi Perfil',             'Configuración de perfil personal',           'bi-person-circle',    '/colaborador/mi-perfil',          12, TRUE);

-- ============================================================================
-- DATOS INICIALES: PERMISOS DEL PORTAL DE COLABORADORES
-- ============================================================================

-- Permisos de Dashboard
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_dashboard.ver', 'Ver panel de inicio', (SELECT id FROM colab_modulos WHERE codigo = 'colab_dashboard'), 'ver');

-- Permisos de Turno
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_turno.ver',        'Ver información de turno',     (SELECT id FROM colab_modulos WHERE codigo = 'colab_mi_turno'), 'ver'),
('colab_turno.registrar',  'Registrar entrada/salida',     (SELECT id FROM colab_modulos WHERE codigo = 'colab_mi_turno'), 'ejecutar');

-- Permisos de Inventario
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_inventario.ver',       'Ver inventario del almacén',    (SELECT id FROM colab_modulos WHERE codigo = 'colab_inventario'), 'ver'),
('colab_inventario.ajustar',   'Ajustar cantidades de stock',   (SELECT id FROM colab_modulos WHERE codigo = 'colab_inventario'), 'editar'),
('colab_inventario.exportar',  'Exportar datos de inventario',  (SELECT id FROM colab_modulos WHERE codigo = 'colab_inventario'), 'exportar');

-- Permisos de Entradas
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_entradas.ver',     'Ver entradas de mercancía',    (SELECT id FROM colab_modulos WHERE codigo = 'colab_entradas'), 'ver'),
('colab_entradas.crear',   'Registrar entrada de mercancía', (SELECT id FROM colab_modulos WHERE codigo = 'colab_entradas'), 'crear'),
('colab_entradas.aprobar', 'Aprobar entradas de mercancía', (SELECT id FROM colab_modulos WHERE codigo = 'colab_entradas'), 'aprobar');

-- Permisos de Salidas
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_salidas.ver',     'Ver salidas de mercancía',     (SELECT id FROM colab_modulos WHERE codigo = 'colab_salidas'), 'ver'),
('colab_salidas.crear',   'Registrar salida de mercancía', (SELECT id FROM colab_modulos WHERE codigo = 'colab_salidas'), 'crear'),
('colab_salidas.aprobar', 'Aprobar salidas de mercancía',  (SELECT id FROM colab_modulos WHERE codigo = 'colab_salidas'), 'aprobar');

-- Permisos de Transferencias
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_transferencias.ver',      'Ver transferencias',              (SELECT id FROM colab_modulos WHERE codigo = 'colab_transferencias'), 'ver'),
('colab_transferencias.crear',    'Crear solicitud de transferencia', (SELECT id FROM colab_modulos WHERE codigo = 'colab_transferencias'), 'crear'),
('colab_transferencias.aprobar',  'Aprobar transferencias',          (SELECT id FROM colab_modulos WHERE codigo = 'colab_transferencias'), 'aprobar');

-- Permisos de Conteos
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_conteos.ver',       'Ver conteos de inventario',   (SELECT id FROM colab_modulos WHERE codigo = 'colab_conteos'), 'ver'),
('colab_conteos.crear',     'Iniciar conteo de inventario', (SELECT id FROM colab_modulos WHERE codigo = 'colab_conteos'), 'crear'),
('colab_conteos.ejecutar',  'Ejecutar conteo físico',       (SELECT id FROM colab_modulos WHERE codigo = 'colab_conteos'), 'ejecutar'),
('colab_conteos.aprobar',   'Aprobar y cerrar conteos',     (SELECT id FROM colab_modulos WHERE codigo = 'colab_conteos'), 'aprobar');

-- Permisos de Productos (solo lectura)
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_productos.ver', 'Ver catálogo de productos', (SELECT id FROM colab_modulos WHERE codigo = 'colab_productos'), 'ver');

-- Permisos de Reportes
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_reportes.ver',      'Ver reportes operativos',  (SELECT id FROM colab_modulos WHERE codigo = 'colab_reportes'), 'ver'),
('colab_reportes.exportar', 'Exportar reportes',        (SELECT id FROM colab_modulos WHERE codigo = 'colab_reportes'), 'exportar');

-- Permisos de Mi Actividad
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_actividad.ver', 'Ver mi historial de actividad', (SELECT id FROM colab_modulos WHERE codigo = 'colab_mi_actividad'), 'ver');

-- Permisos de Notificaciones
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_notificaciones.ver', 'Ver notificaciones', (SELECT id FROM colab_modulos WHERE codigo = 'colab_notificaciones'), 'ver');

-- Permisos de Mi Perfil
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion) VALUES
('colab_perfil.ver',    'Ver mi perfil',     (SELECT id FROM colab_modulos WHERE codigo = 'colab_mi_perfil'), 'ver'),
('colab_perfil.editar', 'Editar mi perfil',  (SELECT id FROM colab_modulos WHERE codigo = 'colab_mi_perfil'), 'editar');

-- ============================================================================
-- DATOS INICIALES: ROLES DE COLABORADORES
-- ============================================================================

INSERT INTO colab_roles (codigo, nombre, descripcion, nivel_jerarquia, es_supervisor, color) VALUES
('jefe_bodega',   'Jefe de Bodega',   'Control total del almacén asignado. Aprueba ajustes, conteos y transferencias.',     100, TRUE,  '#dc3545'),
('supervisor',    'Supervisor',       'Supervisión de operaciones. Puede aprobar movimientos y ver reportes.',               80,  TRUE,  '#fd7e14'),
('inventarista',  'Inventarista',     'Encargado de conteos físicos y verificación de stock.',                               60,  FALSE, '#0d6efd'),
('recepcionista', 'Recepcionista',    'Recepción y verificación de mercancía entrante.',                                     50,  FALSE, '#198754'),
('despachador',   'Despachador',      'Preparación y despacho de pedidos y transferencias.',                                 50,  FALSE, '#6f42c1'),
('auxiliar',      'Auxiliar',         'Operaciones básicas de movimiento de inventario.',                                    30,  FALSE, '#6c757d'),
('consulta',      'Solo Consulta',    'Acceso de solo lectura a inventario y productos.',                                    10,  FALSE, '#adb5bd');

-- ============================================================================
-- ASIGNACIÓN DE PERMISOS POR ROL
-- ============================================================================

-- JEFE DE BODEGA: Acceso total
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'jefe_bodega'),
    id
FROM colab_permisos
WHERE es_activo = TRUE;

-- SUPERVISOR: Todo excepto crear conteos
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'supervisor'),
    id
FROM colab_permisos
WHERE codigo IN (
    'colab_dashboard.ver',
    'colab_turno.ver', 'colab_turno.registrar',
    'colab_inventario.ver', 'colab_inventario.ajustar', 'colab_inventario.exportar',
    'colab_entradas.ver', 'colab_entradas.crear', 'colab_entradas.aprobar',
    'colab_salidas.ver', 'colab_salidas.crear', 'colab_salidas.aprobar',
    'colab_transferencias.ver', 'colab_transferencias.crear', 'colab_transferencias.aprobar',
    'colab_conteos.ver', 'colab_conteos.ejecutar', 'colab_conteos.aprobar',
    'colab_productos.ver',
    'colab_reportes.ver', 'colab_reportes.exportar',
    'colab_actividad.ver',
    'colab_notificaciones.ver',
    'colab_perfil.ver', 'colab_perfil.editar'
);

-- INVENTARISTA: Enfocado en conteos y consulta de inventario
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'inventarista'),
    id
FROM colab_permisos
WHERE codigo IN (
    'colab_dashboard.ver',
    'colab_turno.ver', 'colab_turno.registrar',
    'colab_inventario.ver', 'colab_inventario.exportar',
    'colab_conteos.ver', 'colab_conteos.crear', 'colab_conteos.ejecutar',
    'colab_productos.ver',
    'colab_actividad.ver',
    'colab_notificaciones.ver',
    'colab_perfil.ver', 'colab_perfil.editar'
);

-- RECEPCIONISTA: Enfocado en entradas
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'recepcionista'),
    id
FROM colab_permisos
WHERE codigo IN (
    'colab_dashboard.ver',
    'colab_turno.ver', 'colab_turno.registrar',
    'colab_inventario.ver',
    'colab_entradas.ver', 'colab_entradas.crear',
    'colab_productos.ver',
    'colab_actividad.ver',
    'colab_notificaciones.ver',
    'colab_perfil.ver', 'colab_perfil.editar'
);

-- DESPACHADOR: Enfocado en salidas y transferencias
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'despachador'),
    id
FROM colab_permisos
WHERE codigo IN (
    'colab_dashboard.ver',
    'colab_turno.ver', 'colab_turno.registrar',
    'colab_inventario.ver',
    'colab_salidas.ver', 'colab_salidas.crear',
    'colab_transferencias.ver', 'colab_transferencias.crear',
    'colab_productos.ver',
    'colab_actividad.ver',
    'colab_notificaciones.ver',
    'colab_perfil.ver', 'colab_perfil.editar'
);

-- AUXILIAR: Operaciones básicas
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'auxiliar'),
    id
FROM colab_permisos
WHERE codigo IN (
    'colab_dashboard.ver',
    'colab_turno.ver', 'colab_turno.registrar',
    'colab_inventario.ver',
    'colab_entradas.ver', 'colab_entradas.crear',
    'colab_salidas.ver', 'colab_salidas.crear',
    'colab_conteos.ver', 'colab_conteos.ejecutar',
    'colab_productos.ver',
    'colab_actividad.ver',
    'colab_notificaciones.ver',
    'colab_perfil.ver', 'colab_perfil.editar'
);

-- SOLO CONSULTA: Únicamente lectura
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'consulta'),
    id
FROM colab_permisos
WHERE codigo IN (
    'colab_dashboard.ver',
    'colab_inventario.ver',
    'colab_entradas.ver',
    'colab_salidas.ver',
    'colab_transferencias.ver',
    'colab_conteos.ver',
    'colab_productos.ver',
    'colab_reportes.ver',
    'colab_notificaciones.ver',
    'colab_perfil.ver'
);

-- ============================================================================
-- DATOS INICIALES: CONFIGURACIÓN DEL PORTAL
-- ============================================================================

INSERT INTO colab_configuracion (clave, valor, tipo_dato, descripcion, categoria) VALUES
-- Sesiones
('sesion_duracion_minutos',          '480',    'numero',   'Duración máxima de sesión en minutos (8 horas)',              'sesiones'),
('sesion_inactividad_minutos',       '30',     'numero',   'Tiempo de inactividad antes de cerrar sesión',                'sesiones'),
('max_sesiones_simultaneas',         '1',      'numero',   'Máximo de sesiones simultáneas por colaborador',              'sesiones'),
('max_intentos_login',               '5',      'numero',   'Intentos de login antes de bloqueo',                          'sesiones'),
('minutos_bloqueo_login',            '15',     'numero',   'Minutos de bloqueo tras exceder intentos',                    'sesiones'),

-- Contraseñas
('contrasena_longitud_minima',       '12',     'numero',   'Longitud mínima de contraseña',                               'seguridad'),
('contrasena_requiere_mayuscula',    'true',   'booleano', 'Requiere al menos una letra mayúscula',                       'seguridad'),
('contrasena_requiere_numero',       'true',   'booleano', 'Requiere al menos un número',                                 'seguridad'),
('contrasena_requiere_especial',     'true',   'booleano', 'Requiere al menos un carácter especial',                      'seguridad'),
('contrasena_historial_cantidad',    '5',      'numero',   'Cantidad de contraseñas anteriores que no se pueden reutilizar','seguridad'),
('contrasena_dias_expiracion',       '90',     'numero',   'Días antes de expirar la contraseña',                         'seguridad'),

-- Turnos
('turno_registro_obligatorio',       'true',   'booleano', 'El colaborador debe registrar entrada antes de operar',       'turnos'),
('turno_tolerancia_minutos',         '15',     'numero',   'Minutos de tolerancia para registrar entrada',                'turnos'),
('turno_cierre_automatico_horas',    '12',     'numero',   'Horas después de las cuales se cierra turno automáticamente', 'turnos'),

-- Inventario
('ajuste_requiere_aprobacion',       'true',   'booleano', 'Los ajustes de inventario requieren aprobación de supervisor','inventario'),
('ajuste_umbral_aprobacion',         '10',     'numero',   'Cantidad mínima de ajuste que requiere aprobación',           'inventario'),
('transferencia_requiere_aprobacion','true',    'booleano', 'Las transferencias requieren aprobación',                     'inventario'),
('conteo_diferencia_alerta',         '5',      'numero',   'Diferencia en conteo que genera alerta automática',           'inventario'),
('foto_evidencia_obligatoria',       'false',  'booleano', 'Requiere foto de evidencia en movimientos',                   'inventario'),

-- General
('nombre_portal',                    'Portal de Operaciones', 'texto', 'Nombre mostrado en el portal de colaboradores',   'general'),
('logo_url',                         '',       'texto',    'URL del logo del portal',                                     'general'),
('color_primario',                   '#0d6efd','texto',    'Color primario del portal',                                   'general'),
('soporte_correo',                   '',       'texto',    'Correo de soporte para colaboradores',                        'general'),
('soporte_telefono',                 '',       'texto',    'Teléfono de soporte para colaboradores',                      'general');

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista completa de colaboradores con roles y asignaciones
CREATE OR REPLACE VIEW vista_colab_usuarios_completa AS
SELECT
    u.id,
    u.nombre,
    u.apellido,
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
    u.correo,
    u.telefono,
    u.codigo_colaborador,
    u.cargo,
    u.tipo_contrato,
    u.fecha_ingreso,
    u.es_activo,
    u.es_verificado,
    u.ultimo_acceso,
    e.nombre AS empresa_nombre,
    r.nombre AS rol_principal,
    r.codigo AS rol_codigo,
    r.es_supervisor,
    GROUP_CONCAT(DISTINCT a.almacen_id) AS almacenes_asignados_ids
FROM colab_usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
LEFT JOIN colab_usuarios_roles ur ON u.id = ur.usuario_id AND ur.es_principal = TRUE
    AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= CURRENT_DATE)
LEFT JOIN colab_roles r ON ur.rol_id = r.id
LEFT JOIN colab_asignaciones_almacen a ON u.id = a.usuario_id AND a.es_activa = TRUE
    AND (a.fecha_fin IS NULL OR a.fecha_fin >= CURRENT_DATE)
GROUP BY u.id, e.nombre, r.nombre, r.codigo, r.es_supervisor;

-- Vista de asignaciones activas con detalle de almacén
CREATE OR REPLACE VIEW vista_colab_asignaciones_activas AS
SELECT
    ca.id AS asignacion_id,
    ca.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS colaborador,
    u.codigo_colaborador,
    ca.almacen_id,
    ia.nombre AS almacen_nombre,
    ia.codigo AS almacen_codigo,
    ia.tipo AS almacen_tipo,
    ia.ciudad AS almacen_ciudad,
    ca.nivel_acceso,
    ca.zona_asignada,
    ca.fecha_inicio,
    ca.fecha_fin,
    r.nombre AS rol_principal,
    r.es_supervisor
FROM colab_asignaciones_almacen ca
JOIN colab_usuarios u ON ca.usuario_id = u.id
JOIN inventario_almacenes ia ON ca.almacen_id = ia.id
LEFT JOIN colab_usuarios_roles ur ON u.id = ur.usuario_id AND ur.es_principal = TRUE
LEFT JOIN colab_roles r ON ur.rol_id = r.id
WHERE ca.es_activa = TRUE
    AND u.es_activo = TRUE
    AND (ca.fecha_fin IS NULL OR ca.fecha_fin >= CURRENT_DATE);

-- Vista de actividad reciente de inventario
CREATE OR REPLACE VIEW vista_colab_actividad_reciente AS
SELECT
    ai.id,
    ai.tipo_operacion,
    ai.cantidad,
    ai.cantidad_anterior,
    ai.cantidad_nueva,
    ai.motivo,
    ai.documento_tipo,
    ai.documento_numero,
    ai.numero_lote,
    ai.requiere_aprobacion,
    ai.estado_aprobacion,
    ai.creado_en,
    ai.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS colaborador,
    u.codigo_colaborador,
    ai.almacen_id,
    ia.nombre AS almacen_nombre,
    ai.producto_id,
    p.nombre AS producto_nombre,
    p.sku AS producto_sku
FROM colab_actividad_inventario ai
JOIN colab_usuarios u ON ai.usuario_id = u.id
JOIN inventario_almacenes ia ON ai.almacen_id = ia.id
JOIN productos p ON ai.producto_id = p.id
ORDER BY ai.creado_en DESC;

-- Vista de conteos pendientes
CREATE OR REPLACE VIEW vista_colab_conteos_pendientes AS
SELECT
    ci.id,
    ci.codigo,
    ci.tipo,
    ci.zona_conteo,
    ci.estado,
    ci.fecha_programada,
    ci.fecha_inicio,
    ci.total_productos_contados,
    ci.total_discrepancias,
    ci.almacen_id,
    ia.nombre AS almacen_nombre,
    ci.responsable_id,
    CONCAT(u.nombre, ' ', u.apellido) AS responsable
FROM colab_conteos_inventario ci
JOIN inventario_almacenes ia ON ci.almacen_id = ia.id
JOIN colab_usuarios u ON ci.responsable_id = u.id
WHERE ci.estado IN ('programado', 'en_progreso', 'pausado')
ORDER BY ci.fecha_programada ASC;

-- Vista de turnos del día actual
CREATE OR REPLACE VIEW vista_colab_turnos_hoy AS
SELECT
    t.id,
    t.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS colaborador,
    u.codigo_colaborador,
    t.almacen_id,
    ia.nombre AS almacen_nombre,
    t.hora_inicio_programada,
    t.hora_fin_programada,
    t.hora_entrada,
    t.hora_salida,
    t.estado,
    CASE
        WHEN t.estado = 'en_curso' THEN TIMESTAMPDIFF(MINUTE, t.hora_entrada, NOW())
        WHEN t.estado = 'completado' THEN TIMESTAMPDIFF(MINUTE, t.hora_entrada, t.hora_salida)
        ELSE 0
    END AS minutos_trabajados
FROM colab_turnos t
JOIN colab_usuarios u ON t.usuario_id = u.id
JOIN inventario_almacenes ia ON t.almacen_id = ia.id
WHERE t.fecha = CURRENT_DATE
ORDER BY t.hora_inicio_programada;

-- Vista de stock visible por colaborador (para consumo desde el backend con filtro de almacén)
CREATE OR REPLACE VIEW vista_colab_stock_asignado AS
SELECT
    s.id AS stock_id,
    s.producto_id,
    p.nombre AS producto_nombre,
    p.sku,
    s.variante_id,
    s.almacen_id,
    ia.nombre AS almacen_nombre,
    ia.codigo AS almacen_codigo,
    s.cantidad_disponible,
    s.cantidad_reservada,
    s.cantidad_en_transito,
    s.cantidad_danada,
    s.stock_minimo,
    s.punto_reorden,
    s.ubicacion_pasillo,
    s.ubicacion_estante,
    s.ubicacion_nivel,
    s.ubicacion_bin,
    s.ultimo_movimiento,
    s.ultimo_conteo,
    CASE
        WHEN s.cantidad_disponible <= 0 THEN 'agotado'
        WHEN s.cantidad_disponible <= s.stock_minimo THEN 'bajo'
        WHEN s.punto_reorden IS NOT NULL AND s.cantidad_disponible <= s.punto_reorden THEN 'reorden'
        ELSE 'normal'
    END AS estado_stock
FROM inventario_stock s
JOIN productos p ON s.producto_id = p.id
JOIN inventario_almacenes ia ON s.almacen_id = ia.id
WHERE ia.es_activo = TRUE;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Registrar entrada de mercancía con validaciones
CREATE PROCEDURE sp_colab_registrar_entrada_mercancia(
    IN p_usuario_id INT UNSIGNED,
    IN p_almacen_id INT UNSIGNED,
    IN p_producto_id INT,
    IN p_variante_id INT,
    IN p_cantidad INT,
    IN p_numero_lote VARCHAR(100),
    IN p_fecha_vencimiento DATE,
    IN p_costo_unitario DECIMAL(15,4),
    IN p_documento_tipo VARCHAR(50),
    IN p_documento_numero VARCHAR(50),
    IN p_motivo TEXT,
    IN p_ip_address VARCHAR(45)
)
BEGIN
    DECLARE v_cantidad_anterior INT DEFAULT 0;
    DECLARE v_stock_id BIGINT UNSIGNED;
    DECLARE v_turno_id INT UNSIGNED;

    -- Verificar que el colaborador tiene asignación activa en el almacén
    IF NOT EXISTS (
        SELECT 1 FROM colab_asignaciones_almacen
        WHERE usuario_id = p_usuario_id
            AND almacen_id = p_almacen_id
            AND es_activa = TRUE
            AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Colaborador no tiene asignación activa en este almacén';
    END IF;

    -- Obtener turno activo
    SELECT id INTO v_turno_id
    FROM colab_turnos
    WHERE usuario_id = p_usuario_id
        AND fecha = CURRENT_DATE
        AND estado = 'en_curso'
    LIMIT 1;

    START TRANSACTION;

    -- Obtener stock actual
    SELECT id, cantidad_disponible INTO v_stock_id, v_cantidad_anterior
    FROM inventario_stock
    WHERE producto_id = p_producto_id
        AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL))
        AND almacen_id = p_almacen_id
    LIMIT 1;

    -- Actualizar o insertar stock
    IF v_stock_id IS NOT NULL THEN
        UPDATE inventario_stock
        SET cantidad_disponible = cantidad_disponible + p_cantidad,
            ultimo_movimiento = NOW(),
            ultimo_costo = COALESCE(p_costo_unitario, ultimo_costo)
        WHERE id = v_stock_id;
    ELSE
        INSERT INTO inventario_stock (producto_id, variante_id, almacen_id, cantidad_disponible, ultimo_costo, ultimo_movimiento)
        VALUES (p_producto_id, p_variante_id, p_almacen_id, p_cantidad, p_costo_unitario, NOW());

        SET v_stock_id = LAST_INSERT_ID();
        SET v_cantidad_anterior = 0;
    END IF;

    -- Registrar movimiento en tabla general de inventario
    INSERT INTO movimientos_inventario (
        producto_id, cantidad, tipo_movimiento,
        motivo, stock_anterior, stock_nuevo, usuario_id
    ) VALUES (
        p_producto_id, p_cantidad, 'entrada',
        COALESCE(p_motivo, 'Entrada de mercancía por colaborador'),
        v_cantidad_anterior, v_cantidad_anterior + p_cantidad, p_usuario_id
    );

    -- Registrar en actividad del colaborador
    INSERT INTO colab_actividad_inventario (
        usuario_id, turno_id, almacen_id,
        tipo_operacion, producto_id, variante_id,
        cantidad, cantidad_anterior, cantidad_nueva,
        documento_tipo, documento_numero,
        numero_lote, fecha_vencimiento,
        costo_unitario, motivo, ip_address
    ) VALUES (
        p_usuario_id, v_turno_id, p_almacen_id,
        'entrada_mercancia', p_producto_id, p_variante_id,
        p_cantidad, v_cantidad_anterior, v_cantidad_anterior + p_cantidad,
        p_documento_tipo, p_documento_numero,
        p_numero_lote, p_fecha_vencimiento,
        p_costo_unitario, p_motivo, p_ip_address
    );

    COMMIT;

    SELECT v_cantidad_anterior + p_cantidad AS nueva_cantidad_disponible, 'Entrada registrada correctamente' AS mensaje;
END //

-- Registrar salida de mercancía con validaciones
CREATE PROCEDURE sp_colab_registrar_salida_mercancia(
    IN p_usuario_id INT UNSIGNED,
    IN p_almacen_id INT UNSIGNED,
    IN p_producto_id INT,
    IN p_variante_id INT,
    IN p_cantidad INT,
    IN p_documento_tipo VARCHAR(50),
    IN p_documento_numero VARCHAR(50),
    IN p_motivo TEXT,
    IN p_ip_address VARCHAR(45)
)
BEGIN
    DECLARE v_cantidad_anterior INT DEFAULT 0;
    DECLARE v_stock_id BIGINT UNSIGNED;
    DECLARE v_turno_id INT UNSIGNED;

    -- Verificar asignación
    IF NOT EXISTS (
        SELECT 1 FROM colab_asignaciones_almacen
        WHERE usuario_id = p_usuario_id
            AND almacen_id = p_almacen_id
            AND es_activa = TRUE
            AND nivel_acceso IN ('operacion', 'administracion')
            AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Colaborador no tiene permisos de operación en este almacén';
    END IF;

    -- Obtener turno activo
    SELECT id INTO v_turno_id
    FROM colab_turnos
    WHERE usuario_id = p_usuario_id
        AND fecha = CURRENT_DATE
        AND estado = 'en_curso'
    LIMIT 1;

    -- Verificar stock suficiente
    SELECT id, cantidad_disponible INTO v_stock_id, v_cantidad_anterior
    FROM inventario_stock
    WHERE producto_id = p_producto_id
        AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL))
        AND almacen_id = p_almacen_id
    LIMIT 1;

    IF v_stock_id IS NULL OR v_cantidad_anterior < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para esta operación';
    END IF;

    START TRANSACTION;

    -- Actualizar stock
    UPDATE inventario_stock
    SET cantidad_disponible = cantidad_disponible - p_cantidad,
        ultimo_movimiento = NOW()
    WHERE id = v_stock_id;

    -- Registrar movimiento general
    INSERT INTO movimientos_inventario (
        producto_id, cantidad, tipo_movimiento,
        motivo, stock_anterior, stock_nuevo, usuario_id
    ) VALUES (
        p_producto_id, p_cantidad, 'salida',
        COALESCE(p_motivo, 'Salida de mercancía por colaborador'),
        v_cantidad_anterior, v_cantidad_anterior - p_cantidad, p_usuario_id
    );

    -- Registrar actividad colaborador
    INSERT INTO colab_actividad_inventario (
        usuario_id, turno_id, almacen_id,
        tipo_operacion, producto_id, variante_id,
        cantidad, cantidad_anterior, cantidad_nueva,
        documento_tipo, documento_numero,
        motivo, ip_address
    ) VALUES (
        p_usuario_id, v_turno_id, p_almacen_id,
        'salida_mercancia', p_producto_id, p_variante_id,
        p_cantidad, v_cantidad_anterior, v_cantidad_anterior - p_cantidad,
        p_documento_tipo, p_documento_numero,
        p_motivo, p_ip_address
    );

    COMMIT;

    SELECT v_cantidad_anterior - p_cantidad AS nueva_cantidad_disponible, 'Salida registrada correctamente' AS mensaje;
END //

-- Iniciar un conteo físico de inventario
CREATE PROCEDURE sp_colab_iniciar_conteo_inventario(
    IN p_usuario_id INT UNSIGNED,
    IN p_almacen_id INT UNSIGNED,
    IN p_tipo ENUM('completo', 'parcial', 'ciclico', 'aleatorio'),
    IN p_zona VARCHAR(50),
    IN p_categoria_id INT UNSIGNED
)
BEGIN
    DECLARE v_codigo VARCHAR(30);

    -- Verificar que el colaborador tenga asignación activa
    IF NOT EXISTS (
        SELECT 1 FROM colab_asignaciones_almacen
        WHERE usuario_id = p_usuario_id
            AND almacen_id = p_almacen_id
            AND es_activa = TRUE
            AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Colaborador no tiene asignación activa en este almacén';
    END IF;

    -- Generar código único
    SET v_codigo = CONCAT('CNT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9999), 4, '0'));

    INSERT INTO colab_conteos_inventario (
        almacen_id, codigo, tipo, zona_conteo, categoria_id,
        responsable_id, estado, fecha_programada, fecha_inicio
    ) VALUES (
        p_almacen_id, v_codigo, p_tipo, p_zona, p_categoria_id,
        p_usuario_id, 'en_progreso', CURRENT_DATE, NOW()
    );

    SELECT LAST_INSERT_ID() AS conteo_id, v_codigo AS codigo_conteo, 'Conteo iniciado correctamente' AS mensaje;
END //

-- Cerrar y consolidar un conteo de inventario
CREATE PROCEDURE sp_colab_cerrar_conteo_inventario(
    IN p_conteo_id BIGINT UNSIGNED,
    IN p_usuario_id INT UNSIGNED
)
BEGIN
    DECLARE v_almacen_id INT UNSIGNED;
    DECLARE v_total_contados INT;
    DECLARE v_total_discrepancias INT;
    DECLARE v_total_faltantes INT;
    DECLARE v_total_sobrantes INT;

    -- Verificar que el conteo existe y está en progreso
    SELECT almacen_id INTO v_almacen_id
    FROM colab_conteos_inventario
    WHERE id = p_conteo_id AND estado IN ('en_progreso', 'pausado');

    IF v_almacen_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conteo no encontrado o no está en progreso';
    END IF;

    -- Calcular totales
    SELECT
        COUNT(*),
        SUM(CASE WHEN diferencia != 0 THEN 1 ELSE 0 END),
        SUM(CASE WHEN diferencia < 0 THEN 1 ELSE 0 END),
        SUM(CASE WHEN diferencia > 0 THEN 1 ELSE 0 END)
    INTO v_total_contados, v_total_discrepancias, v_total_faltantes, v_total_sobrantes
    FROM colab_conteos_inventario_detalle
    WHERE conteo_id = p_conteo_id;

    -- Actualizar conteo
    UPDATE colab_conteos_inventario
    SET estado = 'completado',
        fecha_fin = NOW(),
        total_productos_contados = COALESCE(v_total_contados, 0),
        total_discrepancias = COALESCE(v_total_discrepancias, 0),
        total_faltantes = COALESCE(v_total_faltantes, 0),
        total_sobrantes = COALESCE(v_total_sobrantes, 0)
    WHERE id = p_conteo_id;

    SELECT
        COALESCE(v_total_contados, 0) AS total_contados,
        COALESCE(v_total_discrepancias, 0) AS total_discrepancias,
        COALESCE(v_total_faltantes, 0) AS total_faltantes,
        COALESCE(v_total_sobrantes, 0) AS total_sobrantes,
        'Conteo cerrado correctamente. Pendiente de aprobación.' AS mensaje;
END //

-- Transferencia entre almacenes
CREATE PROCEDURE sp_colab_transferir_entre_almacenes(
    IN p_usuario_id INT UNSIGNED,
    IN p_almacen_origen_id INT UNSIGNED,
    IN p_almacen_destino_id INT UNSIGNED,
    IN p_producto_id INT,
    IN p_variante_id INT,
    IN p_cantidad INT,
    IN p_motivo TEXT,
    IN p_ip_address VARCHAR(45)
)
BEGIN
    DECLARE v_cantidad_origen INT DEFAULT 0;
    DECLARE v_cantidad_destino INT DEFAULT 0;
    DECLARE v_stock_origen_id BIGINT UNSIGNED;
    DECLARE v_stock_destino_id BIGINT UNSIGNED;
    DECLARE v_turno_id INT UNSIGNED;
    DECLARE v_requiere_aprobacion BOOLEAN DEFAULT FALSE;

    -- Verificar asignación en almacén origen
    IF NOT EXISTS (
        SELECT 1 FROM colab_asignaciones_almacen
        WHERE usuario_id = p_usuario_id
            AND almacen_id = p_almacen_origen_id
            AND es_activa = TRUE
            AND nivel_acceso IN ('operacion', 'administracion')
            AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sin permisos de operación en almacén origen';
    END IF;

    -- Verificar configuración de aprobación
    SELECT valor = 'true' INTO v_requiere_aprobacion
    FROM colab_configuracion WHERE clave = 'transferencia_requiere_aprobacion';

    -- Obtener turno activo
    SELECT id INTO v_turno_id
    FROM colab_turnos
    WHERE usuario_id = p_usuario_id AND fecha = CURRENT_DATE AND estado = 'en_curso'
    LIMIT 1;

    -- Verificar stock en origen
    SELECT id, cantidad_disponible INTO v_stock_origen_id, v_cantidad_origen
    FROM inventario_stock
    WHERE producto_id = p_producto_id
        AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL))
        AND almacen_id = p_almacen_origen_id
    LIMIT 1;

    IF v_stock_origen_id IS NULL OR v_cantidad_origen < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente en almacén origen';
    END IF;

    START TRANSACTION;

    -- Reducir stock en origen
    UPDATE inventario_stock
    SET cantidad_disponible = cantidad_disponible - p_cantidad,
        cantidad_en_transito = cantidad_en_transito + p_cantidad,
        ultimo_movimiento = NOW()
    WHERE id = v_stock_origen_id;

    -- Obtener stock destino
    SELECT id, cantidad_disponible INTO v_stock_destino_id, v_cantidad_destino
    FROM inventario_stock
    WHERE producto_id = p_producto_id
        AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL))
        AND almacen_id = p_almacen_destino_id
    LIMIT 1;

    -- Crear registro en destino si no existe
    IF v_stock_destino_id IS NULL THEN
        INSERT INTO inventario_stock (producto_id, variante_id, almacen_id, cantidad_disponible, cantidad_en_transito)
        VALUES (p_producto_id, p_variante_id, p_almacen_destino_id, 0, p_cantidad);
        SET v_cantidad_destino = 0;
    ELSE
        UPDATE inventario_stock
        SET cantidad_en_transito = cantidad_en_transito + p_cantidad
        WHERE id = v_stock_destino_id;
    END IF;

    -- Registrar movimiento general (salida transferencia)
    INSERT INTO movimientos_inventario (
        producto_id, cantidad, tipo_movimiento,
        motivo, stock_anterior, stock_nuevo, usuario_id
    ) VALUES (
        p_producto_id, p_cantidad, 'transferencia',
        CONCAT(COALESCE(p_motivo, 'Transferencia entre almacenes'), ' [Origen:#', p_almacen_origen_id, ' Destino:#', p_almacen_destino_id, ']'),
        v_cantidad_origen, v_cantidad_origen - p_cantidad, p_usuario_id
    );

    -- Registrar actividad del colaborador (salida)
    INSERT INTO colab_actividad_inventario (
        usuario_id, turno_id, almacen_id,
        tipo_operacion, producto_id, variante_id,
        cantidad, cantidad_anterior, cantidad_nueva,
        referencia_externa, motivo, ip_address,
        requiere_aprobacion, estado_aprobacion
    ) VALUES (
        p_usuario_id, v_turno_id, p_almacen_origen_id,
        'transferencia_salida', p_producto_id, p_variante_id,
        p_cantidad, v_cantidad_origen, v_cantidad_origen - p_cantidad,
        CONCAT('Destino: almacén #', p_almacen_destino_id), p_motivo, p_ip_address,
        v_requiere_aprobacion, IF(v_requiere_aprobacion, 'pendiente', NULL)
    );

    COMMIT;

    SELECT 'Transferencia registrada correctamente' AS mensaje,
        v_requiere_aprobacion AS pendiente_aprobacion;
END //

DELIMITER ;

-- ============================================================================
-- EVENTOS AUTOMÁTICOS
-- ============================================================================

-- Cerrar sesiones expiradas de colaboradores
CREATE EVENT IF NOT EXISTS evento_colab_cerrar_sesiones_expiradas
ON SCHEDULE EVERY 5 MINUTE
STARTS CURRENT_TIMESTAMP
DO
    UPDATE colab_sesiones
    SET es_activa = FALSE,
        cerrada_en = NOW(),
        motivo_cierre = 'expiracion'
    WHERE es_activa = TRUE
        AND expira_en < NOW();

-- Cerrar turnos olvidados (más de 12 horas abiertos)
CREATE EVENT IF NOT EXISTS evento_colab_cerrar_turnos_olvidados
ON SCHEDULE EVERY 30 MINUTE
STARTS CURRENT_TIMESTAMP
DO
    UPDATE colab_turnos
    SET estado = 'completado',
        hora_salida = NOW(),
        notas_salida = 'Turno cerrado automáticamente por sistema (superó tiempo máximo)'
    WHERE estado = 'en_curso'
        AND TIMESTAMPDIFF(HOUR, hora_entrada, NOW()) >= 12;

-- Limpiar tokens expirados de colaboradores
CREATE EVENT IF NOT EXISTS evento_colab_limpiar_tokens_expirados
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
    DELETE FROM colab_tokens
    WHERE expira_en < NOW()
        AND usado_en IS NULL;

-- ============================================================================
-- MÓDULO ADMIN: Agregar permisos de gestión de colaboradores al panel admin
-- ============================================================================

-- Permisos de gestión de colaboradores (adaptados a estructura actual de permisos)
INSERT INTO permisos (codigo, nombre, descripcion, modulo) VALUES
('colaboradores.ver', 'Ver colaboradores', 'Permite ver listado de colaboradores', 'colaboradores'),
('colaboradores.crear', 'Crear colaboradores', 'Permite crear nuevos colaboradores', 'colaboradores'),
('colaboradores.editar', 'Editar colaboradores', 'Permite editar datos de colaboradores', 'colaboradores'),
('colaboradores.eliminar', 'Eliminar colaboradores', 'Permite eliminar colaboradores', 'colaboradores'),
('colaboradores.asignar', 'Asignar roles y almacenes', 'Permite asignar roles y almacenes a colaboradores', 'colaboradores')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Asignar permisos de colaboradores al rol con id 1 (super_admin)
INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos WHERE codigo LIKE 'colaboradores.%'
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ============================================================================
-- FIN DE FASE 13
-- ============================================================================

SELECT '========================================' AS '';
SELECT 'FASE 13 INSTALADA CORRECTAMENTE' AS estado;
SELECT 'Portal de Colaboradores (Operaciones)' AS modulo;
SELECT NOW() AS fecha_instalacion;
SELECT '========================================' AS '';
