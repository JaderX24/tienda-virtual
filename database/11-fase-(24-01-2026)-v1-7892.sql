-- ============================================================================
-- TIENDA VIRTUAL - FASE 11: PAGOS AVANZADOS
-- ============================================================================
-- Versión: 1.0
-- Fecha: 24-01-2026
-- Descripción: Sistema completo de pagos con múltiples pasarelas,
--              split payments, suscripciones y wallets
-- Dependencias: Fases 1-10 instaladas
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- CONFIGURACIÓN INICIAL
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- LIMPIEZA DE OBJETOS EXISTENTES
-- ============================================================================

-- Eliminar vistas
DROP VIEW IF EXISTS vista_transacciones_recientes;
DROP VIEW IF EXISTS vista_suscripciones_activas;
DROP VIEW IF EXISTS vista_pagos_pendientes;
DROP VIEW IF EXISTS vista_reembolsos_pendientes;
DROP VIEW IF EXISTS vista_comisiones_marketplace;
DROP VIEW IF EXISTS vista_balance_wallets;

-- Eliminar procedimientos
DROP PROCEDURE IF EXISTS sp_procesar_pago;
DROP PROCEDURE IF EXISTS sp_crear_suscripcion;
DROP PROCEDURE IF EXISTS sp_renovar_suscripcion;
DROP PROCEDURE IF EXISTS sp_cancelar_suscripcion;
DROP PROCEDURE IF EXISTS sp_procesar_reembolso;
DROP PROCEDURE IF EXISTS sp_split_payment;
DROP PROCEDURE IF EXISTS sp_recargar_wallet;
DROP PROCEDURE IF EXISTS sp_transferir_wallet;
DROP PROCEDURE IF EXISTS sp_liquidar_vendedor;
DROP PROCEDURE IF EXISTS sp_conciliar_transacciones;

-- Eliminar eventos
DROP EVENT IF EXISTS evento_renovar_suscripciones;
DROP EVENT IF EXISTS evento_verificar_pagos_pendientes;
DROP EVENT IF EXISTS evento_liquidacion_vendedores;
DROP EVENT IF EXISTS evento_limpiar_tokens_expirados;

-- Eliminar triggers
DROP TRIGGER IF EXISTS trg_actualizar_balance_wallet;
DROP TRIGGER IF EXISTS trg_log_transaccion;
DROP TRIGGER IF EXISTS trg_notificar_pago;

-- Eliminar tablas (orden por dependencias)
DROP TABLE IF EXISTS pagos_liquidaciones_detalle;
DROP TABLE IF EXISTS pagos_liquidaciones;
DROP TABLE IF EXISTS pagos_split_detalle;
DROP TABLE IF EXISTS pagos_splits;
DROP TABLE IF EXISTS pagos_suscripciones_historial;
DROP TABLE IF EXISTS pagos_suscripciones;
DROP TABLE IF EXISTS pagos_planes_suscripcion;
DROP TABLE IF EXISTS pagos_reembolsos;
DROP TABLE IF EXISTS pagos_disputas_evidencia;
DROP TABLE IF EXISTS pagos_disputas;
DROP TABLE IF EXISTS pagos_transacciones_log;
DROP TABLE IF EXISTS pagos_transacciones;
DROP TABLE IF EXISTS pagos_wallets_movimientos;
DROP TABLE IF EXISTS pagos_wallets;
DROP TABLE IF EXISTS pagos_metodos_cliente;
DROP TABLE IF EXISTS pagos_tokens_tarjeta;
DROP TABLE IF EXISTS pagos_pasarelas_comisiones;
DROP TABLE IF EXISTS pagos_pasarelas_credenciales;
DROP TABLE IF EXISTS pagos_pasarelas;
DROP TABLE IF EXISTS pagos_monedas;
DROP TABLE IF EXISTS pagos_configuracion;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLA: pagos_configuracion
-- Configuración general del sistema de pagos
-- ============================================================================

CREATE TABLE pagos_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato ENUM('texto', 'numero', 'booleano', 'json', 'encriptado') DEFAULT 'texto',
    descripcion VARCHAR(500),
    empresa_id INT UNSIGNED NULL,
    es_sensible BOOLEAN DEFAULT FALSE,
    es_global BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_pago_config_clave_empresa (clave, empresa_id),
    INDEX idx_pago_config_empresa (empresa_id),
    
    CONSTRAINT fk_pago_config_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_monedas
-- Monedas soportadas por el sistema
-- ============================================================================

