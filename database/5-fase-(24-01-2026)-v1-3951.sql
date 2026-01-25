-- ============================================================================
-- TIENDA VIRTUAL - FASE 5
-- ============================================================================
-- Módulo: Clientes Públicos (Escalable - Estilo Amazon)
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script implementa:
-- - Registro de clientes con verificación
-- - Direcciones múltiples (envío/facturación)
-- - Wishlist / Listas de deseos
-- - Programa de fidelidad (puntos y niveles)
-- - Métodos de pago guardados (tokenizados)
-- - Sistema de referidos
-- - Membresías premium (tipo Amazon Prime)
-- - Preferencias y configuración
-- - Historial de navegación
-- ============================================================================
-- Ejecutar DESPUÉS de las Fases 1, 2, 3 y 4
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- ESQUEMA: CLIENTES - TABLA PRINCIPAL
-- ============================================================================

CREATE TABLE clientes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación única
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    codigo_cliente VARCHAR(20) NOT NULL UNIQUE,
    
    -- Información de acceso
    correo VARCHAR(255) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    
    -- Datos personales
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(200) GENERATED ALWAYS AS (CONCAT(nombre, ' ', apellido)) STORED,
    
    -- Contacto
    telefono VARCHAR(20),
    telefono_secundario VARCHAR(20),
    whatsapp VARCHAR(20),
    
    -- Identificación fiscal (para facturas)
    tipo_documento ENUM('dni', 'rtn', 'pasaporte', 'otro') DEFAULT 'dni',
    numero_documento VARCHAR(30),
    razon_social VARCHAR(200),
    
    -- Datos demográficos
    fecha_nacimiento DATE,
    genero ENUM('masculino', 'femenino', 'otro', 'no_especificado') DEFAULT 'no_especificado',
    
    -- Avatar y personalización
    avatar_url VARCHAR(500),
    
    -- Estado de la cuenta
    estado ENUM(
        'pendiente_verificacion',
        'activo',
        'suspendido',
        'bloqueado',
        'eliminado'
    ) NOT NULL DEFAULT 'pendiente_verificacion',
    
    -- Verificaciones
    correo_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    correo_verificado_en DATETIME,
    telefono_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    telefono_verificado_en DATETIME,
    
    -- Seguridad
    tiene_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    secreto_2fa VARCHAR(100),
    ultimo_login DATETIME,
    ultimo_login_ip VARCHAR(45),
    intentos_login_fallidos TINYINT UNSIGNED NOT NULL DEFAULT 0,
    bloqueado_hasta DATETIME,
    
    -- Programa de fidelidad
    nivel_membresia_id INT UNSIGNED,
    puntos_actuales INT UNSIGNED NOT NULL DEFAULT 0,
    puntos_totales_historico INT UNSIGNED NOT NULL DEFAULT 0,
    fecha_vencimiento_puntos DATE,
    
    -- Referidos
    codigo_referido VARCHAR(20) UNIQUE,
    referido_por_cliente_id BIGINT UNSIGNED,
    
    -- Preferencias generales
    idioma VARCHAR(5) NOT NULL DEFAULT 'es',
    moneda_preferida VARCHAR(3) NOT NULL DEFAULT 'HNL',
    zona_horaria VARCHAR(50) DEFAULT 'America/Tegucigalpa',
    
    -- Marketing
    acepta_marketing_correo BOOLEAN NOT NULL DEFAULT FALSE,
    acepta_marketing_sms BOOLEAN NOT NULL DEFAULT FALSE,
    acepta_marketing_push BOOLEAN NOT NULL DEFAULT FALSE,
    fuente_registro VARCHAR(50),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Estadísticas (desnormalizadas)
    total_pedidos INT UNSIGNED NOT NULL DEFAULT 0,
    total_gastado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ticket_promedio DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ultimo_pedido_fecha DATETIME,
    total_resenas INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    eliminado_en DATETIME,
    ip_registro VARCHAR(45),
    user_agent_registro TEXT,
    
    -- Índices
    INDEX idx_uuid (uuid),
    INDEX idx_codigo (codigo_cliente),
    INDEX idx_correo (correo),
    INDEX idx_telefono (telefono),
    INDEX idx_estado (estado),
    INDEX idx_nivel_membresia (nivel_membresia_id),
    INDEX idx_puntos (puntos_actuales),
    INDEX idx_referido_por (referido_por_cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_total_gastado (total_gastado),
    INDEX idx_ultimo_pedido (ultimo_pedido_fecha),
    INDEX idx_creado (creado_en),
    FULLTEXT idx_busqueda (nombre, apellido, correo),
    
    CONSTRAINT fk_cliente_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: NIVELES DE MEMBRESÍA (Tipo Amazon Prime)
-- ============================================================================

CREATE TABLE clientes_niveles_membresia (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Requisitos para alcanzar el nivel
    puntos_requeridos INT UNSIGNED NOT NULL DEFAULT 0,
    gasto_minimo_anual DECIMAL(15,2) DEFAULT 0.00,
    pedidos_minimos_anual INT UNSIGNED DEFAULT 0,
    
    -- Beneficios
    descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    puntos_multiplicador DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    envio_gratis BOOLEAN NOT NULL DEFAULT FALSE,
    envio_gratis_minimo DECIMAL(15,2),
    acceso_ofertas_exclusivas BOOLEAN NOT NULL DEFAULT FALSE,
    atencion_prioritaria BOOLEAN NOT NULL DEFAULT FALSE,
    devoluciones_extendidas_dias INT UNSIGNED DEFAULT 30,
    
    -- Costo (si es membresía de pago tipo Prime)
    es_pago BOOLEAN NOT NULL DEFAULT FALSE,
    precio_mensual DECIMAL(10,2),
    precio_anual DECIMAL(10,2),
    
    -- Apariencia
    color_badge VARCHAR(7) DEFAULT '#6c757d',
    icono VARCHAR(50),
    imagen_url VARCHAR(500),
    
    -- Control
    es_default BOOLEAN NOT NULL DEFAULT FALSE,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_activo (es_activo),
    INDEX idx_default (es_default),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar FK después de crear la tabla de niveles
ALTER TABLE clientes 
ADD CONSTRAINT fk_cliente_nivel_membresia 
FOREIGN KEY (nivel_membresia_id) REFERENCES clientes_niveles_membresia(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE clientes 
ADD CONSTRAINT fk_cliente_referido_por 
FOREIGN KEY (referido_por_cliente_id) REFERENCES clientes(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Historial de membresías del cliente
CREATE TABLE clientes_membresias_historial (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    nivel_membresia_id INT UNSIGNED NOT NULL,
    
    tipo_cambio ENUM('upgrade', 'downgrade', 'renovacion', 'cancelacion', 'inicial') NOT NULL,
    nivel_anterior_id INT UNSIGNED,
    
    -- Si es membresía de pago
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    precio_pagado DECIMAL(10,2),
    metodo_pago VARCHAR(50),
    
    -- Estado
    estado ENUM('activa', 'expirada', 'cancelada') NOT NULL DEFAULT 'activa',
    cancelado_en DATETIME,
    motivo_cancelacion TEXT,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_nivel (nivel_membresia_id),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_estado (estado),
    CONSTRAINT fk_membresia_hist_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_membresia_hist_nivel 
        FOREIGN KEY (nivel_membresia_id) REFERENCES clientes_niveles_membresia(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: DIRECCIONES
-- ============================================================================

CREATE TABLE clientes_direcciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    
    -- Identificación
    alias VARCHAR(50),
    
    -- Tipo de dirección
    tipo ENUM('envio', 'facturacion', 'ambos') NOT NULL DEFAULT 'ambos',
    
    -- Destinatario
    nombre_destinatario VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    
    -- Dirección completa
    linea_1 VARCHAR(255) NOT NULL,
    linea_2 VARCHAR(255),
    referencia TEXT,
    
    -- Ubicación geográfica
    ciudad VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    pais VARCHAR(100) NOT NULL DEFAULT 'Honduras',
    codigo_postal VARCHAR(20),
    
    -- Coordenadas (para entregas precisas)
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Instrucciones de entrega
    instrucciones_entrega TEXT,
    
    -- Control
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    veces_usada INT UNSIGNED NOT NULL DEFAULT 0,
    ultimo_uso DATETIME,
    
    -- Validación
    validada BOOLEAN NOT NULL DEFAULT FALSE,
    validada_en DATETIME,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_tipo (tipo),
    INDEX idx_principal (es_principal),
    INDEX idx_activa (es_activa),
    INDEX idx_pais_depto (pais, departamento),
    INDEX idx_ciudad (ciudad),
    CONSTRAINT fk_direccion_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: MÉTODOS DE PAGO GUARDADOS
-- ============================================================================

CREATE TABLE clientes_metodos_pago (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo de método
    tipo ENUM(
        'tarjeta_credito',
        'tarjeta_debito',
        'paypal',
        'transferencia',
        'billetera_digital',
        'otro'
    ) NOT NULL,
    
    -- Información tokenizada (NUNCA guardar datos completos de tarjeta)
    token VARCHAR(255),
    token_proveedor VARCHAR(50),
    
    -- Datos enmascarados para mostrar
    alias VARCHAR(50),
    ultimos_4_digitos VARCHAR(4),
    marca_tarjeta VARCHAR(30),
    banco_emisor VARCHAR(100),
    
    -- Vencimiento (solo mes/año)
    mes_vencimiento TINYINT UNSIGNED,
    anio_vencimiento SMALLINT UNSIGNED,
    
    -- Titular
    nombre_titular VARCHAR(200),
    
    -- Dirección de facturación asociada
    direccion_facturacion_id BIGINT UNSIGNED,
    
    -- Control
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    veces_usado INT UNSIGNED NOT NULL DEFAULT 0,
    ultimo_uso DATETIME,
    
    -- Verificación
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    verificado_en DATETIME,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_tipo (tipo),
    INDEX idx_principal (es_principal),
    INDEX idx_activo (es_activo),
    INDEX idx_token (token),
    CONSTRAINT fk_metodo_pago_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_metodo_pago_direccion 
        FOREIGN KEY (direccion_facturacion_id) REFERENCES clientes_direcciones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: WISHLIST / LISTAS DE DESEOS
-- ============================================================================

-- Listas de deseos (un cliente puede tener múltiples)
CREATE TABLE clientes_wishlists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    
    nombre VARCHAR(100) NOT NULL DEFAULT 'Mi Lista de Deseos',
    descripcion TEXT,
    
    -- Privacidad
    es_publica BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_compartir VARCHAR(20) UNIQUE,
    
    -- Control
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    total_items INT UNSIGNED NOT NULL DEFAULT 0,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_publica (es_publica),
    INDEX idx_principal (es_principal),
    INDEX idx_codigo (codigo_compartir),
    CONSTRAINT fk_wishlist_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items en la wishlist
CREATE TABLE clientes_wishlists_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wishlist_id BIGINT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    
    -- Precio al momento de agregar (para notificar bajadas)
    precio_al_agregar DECIMAL(15,2),
    precio_actual DECIMAL(15,2),
    
    -- Notificaciones
    notificar_disponibilidad BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_baja_precio BOOLEAN NOT NULL DEFAULT TRUE,
    porcentaje_baja_notificar DECIMAL(5,2) DEFAULT 10.00,
    
    -- Prioridad
    prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
    notas TEXT,
    
    -- Cantidad deseada
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_wishlist_producto (wishlist_id, producto_id, variante_id),
    INDEX idx_wishlist (wishlist_id),
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_prioridad (prioridad),
    CONSTRAINT fk_wishlist_item_wishlist 
        FOREIGN KEY (wishlist_id) REFERENCES clientes_wishlists(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wishlist_item_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wishlist_item_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PROGRAMA DE PUNTOS Y FIDELIDAD
-- ============================================================================

-- Configuración del programa de puntos
CREATE TABLE fidelidad_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT UNSIGNED,
    
    -- Nombre del programa
    nombre_programa VARCHAR(100) NOT NULL DEFAULT 'Puntos de Fidelidad',
    
    -- Acumulación de puntos
    puntos_por_unidad_monetaria DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    unidad_monetaria DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    redondeo ENUM('arriba', 'abajo', 'natural') DEFAULT 'natural',
    
    -- Canje de puntos
    valor_punto_en_moneda DECIMAL(10,4) NOT NULL DEFAULT 0.01,
    puntos_minimos_canje INT UNSIGNED NOT NULL DEFAULT 100,
    maximo_descuento_porcentaje DECIMAL(5,2) DEFAULT 50.00,
    
    -- Vencimiento
    puntos_expiran BOOLEAN NOT NULL DEFAULT TRUE,
    dias_vencimiento INT UNSIGNED DEFAULT 365,
    
    -- Bonificaciones
    puntos_registro INT UNSIGNED DEFAULT 100,
    puntos_primera_compra INT UNSIGNED DEFAULT 500,
    puntos_referido INT UNSIGNED DEFAULT 200,
    puntos_cumpleanos INT UNSIGNED DEFAULT 100,
    puntos_resena INT UNSIGNED DEFAULT 50,
    
    -- Control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_empresa (empresa_id),
    INDEX idx_activo (es_activo),
    CONSTRAINT fk_fidelidad_config_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movimientos de puntos
CREATE TABLE clientes_puntos_movimientos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo de movimiento
    tipo ENUM(
        'acumulacion_compra',
        'acumulacion_registro',
        'acumulacion_referido',
        'acumulacion_cumpleanos',
        'acumulacion_resena',
        'acumulacion_promocion',
        'acumulacion_ajuste',
        'canje_pedido',
        'canje_ajuste',
        'expiracion',
        'devolucion'
    ) NOT NULL,
    
    -- Puntos
    puntos INT NOT NULL,
    puntos_anteriores INT UNSIGNED NOT NULL,
    puntos_nuevos INT UNSIGNED NOT NULL,
    
    -- Valor monetario (si aplica)
    valor_monetario DECIMAL(15,2),
    
    -- Referencia
    referencia_tipo VARCHAR(50),
    referencia_id BIGINT UNSIGNED,
    
    -- Detalles
    descripcion VARCHAR(255),
    
    -- Vencimiento (para acumulaciones)
    fecha_vencimiento DATE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (creado_en),
    INDEX idx_referencia (referencia_tipo, referencia_id),
    INDEX idx_vencimiento (fecha_vencimiento),
    CONSTRAINT fk_puntos_mov_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: SISTEMA DE REFERIDOS
-- ============================================================================

CREATE TABLE clientes_referidos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Referidor
    cliente_referidor_id BIGINT UNSIGNED NOT NULL,
    
    -- Referido
    cliente_referido_id BIGINT UNSIGNED,
    correo_invitado VARCHAR(255) NOT NULL,
    
    -- Estado
    estado ENUM('pendiente', 'registrado', 'primera_compra', 'completado', 'expirado') NOT NULL DEFAULT 'pendiente',
    
    -- Recompensas
    puntos_referidor INT UNSIGNED DEFAULT 0,
    puntos_referido INT UNSIGNED DEFAULT 0,
    descuento_referido_porcentaje DECIMAL(5,2),
    codigo_descuento VARCHAR(20),
    
    -- Tracking
    fecha_invitacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_registro DATETIME,
    fecha_primera_compra DATETIME,
    fecha_completado DATETIME,
    
    -- Control
    expira_en DATETIME,
    ip_invitacion VARCHAR(45),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_referidor_correo (cliente_referidor_id, correo_invitado),
    INDEX idx_referidor (cliente_referidor_id),
    INDEX idx_referido (cliente_referido_id),
    INDEX idx_correo (correo_invitado),
    INDEX idx_estado (estado),
    CONSTRAINT fk_referido_referidor 
        FOREIGN KEY (cliente_referidor_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_referido_cliente 
        FOREIGN KEY (cliente_referido_id) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: SESIONES Y SEGURIDAD
-- ============================================================================

CREATE TABLE clientes_sesiones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    
    -- Token de sesión
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    
    -- Información del dispositivo
    dispositivo VARCHAR(100),
    navegador VARCHAR(100),
    sistema_operativo VARCHAR(100),
    user_agent TEXT,
    
    -- Ubicación
    ip_address VARCHAR(45) NOT NULL,
    pais VARCHAR(100),
    ciudad VARCHAR(100),
    
    -- Control
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Tiempos
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME NOT NULL,
    cerrado_en DATETIME,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_token (token_hash),
    INDEX idx_refresh (refresh_token_hash),
    INDEX idx_activa (es_activa),
    INDEX idx_expira (expira_en),
    CONSTRAINT fk_sesion_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intentos de login de clientes
CREATE TABLE clientes_intentos_login (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    correo VARCHAR(255) NOT NULL,
    cliente_id BIGINT UNSIGNED,
    
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    
    exitoso BOOLEAN NOT NULL DEFAULT FALSE,
    razon_fallo VARCHAR(100),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_correo (correo),
    INDEX idx_cliente (cliente_id),
    INDEX idx_ip (ip_address),
    INDEX idx_exitoso (exitoso),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_intento_login_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Códigos de verificación
CREATE TABLE clientes_codigos_verificacion (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED,
    
    -- Destino
    correo VARCHAR(255),
    telefono VARCHAR(20),
    
    -- Código
    codigo VARCHAR(10) NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    
    -- Tipo
    tipo ENUM(
        'verificar_correo',
        'verificar_telefono',
        'recuperar_contrasena',
        'cambiar_correo',
        'eliminar_cuenta',
        'login_2fa'
    ) NOT NULL,
    
    -- Control
    intentos INT UNSIGNED NOT NULL DEFAULT 0,
    max_intentos INT UNSIGNED NOT NULL DEFAULT 5,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    usado_en DATETIME,
    
    -- Tiempos
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME NOT NULL,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_correo (correo),
    INDEX idx_telefono (telefono),
    INDEX idx_codigo_hash (codigo_hash),
    INDEX idx_tipo (tipo),
    INDEX idx_expira (expira_en),
    CONSTRAINT fk_codigo_verif_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PREFERENCIAS Y CONFIGURACIÓN
-- ============================================================================

CREATE TABLE clientes_preferencias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL UNIQUE,
    
    -- Notificaciones
    notif_correo_pedidos BOOLEAN NOT NULL DEFAULT TRUE,
    notif_correo_envios BOOLEAN NOT NULL DEFAULT TRUE,
    notif_correo_ofertas BOOLEAN NOT NULL DEFAULT FALSE,
    notif_correo_newsletter BOOLEAN NOT NULL DEFAULT FALSE,
    notif_correo_puntos BOOLEAN NOT NULL DEFAULT TRUE,
    
    notif_sms_pedidos BOOLEAN NOT NULL DEFAULT FALSE,
    notif_sms_envios BOOLEAN NOT NULL DEFAULT TRUE,
    notif_sms_ofertas BOOLEAN NOT NULL DEFAULT FALSE,
    
    notif_push_pedidos BOOLEAN NOT NULL DEFAULT TRUE,
    notif_push_envios BOOLEAN NOT NULL DEFAULT TRUE,
    notif_push_ofertas BOOLEAN NOT NULL DEFAULT FALSE,
    notif_push_wishlist BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Privacidad
    perfil_publico BOOLEAN NOT NULL DEFAULT FALSE,
    mostrar_resenas BOOLEAN NOT NULL DEFAULT TRUE,
    permitir_recomendaciones BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Experiencia de compra
    guardar_carrito BOOLEAN NOT NULL DEFAULT TRUE,
    checkout_rapido BOOLEAN NOT NULL DEFAULT FALSE,
    direccion_default_id BIGINT UNSIGNED,
    metodo_pago_default_id BIGINT UNSIGNED,
    
    -- Visualización
    productos_por_pagina INT UNSIGNED DEFAULT 24,
    vista_catalogo ENUM('grid', 'lista') DEFAULT 'grid',
    
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    CONSTRAINT fk_preferencias_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_preferencias_direccion 
        FOREIGN KEY (direccion_default_id) REFERENCES clientes_direcciones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_preferencias_metodo_pago 
        FOREIGN KEY (metodo_pago_default_id) REFERENCES clientes_metodos_pago(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: HISTORIAL DE NAVEGACIÓN Y PRODUCTOS VISTOS
-- ============================================================================

CREATE TABLE clientes_productos_vistos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    
    veces_visto INT UNSIGNED NOT NULL DEFAULT 1,
    primera_vez DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_vez DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Contexto
    fuente VARCHAR(50),
    busqueda_relacionada VARCHAR(255),
    
    UNIQUE KEY uk_cliente_producto (cliente_id, producto_id, variante_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_producto (producto_id),
    INDEX idx_ultima_vez (ultima_vez),
    CONSTRAINT fk_visto_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_visto_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_visto_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Búsquedas del cliente
CREATE TABLE clientes_busquedas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED,
    sesion_id VARCHAR(100),
    
    termino_busqueda VARCHAR(255) NOT NULL,
    resultados_encontrados INT UNSIGNED DEFAULT 0,
    
    -- Si hizo clic en algún resultado
    producto_seleccionado_id BIGINT UNSIGNED,
    
    ip_address VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_sesion (sesion_id),
    INDEX idx_termino (termino_busqueda),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_busqueda_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_busqueda_producto 
        FOREIGN KEY (producto_seleccionado_id) REFERENCES catalogo_productos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NUEVOS MÓDULOS Y PERMISOS
-- ============================================================================

-- Módulos (ignorar si ya existen)
INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('clientes', 'Clientes', 'Gestión de clientes', 'bi-people', '/admin/clientes', 19, TRUE),
('clientes_direcciones', 'Direcciones', 'Direcciones de clientes', 'bi-geo-alt', '/admin/clientes/direcciones', 20, FALSE),
('clientes_wishlists', 'Wishlists', 'Listas de deseos', 'bi-heart', '/admin/clientes/wishlists', 21, FALSE),
('fidelidad', 'Programa de Fidelidad', 'Puntos y niveles', 'bi-star', '/admin/fidelidad', 22, TRUE),
('referidos', 'Referidos', 'Sistema de referidos', 'bi-share', '/admin/referidos', 23, FALSE);

-- Permisos para clientes (ignorar si ya existen)
INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'clientes.ver', 'Ver clientes', id, 'ver' FROM admin_modulos WHERE codigo = 'clientes'
UNION ALL
SELECT 'clientes.crear', 'Crear clientes', id, 'crear' FROM admin_modulos WHERE codigo = 'clientes'
UNION ALL
SELECT 'clientes.editar', 'Editar clientes', id, 'editar' FROM admin_modulos WHERE codigo = 'clientes'
UNION ALL
SELECT 'clientes.eliminar', 'Eliminar clientes', id, 'eliminar' FROM admin_modulos WHERE codigo = 'clientes'
UNION ALL
SELECT 'clientes.exportar', 'Exportar clientes', id, 'exportar' FROM admin_modulos WHERE codigo = 'clientes'
UNION ALL
SELECT 'clientes.ver_historial', 'Ver historial de clientes', id, 'ver' FROM admin_modulos WHERE codigo = 'clientes'
UNION ALL
SELECT 'clientes.gestionar_puntos', 'Gestionar puntos', id, 'editar' FROM admin_modulos WHERE codigo = 'clientes';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'fidelidad.ver', 'Ver programa fidelidad', id, 'ver' FROM admin_modulos WHERE codigo = 'fidelidad'
UNION ALL
SELECT 'fidelidad.configurar', 'Configurar fidelidad', id, 'editar' FROM admin_modulos WHERE codigo = 'fidelidad'
UNION ALL
SELECT 'fidelidad.gestionar_niveles', 'Gestionar niveles', id, 'editar' FROM admin_modulos WHERE codigo = 'fidelidad';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'referidos.ver', 'Ver referidos', id, 'ver' FROM admin_modulos WHERE codigo = 'referidos'
UNION ALL
SELECT 'referidos.gestionar', 'Gestionar referidos', id, 'editar' FROM admin_modulos WHERE codigo = 'referidos';

-- Asignar permisos al super_admin (ignorar si ya existen)
INSERT IGNORE INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos 
WHERE codigo LIKE 'clientes%' 
   OR codigo LIKE 'fidelidad%' 
   OR codigo LIKE 'referidos%';

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de clientes con resumen
CREATE OR REPLACE VIEW vista_clientes_resumen AS
SELECT 
    c.id,
    c.codigo_cliente,
    c.nombre_completo,
    c.correo,
    c.telefono,
    c.estado,
    c.correo_verificado,
    nm.nombre AS nivel_membresia,
    nm.color_badge AS color_nivel,
    c.puntos_actuales,
    c.total_pedidos,
    c.total_gastado,
    c.ticket_promedio,
    c.ultimo_pedido_fecha,
    c.total_resenas,
    c.creado_en,
    DATEDIFF(CURDATE(), c.creado_en) AS dias_como_cliente,
    DATEDIFF(CURDATE(), c.ultimo_pedido_fecha) AS dias_sin_comprar
FROM clientes c
LEFT JOIN clientes_niveles_membresia nm ON c.nivel_membresia_id = nm.id
WHERE c.eliminado_en IS NULL;

-- Vista de clientes VIP (alto valor)
CREATE OR REPLACE VIEW vista_clientes_vip AS
SELECT 
    c.id,
    c.codigo_cliente,
    c.nombre_completo,
    c.correo,
    nm.nombre AS nivel_membresia,
    c.puntos_actuales,
    c.total_pedidos,
    c.total_gastado,
    c.ticket_promedio,
    c.ultimo_pedido_fecha
FROM clientes c
LEFT JOIN clientes_niveles_membresia nm ON c.nivel_membresia_id = nm.id
WHERE c.estado = 'activo'
AND c.eliminado_en IS NULL
AND (c.total_gastado >= 10000 OR c.total_pedidos >= 10)
ORDER BY c.total_gastado DESC;

-- Vista de wishlist populares (productos más deseados)
CREATE OR REPLACE VIEW vista_productos_mas_deseados AS
SELECT 
    p.id AS producto_id,
    p.sku,
    p.nombre AS producto,
    p.precio_base,
    COUNT(wi.id) AS veces_en_wishlist,
    COUNT(DISTINCT wi.wishlist_id) AS wishlists_distintas
FROM catalogo_productos p
JOIN clientes_wishlists_items wi ON p.id = wi.producto_id
GROUP BY p.id, p.sku, p.nombre, p.precio_base
ORDER BY veces_en_wishlist DESC
LIMIT 100;

-- Vista de clientes por retener (sin actividad reciente)
CREATE OR REPLACE VIEW vista_clientes_por_retener AS
SELECT 
    c.id,
    c.codigo_cliente,
    c.nombre_completo,
    c.correo,
    c.telefono,
    c.total_pedidos,
    c.total_gastado,
    c.ultimo_pedido_fecha,
    DATEDIFF(CURDATE(), c.ultimo_pedido_fecha) AS dias_sin_comprar,
    c.puntos_actuales
FROM clientes c
WHERE c.estado = 'activo'
AND c.eliminado_en IS NULL
AND c.total_pedidos > 0
AND c.ultimo_pedido_fecha < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
ORDER BY c.total_gastado DESC;

-- Vista de movimientos de puntos recientes
CREATE OR REPLACE VIEW vista_puntos_recientes AS
SELECT 
    pm.id,
    c.codigo_cliente,
    c.nombre_completo,
    pm.tipo,
    pm.puntos,
    pm.puntos_anteriores,
    pm.puntos_nuevos,
    pm.valor_monetario,
    pm.descripcion,
    pm.creado_en
FROM clientes_puntos_movimientos pm
JOIN clientes c ON pm.cliente_id = c.id
ORDER BY pm.creado_en DESC
LIMIT 1000;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Generar código de cliente único
CREATE PROCEDURE sp_generar_codigo_cliente(OUT p_codigo VARCHAR(20))
BEGIN
    DECLARE v_codigo VARCHAR(20);
    DECLARE v_existe INT DEFAULT 1;
    
    WHILE v_existe > 0 DO
        SET v_codigo = CONCAT('CLI-', UPPER(SUBSTRING(MD5(RAND()), 1, 8)));
        SELECT COUNT(*) INTO v_existe FROM clientes WHERE codigo_cliente = v_codigo;
    END WHILE;
    
    SET p_codigo = v_codigo;
END //

-- Generar código de referido único
CREATE PROCEDURE sp_generar_codigo_referido(IN p_cliente_id BIGINT UNSIGNED)
BEGIN
    DECLARE v_codigo VARCHAR(20);
    DECLARE v_existe INT DEFAULT 1;
    DECLARE v_nombre VARCHAR(100);
    
    SELECT UPPER(SUBSTRING(nombre, 1, 3)) INTO v_nombre FROM clientes WHERE id = p_cliente_id;
    
    WHILE v_existe > 0 DO
        SET v_codigo = CONCAT(v_nombre, '-', UPPER(SUBSTRING(MD5(RAND()), 1, 5)));
        SELECT COUNT(*) INTO v_existe FROM clientes WHERE codigo_referido = v_codigo;
    END WHILE;
    
    UPDATE clientes SET codigo_referido = v_codigo WHERE id = p_cliente_id;
    
    SELECT v_codigo AS codigo_generado;
END //

-- Registrar nuevo cliente
CREATE PROCEDURE sp_registrar_cliente(
    IN p_correo VARCHAR(255),
    IN p_contrasena_hash VARCHAR(255),
    IN p_nombre VARCHAR(100),
    IN p_apellido VARCHAR(100),
    IN p_telefono VARCHAR(20),
    IN p_codigo_referido_usado VARCHAR(20),
    IN p_ip VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_fuente VARCHAR(50)
)
BEGIN
    DECLARE v_codigo_cliente VARCHAR(20);
    DECLARE v_cliente_id BIGINT UNSIGNED;
    DECLARE v_nivel_default_id INT UNSIGNED;
    DECLARE v_referidor_id BIGINT UNSIGNED;
    DECLARE v_puntos_registro INT UNSIGNED DEFAULT 0;
    DECLARE v_puntos_referido INT UNSIGNED DEFAULT 0;
    
    CALL sp_generar_codigo_cliente(v_codigo_cliente);
    
    SELECT id INTO v_nivel_default_id 
    FROM clientes_niveles_membresia 
    WHERE es_default = TRUE AND es_activo = TRUE 
    LIMIT 1;
    
    IF p_codigo_referido_usado IS NOT NULL THEN
        SELECT id INTO v_referidor_id 
        FROM clientes 
        WHERE codigo_referido = p_codigo_referido_usado AND estado = 'activo';
    END IF;
    
    SELECT puntos_registro, puntos_referido 
    INTO v_puntos_registro, v_puntos_referido
    FROM fidelidad_configuracion 
    WHERE es_activo = TRUE 
    LIMIT 1;
    
    INSERT INTO clientes (
        codigo_cliente, correo, contrasena_hash, nombre, apellido,
        telefono, nivel_membresia_id, referido_por_cliente_id,
        puntos_actuales, puntos_totales_historico,
        ip_registro, user_agent_registro, fuente_registro
    ) VALUES (
        v_codigo_cliente, p_correo, p_contrasena_hash, p_nombre, p_apellido,
        p_telefono, v_nivel_default_id, v_referidor_id,
        v_puntos_registro, v_puntos_registro,
        p_ip, p_user_agent, p_fuente
    );
    
    SET v_cliente_id = LAST_INSERT_ID();
    
    INSERT INTO clientes_preferencias (cliente_id) VALUES (v_cliente_id);
    
    INSERT INTO clientes_wishlists (cliente_id, nombre, es_principal) 
    VALUES (v_cliente_id, 'Mi Lista de Deseos', TRUE);
    
    IF v_puntos_registro > 0 THEN
        INSERT INTO clientes_puntos_movimientos (
            cliente_id, tipo, puntos, puntos_anteriores, puntos_nuevos, descripcion
        ) VALUES (
            v_cliente_id, 'acumulacion_registro', v_puntos_registro, 0, v_puntos_registro, 
            'Bienvenida: Puntos por registro'
        );
    END IF;
    
    IF v_referidor_id IS NOT NULL THEN
        UPDATE clientes 
        SET puntos_actuales = puntos_actuales + v_puntos_referido,
            puntos_totales_historico = puntos_totales_historico + v_puntos_referido
        WHERE id = v_referidor_id;
        
        INSERT INTO clientes_puntos_movimientos (
            cliente_id, tipo, puntos, 
            puntos_anteriores, puntos_nuevos, 
            referencia_tipo, referencia_id, descripcion
        ) 
        SELECT 
            v_referidor_id, 'acumulacion_referido', v_puntos_referido,
            puntos_actuales - v_puntos_referido, puntos_actuales,
            'cliente', v_cliente_id, CONCAT('Referido: ', p_nombre, ' ', p_apellido)
        FROM clientes WHERE id = v_referidor_id;
        
        UPDATE clientes_referidos 
        SET cliente_referido_id = v_cliente_id,
            estado = 'registrado',
            fecha_registro = NOW()
        WHERE cliente_referidor_id = v_referidor_id 
        AND correo_invitado = p_correo
        AND estado = 'pendiente';
    END IF;
    
    CALL sp_generar_codigo_referido(v_cliente_id);
    
    SELECT v_cliente_id AS cliente_id, v_codigo_cliente AS codigo_cliente;
END //

-- Acumular puntos por compra
CREATE PROCEDURE sp_acumular_puntos_compra(
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_monto DECIMAL(15,2),
    IN p_pedido_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_puntos INT UNSIGNED;
    DECLARE v_puntos_anteriores INT UNSIGNED;
    DECLARE v_multiplicador DECIMAL(3,2) DEFAULT 1.00;
    DECLARE v_puntos_por_unidad DECIMAL(5,2);
    DECLARE v_unidad_monetaria DECIMAL(10,2);
    DECLARE v_dias_vencimiento INT UNSIGNED;
    
    SELECT puntos_por_unidad_monetaria, unidad_monetaria, dias_vencimiento
    INTO v_puntos_por_unidad, v_unidad_monetaria, v_dias_vencimiento
    FROM fidelidad_configuracion WHERE es_activo = TRUE LIMIT 1;
    
    SELECT nm.puntos_multiplicador INTO v_multiplicador
    FROM clientes c
    JOIN clientes_niveles_membresia nm ON c.nivel_membresia_id = nm.id
    WHERE c.id = p_cliente_id;
    
    SET v_puntos = ROUND((p_monto / v_unidad_monetaria) * v_puntos_por_unidad * COALESCE(v_multiplicador, 1));
    
    SELECT puntos_actuales INTO v_puntos_anteriores FROM clientes WHERE id = p_cliente_id;
    
    UPDATE clientes 
    SET puntos_actuales = puntos_actuales + v_puntos,
        puntos_totales_historico = puntos_totales_historico + v_puntos,
        fecha_vencimiento_puntos = DATE_ADD(CURDATE(), INTERVAL v_dias_vencimiento DAY)
    WHERE id = p_cliente_id;
    
    INSERT INTO clientes_puntos_movimientos (
        cliente_id, tipo, puntos, puntos_anteriores, puntos_nuevos,
        valor_monetario, referencia_tipo, referencia_id, 
        descripcion, fecha_vencimiento
    ) VALUES (
        p_cliente_id, 'acumulacion_compra', v_puntos, 
        v_puntos_anteriores, v_puntos_anteriores + v_puntos,
        p_monto, 'pedido', p_pedido_id,
        CONCAT('Compra por L ', FORMAT(p_monto, 2)),
        DATE_ADD(CURDATE(), INTERVAL v_dias_vencimiento DAY)
    );
    
    SELECT v_puntos AS puntos_ganados, (v_puntos_anteriores + v_puntos) AS puntos_totales;
END //

-- Canjear puntos
CREATE PROCEDURE sp_canjear_puntos(
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_puntos_canjear INT UNSIGNED,
    IN p_pedido_id BIGINT UNSIGNED,
    OUT p_valor_descuento DECIMAL(15,2),
    OUT p_exito BOOLEAN,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_puntos_actuales INT UNSIGNED;
    DECLARE v_puntos_minimos INT UNSIGNED;
    DECLARE v_valor_punto DECIMAL(10,4);
    
    SELECT puntos_actuales INTO v_puntos_actuales FROM clientes WHERE id = p_cliente_id;
    
    SELECT puntos_minimos_canje, valor_punto_en_moneda 
    INTO v_puntos_minimos, v_valor_punto
    FROM fidelidad_configuracion WHERE es_activo = TRUE LIMIT 1;
    
    IF v_puntos_actuales < p_puntos_canjear THEN
        SET p_exito = FALSE;
        SET p_mensaje = 'Puntos insuficientes';
        SET p_valor_descuento = 0;
    ELSEIF p_puntos_canjear < v_puntos_minimos THEN
        SET p_exito = FALSE;
        SET p_mensaje = CONCAT('Mínimo ', v_puntos_minimos, ' puntos para canjear');
        SET p_valor_descuento = 0;
    ELSE
        SET p_valor_descuento = p_puntos_canjear * v_valor_punto;
        
        UPDATE clientes 
        SET puntos_actuales = puntos_actuales - p_puntos_canjear
        WHERE id = p_cliente_id;
        
        INSERT INTO clientes_puntos_movimientos (
            cliente_id, tipo, puntos, 
            puntos_anteriores, puntos_nuevos,
            valor_monetario, referencia_tipo, referencia_id, descripcion
        ) VALUES (
            p_cliente_id, 'canje_pedido', -p_puntos_canjear,
            v_puntos_actuales, v_puntos_actuales - p_puntos_canjear,
            p_valor_descuento, 'pedido', p_pedido_id,
            CONCAT('Canje de puntos - Descuento L ', FORMAT(p_valor_descuento, 2))
        );
        
        SET p_exito = TRUE;
        SET p_mensaje = 'Canje exitoso';
    END IF;
END //

-- Agregar a wishlist
CREATE PROCEDURE sp_agregar_wishlist(
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_producto_id BIGINT UNSIGNED,
    IN p_variante_id BIGINT UNSIGNED,
    IN p_wishlist_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_wishlist_id BIGINT UNSIGNED;
    DECLARE v_precio DECIMAL(15,2);
    DECLARE v_existe INT;
    
    IF p_wishlist_id IS NULL THEN
        SELECT id INTO v_wishlist_id 
        FROM clientes_wishlists 
        WHERE cliente_id = p_cliente_id AND es_principal = TRUE
        LIMIT 1;
    ELSE
        SET v_wishlist_id = p_wishlist_id;
    END IF;
    
    IF p_variante_id IS NOT NULL THEN
        SELECT COALESCE(precio, (SELECT precio_base FROM catalogo_productos WHERE id = p_producto_id))
        INTO v_precio
        FROM catalogo_productos_variantes WHERE id = p_variante_id;
    ELSE
        SELECT precio_base INTO v_precio FROM catalogo_productos WHERE id = p_producto_id;
    END IF;
    
    SELECT COUNT(*) INTO v_existe 
    FROM clientes_wishlists_items 
    WHERE wishlist_id = v_wishlist_id 
    AND producto_id = p_producto_id 
    AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL));
    
    IF v_existe = 0 THEN
        INSERT INTO clientes_wishlists_items (
            wishlist_id, producto_id, variante_id, 
            precio_al_agregar, precio_actual
        ) VALUES (
            v_wishlist_id, p_producto_id, p_variante_id,
            v_precio, v_precio
        );
        
        UPDATE clientes_wishlists 
        SET total_items = total_items + 1 
        WHERE id = v_wishlist_id;
        
        SELECT 'agregado' AS resultado, LAST_INSERT_ID() AS item_id;
    ELSE
        SELECT 'ya_existe' AS resultado, NULL AS item_id;
    END IF;
END //

-- Verificar y actualizar nivel de membresía
CREATE PROCEDURE sp_verificar_nivel_membresia(IN p_cliente_id BIGINT UNSIGNED)
BEGIN
    DECLARE v_puntos_totales INT UNSIGNED;
    DECLARE v_gasto_anual DECIMAL(15,2);
    DECLARE v_pedidos_anual INT UNSIGNED;
    DECLARE v_nivel_actual_id INT UNSIGNED;
    DECLARE v_nuevo_nivel_id INT UNSIGNED;
    
    SELECT puntos_totales_historico, nivel_membresia_id
    INTO v_puntos_totales, v_nivel_actual_id
    FROM clientes WHERE id = p_cliente_id;
    
    SELECT COALESCE(SUM(total), 0), COUNT(*)
    INTO v_gasto_anual, v_pedidos_anual
    FROM (SELECT 1 AS total) AS pedidos_placeholder
    WHERE 1=0;
    
    SELECT id INTO v_nuevo_nivel_id
    FROM clientes_niveles_membresia
    WHERE es_activo = TRUE
    AND es_pago = FALSE
    AND (puntos_requeridos <= v_puntos_totales)
    ORDER BY puntos_requeridos DESC
    LIMIT 1;
    
    IF v_nuevo_nivel_id IS NOT NULL AND v_nuevo_nivel_id != COALESCE(v_nivel_actual_id, 0) THEN
        UPDATE clientes SET nivel_membresia_id = v_nuevo_nivel_id WHERE id = p_cliente_id;
        
        INSERT INTO clientes_membresias_historial (
            cliente_id, nivel_membresia_id, tipo_cambio, 
            nivel_anterior_id, fecha_inicio, estado
        ) VALUES (
            p_cliente_id, v_nuevo_nivel_id, 
            IF(v_nuevo_nivel_id > COALESCE(v_nivel_actual_id, 0), 'upgrade', 'downgrade'),
            v_nivel_actual_id, CURDATE(), 'activa'
        );
        
        SELECT 'actualizado' AS resultado, v_nuevo_nivel_id AS nuevo_nivel_id;
    ELSE
        SELECT 'sin_cambios' AS resultado, v_nivel_actual_id AS nivel_actual_id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger para crear preferencias automáticamente
CREATE TRIGGER trg_cliente_crear_preferencias
AFTER INSERT ON clientes
FOR EACH ROW
BEGIN
    INSERT IGNORE INTO clientes_preferencias (cliente_id) VALUES (NEW.id);
END //

-- Trigger para actualizar conteo de wishlist
CREATE TRIGGER trg_wishlist_item_delete
AFTER DELETE ON clientes_wishlists_items
FOR EACH ROW
BEGIN
    UPDATE clientes_wishlists 
    SET total_items = total_items - 1,
        actualizado_en = NOW()
    WHERE id = OLD.wishlist_id;
END //

-- Trigger para actualizar precios en wishlist
CREATE TRIGGER trg_producto_precio_wishlist
AFTER UPDATE ON catalogo_productos
FOR EACH ROW
BEGIN
    IF OLD.precio_base <> NEW.precio_base THEN
        UPDATE clientes_wishlists_items 
        SET precio_actual = NEW.precio_base
        WHERE producto_id = NEW.id AND variante_id IS NULL;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Niveles de membresía
INSERT INTO clientes_niveles_membresia (codigo, nombre, descripcion, puntos_requeridos, descuento_porcentaje, puntos_multiplicador, envio_gratis, envio_gratis_minimo, acceso_ofertas_exclusivas, color_badge, icono, es_default, orden) VALUES
('bronce', 'Bronce', 'Nivel inicial de membresía', 0, 0.00, 1.00, FALSE, NULL, FALSE, '#CD7F32', 'bi-award', TRUE, 1),
('plata', 'Plata', 'Para clientes frecuentes', 1000, 5.00, 1.25, FALSE, 1000.00, FALSE, '#C0C0C0', 'bi-award-fill', FALSE, 2),
('oro', 'Oro', 'Para clientes premium', 5000, 10.00, 1.50, TRUE, 500.00, TRUE, '#FFD700', 'bi-star', FALSE, 3),
('platino', 'Platino', 'Nivel máximo de beneficios', 15000, 15.00, 2.00, TRUE, NULL, TRUE, '#E5E4E2', 'bi-star-fill', FALSE, 4);

-- Membresía premium de pago (tipo Amazon Prime)
INSERT INTO clientes_niveles_membresia (codigo, nombre, descripcion, puntos_requeridos, descuento_porcentaje, puntos_multiplicador, envio_gratis, acceso_ofertas_exclusivas, atencion_prioritaria, devoluciones_extendidas_dias, es_pago, precio_mensual, precio_anual, color_badge, icono, orden) VALUES
('premium', 'Premium', 'Membresía premium con envío gratis ilimitado y ofertas exclusivas', 0, 20.00, 3.00, TRUE, TRUE, TRUE, 60, TRUE, 99.00, 999.00, '#9B59B6', 'bi-gem', 5);

-- Configuración del programa de fidelidad
INSERT INTO fidelidad_configuracion (
    nombre_programa, puntos_por_unidad_monetaria, unidad_monetaria,
    valor_punto_en_moneda, puntos_minimos_canje, maximo_descuento_porcentaje,
    puntos_expiran, dias_vencimiento,
    puntos_registro, puntos_primera_compra, puntos_referido, puntos_cumpleanos, puntos_resena,
    es_activo
) VALUES (
    'Puntos TiendaVirtual', 1.00, 10.00,
    0.10, 100, 50.00,
    TRUE, 365,
    100, 500, 200, 100, 50,
    TRUE
);

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

DELIMITER //

-- Procedimiento para expirar puntos
CREATE PROCEDURE sp_expirar_puntos()
BEGIN
    DECLARE v_cliente_id BIGINT UNSIGNED;
    DECLARE v_puntos_expirar INT UNSIGNED;
    DECLARE v_puntos_actuales INT UNSIGNED;
    DECLARE v_done INT DEFAULT FALSE;
    
    DECLARE cur_clientes CURSOR FOR
        SELECT id, puntos_actuales
        FROM clientes
        WHERE fecha_vencimiento_puntos <= CURDATE()
        AND puntos_actuales > 0
        AND estado = 'activo';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    OPEN cur_clientes;
    
    read_loop: LOOP
        FETCH cur_clientes INTO v_cliente_id, v_puntos_expirar;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        SELECT puntos_actuales INTO v_puntos_actuales FROM clientes WHERE id = v_cliente_id;
        
        UPDATE clientes 
        SET puntos_actuales = 0,
            fecha_vencimiento_puntos = NULL
        WHERE id = v_cliente_id;
        
        INSERT INTO clientes_puntos_movimientos (
            cliente_id, tipo, puntos, puntos_anteriores, puntos_nuevos, descripcion
        ) VALUES (
            v_cliente_id, 'expiracion', -v_puntos_actuales, v_puntos_actuales, 0,
            'Puntos expirados por inactividad'
        );
    END LOOP;
    
    CLOSE cur_clientes;
END //

DELIMITER ;

-- Evento para expirar puntos (ejecuta diariamente)
DROP EVENT IF EXISTS evento_expirar_puntos;
CREATE EVENT evento_expirar_puntos
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 1 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO CALL sp_expirar_puntos();

-- Evento para limpiar sesiones expiradas
DROP EVENT IF EXISTS evento_limpiar_sesiones_clientes;
CREATE EVENT evento_limpiar_sesiones_clientes
ON SCHEDULE EVERY 1 HOUR
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO 
    UPDATE clientes_sesiones 
    SET es_activa = FALSE, cerrado_en = NOW() 
    WHERE expira_en < NOW() AND es_activa = TRUE;

-- Evento para limpiar códigos de verificación expirados
DROP EVENT IF EXISTS evento_limpiar_codigos_verificacion;
CREATE EVENT evento_limpiar_codigos_verificacion
ON SCHEDULE EVERY 1 HOUR
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO DELETE FROM clientes_codigos_verificacion WHERE expira_en < NOW() AND usado = FALSE;

-- ============================================================================
-- FIN DEL SCRIPT - FASE 5
-- ============================================================================