CREATE TABLE pagos_monedas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(3) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    simbolo VARCHAR(10) NOT NULL,
    decimales TINYINT UNSIGNED DEFAULT 2,
    formato_patron VARCHAR(50) DEFAULT '#,##0.00',
    es_principal BOOLEAN DEFAULT FALSE,
    tasa_cambio_base DECIMAL(15,6) DEFAULT 1.000000,
    ultima_actualizacion_tasa TIMESTAMP NULL,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_moneda_activo (es_activo),
    INDEX idx_moneda_principal (es_principal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_pasarelas
-- Pasarelas de pago disponibles
-- ============================================================================

CREATE TABLE pagos_pasarelas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    tipo ENUM(
        'tarjeta',
        'transferencia',
        'wallet_digital',
        'efectivo',
        'criptomoneda',
        'bnpl',
        'otro'
    ) NOT NULL DEFAULT 'tarjeta',
    proveedor VARCHAR(100),
    logo_url VARCHAR(500),
    url_documentacion VARCHAR(500),
    
    -- Configuración de integración
    modo_integracion ENUM('api', 'redirect', 'iframe', 'sdk', 'webhook') DEFAULT 'api',
    url_api_sandbox VARCHAR(500),
    url_api_produccion VARCHAR(500),
    version_api VARCHAR(20),
    
    -- Características soportadas
    soporta_tokenizacion BOOLEAN DEFAULT FALSE,
    soporta_3ds BOOLEAN DEFAULT FALSE,
    soporta_reembolsos BOOLEAN DEFAULT TRUE,
    soporta_reembolsos_parciales BOOLEAN DEFAULT FALSE,
    soporta_suscripciones BOOLEAN DEFAULT FALSE,
    soporta_split_payment BOOLEAN DEFAULT FALSE,
    soporta_preautorizacion BOOLEAN DEFAULT FALSE,
    soporta_captura_diferida BOOLEAN DEFAULT FALSE,
    
    -- Monedas soportadas (JSON array de códigos)
    monedas_soportadas JSON,
    
    -- Límites
    monto_minimo DECIMAL(15,2) DEFAULT 1.00,
    monto_maximo DECIMAL(15,2) DEFAULT 999999.99,
    
    -- Control
    orden_prioridad INT DEFAULT 0,
    es_activo BOOLEAN DEFAULT TRUE,
    es_visible_cliente BOOLEAN DEFAULT TRUE,
    requiere_configuracion BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pasarela_tipo (tipo),
    INDEX idx_pasarela_activo (es_activo),
    INDEX idx_pasarela_orden (orden_prioridad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_pasarelas_credenciales
-- Credenciales de pasarelas por empresa (encriptadas)
-- ============================================================================

CREATE TABLE pagos_pasarelas_credenciales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pasarela_id INT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED NOT NULL,
    
    -- Ambiente
    ambiente ENUM('sandbox', 'produccion') NOT NULL DEFAULT 'sandbox',
    
    -- Credenciales (valores encriptados en aplicación)
    api_key_publica TEXT,
    api_key_privada TEXT,
    merchant_id VARCHAR(200),
    webhook_secret TEXT,
    certificado TEXT,
    credenciales_extra JSON,
    
    -- Estado
    es_activo BOOLEAN DEFAULT TRUE,
    verificado_en TIMESTAMP NULL,
    ultimo_uso_en TIMESTAMP NULL,
    
    -- Auditoría
    creado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_pasarela_empresa_ambiente (pasarela_id, empresa_id, ambiente),
    INDEX idx_cred_empresa (empresa_id),
    INDEX idx_cred_activo (es_activo),
    
    CONSTRAINT fk_pago_cred_pasarela 
        FOREIGN KEY (pasarela_id) REFERENCES pagos_pasarelas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_cred_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_cred_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_pasarelas_comisiones
-- Comisiones por pasarela y empresa
-- ============================================================================

CREATE TABLE pagos_pasarelas_comisiones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pasarela_id INT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED NULL,
    
    -- Tipo de comisión
    tipo_comision ENUM('porcentaje', 'fijo', 'mixto') NOT NULL DEFAULT 'porcentaje',
    
    -- Valores
    porcentaje DECIMAL(5,4) DEFAULT 0.0000,
    monto_fijo DECIMAL(10,2) DEFAULT 0.00,
    moneda_id INT UNSIGNED,
    
    -- Rangos (para comisiones escalonadas)
    monto_desde DECIMAL(15,2) DEFAULT 0.00,
    monto_hasta DECIMAL(15,2) DEFAULT 999999999.99,
    
    -- Tipo de transacción
    tipo_transaccion ENUM('venta', 'reembolso', 'suscripcion', 'transferencia', 'todos') DEFAULT 'todos',
    
    -- Control
    es_activo BOOLEAN DEFAULT TRUE,
    vigencia_desde DATE,
    vigencia_hasta DATE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_comision_pasarela (pasarela_id),
    INDEX idx_comision_empresa (empresa_id),
    INDEX idx_comision_vigencia (vigencia_desde, vigencia_hasta),
    
    CONSTRAINT fk_pago_com_pasarela 
        FOREIGN KEY (pasarela_id) REFERENCES pagos_pasarelas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_com_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_com_moneda 
        FOREIGN KEY (moneda_id) REFERENCES pagos_monedas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_tokens_tarjeta
-- Tokens de tarjetas tokenizadas (sin datos sensibles)
-- ============================================================================

CREATE TABLE pagos_tokens_tarjeta (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    pasarela_id INT UNSIGNED NOT NULL,
    
    -- Token de la pasarela (encriptado)
    token_pasarela TEXT NOT NULL,
    
    -- Datos no sensibles de la tarjeta
    ultimos_cuatro VARCHAR(4) NOT NULL,
    marca ENUM('visa', 'mastercard', 'amex', 'diners', 'discover', 'jcb', 'otro') NOT NULL,
    tipo ENUM('credito', 'debito', 'prepago') DEFAULT 'credito',
    banco_emisor VARCHAR(100),
    pais_emision VARCHAR(2),
    
    -- Expiración
    mes_expiracion TINYINT UNSIGNED NOT NULL,
    anio_expiracion SMALLINT UNSIGNED NOT NULL,
    
    -- Alias y preferencias
    alias VARCHAR(100),
    es_predeterminada BOOLEAN DEFAULT FALSE,
    
    -- Control
    intentos_fallidos INT UNSIGNED DEFAULT 0,
    ultimo_uso_exitoso TIMESTAMP NULL,
    es_activo BOOLEAN DEFAULT TRUE,
    fecha_expiracion_token DATE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_token_cliente (cliente_id),
    INDEX idx_token_pasarela (pasarela_id),
    INDEX idx_token_activo (es_activo),
    INDEX idx_token_predeterminada (cliente_id, es_predeterminada),
    
    CONSTRAINT fk_pago_token_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_token_pasarela 
        FOREIGN KEY (pasarela_id) REFERENCES pagos_pasarelas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_metodos_cliente
-- Métodos de pago guardados por cliente
-- ============================================================================

CREATE TABLE pagos_metodos_cliente (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    pasarela_id INT UNSIGNED NOT NULL,
    
    -- Tipo de método
    tipo ENUM('tarjeta', 'cuenta_bancaria', 'wallet', 'otro') NOT NULL,
    
    -- Referencia al token o datos
    token_tarjeta_id BIGINT UNSIGNED NULL,
    
    -- Datos de cuenta bancaria (parciales, no sensibles)
    banco_nombre VARCHAR(100),
    cuenta_tipo ENUM('ahorro', 'corriente', 'monetaria'),
    cuenta_ultimos_cuatro VARCHAR(4),
    
    -- Identificador externo
    referencia_externa VARCHAR(200),
    
    -- Preferencias
    alias VARCHAR(100),
    es_predeterminado BOOLEAN DEFAULT FALSE,
    
    -- Control
    es_verificado BOOLEAN DEFAULT FALSE,
    verificado_en TIMESTAMP NULL,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_metodo_cliente (cliente_id),
    INDEX idx_metodo_pasarela (pasarela_id),
    INDEX idx_metodo_tipo (tipo),
    INDEX idx_metodo_predeterminado (cliente_id, es_predeterminado),
    
    CONSTRAINT fk_pago_metodo_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_metodo_pasarela 
        FOREIGN KEY (pasarela_id) REFERENCES pagos_pasarelas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_metodo_token 
        FOREIGN KEY (token_tarjeta_id) REFERENCES pagos_tokens_tarjeta(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_wallets
-- Billeteras virtuales de clientes
-- ============================================================================

CREATE TABLE pagos_wallets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED NOT NULL,
    
    -- Identificación
    codigo VARCHAR(20) NOT NULL UNIQUE,
    
    -- Balance
    balance_disponible DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance_pendiente DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance_retenido DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    moneda_id INT UNSIGNED NOT NULL,
    
    -- Límites
    limite_recarga_diario DECIMAL(15,2) DEFAULT 10000.00,
    limite_transferencia_diario DECIMAL(15,2) DEFAULT 5000.00,
    recargado_hoy DECIMAL(15,2) DEFAULT 0.00,
    transferido_hoy DECIMAL(15,2) DEFAULT 0.00,
    fecha_reset_limites DATE,
    
    -- Estado
    estado ENUM('activo', 'suspendido', 'bloqueado', 'cerrado') DEFAULT 'activo',
    razon_bloqueo VARCHAR(500),
    
    -- Seguridad
    pin_hash VARCHAR(255),
    intentos_pin_fallidos TINYINT UNSIGNED DEFAULT 0,
    ultimo_acceso TIMESTAMP NULL,
    
    -- Control
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_wallet_cliente_empresa (cliente_id, empresa_id),
    INDEX idx_wallet_empresa (empresa_id),
    INDEX idx_wallet_estado (estado),
    INDEX idx_wallet_codigo (codigo),
    
    CONSTRAINT fk_pago_wallet_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_wallet_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_wallet_moneda 
        FOREIGN KEY (moneda_id) REFERENCES pagos_monedas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_wallets_movimientos
-- Movimientos de billeteras virtuales
-- ============================================================================

CREATE TABLE pagos_wallets_movimientos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo de movimiento
    tipo ENUM(
        'recarga',
        'compra',
        'reembolso',
        'transferencia_entrada',
        'transferencia_salida',
        'cashback',
        'bonificacion',
        'ajuste',
        'retencion',
        'liberacion',
        'retiro'
    ) NOT NULL,
    
    -- Montos
    monto DECIMAL(15,2) NOT NULL,
    balance_anterior DECIMAL(15,2) NOT NULL,
    balance_posterior DECIMAL(15,2) NOT NULL,
    
    -- Referencia
    referencia_tipo VARCHAR(50),
    referencia_id BIGINT UNSIGNED,
    
    -- Descripción
    concepto VARCHAR(500),
    
    -- Metadata
    metadata JSON,
    
    -- Control
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mov_wallet (wallet_id),
    INDEX idx_mov_tipo (tipo),
    INDEX idx_mov_fecha (creado_en),
    INDEX idx_mov_referencia (referencia_tipo, referencia_id),
    
    CONSTRAINT fk_pago_mov_wallet 
        FOREIGN KEY (wallet_id) REFERENCES pagos_wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_transacciones
-- Transacciones de pago principales
-- ============================================================================

CREATE TABLE pagos_transacciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificadores
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    numero_transaccion VARCHAR(50) NOT NULL UNIQUE,
    referencia_externa VARCHAR(200),
    
    -- Relaciones
    empresa_id INT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED,
    pedido_id BIGINT UNSIGNED,
    pasarela_id INT UNSIGNED NOT NULL,
    metodo_pago_id BIGINT UNSIGNED,
    
    -- Tipo y estado
    tipo ENUM(
        'venta',
        'preautorizacion',
        'captura',
        'reembolso',
        'reembolso_parcial',
        'anulacion',
        'suscripcion',
        'recarga_wallet',
        'transferencia'
    ) NOT NULL DEFAULT 'venta',
    
    estado ENUM(
        'pendiente',
        'procesando',
        'aprobada',
        'rechazada',
        'cancelada',
        'reembolsada',
        'en_disputa',
        'expirada',
        'error'
    ) NOT NULL DEFAULT 'pendiente',
    
    -- Montos
    monto_original DECIMAL(15,2) NOT NULL,
    monto_procesado DECIMAL(15,2) NOT NULL,
    monto_comision DECIMAL(15,2) DEFAULT 0.00,
    monto_impuesto DECIMAL(15,2) DEFAULT 0.00,
    monto_neto DECIMAL(15,2) DEFAULT 0.00,
    moneda_id INT UNSIGNED NOT NULL,
    
    -- Tasa de cambio (si aplica)
    tasa_cambio DECIMAL(15,6) DEFAULT 1.000000,
    moneda_origen_id INT UNSIGNED,
    monto_origen DECIMAL(15,2),
    
    -- Datos de la pasarela
    pasarela_transaccion_id VARCHAR(200),
    pasarela_autorizacion VARCHAR(100),
    pasarela_respuesta_codigo VARCHAR(50),
    pasarela_respuesta_mensaje VARCHAR(500),
    pasarela_respuesta_raw JSON,
    
    -- Datos del método de pago
    metodo_tipo VARCHAR(50),
    metodo_ultimos_cuatro VARCHAR(4),
    metodo_marca VARCHAR(50),
    
    -- 3D Secure
    requiere_3ds BOOLEAN DEFAULT FALSE,
    estado_3ds ENUM('no_aplica', 'pendiente', 'exitoso', 'fallido') DEFAULT 'no_aplica',
    
    -- Información del cliente
    ip_cliente VARCHAR(45),
    user_agent VARCHAR(500),
    dispositivo VARCHAR(50),
    
    -- Fechas importantes
    fecha_autorizacion TIMESTAMP NULL,
    fecha_captura TIMESTAMP NULL,
    fecha_reembolso TIMESTAMP NULL,
    fecha_expiracion TIMESTAMP NULL,
    
    -- Control
    intentos INT UNSIGNED DEFAULT 1,
    es_recurrente BOOLEAN DEFAULT FALSE,
    suscripcion_id BIGINT UNSIGNED,
    transaccion_padre_id BIGINT UNSIGNED,
    
    -- Auditoría
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_trans_uuid (uuid),
    INDEX idx_trans_numero (numero_transaccion),
    INDEX idx_trans_empresa (empresa_id),
    INDEX idx_trans_cliente (cliente_id),
    INDEX idx_trans_pedido (pedido_id),
    INDEX idx_trans_pasarela (pasarela_id),
    INDEX idx_trans_estado (estado),
    INDEX idx_trans_tipo (tipo),
    INDEX idx_trans_fecha (creado_en),
    INDEX idx_trans_pasarela_id (pasarela_transaccion_id),
    
    CONSTRAINT fk_pago_trans_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_trans_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_trans_pasarela 
        FOREIGN KEY (pasarela_id) REFERENCES pagos_pasarelas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pago_trans_metodo 
        FOREIGN KEY (metodo_pago_id) REFERENCES pagos_metodos_cliente(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_trans_moneda 
        FOREIGN KEY (moneda_id) REFERENCES pagos_monedas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pago_trans_moneda_origen 
        FOREIGN KEY (moneda_origen_id) REFERENCES pagos_monedas(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_trans_padre 
        FOREIGN KEY (transaccion_padre_id) REFERENCES pagos_transacciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_transacciones_log
-- Log detallado de eventos de transacciones
-- ============================================================================

CREATE TABLE pagos_transacciones_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaccion_id BIGINT UNSIGNED NOT NULL,
    
    -- Evento
    evento ENUM(
        'creada',
        'enviada_pasarela',
        'respuesta_pasarela',
        'aprobada',
        'rechazada',
        '3ds_iniciado',
        '3ds_completado',
        'capturada',
        'reembolsada',
        'anulada',
        'disputa_abierta',
        'disputa_resuelta',
        'webhook_recibido',
        'error',
        'reintento',
        'notificacion_enviada'
    ) NOT NULL,
    
    -- Estado antes y después
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    
    -- Detalles
    mensaje VARCHAR(1000),
    datos JSON,
    
    -- Origen
    origen ENUM('sistema', 'pasarela', 'webhook', 'manual', 'automatico') DEFAULT 'sistema',
    usuario_id INT UNSIGNED,
    ip_origen VARCHAR(45),
    
    -- Timestamp
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_log_transaccion (transaccion_id),
    INDEX idx_log_evento (evento),
    INDEX idx_log_fecha (creado_en),
    
    CONSTRAINT fk_pago_log_transaccion 
        FOREIGN KEY (transaccion_id) REFERENCES pagos_transacciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_log_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_reembolsos
-- Reembolsos de transacciones
-- ============================================================================

CREATE TABLE pagos_reembolsos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificadores
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    numero_reembolso VARCHAR(50) NOT NULL UNIQUE,
    
    -- Relaciones
    transaccion_id BIGINT UNSIGNED NOT NULL,
    transaccion_reembolso_id BIGINT UNSIGNED,
    
    -- Tipo
    tipo ENUM('total', 'parcial') NOT NULL DEFAULT 'total',
    
    -- Montos
    monto_solicitado DECIMAL(15,2) NOT NULL,
    monto_aprobado DECIMAL(15,2),
    monto_comision_retenida DECIMAL(15,2) DEFAULT 0.00,
    
    -- Estado
    estado ENUM(
        'solicitado',
        'en_revision',
        'aprobado',
        'procesando',
        'completado',
        'rechazado',
        'cancelado'
    ) NOT NULL DEFAULT 'solicitado',
    
    -- Razón
    motivo ENUM(
        'solicitud_cliente',
        'producto_defectuoso',
        'no_entregado',
        'diferente_descripcion',
        'duplicado',
        'fraude',
        'otro'
    ) NOT NULL,
    descripcion_motivo TEXT,
    
    -- Respuesta de pasarela
    pasarela_reembolso_id VARCHAR(200),
    pasarela_respuesta JSON,
    
    -- Procesamiento
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP NULL,
    fecha_procesamiento TIMESTAMP NULL,
    fecha_completado TIMESTAMP NULL,
    
    -- Auditoría
    solicitado_por_tipo ENUM('cliente', 'admin', 'sistema') DEFAULT 'cliente',
    solicitado_por_id BIGINT UNSIGNED,
    aprobado_por INT UNSIGNED,
    notas_internas TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_reembolso_transaccion (transaccion_id),
    INDEX idx_reembolso_estado (estado),
    INDEX idx_reembolso_fecha (fecha_solicitud),
    
    CONSTRAINT fk_pago_reembolso_trans 
        FOREIGN KEY (transaccion_id) REFERENCES pagos_transacciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_reembolso_trans_re 
        FOREIGN KEY (transaccion_reembolso_id) REFERENCES pagos_transacciones(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_reembolso_aprobador 
        FOREIGN KEY (aprobado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_disputas
-- Disputas y contracargos
-- ============================================================================

CREATE TABLE pagos_disputas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificadores
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    numero_disputa VARCHAR(50) NOT NULL UNIQUE,
    
    -- Relaciones
    transaccion_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo y estado
    tipo ENUM('chargeback', 'pre_chargeback', 'consulta', 'fraude') NOT NULL,
    estado ENUM(
        'abierta',
        'en_revision',
        'evidencia_enviada',
        'ganada',
        'perdida',
        'cerrada'
    ) NOT NULL DEFAULT 'abierta',
    
    -- Monto en disputa
    monto_disputado DECIMAL(15,2) NOT NULL,
    monto_resuelto DECIMAL(15,2),
    
    -- Razón
    razon_codigo VARCHAR(50),
    razon_descripcion VARCHAR(500),
    
    -- Fechas importantes
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_respuesta DATE,
    fecha_resolucion TIMESTAMP NULL,
    
    -- Datos de pasarela
    pasarela_disputa_id VARCHAR(200),
    pasarela_datos JSON,
    
    -- Notas
    notas_internas TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_disputa_transaccion (transaccion_id),
    INDEX idx_disputa_estado (estado),
    INDEX idx_disputa_fecha (fecha_apertura),
    
    CONSTRAINT fk_pago_disputa_trans 
        FOREIGN KEY (transaccion_id) REFERENCES pagos_transacciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_disputas_evidencia
-- Evidencia para disputas
-- ============================================================================

CREATE TABLE pagos_disputas_evidencia (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    disputa_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo de evidencia
    tipo ENUM(
        'comprobante_entrega',
        'comunicacion_cliente',
        'politica_devolucion',
        'descripcion_producto',
        'confirmacion_pedido',
        'tracking',
        'firma_cliente',
        'otro'
    ) NOT NULL,
    
    -- Archivo
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100),
    url_archivo VARCHAR(500),
    tamano_bytes BIGINT UNSIGNED,
    
    -- Descripción
    descripcion TEXT,
    
    -- Control
    subido_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_evidencia_disputa (disputa_id),
    
    CONSTRAINT fk_pago_evidencia_disputa 
        FOREIGN KEY (disputa_id) REFERENCES pagos_disputas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_evidencia_usuario 
        FOREIGN KEY (subido_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_planes_suscripcion
-- Planes de suscripción disponibles
-- ============================================================================

CREATE TABLE pagos_planes_suscripcion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    
    -- Empresa
    empresa_id INT UNSIGNED NOT NULL,
    
    -- Precio
    precio DECIMAL(15,2) NOT NULL,
    moneda_id INT UNSIGNED NOT NULL,
    
    -- Frecuencia de cobro
    intervalo ENUM('dia', 'semana', 'mes', 'anio') NOT NULL DEFAULT 'mes',
    frecuencia_intervalo TINYINT UNSIGNED NOT NULL DEFAULT 1,
    
    -- Período de prueba
    dias_prueba INT UNSIGNED DEFAULT 0,
    
    -- Ciclos
    ciclos_totales INT UNSIGNED,
    es_ilimitado BOOLEAN DEFAULT TRUE,
    
    -- Configuración
    permite_pausa BOOLEAN DEFAULT TRUE,
    dias_gracia INT UNSIGNED DEFAULT 3,
    max_reintentos_pago TINYINT UNSIGNED DEFAULT 3,
    
    -- Características incluidas (JSON)
    caracteristicas JSON,
    
    -- Referencias a productos
    producto_id BIGINT UNSIGNED,
    
    -- Control
    es_activo BOOLEAN DEFAULT TRUE,
    es_publico BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_plan_codigo_empresa (codigo, empresa_id),
    INDEX idx_plan_empresa (empresa_id),
    INDEX idx_plan_activo (es_activo),
    
    CONSTRAINT fk_pago_plan_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_plan_moneda 
        FOREIGN KEY (moneda_id) REFERENCES pagos_monedas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pago_plan_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_suscripciones
-- Suscripciones activas de clientes
-- ============================================================================

CREATE TABLE pagos_suscripciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificadores
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    numero_suscripcion VARCHAR(50) NOT NULL UNIQUE,
    
    -- Relaciones
    plan_id INT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED NOT NULL,
    metodo_pago_id BIGINT UNSIGNED,
    
    -- Estado
    estado ENUM(
        'pendiente_pago',
        'activa',
        'pausada',
        'cancelada',
        'vencida',
        'suspendida'
    ) NOT NULL DEFAULT 'pendiente_pago',
    
    -- Precio actual (puede diferir del plan por descuentos)
    precio_actual DECIMAL(15,2) NOT NULL,
    moneda_id INT UNSIGNED NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    
    -- Fechas del ciclo
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    fecha_proximo_cobro DATE,
    fecha_ultimo_cobro DATE,
    fecha_cancelacion TIMESTAMP NULL,
    
    -- Período de prueba
    en_periodo_prueba BOOLEAN DEFAULT FALSE,
    fecha_fin_prueba DATE,
    
    -- Ciclos
    ciclo_actual INT UNSIGNED DEFAULT 0,
    ciclos_completados INT UNSIGNED DEFAULT 0,
    ciclos_restantes INT UNSIGNED,
    
    -- Reintentos
    intentos_cobro_fallidos TINYINT UNSIGNED DEFAULT 0,
    ultimo_error_cobro VARCHAR(500),
    
    -- Referencia externa (pasarela)
    pasarela_suscripcion_id VARCHAR(200),
    
    -- Cancelación
    razon_cancelacion VARCHAR(500),
    cancelado_por ENUM('cliente', 'admin', 'sistema', 'pasarela'),
    
    -- Metadata
    metadata JSON,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_susc_cliente (cliente_id),
    INDEX idx_susc_plan (plan_id),
    INDEX idx_susc_empresa (empresa_id),
    INDEX idx_susc_estado (estado),
    INDEX idx_susc_proximo_cobro (fecha_proximo_cobro),
    
    CONSTRAINT fk_pago_susc_plan 
        FOREIGN KEY (plan_id) REFERENCES pagos_planes_suscripcion(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pago_susc_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_susc_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_susc_metodo 
        FOREIGN KEY (metodo_pago_id) REFERENCES pagos_metodos_cliente(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_susc_moneda 
        FOREIGN KEY (moneda_id) REFERENCES pagos_monedas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_suscripciones_historial
-- Historial de cobros de suscripciones
-- ============================================================================

CREATE TABLE pagos_suscripciones_historial (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    suscripcion_id BIGINT UNSIGNED NOT NULL,
    transaccion_id BIGINT UNSIGNED,
    
    -- Ciclo
    numero_ciclo INT UNSIGNED NOT NULL,
    
    -- Período facturado
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    
    -- Monto
    monto DECIMAL(15,2) NOT NULL,
    
    -- Estado del cobro
    estado ENUM('exitoso', 'fallido', 'pendiente', 'omitido') NOT NULL,
    
    -- Detalles
    error_mensaje VARCHAR(500),
    intentos INT UNSIGNED DEFAULT 1,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_hist_suscripcion (suscripcion_id),
    INDEX idx_hist_transaccion (transaccion_id),
    INDEX idx_hist_ciclo (numero_ciclo),
    
    CONSTRAINT fk_pago_hist_suscripcion 
        FOREIGN KEY (suscripcion_id) REFERENCES pagos_suscripciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_hist_transaccion 
        FOREIGN KEY (transaccion_id) REFERENCES pagos_transacciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_splits
-- Split payments (división de pagos para marketplace)
-- ============================================================================

CREATE TABLE pagos_splits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificador
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    numero_split VARCHAR(50) NOT NULL UNIQUE,
    
    -- Transacción origen
    transaccion_id BIGINT UNSIGNED NOT NULL,
    
    -- Empresa principal (marketplace)
    empresa_id INT UNSIGNED NOT NULL,
    
    -- Estado
    estado ENUM(
        'pendiente',
        'procesando',
        'completado',
        'parcial',
        'fallido',
        'revertido'
    ) NOT NULL DEFAULT 'pendiente',
    
    -- Totales
    monto_total DECIMAL(15,2) NOT NULL,
    monto_distribuido DECIMAL(15,2) DEFAULT 0.00,
    monto_comision_marketplace DECIMAL(15,2) DEFAULT 0.00,
    moneda_id INT UNSIGNED NOT NULL,
    
    -- Configuración
    tipo_distribucion ENUM('porcentaje', 'monto_fijo', 'mixto') DEFAULT 'porcentaje',
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_split_transaccion (transaccion_id),
    INDEX idx_split_empresa (empresa_id),
    INDEX idx_split_estado (estado),
    
    CONSTRAINT fk_pago_split_trans 
        FOREIGN KEY (transaccion_id) REFERENCES pagos_transacciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_split_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_split_moneda 
        FOREIGN KEY (moneda_id) REFERENCES pagos_monedas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_split_detalle
-- Detalle de distribución de split payments
-- ============================================================================

CREATE TABLE pagos_split_detalle (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    split_id BIGINT UNSIGNED NOT NULL,
    
    -- Destinatario
    vendedor_empresa_id INT UNSIGNED,
    vendedor_wallet_id BIGINT UNSIGNED,
    cuenta_destino VARCHAR(200),
    
    -- Producto/Servicio relacionado
    producto_id BIGINT UNSIGNED,
    pedido_item_id BIGINT UNSIGNED,
    
    -- Montos
    monto_bruto DECIMAL(15,2) NOT NULL,
    comision_marketplace DECIMAL(15,2) DEFAULT 0.00,
    comision_pasarela DECIMAL(15,2) DEFAULT 0.00,
    monto_neto DECIMAL(15,2) NOT NULL,
    
    -- Porcentajes
    porcentaje_vendedor DECIMAL(5,2),
    porcentaje_marketplace DECIMAL(5,2),
    
    -- Estado
    estado ENUM('pendiente', 'transferido', 'fallido', 'revertido') DEFAULT 'pendiente',
    fecha_transferencia TIMESTAMP NULL,
    
    -- Referencia de transferencia
    referencia_transferencia VARCHAR(200),
    error_mensaje VARCHAR(500),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_split_det_split (split_id),
    INDEX idx_split_det_vendedor (vendedor_empresa_id),
    INDEX idx_split_det_estado (estado),
    
    CONSTRAINT fk_pago_split_det_split 
        FOREIGN KEY (split_id) REFERENCES pagos_splits(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_split_det_vendedor 
        FOREIGN KEY (vendedor_empresa_id) REFERENCES admin_empresas(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_split_det_wallet 
        FOREIGN KEY (vendedor_wallet_id) REFERENCES pagos_wallets(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_split_det_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_liquidaciones
-- Liquidaciones a vendedores
-- ============================================================================

CREATE TABLE pagos_liquidaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificador
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    numero_liquidacion VARCHAR(50) NOT NULL UNIQUE,
    
    -- Vendedor
    vendedor_empresa_id INT UNSIGNED NOT NULL,
    
    -- Período
    periodo_desde DATE NOT NULL,
    periodo_hasta DATE NOT NULL,
    
    -- Montos
    monto_bruto DECIMAL(15,2) NOT NULL,
    monto_comisiones DECIMAL(15,2) DEFAULT 0.00,
    monto_retenciones DECIMAL(15,2) DEFAULT 0.00,
    monto_ajustes DECIMAL(15,2) DEFAULT 0.00,
    monto_neto DECIMAL(15,2) NOT NULL,
    moneda_id INT UNSIGNED NOT NULL,
    
    -- Estado
    estado ENUM(
        'borrador',
        'pendiente',
        'aprobada',
        'procesando',
        'pagada',
        'rechazada',
        'cancelada'
    ) NOT NULL DEFAULT 'borrador',
    
    -- Datos de pago
    metodo_pago VARCHAR(50),
    cuenta_destino VARCHAR(200),
    referencia_pago VARCHAR(200),
    fecha_pago TIMESTAMP NULL,
    comprobante_url VARCHAR(500),
    
    -- Auditoría
    creado_por INT UNSIGNED,
    aprobado_por INT UNSIGNED,
    fecha_aprobacion TIMESTAMP NULL,
    notas TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_liq_vendedor (vendedor_empresa_id),
    INDEX idx_liq_estado (estado),
    INDEX idx_liq_periodo (periodo_desde, periodo_hasta),
    
    CONSTRAINT fk_pago_liq_vendedor 
        FOREIGN KEY (vendedor_empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_liq_moneda 
        FOREIGN KEY (moneda_id) REFERENCES pagos_monedas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pago_liq_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_liq_aprobador 
        FOREIGN KEY (aprobado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: pagos_liquidaciones_detalle
-- Detalle de transacciones en liquidación
-- ============================================================================

CREATE TABLE pagos_liquidaciones_detalle (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    liquidacion_id BIGINT UNSIGNED NOT NULL,
    
    -- Referencia
    transaccion_id BIGINT UNSIGNED,
    split_detalle_id BIGINT UNSIGNED,
    
    -- Tipo
    tipo ENUM('venta', 'reembolso', 'comision', 'ajuste', 'retencion') NOT NULL,
    
    -- Descripción
    concepto VARCHAR(500),
    
    -- Monto
    monto DECIMAL(15,2) NOT NULL,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_liq_det_liquidacion (liquidacion_id),
    INDEX idx_liq_det_transaccion (transaccion_id),
    
    CONSTRAINT fk_pago_liq_det_liq 
        FOREIGN KEY (liquidacion_id) REFERENCES pagos_liquidaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_liq_det_trans 
        FOREIGN KEY (transaccion_id) REFERENCES pagos_transacciones(id) ON DELETE SET NULL,
    CONSTRAINT fk_pago_liq_det_split 
        FOREIGN KEY (split_detalle_id) REFERENCES pagos_split_detalle(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista: Transacciones recientes con detalles
CREATE VIEW vista_transacciones_recientes AS
SELECT 
    t.id,
    t.numero_transaccion,
    t.tipo,
    t.estado,
    t.monto_procesado,
    m.codigo AS moneda,
    m.simbolo AS moneda_simbolo,
    p.nombre AS pasarela,
    t.metodo_marca,
    t.metodo_ultimos_cuatro,
    t.cliente_id,
    t.pedido_id,
    t.empresa_id,
    t.creado_en
FROM pagos_transacciones t
INNER JOIN pagos_monedas m ON t.moneda_id = m.id
INNER JOIN pagos_pasarelas p ON t.pasarela_id = p.id
ORDER BY t.creado_en DESC;

-- Vista: Suscripciones activas
CREATE VIEW vista_suscripciones_activas AS
SELECT 
    s.id,
    s.numero_suscripcion,
    s.cliente_id,
    pl.nombre AS plan_nombre,
    s.precio_actual,
    m.codigo AS moneda,
    s.estado,
    s.fecha_proximo_cobro,
    s.ciclo_actual,
    s.en_periodo_prueba,
    s.empresa_id
FROM pagos_suscripciones s
INNER JOIN pagos_planes_suscripcion pl ON s.plan_id = pl.id
INNER JOIN pagos_monedas m ON s.moneda_id = m.id
WHERE s.estado IN ('activa', 'pausada', 'pendiente_pago')
ORDER BY s.fecha_proximo_cobro;

-- Vista: Pagos pendientes de procesar
CREATE VIEW vista_pagos_pendientes AS
SELECT 
    t.id,
    t.numero_transaccion,
    t.tipo,
    t.monto_procesado,
    m.codigo AS moneda,
    t.estado,
    t.intentos,
    t.creado_en,
    TIMESTAMPDIFF(HOUR, t.creado_en, NOW()) AS horas_pendiente,
    t.empresa_id
FROM pagos_transacciones t
INNER JOIN pagos_monedas m ON t.moneda_id = m.id
WHERE t.estado IN ('pendiente', 'procesando')
ORDER BY t.creado_en;

-- Vista: Reembolsos pendientes
CREATE VIEW vista_reembolsos_pendientes AS
SELECT 
    r.id,
    r.numero_reembolso,
    r.tipo,
    r.monto_solicitado,
    r.estado,
    r.motivo,
    r.fecha_solicitud,
    t.numero_transaccion,
    t.empresa_id
FROM pagos_reembolsos r
INNER JOIN pagos_transacciones t ON r.transaccion_id = t.id
WHERE r.estado IN ('solicitado', 'en_revision', 'aprobado', 'procesando')
ORDER BY r.fecha_solicitud;

-- Vista: Comisiones de marketplace
CREATE VIEW vista_comisiones_marketplace AS
SELECT 
    s.empresa_id AS marketplace_id,
    sd.vendedor_empresa_id,
    DATE(s.creado_en) AS fecha,
    COUNT(DISTINCT s.id) AS total_splits,
    SUM(sd.monto_bruto) AS monto_bruto_total,
    SUM(sd.comision_marketplace) AS comision_marketplace_total,
    SUM(sd.monto_neto) AS monto_neto_vendedores
FROM pagos_splits s
INNER JOIN pagos_split_detalle sd ON s.id = sd.split_id
WHERE s.estado = 'completado'
GROUP BY s.empresa_id, sd.vendedor_empresa_id, DATE(s.creado_en);

-- Vista: Balance de wallets
CREATE VIEW vista_balance_wallets AS
SELECT 
    w.id,
    w.codigo,
    w.cliente_id,
    w.balance_disponible,
    w.balance_pendiente,
    w.balance_retenido,
    (w.balance_disponible + w.balance_pendiente) AS balance_total,
    m.codigo AS moneda,
    m.simbolo AS moneda_simbolo,
    w.estado,
    w.empresa_id
FROM pagos_wallets w
INNER JOIN pagos_monedas m ON w.moneda_id = m.id
WHERE w.es_activo = TRUE;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Procedimiento: Procesar pago
CREATE PROCEDURE sp_procesar_pago(
    IN p_empresa_id INT UNSIGNED,
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_pedido_id BIGINT UNSIGNED,
    IN p_pasarela_id INT UNSIGNED,
    IN p_metodo_pago_id BIGINT UNSIGNED,
    IN p_monto DECIMAL(15,2),
    IN p_moneda_id INT UNSIGNED,
    IN p_tipo VARCHAR(50),
    IN p_ip_cliente VARCHAR(45),
    OUT p_transaccion_id BIGINT UNSIGNED,
    OUT p_numero_transaccion VARCHAR(50)
)
BEGIN
    DECLARE v_numero VARCHAR(50);
    DECLARE v_comision DECIMAL(15,2) DEFAULT 0.00;
    
    -- Generar número de transacción
    SET v_numero = CONCAT('TXN-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    
    -- Calcular comisión de la pasarela
    SELECT 
        CASE pc.tipo_comision
            WHEN 'porcentaje' THEN p_monto * (pc.porcentaje / 100)
            WHEN 'fijo' THEN pc.monto_fijo
            WHEN 'mixto' THEN (p_monto * (pc.porcentaje / 100)) + pc.monto_fijo
            ELSE 0
        END INTO v_comision
    FROM pagos_pasarelas_comisiones pc
    WHERE pc.pasarela_id = p_pasarela_id
    AND (pc.empresa_id = p_empresa_id OR pc.empresa_id IS NULL)
    AND pc.es_activo = TRUE
    AND (pc.tipo_transaccion = p_tipo OR pc.tipo_transaccion = 'todos')
    AND p_monto BETWEEN pc.monto_desde AND pc.monto_hasta
    ORDER BY pc.empresa_id DESC
    LIMIT 1;
    
    -- Insertar transacción
    INSERT INTO pagos_transacciones (
        numero_transaccion, empresa_id, cliente_id, pedido_id,
        pasarela_id, metodo_pago_id, tipo, estado,
        monto_original, monto_procesado, monto_comision, monto_neto,
        moneda_id, ip_cliente
    ) VALUES (
        v_numero, p_empresa_id, p_cliente_id, p_pedido_id,
        p_pasarela_id, p_metodo_pago_id, p_tipo, 'pendiente',
        p_monto, p_monto, COALESCE(v_comision, 0), p_monto - COALESCE(v_comision, 0),
        p_moneda_id, p_ip_cliente
    );
    
    SET p_transaccion_id = LAST_INSERT_ID();
    SET p_numero_transaccion = v_numero;
    
    -- Registrar en log
    INSERT INTO pagos_transacciones_log (transaccion_id, evento, estado_nuevo, mensaje, origen)
    VALUES (p_transaccion_id, 'creada', 'pendiente', 'Transacción creada', 'sistema');
END //

-- Procedimiento: Crear suscripción
CREATE PROCEDURE sp_crear_suscripcion(
    IN p_plan_id INT UNSIGNED,
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_metodo_pago_id BIGINT UNSIGNED,
    OUT p_suscripcion_id BIGINT UNSIGNED,
    OUT p_numero_suscripcion VARCHAR(50)
)
BEGIN
    DECLARE v_numero VARCHAR(50);
    DECLARE v_empresa_id INT UNSIGNED;
    DECLARE v_precio DECIMAL(15,2);
    DECLARE v_moneda_id INT UNSIGNED;
    DECLARE v_dias_prueba INT;
    DECLARE v_fecha_inicio DATE;
    DECLARE v_fecha_proximo_cobro DATE;
    DECLARE v_en_prueba BOOLEAN;
    
    -- Obtener datos del plan
    SELECT empresa_id, precio, moneda_id, dias_prueba
    INTO v_empresa_id, v_precio, v_moneda_id, v_dias_prueba
    FROM pagos_planes_suscripcion
    WHERE id = p_plan_id AND es_activo = TRUE;
    
    -- Generar número
    SET v_numero = CONCAT('SUB-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    
    -- Calcular fechas
    SET v_fecha_inicio = CURDATE();
    
    IF v_dias_prueba > 0 THEN
        SET v_en_prueba = TRUE;
        SET v_fecha_proximo_cobro = DATE_ADD(v_fecha_inicio, INTERVAL v_dias_prueba DAY);
    ELSE
        SET v_en_prueba = FALSE;
        SET v_fecha_proximo_cobro = v_fecha_inicio;
    END IF;
    
    -- Crear suscripción
    INSERT INTO pagos_suscripciones (
        numero_suscripcion, plan_id, cliente_id, empresa_id,
        metodo_pago_id, estado, precio_actual, moneda_id,
        fecha_inicio, fecha_proximo_cobro,
        en_periodo_prueba, fecha_fin_prueba
    ) VALUES (
        v_numero, p_plan_id, p_cliente_id, v_empresa_id,
        p_metodo_pago_id, 
        IF(v_en_prueba, 'activa', 'pendiente_pago'),
        v_precio, v_moneda_id,
        v_fecha_inicio, v_fecha_proximo_cobro,
        v_en_prueba,
        IF(v_en_prueba, DATE_ADD(v_fecha_inicio, INTERVAL v_dias_prueba DAY), NULL)
    );
    
    SET p_suscripcion_id = LAST_INSERT_ID();
    SET p_numero_suscripcion = v_numero;
END //

-- Procedimiento: Renovar suscripción
CREATE PROCEDURE sp_renovar_suscripcion(
    IN p_suscripcion_id BIGINT UNSIGNED,
    OUT p_transaccion_id BIGINT UNSIGNED,
    OUT p_resultado VARCHAR(50)
)
BEGIN
    DECLARE v_cliente_id BIGINT UNSIGNED;
    DECLARE v_empresa_id INT UNSIGNED;
    DECLARE v_metodo_pago_id BIGINT UNSIGNED;
    DECLARE v_precio DECIMAL(15,2);
    DECLARE v_moneda_id INT UNSIGNED;
    DECLARE v_pasarela_id INT UNSIGNED;
    DECLARE v_intervalo VARCHAR(10);
    DECLARE v_frecuencia INT;
    DECLARE v_numero_trans VARCHAR(50);
    
    -- Obtener datos de la suscripción
    SELECT 
        s.cliente_id, s.empresa_id, s.metodo_pago_id,
        s.precio_actual, s.moneda_id,
        pl.intervalo, pl.frecuencia_intervalo
    INTO 
        v_cliente_id, v_empresa_id, v_metodo_pago_id,
        v_precio, v_moneda_id,
        v_intervalo, v_frecuencia
    FROM pagos_suscripciones s
    INNER JOIN pagos_planes_suscripcion pl ON s.plan_id = pl.id
    WHERE s.id = p_suscripcion_id;
    
    -- Obtener pasarela del método de pago
    SELECT pasarela_id INTO v_pasarela_id
    FROM pagos_metodos_cliente
    WHERE id = v_metodo_pago_id;
    
    -- Crear transacción de cobro
    CALL sp_procesar_pago(
        v_empresa_id, v_cliente_id, NULL, v_pasarela_id,
        v_metodo_pago_id, v_precio, v_moneda_id, 'suscripcion',
        NULL, p_transaccion_id, v_numero_trans
    );
    
    -- Actualizar transacción con referencia a suscripción
    UPDATE pagos_transacciones
    SET suscripcion_id = p_suscripcion_id, es_recurrente = TRUE
    WHERE id = p_transaccion_id;
    
    -- Actualizar suscripción
    UPDATE pagos_suscripciones
    SET 
        ciclo_actual = ciclo_actual + 1,
        fecha_ultimo_cobro = CURDATE(),
        fecha_proximo_cobro = CASE v_intervalo
            WHEN 'dia' THEN DATE_ADD(CURDATE(), INTERVAL v_frecuencia DAY)
            WHEN 'semana' THEN DATE_ADD(CURDATE(), INTERVAL v_frecuencia WEEK)
            WHEN 'mes' THEN DATE_ADD(CURDATE(), INTERVAL v_frecuencia MONTH)
            WHEN 'anio' THEN DATE_ADD(CURDATE(), INTERVAL v_frecuencia YEAR)
        END,
        en_periodo_prueba = FALSE,
        estado = 'activa'
    WHERE id = p_suscripcion_id;
    
    SET p_resultado = 'cobro_iniciado';
END //

-- Procedimiento: Cancelar suscripción
CREATE PROCEDURE sp_cancelar_suscripcion(
    IN p_suscripcion_id BIGINT UNSIGNED,
    IN p_razon VARCHAR(500),
    IN p_cancelado_por VARCHAR(20),
    OUT p_resultado VARCHAR(50)
)
BEGIN
    UPDATE pagos_suscripciones
    SET 
        estado = 'cancelada',
        fecha_cancelacion = NOW(),
        razon_cancelacion = p_razon,
        cancelado_por = p_cancelado_por
    WHERE id = p_suscripcion_id
    AND estado IN ('activa', 'pausada', 'pendiente_pago');
    
    IF ROW_COUNT() > 0 THEN
        SET p_resultado = 'cancelada';
    ELSE
        SET p_resultado = 'no_modificada';
    END IF;
END //

-- Procedimiento: Procesar reembolso
CREATE PROCEDURE sp_procesar_reembolso(
    IN p_transaccion_id BIGINT UNSIGNED,
    IN p_monto DECIMAL(15,2),
    IN p_motivo VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_solicitado_por_tipo VARCHAR(20),
    IN p_solicitado_por_id BIGINT UNSIGNED,
    OUT p_reembolso_id BIGINT UNSIGNED,
    OUT p_numero_reembolso VARCHAR(50)
)
BEGIN
    DECLARE v_numero VARCHAR(50);
    DECLARE v_monto_original DECIMAL(15,2);
    DECLARE v_tipo VARCHAR(20);
    
    -- Obtener monto original
    SELECT monto_procesado INTO v_monto_original
    FROM pagos_transacciones
    WHERE id = p_transaccion_id;
    
    -- Determinar tipo
    SET v_tipo = IF(p_monto >= v_monto_original, 'total', 'parcial');
    
    -- Generar número
    SET v_numero = CONCAT('REF-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    
    -- Crear reembolso
    INSERT INTO pagos_reembolsos (
        numero_reembolso, transaccion_id, tipo,
        monto_solicitado, estado, motivo, descripcion_motivo,
        solicitado_por_tipo, solicitado_por_id
    ) VALUES (
        v_numero, p_transaccion_id, v_tipo,
        p_monto, 'solicitado', p_motivo, p_descripcion,
        p_solicitado_por_tipo, p_solicitado_por_id
    );
    
    SET p_reembolso_id = LAST_INSERT_ID();
    SET p_numero_reembolso = v_numero;
END //

-- Procedimiento: Split payment
CREATE PROCEDURE sp_split_payment(
    IN p_transaccion_id BIGINT UNSIGNED,
    IN p_empresa_id INT UNSIGNED,
    IN p_comision_marketplace DECIMAL(5,2),
    OUT p_split_id BIGINT UNSIGNED,
    OUT p_numero_split VARCHAR(50)
)
BEGIN
    DECLARE v_numero VARCHAR(50);
    DECLARE v_monto DECIMAL(15,2);
    DECLARE v_moneda_id INT UNSIGNED;
    DECLARE v_comision_monto DECIMAL(15,2);
    
    -- Obtener datos de la transacción
    SELECT monto_procesado, moneda_id
    INTO v_monto, v_moneda_id
    FROM pagos_transacciones
    WHERE id = p_transaccion_id;
    
    -- Calcular comisión
    SET v_comision_monto = v_monto * (p_comision_marketplace / 100);
    
    -- Generar número
    SET v_numero = CONCAT('SPL-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    
    -- Crear split
    INSERT INTO pagos_splits (
        numero_split, transaccion_id, empresa_id, estado,
        monto_total, monto_comision_marketplace, moneda_id
    ) VALUES (
        v_numero, p_transaccion_id, p_empresa_id, 'pendiente',
        v_monto, v_comision_monto, v_moneda_id
    );
    
    SET p_split_id = LAST_INSERT_ID();
    SET p_numero_split = v_numero;
END //

-- Procedimiento: Recargar wallet
CREATE PROCEDURE sp_recargar_wallet(
    IN p_wallet_id BIGINT UNSIGNED,
    IN p_monto DECIMAL(15,2),
    IN p_transaccion_id BIGINT UNSIGNED,
    OUT p_nuevo_balance DECIMAL(15,2)
)
BEGIN
    DECLARE v_balance_actual DECIMAL(15,2);
    
    -- Obtener balance actual
    SELECT balance_disponible INTO v_balance_actual
    FROM pagos_wallets
    WHERE id = p_wallet_id
    FOR UPDATE;
    
    -- Actualizar balance
    UPDATE pagos_wallets
    SET 
        balance_disponible = balance_disponible + p_monto,
        recargado_hoy = recargado_hoy + p_monto
    WHERE id = p_wallet_id;
    
    -- Registrar movimiento
    INSERT INTO pagos_wallets_movimientos (
        wallet_id, tipo, monto, balance_anterior, balance_posterior,
        referencia_tipo, referencia_id, concepto
    ) VALUES (
        p_wallet_id, 'recarga', p_monto, v_balance_actual, v_balance_actual + p_monto,
        'transaccion', p_transaccion_id, 'Recarga de saldo'
    );
    
    SET p_nuevo_balance = v_balance_actual + p_monto;
END //

-- Procedimiento: Transferir entre wallets
CREATE PROCEDURE sp_transferir_wallet(
    IN p_wallet_origen_id BIGINT UNSIGNED,
    IN p_wallet_destino_id BIGINT UNSIGNED,
    IN p_monto DECIMAL(15,2),
    IN p_concepto VARCHAR(500),
    OUT p_resultado VARCHAR(50)
)
BEGIN
    DECLARE v_balance_origen DECIMAL(15,2);
    DECLARE v_balance_destino DECIMAL(15,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 'error';
    END;
    
    START TRANSACTION;
    
    -- Bloquear wallets
    SELECT balance_disponible INTO v_balance_origen
    FROM pagos_wallets WHERE id = p_wallet_origen_id FOR UPDATE;
    
    SELECT balance_disponible INTO v_balance_destino
    FROM pagos_wallets WHERE id = p_wallet_destino_id FOR UPDATE;
    
    -- Validar saldo
    IF v_balance_origen < p_monto THEN
        SET p_resultado = 'saldo_insuficiente';
        ROLLBACK;
    ELSE
        -- Debitar origen
        UPDATE pagos_wallets
        SET balance_disponible = balance_disponible - p_monto,
            transferido_hoy = transferido_hoy + p_monto
        WHERE id = p_wallet_origen_id;
        
        INSERT INTO pagos_wallets_movimientos (
            wallet_id, tipo, monto, balance_anterior, balance_posterior,
            referencia_tipo, referencia_id, concepto
        ) VALUES (
            p_wallet_origen_id, 'transferencia_salida', p_monto,
            v_balance_origen, v_balance_origen - p_monto,
            'wallet', p_wallet_destino_id, p_concepto
        );
        
        -- Acreditar destino
        UPDATE pagos_wallets
        SET balance_disponible = balance_disponible + p_monto
        WHERE id = p_wallet_destino_id;
        
        INSERT INTO pagos_wallets_movimientos (
            wallet_id, tipo, monto, balance_anterior, balance_posterior,
            referencia_tipo, referencia_id, concepto
        ) VALUES (
            p_wallet_destino_id, 'transferencia_entrada', p_monto,
            v_balance_destino, v_balance_destino + p_monto,
            'wallet', p_wallet_origen_id, p_concepto
        );
        
        COMMIT;
        SET p_resultado = 'exitosa';
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger: Log automático de cambios en transacciones
CREATE TRIGGER trg_log_transaccion
AFTER UPDATE ON pagos_transacciones
FOR EACH ROW
BEGIN
    IF NEW.estado != OLD.estado THEN
        INSERT INTO pagos_transacciones_log (
            transaccion_id, evento, estado_anterior, estado_nuevo,
            mensaje, origen
        ) VALUES (
            NEW.id,
            CASE NEW.estado
                WHEN 'aprobada' THEN 'aprobada'
                WHEN 'rechazada' THEN 'rechazada'
                WHEN 'procesando' THEN 'enviada_pasarela'
                WHEN 'reembolsada' THEN 'reembolsada'
                WHEN 'cancelada' THEN 'anulada'
                ELSE 'error'
            END,
            OLD.estado, NEW.estado,
            CONCAT('Estado cambiado de ', OLD.estado, ' a ', NEW.estado),
            'sistema'
        );
    END IF;
END //

-- Trigger: Actualizar balance de wallet en movimientos
CREATE TRIGGER trg_actualizar_balance_wallet
AFTER INSERT ON pagos_wallets_movimientos
FOR EACH ROW
BEGIN
    -- Ya se actualizó en el procedimiento, este trigger es para auditoría
    IF NEW.balance_posterior < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Balance de wallet no puede ser negativo';
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Habilitar el programador de eventos si no está activo
SET GLOBAL event_scheduler = ON;

-- Eliminar eventos existentes si existen
DROP EVENT IF EXISTS evento_renovar_suscripciones;
DROP EVENT IF EXISTS evento_verificar_pagos_pendientes;
DROP EVENT IF EXISTS evento_limpiar_tokens_expirados;

DELIMITER //

-- Evento: Renovar suscripciones diariamente
CREATE EVENT evento_renovar_suscripciones
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '06:00:00')
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Renueva suscripciones vencidas diariamente a las 6:00 AM'
DO
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_suscripcion_id BIGINT UNSIGNED;
    DECLARE v_trans_id BIGINT UNSIGNED;
    DECLARE v_resultado VARCHAR(50);
    
    DECLARE cur_suscripciones CURSOR FOR
        SELECT id FROM pagos_suscripciones
        WHERE estado = 'activa'
        AND fecha_proximo_cobro <= CURDATE()
        AND en_periodo_prueba = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur_suscripciones;
    
    read_loop: LOOP
        FETCH cur_suscripciones INTO v_suscripcion_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL sp_renovar_suscripcion(v_suscripcion_id, v_trans_id, v_resultado);
    END LOOP;
    
    CLOSE cur_suscripciones;
END //

-- Evento: Verificar pagos pendientes
CREATE EVENT evento_verificar_pagos_pendientes
ON SCHEDULE EVERY 1 HOUR
STARTS TIMESTAMP(CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Marca transacciones pendientes como expiradas después de 24 horas'
DO
BEGIN
    -- Marcar como expiradas transacciones pendientes de más de 24 horas
    UPDATE pagos_transacciones
    SET estado = 'expirada'
    WHERE estado = 'pendiente'
    AND creado_en < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END //

-- Evento: Limpiar tokens expirados
CREATE EVENT evento_limpiar_tokens_expirados
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '04:00:00')
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Desactiva tokens de tarjeta expirados diariamente a las 4:00 AM'
DO
BEGIN
    UPDATE pagos_tokens_tarjeta
    SET es_activo = FALSE
    WHERE fecha_expiracion_token < CURDATE()
    OR (anio_expiracion < YEAR(CURDATE()))
    OR (anio_expiracion = YEAR(CURDATE()) AND mes_expiracion < MONTH(CURDATE()));
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Monedas soportadas
INSERT IGNORE INTO pagos_monedas (codigo, nombre, simbolo, decimales, es_principal) VALUES
('HNL', 'Lempira Hondureño', 'L', 2, TRUE),
('USD', 'Dólar Estadounidense', '$', 2, FALSE),
('EUR', 'Euro', '€', 2, FALSE),
('MXN', 'Peso Mexicano', '$', 2, FALSE),
('GTQ', 'Quetzal Guatemalteco', 'Q', 2, FALSE);

-- Pasarelas de pago
INSERT IGNORE INTO pagos_pasarelas (codigo, nombre, tipo, proveedor, modo_integracion, soporta_tokenizacion, soporta_3ds, soporta_reembolsos, soporta_reembolsos_parciales, soporta_suscripciones, soporta_split_payment, monedas_soportadas, es_activo) VALUES
('stripe', 'Stripe', 'tarjeta', 'Stripe Inc.', 'api', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, '["USD", "EUR", "HNL"]', TRUE),
('paypal', 'PayPal', 'wallet_digital', 'PayPal Inc.', 'redirect', TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, '["USD", "EUR"]', TRUE),
('banco_local', 'Transferencia Bancaria Local', 'transferencia', 'Bancos Honduras', 'redirect', FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, '["HNL"]', TRUE),
('efectivo', 'Pago en Efectivo', 'efectivo', 'Interno', 'api', FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, '["HNL"]', TRUE),
('wallet_interno', 'Wallet Tienda', 'wallet_digital', 'Interno', 'api', FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, '["HNL"]', TRUE);

-- Configuración del sistema de pagos
INSERT IGNORE INTO pagos_configuracion (clave, valor, tipo_dato, descripcion, es_global) VALUES
('ambiente_default', 'sandbox', 'texto', 'Ambiente por defecto para pasarelas', TRUE),
('reintentos_pago_max', '3', 'numero', 'Máximo de reintentos de cobro', TRUE),
('dias_gracia_suscripcion', '3', 'numero', 'Días de gracia antes de suspender suscripción', TRUE),
('comision_marketplace_default', '10', 'numero', 'Comisión por defecto del marketplace (%)', TRUE),
('wallet_habilitado', 'true', 'booleano', 'Habilitar sistema de wallets', TRUE),
('split_payment_habilitado', 'true', 'booleano', 'Habilitar split payments', TRUE),
('monto_minimo_reembolso', '1.00', 'numero', 'Monto mínimo para solicitar reembolso', TRUE),
('dias_limite_reembolso', '30', 'numero', 'Días límite para solicitar reembolso', TRUE),
('notificar_pago_exitoso', 'true', 'booleano', 'Enviar notificación en pago exitoso', TRUE),
('notificar_pago_fallido', 'true', 'booleano', 'Enviar notificación en pago fallido', TRUE);

-- Comisiones de pasarelas (globales)
INSERT IGNORE INTO pagos_pasarelas_comisiones (pasarela_id, tipo_comision, porcentaje, monto_fijo, tipo_transaccion, es_activo) VALUES
(1, 'mixto', 2.9000, 0.30, 'todos', TRUE),
(2, 'mixto', 3.4900, 0.49, 'todos', TRUE),
(3, 'fijo', 0.0000, 5.00, 'todos', TRUE),
(4, 'fijo', 0.0000, 0.00, 'todos', TRUE),
(5, 'porcentaje', 1.0000, 0.00, 'todos', TRUE);

-- ============================================================================
-- REGISTRAR MÓDULOS Y PERMISOS
-- ============================================================================

-- Módulo de Pagos
INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo)
VALUES ('pagos', 'Pagos', 'Gestión del sistema de pagos', 'bi-credit-card', 120, TRUE);

-- Submódulos
INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'pagos_transacciones', 'Transacciones', 'Gestión de transacciones', 'bi-receipt', 121, TRUE, id
FROM admin_modulos WHERE codigo = 'pagos';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'pagos_pasarelas', 'Pasarelas', 'Configuración de pasarelas', 'bi-diagram-3', 122, TRUE, id
FROM admin_modulos WHERE codigo = 'pagos';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'pagos_suscripciones', 'Suscripciones', 'Gestión de suscripciones', 'bi-arrow-repeat', 123, TRUE, id
FROM admin_modulos WHERE codigo = 'pagos';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'pagos_reembolsos', 'Reembolsos', 'Gestión de reembolsos', 'bi-arrow-return-left', 124, TRUE, id
FROM admin_modulos WHERE codigo = 'pagos';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'pagos_wallets', 'Wallets', 'Gestión de billeteras virtuales', 'bi-wallet2', 125, TRUE, id
FROM admin_modulos WHERE codigo = 'pagos';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'pagos_liquidaciones', 'Liquidaciones', 'Liquidaciones a vendedores', 'bi-cash-stack', 126, TRUE, id
FROM admin_modulos WHERE codigo = 'pagos';

-- Permisos principales
INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.ver', 'Ver pagos', 'Ver dashboard de pagos'
FROM admin_modulos WHERE codigo = 'pagos';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.transacciones.ver', 'Ver transacciones', 'Ver listado de transacciones'
FROM admin_modulos WHERE codigo = 'pagos_transacciones';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.transacciones.procesar', 'Procesar transacciones', 'Procesar pagos manualmente'
FROM admin_modulos WHERE codigo = 'pagos_transacciones';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.pasarelas.ver', 'Ver pasarelas', 'Ver pasarelas configuradas'
FROM admin_modulos WHERE codigo = 'pagos_pasarelas';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.pasarelas.configurar', 'Configurar pasarelas', 'Modificar credenciales de pasarelas'
FROM admin_modulos WHERE codigo = 'pagos_pasarelas';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.suscripciones.ver', 'Ver suscripciones', 'Ver suscripciones activas'
FROM admin_modulos WHERE codigo = 'pagos_suscripciones';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.suscripciones.gestionar', 'Gestionar suscripciones', 'Cancelar o modificar suscripciones'
FROM admin_modulos WHERE codigo = 'pagos_suscripciones';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.reembolsos.ver', 'Ver reembolsos', 'Ver solicitudes de reembolso'
FROM admin_modulos WHERE codigo = 'pagos_reembolsos';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.reembolsos.aprobar', 'Aprobar reembolsos', 'Aprobar o rechazar reembolsos'
FROM admin_modulos WHERE codigo = 'pagos_reembolsos';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.wallets.ver', 'Ver wallets', 'Ver billeteras virtuales'
FROM admin_modulos WHERE codigo = 'pagos_wallets';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.wallets.gestionar', 'Gestionar wallets', 'Ajustar saldos de wallets'
FROM admin_modulos WHERE codigo = 'pagos_wallets';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.liquidaciones.ver', 'Ver liquidaciones', 'Ver liquidaciones a vendedores'
FROM admin_modulos WHERE codigo = 'pagos_liquidaciones';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'pagos.liquidaciones.aprobar', 'Aprobar liquidaciones', 'Aprobar pagos a vendedores'
FROM admin_modulos WHERE codigo = 'pagos_liquidaciones';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=================================================' AS '';
SELECT 'FASE 11: PAGOS AVANZADOS - INSTALACIÓN COMPLETADA' AS 'ESTADO';
SELECT '=================================================' AS '';

SELECT 'Tablas creadas:' AS 'Verificación',
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name LIKE 'pagos_%') AS cantidad;

SELECT 'Procedimientos:' AS 'Verificación',
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'tienda_virtual' 
     AND routine_type = 'PROCEDURE'
     AND (routine_name LIKE 'sp_%pago%' OR routine_name LIKE 'sp_%suscripcion%' 
     OR routine_name LIKE 'sp_%wallet%' OR routine_name LIKE 'sp_%reembolso%'
     OR routine_name LIKE 'sp_%split%')) AS cantidad;

SELECT 'Vistas:' AS 'Verificación',
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'tienda_virtual' 
     AND (table_name LIKE 'vista_transacciones%' OR table_name LIKE 'vista_suscripciones%' 
     OR table_name LIKE 'vista_pagos%' OR table_name LIKE 'vista_reembolsos%'
     OR table_name LIKE 'vista_comisiones%' OR table_name LIKE 'vista_balance%')) AS cantidad;

SELECT 'Pasarelas configuradas:' AS 'Verificación',
    (SELECT COUNT(*) FROM pagos_pasarelas WHERE es_activo = TRUE) AS cantidad;

SELECT 'Monedas configuradas:' AS 'Verificación',
    (SELECT COUNT(*) FROM pagos_monedas WHERE es_activo = TRUE) AS cantidad;

-- ============================================================================
-- FIN FASE 11
-- ============================================================================
