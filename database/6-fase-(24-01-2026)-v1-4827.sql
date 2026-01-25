-- ============================================================================
-- TIENDA VIRTUAL - FASE 6
-- ============================================================================
-- Módulo: Carrito y Pedidos (Proceso de Compra Completo - Estilo Amazon)
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script implementa:
-- - Carrito de compras persistente
-- - Sistema de cupones y descuentos
-- - Pedidos con flujo de estados completo
-- - Items del pedido con snapshots de precios
-- - Historial de cambios de estado
-- - Direcciones de envío/facturación por pedido
-- - Cálculos de subtotal, impuestos, envío, descuentos
-- - Notas y comentarios del pedido
-- - Devoluciones y reembolsos
-- ============================================================================
-- Ejecutar DESPUÉS de las Fases 1-5
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- ESQUEMA: CUPONES Y DESCUENTOS
-- ============================================================================

CREATE TABLE cupones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Tipo de descuento
    tipo_descuento ENUM(
        'porcentaje',
        'monto_fijo',
        'envio_gratis',
        'compra_x_lleva_y',
        'segundo_a_descuento'
    ) NOT NULL DEFAULT 'porcentaje',
    
    -- Valor del descuento
    valor_descuento DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_maximo DECIMAL(15,2),
    
    -- Requisitos
    monto_minimo_compra DECIMAL(15,2) DEFAULT 0.00,
    cantidad_minima_productos INT UNSIGNED DEFAULT 1,
    
    -- Aplicabilidad
    aplica_a ENUM(
        'todo',
        'categorias',
        'productos',
        'marcas',
        'primera_compra',
        'clientes_especificos'
    ) NOT NULL DEFAULT 'todo',
    
    -- IDs de aplicabilidad (JSON array)
    aplica_ids JSON,
    
    -- Exclusiones (JSON array de producto_ids o categoria_ids)
    excluye_ids JSON,
    excluye_productos_oferta BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Límites de uso
    uso_maximo_total INT UNSIGNED,
    uso_maximo_por_cliente INT UNSIGNED DEFAULT 1,
    usos_actuales INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Combinación
    es_acumulable BOOLEAN NOT NULL DEFAULT FALSE,
    prioridad INT UNSIGNED NOT NULL DEFAULT 100,
    
    -- Vigencia
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    -- Estado
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_visible BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    
    INDEX idx_codigo (codigo),
    INDEX idx_tipo (tipo_descuento),
    INDEX idx_vigencia (fecha_inicio, fecha_fin),
    INDEX idx_activo (es_activo),
    INDEX idx_empresa (empresa_id),
    CONSTRAINT fk_cupon_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Uso de cupones (historial)
CREATE TABLE cupones_usos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cupon_id INT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    pedido_id BIGINT UNSIGNED,
    
    descuento_aplicado DECIMAL(15,2) NOT NULL,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cupon (cupon_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_pedido (pedido_id),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_cupon_uso_cupon 
        FOREIGN KEY (cupon_id) REFERENCES cupones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cupon_uso_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: CARRITO DE COMPRAS
-- ============================================================================

CREATE TABLE carritos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Propietario (cliente o sesión anónima)
    cliente_id BIGINT UNSIGNED,
    sesion_id VARCHAR(100),
    
    -- Estado
    estado ENUM('activo', 'abandonado', 'convertido', 'expirado') NOT NULL DEFAULT 'activo',
    
    -- Cupón aplicado
    cupon_id INT UNSIGNED,
    descuento_cupon DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Puntos a canjear
    puntos_canjear INT UNSIGNED NOT NULL DEFAULT 0,
    descuento_puntos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Totales calculados
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    impuestos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    envio_estimado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Moneda
    moneda VARCHAR(3) NOT NULL DEFAULT 'HNL',
    
    -- Contadores
    total_items INT UNSIGNED NOT NULL DEFAULT 0,
    total_unidades INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Dirección seleccionada
    direccion_envio_id BIGINT UNSIGNED,
    
    -- Notas del cliente
    notas TEXT,
    
    -- Tracking
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Conversión
    pedido_id BIGINT UNSIGNED,
    convertido_en DATETIME,
    
    -- Timestamps
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_sesion (sesion_id),
    INDEX idx_estado (estado),
    INDEX idx_cupon (cupon_id),
    INDEX idx_actualizado (actualizado_en),
    INDEX idx_expira (expira_en),
    CONSTRAINT fk_carrito_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carrito_cupon 
        FOREIGN KEY (cupon_id) REFERENCES cupones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_carrito_direccion 
        FOREIGN KEY (direccion_envio_id) REFERENCES clientes_direcciones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items del carrito
CREATE TABLE carritos_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    carrito_id BIGINT UNSIGNED NOT NULL,
    
    -- Producto
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    
    -- Cantidad
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    
    -- Precios (al momento de agregar)
    precio_unitario DECIMAL(15,2) NOT NULL,
    precio_original DECIMAL(15,2),
    descuento_unitario DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Totales de línea
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_linea DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    impuesto_linea DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_linea DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Impuesto aplicable
    porcentaje_impuesto DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    
    -- Disponibilidad (al momento de agregar)
    stock_disponible INT,
    almacen_id INT UNSIGNED,
    
    -- Para regalo
    es_regalo BOOLEAN NOT NULL DEFAULT FALSE,
    mensaje_regalo TEXT,
    
    -- Guardado para después
    guardado_para_despues BOOLEAN NOT NULL DEFAULT FALSE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_carrito_producto (carrito_id, producto_id, variante_id),
    INDEX idx_carrito (carrito_id),
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_guardado (guardado_para_despues),
    CONSTRAINT fk_carrito_item_carrito 
        FOREIGN KEY (carrito_id) REFERENCES carritos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carrito_item_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carrito_item_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carrito_item_almacen 
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PEDIDOS
-- ============================================================================

CREATE TABLE pedidos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    numero_pedido VARCHAR(30) NOT NULL UNIQUE,
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- Cliente
    cliente_id BIGINT UNSIGNED NOT NULL,
    
    -- Empresa (multi-tenant)
    empresa_id INT UNSIGNED,
    
    -- Estado del pedido
    estado ENUM(
        'pendiente_pago',
        'pago_procesando',
        'pago_fallido',
        'pagado',
        'confirmado',
        'en_preparacion',
        'preparado',
        'enviado',
        'en_transito',
        'en_reparto',
        'entregado',
        'cancelado',
        'devolucion_solicitada',
        'devolucion_aprobada',
        'devuelto',
        'reembolsado'
    ) NOT NULL DEFAULT 'pendiente_pago',
    
    -- Estado de pago
    estado_pago ENUM(
        'pendiente',
        'procesando',
        'pagado',
        'fallido',
        'reembolso_parcial',
        'reembolsado'
    ) NOT NULL DEFAULT 'pendiente',
    
    -- Origen
    origen ENUM('web', 'mobile', 'app', 'telefono', 'pos', 'marketplace') NOT NULL DEFAULT 'web',
    carrito_id BIGINT UNSIGNED,
    
    -- Moneda
    moneda VARCHAR(3) NOT NULL DEFAULT 'HNL',
    tasa_cambio DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    
    -- Totales
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_productos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_cupon DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_puntos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_membresia DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    subtotal_con_descuento DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    impuestos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    porcentaje_impuesto DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    
    costo_envio DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_envio DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    envio_final DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Puntos
    puntos_canjeados INT UNSIGNED NOT NULL DEFAULT 0,
    puntos_ganados INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Cupón utilizado
    cupon_id INT UNSIGNED,
    cupon_codigo VARCHAR(50),
    
    -- Contadores
    total_items INT UNSIGNED NOT NULL DEFAULT 0,
    total_unidades INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Peso total (para envío)
    peso_total DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    
    -- Dirección de envío (snapshot)
    envio_nombre VARCHAR(200),
    envio_telefono VARCHAR(20),
    envio_linea_1 VARCHAR(255),
    envio_linea_2 VARCHAR(255),
    envio_ciudad VARCHAR(100),
    envio_departamento VARCHAR(100),
    envio_pais VARCHAR(100) DEFAULT 'Honduras',
    envio_codigo_postal VARCHAR(20),
    envio_referencia TEXT,
    envio_instrucciones TEXT,
    envio_latitud DECIMAL(10, 8),
    envio_longitud DECIMAL(11, 8),
    
    -- Dirección de facturación (snapshot)
    facturacion_nombre VARCHAR(200),
    facturacion_rtn VARCHAR(20),
    facturacion_linea_1 VARCHAR(255),
    facturacion_ciudad VARCHAR(100),
    facturacion_departamento VARCHAR(100),
    facturacion_pais VARCHAR(100) DEFAULT 'Honduras',
    
    -- Facturación
    requiere_factura BOOLEAN NOT NULL DEFAULT FALSE,
    numero_factura VARCHAR(50),
    factura_emitida BOOLEAN NOT NULL DEFAULT FALSE,
    factura_emitida_en DATETIME,
    
    -- Envío
    metodo_envio_id INT UNSIGNED,
    metodo_envio_nombre VARCHAR(100),
    envio_estimado_dias INT UNSIGNED,
    fecha_envio_estimada DATE,
    fecha_entrega_estimada DATE,
    
    -- Notas
    notas_cliente TEXT,
    notas_internas TEXT,
    
    -- Es regalo
    es_regalo BOOLEAN NOT NULL DEFAULT FALSE,
    mensaje_regalo TEXT,
    
    -- Tracking
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Fechas importantes
    pagado_en DATETIME,
    confirmado_en DATETIME,
    preparado_en DATETIME,
    enviado_en DATETIME,
    entregado_en DATETIME,
    cancelado_en DATETIME,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    actualizado_por INT UNSIGNED,
    
    -- Índices
    INDEX idx_numero (numero_pedido),
    INDEX idx_uuid (uuid),
    INDEX idx_cliente (cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_estado (estado),
    INDEX idx_estado_pago (estado_pago),
    INDEX idx_origen (origen),
    INDEX idx_fecha (creado_en),
    INDEX idx_cupon (cupon_id),
    INDEX idx_total (total),
    
    CONSTRAINT fk_pedido_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_cupon 
        FOREIGN KEY (cupon_id) REFERENCES cupones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_carrito 
        FOREIGN KEY (carrito_id) REFERENCES carritos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar FK de cupones_usos a pedidos
ALTER TABLE cupones_usos 
ADD CONSTRAINT fk_cupon_uso_pedido 
FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Items del pedido
CREATE TABLE pedidos_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    
    -- Producto (snapshot en caso de que se elimine)
    producto_id BIGINT UNSIGNED,
    variante_id BIGINT UNSIGNED,
    
    -- Snapshot del producto (inmutable)
    sku VARCHAR(50) NOT NULL,
    nombre_producto VARCHAR(300) NOT NULL,
    nombre_variante VARCHAR(200),
    imagen_url VARCHAR(500),
    atributos_json JSON,
    
    -- Cantidad
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    cantidad_enviada INT UNSIGNED NOT NULL DEFAULT 0,
    cantidad_devuelta INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Precios (snapshot)
    precio_unitario DECIMAL(15,2) NOT NULL,
    precio_original DECIMAL(15,2),
    costo_unitario DECIMAL(15,2),
    
    -- Descuentos
    descuento_unitario DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_cupon DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Impuestos
    porcentaje_impuesto DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    impuesto DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Totales de línea
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Peso
    peso DECIMAL(10,3),
    
    -- Inventario
    almacen_id INT UNSIGNED,
    reserva_id BIGINT UNSIGNED,
    
    -- Estado de la línea
    estado ENUM(
        'pendiente',
        'confirmado',
        'en_preparacion',
        'preparado',
        'enviado',
        'entregado',
        'cancelado',
        'devuelto'
    ) NOT NULL DEFAULT 'pendiente',
    
    -- Regalo
    es_regalo BOOLEAN NOT NULL DEFAULT FALSE,
    mensaje_regalo TEXT,
    
    -- Garantía
    tiene_garantia BOOLEAN NOT NULL DEFAULT FALSE,
    garantia_hasta DATE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_sku (sku),
    INDEX idx_estado (estado),
    CONSTRAINT fk_pedido_item_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_item_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_item_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_item_almacen 
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_item_reserva 
        FOREIGN KEY (reserva_id) REFERENCES inventario_reservas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: HISTORIAL DE ESTADOS
-- ============================================================================

CREATE TABLE pedidos_historial_estados (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    
    estado_anterior ENUM(
        'pendiente_pago', 'pago_procesando', 'pago_fallido', 'pagado',
        'confirmado', 'en_preparacion', 'preparado', 'enviado',
        'en_transito', 'en_reparto', 'entregado', 'cancelado',
        'devolucion_solicitada', 'devolucion_aprobada', 'devuelto', 'reembolsado'
    ),
    
    estado_nuevo ENUM(
        'pendiente_pago', 'pago_procesando', 'pago_fallido', 'pagado',
        'confirmado', 'en_preparacion', 'preparado', 'enviado',
        'en_transito', 'en_reparto', 'entregado', 'cancelado',
        'devolucion_solicitada', 'devolucion_aprobada', 'devuelto', 'reembolsado'
    ) NOT NULL,
    
    comentario TEXT,
    es_visible_cliente BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Quién hizo el cambio
    cambiado_por_tipo ENUM('sistema', 'admin', 'cliente', 'transportista') NOT NULL DEFAULT 'sistema',
    cambiado_por_id INT UNSIGNED,
    cambiado_por_nombre VARCHAR(200),
    
    ip_address VARCHAR(45),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_estado (estado_nuevo),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_historial_estado_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PAGOS
-- ============================================================================

CREATE TABLE pedidos_pagos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    
    -- Método de pago
    metodo_pago ENUM(
        'tarjeta_credito',
        'tarjeta_debito',
        'paypal',
        'transferencia',
        'deposito',
        'efectivo_entrega',
        'billetera_digital',
        'puntos',
        'otro'
    ) NOT NULL,
    
    -- Proveedor de pago
    proveedor VARCHAR(50),
    
    -- Identificadores externos
    transaccion_id VARCHAR(100),
    autorizacion_id VARCHAR(100),
    referencia_externa VARCHAR(255),
    
    -- Monto
    monto DECIMAL(15,2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'HNL',
    
    -- Estado
    estado ENUM(
        'pendiente',
        'procesando',
        'completado',
        'fallido',
        'cancelado',
        'reembolsado',
        'reembolso_parcial'
    ) NOT NULL DEFAULT 'pendiente',
    
    -- Datos de tarjeta (enmascarados)
    tarjeta_ultimos_4 VARCHAR(4),
    tarjeta_marca VARCHAR(30),
    tarjeta_banco VARCHAR(100),
    
    -- Respuesta del procesador
    respuesta_codigo VARCHAR(20),
    respuesta_mensaje TEXT,
    respuesta_json JSON,
    
    -- Reembolso
    monto_reembolsado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    reembolso_transaccion_id VARCHAR(100),
    
    -- Comprobante
    comprobante_url VARCHAR(500),
    
    -- Fechas
    procesado_en DATETIME,
    completado_en DATETIME,
    fallido_en DATETIME,
    
    ip_address VARCHAR(45),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_transaccion (transaccion_id),
    INDEX idx_estado (estado),
    INDEX idx_metodo (metodo_pago),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_pago_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ENVÍOS
-- ============================================================================

-- Métodos de envío disponibles
CREATE TABLE envios_metodos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Transportista
    transportista VARCHAR(100),
    transportista_codigo VARCHAR(50),
    
    -- Tipo
    tipo ENUM('standard', 'express', 'same_day', 'pickup', 'gratis') NOT NULL DEFAULT 'standard',
    
    -- Tiempos
    dias_minimo INT UNSIGNED NOT NULL DEFAULT 1,
    dias_maximo INT UNSIGNED NOT NULL DEFAULT 5,
    
    -- Costos
    costo_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    costo_por_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    costo_por_km DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Límites
    peso_maximo DECIMAL(10,2),
    monto_minimo_gratis DECIMAL(15,2),
    
    -- Disponibilidad
    disponible_departamentos JSON,
    disponible_ciudades JSON,
    
    -- Control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 100,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_tipo (tipo),
    INDEX idx_activo (es_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Envíos de pedidos
CREATE TABLE pedidos_envios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    
    -- Método
    metodo_envio_id INT UNSIGNED,
    metodo_nombre VARCHAR(100),
    
    -- Tracking
    numero_guia VARCHAR(100),
    url_tracking VARCHAR(500),
    transportista VARCHAR(100),
    
    -- Estado
    estado ENUM(
        'pendiente',
        'recogido',
        'en_transito',
        'en_centro_distribucion',
        'en_reparto',
        'entregado',
        'fallido',
        'devuelto'
    ) NOT NULL DEFAULT 'pendiente',
    
    -- Fechas
    fecha_envio DATE,
    fecha_entrega_estimada DATE,
    fecha_entrega_real DATETIME,
    
    -- Quien recibió
    recibido_por VARCHAR(200),
    firma_url VARCHAR(500),
    foto_entrega_url VARCHAR(500),
    
    -- Costos
    costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    peso DECIMAL(10,3),
    
    -- Dimensiones del paquete
    largo DECIMAL(10,2),
    ancho DECIMAL(10,2),
    alto DECIMAL(10,2),
    
    -- Intentos de entrega
    intentos_entrega TINYINT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Notas
    notas TEXT,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_guia (numero_guia),
    INDEX idx_estado (estado),
    INDEX idx_fecha_envio (fecha_envio),
    CONSTRAINT fk_envio_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_envio_metodo 
        FOREIGN KEY (metodo_envio_id) REFERENCES envios_metodos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tracking de envíos
CREATE TABLE pedidos_envios_tracking (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id BIGINT UNSIGNED NOT NULL,
    
    estado VARCHAR(100) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    
    fecha_evento DATETIME NOT NULL,
    
    -- Datos del transportista
    codigo_transportista VARCHAR(50),
    datos_json JSON,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_envio (envio_id),
    INDEX idx_fecha (fecha_evento),
    CONSTRAINT fk_tracking_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: DEVOLUCIONES Y REEMBOLSOS
-- ============================================================================

CREATE TABLE pedidos_devoluciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    
    -- Número de devolución
    numero_devolucion VARCHAR(30) NOT NULL UNIQUE,
    
    -- Estado
    estado ENUM(
        'solicitada',
        'aprobada',
        'rechazada',
        'en_transito',
        'recibida',
        'inspeccionada',
        'reembolsada',
        'cerrada'
    ) NOT NULL DEFAULT 'solicitada',
    
    -- Motivo
    motivo ENUM(
        'defectuoso',
        'no_como_descripcion',
        'talla_incorrecta',
        'cambio_opinion',
        'llego_tarde',
        'danado_envio',
        'pedido_incorrecto',
        'otro'
    ) NOT NULL,
    motivo_detalle TEXT,
    
    -- Tipo de resolución solicitada
    tipo_resolucion ENUM('reembolso', 'cambio', 'credito_tienda') NOT NULL DEFAULT 'reembolso',
    
    -- Montos
    monto_solicitado DECIMAL(15,2) NOT NULL,
    monto_aprobado DECIMAL(15,2),
    
    -- Envío de devolución
    etiqueta_devolucion_url VARCHAR(500),
    numero_guia_devolucion VARCHAR(100),
    
    -- Inspección
    inspeccion_notas TEXT,
    inspeccion_fotos JSON,
    inspeccionado_por INT UNSIGNED,
    inspeccionado_en DATETIME,
    
    -- Fechas
    aprobado_en DATETIME,
    rechazado_en DATETIME,
    recibido_en DATETIME,
    reembolsado_en DATETIME,
    
    -- Notas
    notas_cliente TEXT,
    notas_internas TEXT,
    
    -- Auditoría
    creado_por BIGINT UNSIGNED,
    gestionado_por INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_numero (numero_devolucion),
    INDEX idx_estado (estado),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_devolucion_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_devolucion_cliente 
        FOREIGN KEY (creado_por) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items de devolución
CREATE TABLE pedidos_devoluciones_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    devolucion_id BIGINT UNSIGNED NOT NULL,
    pedido_item_id BIGINT UNSIGNED NOT NULL,
    
    cantidad INT UNSIGNED NOT NULL,
    motivo TEXT,
    
    -- Estado del item
    estado ENUM('pendiente', 'recibido', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    
    -- Monto
    monto DECIMAL(15,2) NOT NULL,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_devolucion (devolucion_id),
    INDEX idx_item (pedido_item_id),
    CONSTRAINT fk_devolucion_item_devolucion 
        FOREIGN KEY (devolucion_id) REFERENCES pedidos_devoluciones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_devolucion_item_pedido_item 
        FOREIGN KEY (pedido_item_id) REFERENCES pedidos_items(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: NOTAS Y COMUNICACIÓN
-- ============================================================================

CREATE TABLE pedidos_notas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    
    tipo ENUM('nota_interna', 'nota_cliente', 'sistema') NOT NULL DEFAULT 'nota_interna',
    contenido TEXT NOT NULL,
    
    es_visible_cliente BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Autor
    autor_tipo ENUM('admin', 'cliente', 'sistema') NOT NULL,
    autor_id INT UNSIGNED,
    autor_nombre VARCHAR(200),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_tipo (tipo),
    INDEX idx_visible (es_visible_cliente),
    CONSTRAINT fk_nota_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NUEVOS MÓDULOS Y PERMISOS
-- ============================================================================

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('pedidos', 'Pedidos', 'Gestión de pedidos', 'bi-bag-check', '/admin/pedidos', 24, TRUE),
('pedidos_devoluciones', 'Devoluciones', 'Gestión de devoluciones', 'bi-arrow-return-left', '/admin/pedidos/devoluciones', 25, TRUE),
('cupones', 'Cupones', 'Gestión de cupones', 'bi-ticket-perforated', '/admin/cupones', 26, TRUE),
('envios', 'Envíos', 'Gestión de envíos', 'bi-truck', '/admin/envios', 27, TRUE);

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'pedidos.ver', 'Ver pedidos', id, 'ver' FROM admin_modulos WHERE codigo = 'pedidos'
UNION ALL SELECT 'pedidos.crear', 'Crear pedidos', id, 'crear' FROM admin_modulos WHERE codigo = 'pedidos'
UNION ALL SELECT 'pedidos.editar', 'Editar pedidos', id, 'editar' FROM admin_modulos WHERE codigo = 'pedidos'
UNION ALL SELECT 'pedidos.cancelar', 'Cancelar pedidos', id, 'eliminar' FROM admin_modulos WHERE codigo = 'pedidos'
UNION ALL SELECT 'pedidos.exportar', 'Exportar pedidos', id, 'exportar' FROM admin_modulos WHERE codigo = 'pedidos'
UNION ALL SELECT 'pedidos.cambiar_estado', 'Cambiar estado', id, 'editar' FROM admin_modulos WHERE codigo = 'pedidos'
UNION ALL SELECT 'pedidos.ver_pagos', 'Ver pagos', id, 'ver' FROM admin_modulos WHERE codigo = 'pedidos'
UNION ALL SELECT 'pedidos.reembolsar', 'Procesar reembolsos', id, 'editar' FROM admin_modulos WHERE codigo = 'pedidos';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'pedidos_devoluciones.ver', 'Ver devoluciones', id, 'ver' FROM admin_modulos WHERE codigo = 'pedidos_devoluciones'
UNION ALL SELECT 'pedidos_devoluciones.gestionar', 'Gestionar devoluciones', id, 'editar' FROM admin_modulos WHERE codigo = 'pedidos_devoluciones';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'cupones.ver', 'Ver cupones', id, 'ver' FROM admin_modulos WHERE codigo = 'cupones'
UNION ALL SELECT 'cupones.crear', 'Crear cupones', id, 'crear' FROM admin_modulos WHERE codigo = 'cupones'
UNION ALL SELECT 'cupones.editar', 'Editar cupones', id, 'editar' FROM admin_modulos WHERE codigo = 'cupones'
UNION ALL SELECT 'cupones.eliminar', 'Eliminar cupones', id, 'eliminar' FROM admin_modulos WHERE codigo = 'cupones';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'envios.ver', 'Ver envíos', id, 'ver' FROM admin_modulos WHERE codigo = 'envios'
UNION ALL SELECT 'envios.gestionar', 'Gestionar envíos', id, 'editar' FROM admin_modulos WHERE codigo = 'envios'
UNION ALL SELECT 'envios.configurar', 'Configurar métodos', id, 'editar' FROM admin_modulos WHERE codigo = 'envios';

INSERT IGNORE INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos 
WHERE codigo LIKE 'pedidos%' 
   OR codigo LIKE 'cupones%' 
   OR codigo LIKE 'envios%';

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de pedidos con resumen
CREATE OR REPLACE VIEW vista_pedidos_resumen AS
SELECT 
    p.id,
    p.numero_pedido,
    p.estado,
    p.estado_pago,
    c.codigo_cliente,
    c.nombre_completo AS cliente,
    c.correo AS cliente_correo,
    p.total_items,
    p.subtotal,
    p.descuento_total,
    p.impuestos,
    p.costo_envio,
    p.total,
    p.moneda,
    p.origen,
    p.envio_ciudad,
    p.envio_departamento,
    p.creado_en,
    p.pagado_en,
    p.enviado_en,
    p.entregado_en,
    TIMESTAMPDIFF(HOUR, p.creado_en, NOW()) AS horas_desde_creacion
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
ORDER BY p.creado_en DESC;

-- Vista de pedidos pendientes de envío
CREATE OR REPLACE VIEW vista_pedidos_por_enviar AS
SELECT 
    p.id,
    p.numero_pedido,
    p.estado,
    c.nombre_completo AS cliente,
    c.telefono AS cliente_telefono,
    p.total_items,
    p.total,
    p.envio_nombre,
    p.envio_ciudad,
    p.envio_departamento,
    p.metodo_envio_nombre,
    p.creado_en,
    p.pagado_en,
    TIMESTAMPDIFF(HOUR, p.pagado_en, NOW()) AS horas_desde_pago
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
WHERE p.estado IN ('pagado', 'confirmado', 'en_preparacion', 'preparado')
ORDER BY p.pagado_en ASC;

-- Vista de ventas del día
CREATE OR REPLACE VIEW vista_ventas_hoy AS
SELECT 
    COUNT(*) AS total_pedidos,
    SUM(total) AS total_ventas,
    SUM(total_items) AS total_productos,
    AVG(total) AS ticket_promedio,
    COUNT(CASE WHEN estado = 'pendiente_pago' THEN 1 END) AS pendientes_pago,
    COUNT(CASE WHEN estado IN ('pagado', 'confirmado') THEN 1 END) AS por_preparar,
    COUNT(CASE WHEN estado = 'enviado' THEN 1 END) AS enviados
FROM pedidos
WHERE DATE(creado_en) = CURDATE();

-- Vista de carritos abandonados
CREATE OR REPLACE VIEW vista_carritos_abandonados AS
SELECT 
    ca.id,
    c.codigo_cliente,
    c.nombre_completo AS cliente,
    c.correo,
    ca.total_items,
    ca.total,
    ca.creado_en,
    ca.ultimo_acceso,
    TIMESTAMPDIFF(HOUR, ca.ultimo_acceso, NOW()) AS horas_abandonado
FROM carritos ca
JOIN clientes c ON ca.cliente_id = c.id
WHERE ca.estado = 'activo'
AND ca.total_items > 0
AND ca.ultimo_acceso < DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY ca.total DESC;

-- Vista de productos más vendidos
CREATE OR REPLACE VIEW vista_productos_mas_vendidos AS
SELECT 
    pi.producto_id,
    pi.sku,
    pi.nombre_producto,
    COUNT(DISTINCT pi.pedido_id) AS total_pedidos,
    SUM(pi.cantidad) AS total_unidades,
    SUM(pi.total) AS total_ventas,
    AVG(pi.precio_unitario) AS precio_promedio
FROM pedidos_items pi
JOIN pedidos p ON pi.pedido_id = p.id
WHERE p.estado NOT IN ('cancelado', 'devuelto', 'reembolsado')
AND p.creado_en >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY pi.producto_id, pi.sku, pi.nombre_producto
ORDER BY total_unidades DESC
LIMIT 100;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Generar número de pedido único
CREATE PROCEDURE sp_generar_numero_pedido(OUT p_numero VARCHAR(30))
BEGIN
    DECLARE v_numero VARCHAR(30);
    DECLARE v_existe INT DEFAULT 1;
    DECLARE v_prefijo VARCHAR(10);
    
    SET v_prefijo = CONCAT('PED-', DATE_FORMAT(NOW(), '%y%m'));
    
    WHILE v_existe > 0 DO
        SET v_numero = CONCAT(v_prefijo, '-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
        SELECT COUNT(*) INTO v_existe FROM pedidos WHERE numero_pedido = v_numero;
    END WHILE;
    
    SET p_numero = v_numero;
END //

-- Generar número de devolución único
CREATE PROCEDURE sp_generar_numero_devolucion(OUT p_numero VARCHAR(30))
BEGIN
    DECLARE v_numero VARCHAR(30);
    DECLARE v_existe INT DEFAULT 1;
    
    WHILE v_existe > 0 DO
        SET v_numero = CONCAT('DEV-', DATE_FORMAT(NOW(), '%y%m'), '-', LPAD(FLOOR(RAND() * 99999), 5, '0'));
        SELECT COUNT(*) INTO v_existe FROM pedidos_devoluciones WHERE numero_devolucion = v_numero;
    END WHILE;
    
    SET p_numero = v_numero;
END //

-- Calcular totales del carrito
CREATE PROCEDURE sp_calcular_totales_carrito(IN p_carrito_id BIGINT UNSIGNED)
BEGIN
    DECLARE v_subtotal DECIMAL(15,2) DEFAULT 0;
    DECLARE v_descuento DECIMAL(15,2) DEFAULT 0;
    DECLARE v_impuestos DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_items INT DEFAULT 0;
    DECLARE v_total_unidades INT DEFAULT 0;
    DECLARE v_descuento_cupon DECIMAL(15,2) DEFAULT 0;
    DECLARE v_porcentaje_impuesto DECIMAL(5,2) DEFAULT 15.00;
    
    SELECT 
        COALESCE(SUM(subtotal), 0),
        COALESCE(SUM(descuento_linea), 0),
        COUNT(*),
        COALESCE(SUM(cantidad), 0)
    INTO v_subtotal, v_descuento, v_total_items, v_total_unidades
    FROM carritos_items
    WHERE carrito_id = p_carrito_id
    AND guardado_para_despues = FALSE;
    
    SELECT COALESCE(descuento_cupon, 0) INTO v_descuento_cupon
    FROM carritos WHERE id = p_carrito_id;
    
    SET v_impuestos = ROUND((v_subtotal - v_descuento - v_descuento_cupon) * (v_porcentaje_impuesto / 100), 2);
    
    UPDATE carritos
    SET 
        subtotal = v_subtotal,
        descuento_total = v_descuento + v_descuento_cupon,
        impuestos = v_impuestos,
        total = v_subtotal - v_descuento - v_descuento_cupon + v_impuestos,
        total_items = v_total_items,
        total_unidades = v_total_unidades,
        actualizado_en = NOW()
    WHERE id = p_carrito_id;
END //

-- Agregar item al carrito
CREATE PROCEDURE sp_agregar_item_carrito(
    IN p_carrito_id BIGINT UNSIGNED,
    IN p_producto_id BIGINT UNSIGNED,
    IN p_variante_id BIGINT UNSIGNED,
    IN p_cantidad INT UNSIGNED
)
BEGIN
    DECLARE v_precio DECIMAL(15,2);
    DECLARE v_precio_original DECIMAL(15,2);
    DECLARE v_stock INT;
    DECLARE v_item_existe BIGINT UNSIGNED;
    DECLARE v_porcentaje_impuesto DECIMAL(5,2) DEFAULT 15.00;
    
    IF p_variante_id IS NOT NULL THEN
        SELECT 
            COALESCE(pv.precio, p.precio_base),
            p.precio_comparacion,
            pv.stock_actual
        INTO v_precio, v_precio_original, v_stock
        FROM catalogo_productos_variantes pv
        JOIN catalogo_productos p ON pv.producto_id = p.id
        WHERE pv.id = p_variante_id;
    ELSE
        SELECT precio_base, precio_comparacion, stock_actual
        INTO v_precio, v_precio_original, v_stock
        FROM catalogo_productos
        WHERE id = p_producto_id;
    END IF;
    
    SELECT id INTO v_item_existe
    FROM carritos_items
    WHERE carrito_id = p_carrito_id
    AND producto_id = p_producto_id
    AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL));
    
    IF v_item_existe IS NOT NULL THEN
        UPDATE carritos_items
        SET 
            cantidad = cantidad + p_cantidad,
            subtotal = (cantidad + p_cantidad) * precio_unitario,
            impuesto_linea = ROUND((cantidad + p_cantidad) * precio_unitario * (porcentaje_impuesto / 100), 2),
            total_linea = (cantidad + p_cantidad) * precio_unitario + ROUND((cantidad + p_cantidad) * precio_unitario * (porcentaje_impuesto / 100), 2),
            stock_disponible = v_stock,
            actualizado_en = NOW()
        WHERE id = v_item_existe;
        
        SELECT v_item_existe AS item_id, 'actualizado' AS resultado;
    ELSE
        INSERT INTO carritos_items (
            carrito_id, producto_id, variante_id, cantidad,
            precio_unitario, precio_original, porcentaje_impuesto,
            subtotal, impuesto_linea, total_linea, stock_disponible
        ) VALUES (
            p_carrito_id, p_producto_id, p_variante_id, p_cantidad,
            v_precio, v_precio_original, v_porcentaje_impuesto,
            p_cantidad * v_precio,
            ROUND(p_cantidad * v_precio * (v_porcentaje_impuesto / 100), 2),
            p_cantidad * v_precio + ROUND(p_cantidad * v_precio * (v_porcentaje_impuesto / 100), 2),
            v_stock
        );
        
        SELECT LAST_INSERT_ID() AS item_id, 'agregado' AS resultado;
    END IF;
    
    CALL sp_calcular_totales_carrito(p_carrito_id);
END //

-- Convertir carrito a pedido
CREATE PROCEDURE sp_convertir_carrito_a_pedido(
    IN p_carrito_id BIGINT UNSIGNED,
    IN p_metodo_envio_id INT UNSIGNED,
    IN p_direccion_envio_id BIGINT UNSIGNED,
    IN p_notas TEXT,
    OUT p_pedido_id BIGINT UNSIGNED,
    OUT p_numero_pedido VARCHAR(30)
)
BEGIN
    DECLARE v_cliente_id BIGINT UNSIGNED;
    DECLARE v_numero VARCHAR(30);
    DECLARE v_subtotal DECIMAL(15,2);
    DECLARE v_descuento DECIMAL(15,2);
    DECLARE v_impuestos DECIMAL(15,2);
    DECLARE v_total DECIMAL(15,2);
    DECLARE v_total_items INT;
    DECLARE v_total_unidades INT;
    DECLARE v_cupon_id INT UNSIGNED;
    DECLARE v_descuento_cupon DECIMAL(15,2);
    DECLARE v_puntos_canjear INT UNSIGNED;
    DECLARE v_descuento_puntos DECIMAL(15,2);
    DECLARE v_costo_envio DECIMAL(10,2) DEFAULT 0;
    DECLARE v_envio_nombre VARCHAR(100);
    DECLARE v_envio_dias INT;
    
    CALL sp_generar_numero_pedido(v_numero);
    
    SELECT cliente_id, subtotal, descuento_total, impuestos, total,
           total_items, total_unidades, cupon_id, descuento_cupon,
           puntos_canjear, descuento_puntos
    INTO v_cliente_id, v_subtotal, v_descuento, v_impuestos, v_total,
         v_total_items, v_total_unidades, v_cupon_id, v_descuento_cupon,
         v_puntos_canjear, v_descuento_puntos
    FROM carritos
    WHERE id = p_carrito_id;
    
    IF p_metodo_envio_id IS NOT NULL THEN
        SELECT costo_base, nombre, dias_maximo
        INTO v_costo_envio, v_envio_nombre, v_envio_dias
        FROM envios_metodos
        WHERE id = p_metodo_envio_id;
    END IF;
    
    INSERT INTO pedidos (
        numero_pedido, cliente_id, carrito_id,
        subtotal, descuento_cupon, descuento_puntos, descuento_total,
        subtotal_con_descuento, impuestos, costo_envio, envio_final, total,
        total_items, total_unidades,
        cupon_id, puntos_canjeados,
        metodo_envio_id, metodo_envio_nombre, envio_estimado_dias,
        fecha_entrega_estimada,
        notas_cliente
    )
    SELECT 
        v_numero, v_cliente_id, p_carrito_id,
        v_subtotal, v_descuento_cupon, v_descuento_puntos, v_descuento,
        v_subtotal - v_descuento, v_impuestos, v_costo_envio, v_costo_envio, 
        v_total + v_costo_envio,
        v_total_items, v_total_unidades,
        v_cupon_id, v_puntos_canjear,
        p_metodo_envio_id, v_envio_nombre, v_envio_dias,
        DATE_ADD(CURDATE(), INTERVAL COALESCE(v_envio_dias, 5) DAY),
        p_notas;
    
    SET p_pedido_id = LAST_INSERT_ID();
    SET p_numero_pedido = v_numero;
    
    IF p_direccion_envio_id IS NOT NULL THEN
        UPDATE pedidos p
        JOIN clientes_direcciones d ON d.id = p_direccion_envio_id
        SET 
            p.envio_nombre = d.nombre_destinatario,
            p.envio_telefono = d.telefono,
            p.envio_linea_1 = d.linea_1,
            p.envio_linea_2 = d.linea_2,
            p.envio_ciudad = d.ciudad,
            p.envio_departamento = d.departamento,
            p.envio_pais = d.pais,
            p.envio_codigo_postal = d.codigo_postal,
            p.envio_referencia = d.referencia,
            p.envio_instrucciones = d.instrucciones_entrega,
            p.envio_latitud = d.latitud,
            p.envio_longitud = d.longitud
        WHERE p.id = p_pedido_id;
    END IF;
    
    INSERT INTO pedidos_items (
        pedido_id, producto_id, variante_id,
        sku, nombre_producto, nombre_variante, imagen_url,
        cantidad, precio_unitario, precio_original,
        descuento_unitario, porcentaje_impuesto, impuesto,
        subtotal, total, es_regalo, mensaje_regalo, almacen_id
    )
    SELECT 
        p_pedido_id, ci.producto_id, ci.variante_id,
        COALESCE(pv.sku, cp.sku),
        cp.nombre,
        pv.nombre_variante,
        (SELECT url_original FROM catalogo_productos_imagenes WHERE producto_id = cp.id AND es_principal = TRUE LIMIT 1),
        ci.cantidad, ci.precio_unitario, ci.precio_original,
        ci.descuento_unitario, ci.porcentaje_impuesto, ci.impuesto_linea,
        ci.subtotal, ci.total_linea, ci.es_regalo, ci.mensaje_regalo, ci.almacen_id
    FROM carritos_items ci
    JOIN catalogo_productos cp ON ci.producto_id = cp.id
    LEFT JOIN catalogo_productos_variantes pv ON ci.variante_id = pv.id
    WHERE ci.carrito_id = p_carrito_id
    AND ci.guardado_para_despues = FALSE;
    
    UPDATE carritos
    SET estado = 'convertido', pedido_id = p_pedido_id, convertido_en = NOW()
    WHERE id = p_carrito_id;
    
    INSERT INTO pedidos_historial_estados (
        pedido_id, estado_anterior, estado_nuevo, 
        comentario, cambiado_por_tipo
    ) VALUES (
        p_pedido_id, NULL, 'pendiente_pago',
        'Pedido creado desde carrito', 'sistema'
    );
    
    IF v_cupon_id IS NOT NULL THEN
        INSERT INTO cupones_usos (cupon_id, cliente_id, pedido_id, descuento_aplicado)
        VALUES (v_cupon_id, v_cliente_id, p_pedido_id, v_descuento_cupon);
        
        UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = v_cupon_id;
    END IF;
END //

-- Cambiar estado del pedido
CREATE PROCEDURE sp_cambiar_estado_pedido(
    IN p_pedido_id BIGINT UNSIGNED,
    IN p_nuevo_estado VARCHAR(50),
    IN p_comentario TEXT,
    IN p_usuario_tipo VARCHAR(20),
    IN p_usuario_id INT UNSIGNED,
    IN p_usuario_nombre VARCHAR(200)
)
BEGIN
    DECLARE v_estado_actual VARCHAR(50);
    DECLARE v_cliente_id BIGINT UNSIGNED;
    
    SELECT estado, cliente_id INTO v_estado_actual, v_cliente_id
    FROM pedidos WHERE id = p_pedido_id;
    
    UPDATE pedidos
    SET 
        estado = p_nuevo_estado,
        pagado_en = IF(p_nuevo_estado = 'pagado' AND pagado_en IS NULL, NOW(), pagado_en),
        confirmado_en = IF(p_nuevo_estado = 'confirmado' AND confirmado_en IS NULL, NOW(), confirmado_en),
        preparado_en = IF(p_nuevo_estado = 'preparado' AND preparado_en IS NULL, NOW(), preparado_en),
        enviado_en = IF(p_nuevo_estado = 'enviado' AND enviado_en IS NULL, NOW(), enviado_en),
        entregado_en = IF(p_nuevo_estado = 'entregado' AND entregado_en IS NULL, NOW(), entregado_en),
        cancelado_en = IF(p_nuevo_estado = 'cancelado' AND cancelado_en IS NULL, NOW(), cancelado_en),
        actualizado_en = NOW()
    WHERE id = p_pedido_id;
    
    INSERT INTO pedidos_historial_estados (
        pedido_id, estado_anterior, estado_nuevo,
        comentario, cambiado_por_tipo, cambiado_por_id, cambiado_por_nombre
    ) VALUES (
        p_pedido_id, v_estado_actual, p_nuevo_estado,
        p_comentario, p_usuario_tipo, p_usuario_id, p_usuario_nombre
    );
    
    IF p_nuevo_estado = 'entregado' THEN
        UPDATE clientes
        SET 
            total_pedidos = total_pedidos + 1,
            ultimo_pedido_fecha = NOW()
        WHERE id = v_cliente_id;
        
        UPDATE clientes c
        JOIN pedidos p ON c.id = p.cliente_id
        SET 
            c.total_gastado = c.total_gastado + p.total,
            c.ticket_promedio = (c.total_gastado + p.total) / (c.total_pedidos)
        WHERE p.id = p_pedido_id;
    END IF;
    
    SELECT 'ok' AS resultado, v_estado_actual AS estado_anterior, p_nuevo_estado AS estado_nuevo;
END //

-- Validar cupón
CREATE PROCEDURE sp_validar_cupon(
    IN p_codigo VARCHAR(50),
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_subtotal DECIMAL(15,2),
    OUT p_valido BOOLEAN,
    OUT p_mensaje VARCHAR(255),
    OUT p_cupon_id INT UNSIGNED,
    OUT p_descuento DECIMAL(15,2)
)
BEGIN
    DECLARE v_cupon_id INT UNSIGNED;
    DECLARE v_tipo VARCHAR(50);
    DECLARE v_valor DECIMAL(15,2);
    DECLARE v_descuento_max DECIMAL(15,2);
    DECLARE v_monto_min DECIMAL(15,2);
    DECLARE v_uso_max_cliente INT;
    DECLARE v_usos_cliente INT;
    DECLARE v_es_activo BOOLEAN;
    DECLARE v_fecha_inicio DATETIME;
    DECLARE v_fecha_fin DATETIME;
    
    SELECT id, tipo_descuento, valor_descuento, descuento_maximo,
           monto_minimo_compra, uso_maximo_por_cliente, es_activo,
           fecha_inicio, fecha_fin
    INTO v_cupon_id, v_tipo, v_valor, v_descuento_max,
         v_monto_min, v_uso_max_cliente, v_es_activo,
         v_fecha_inicio, v_fecha_fin
    FROM cupones
    WHERE codigo = p_codigo;
    
    IF v_cupon_id IS NULL THEN
        SET p_valido = FALSE;
        SET p_mensaje = 'Cupón no encontrado';
        SET p_cupon_id = NULL;
        SET p_descuento = 0;
    ELSEIF v_es_activo = FALSE THEN
        SET p_valido = FALSE;
        SET p_mensaje = 'Cupón inactivo';
        SET p_cupon_id = NULL;
        SET p_descuento = 0;
    ELSEIF NOW() < v_fecha_inicio THEN
        SET p_valido = FALSE;
        SET p_mensaje = 'Cupón aún no vigente';
        SET p_cupon_id = NULL;
        SET p_descuento = 0;
    ELSEIF NOW() > v_fecha_fin THEN
        SET p_valido = FALSE;
        SET p_mensaje = 'Cupón expirado';
        SET p_cupon_id = NULL;
        SET p_descuento = 0;
    ELSEIF p_subtotal < v_monto_min THEN
        SET p_valido = FALSE;
        SET p_mensaje = CONCAT('Monto mínimo: L ', FORMAT(v_monto_min, 2));
        SET p_cupon_id = NULL;
        SET p_descuento = 0;
    ELSE
        SELECT COUNT(*) INTO v_usos_cliente
        FROM cupones_usos
        WHERE cupon_id = v_cupon_id AND cliente_id = p_cliente_id;
        
        IF v_uso_max_cliente IS NOT NULL AND v_usos_cliente >= v_uso_max_cliente THEN
            SET p_valido = FALSE;
            SET p_mensaje = 'Ya usaste este cupón';
            SET p_cupon_id = NULL;
            SET p_descuento = 0;
        ELSE
            SET p_valido = TRUE;
            SET p_cupon_id = v_cupon_id;
            
            IF v_tipo = 'porcentaje' THEN
                SET p_descuento = ROUND(p_subtotal * (v_valor / 100), 2);
                IF v_descuento_max IS NOT NULL AND p_descuento > v_descuento_max THEN
                    SET p_descuento = v_descuento_max;
                END IF;
            ELSEIF v_tipo = 'monto_fijo' THEN
                SET p_descuento = v_valor;
            ELSEIF v_tipo = 'envio_gratis' THEN
                SET p_descuento = 0;
            ELSE
                SET p_descuento = v_valor;
            END IF;
            
            SET p_mensaje = 'Cupón válido';
        END IF;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger para actualizar estadísticas del cliente al entregar pedido
CREATE TRIGGER trg_pedido_entregado_estadisticas
AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF NEW.estado = 'entregado' AND OLD.estado != 'entregado' THEN
        CALL sp_acumular_puntos_compra(NEW.cliente_id, NEW.total, NEW.id);
    END IF;
END //

-- Trigger para registrar cambio de estado automático
CREATE TRIGGER trg_pedido_estado_cambio
BEFORE UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF NEW.estado_pago = 'pagado' AND OLD.estado_pago != 'pagado' THEN
        SET NEW.pagado_en = COALESCE(NEW.pagado_en, NOW());
        IF NEW.estado = 'pendiente_pago' THEN
            SET NEW.estado = 'pagado';
        END IF;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Métodos de envío
INSERT INTO envios_metodos (codigo, nombre, descripcion, tipo, dias_minimo, dias_maximo, costo_base, es_activo, orden) VALUES
('standard', 'Envío Estándar', 'Entrega en 3-5 días hábiles', 'standard', 3, 5, 75.00, TRUE, 1),
('express', 'Envío Express', 'Entrega en 1-2 días hábiles', 'express', 1, 2, 150.00, TRUE, 2),
('same_day', 'Entrega Mismo Día', 'Entrega el mismo día (solo Tegucigalpa y SPS)', 'same_day', 0, 0, 250.00, TRUE, 3),
('pickup', 'Recoger en Tienda', 'Recoge tu pedido en nuestra tienda', 'pickup', 1, 1, 0.00, TRUE, 4),
('gratis', 'Envío Gratis', 'En compras mayores a L 2,000', 'gratis', 3, 7, 0.00, TRUE, 5);

-- Actualizar monto mínimo para envío gratis
UPDATE envios_metodos SET monto_minimo_gratis = 2000.00 WHERE codigo = 'gratis';

-- Cupón de ejemplo para bienvenida
INSERT INTO cupones (
    codigo, nombre, descripcion, tipo_descuento, valor_descuento,
    monto_minimo_compra, aplica_a, uso_maximo_por_cliente,
    fecha_inicio, fecha_fin, es_activo
) VALUES (
    'BIENVENIDO10', 'Descuento de bienvenida', '10% de descuento en tu primera compra',
    'porcentaje', 10.00, 500.00, 'primera_compra', 1,
    NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE
);

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Evento para marcar carritos abandonados
DROP EVENT IF EXISTS evento_marcar_carritos_abandonados;
CREATE EVENT evento_marcar_carritos_abandonados
ON SCHEDULE EVERY 1 HOUR
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO 
    UPDATE carritos 
    SET estado = 'abandonado' 
    WHERE estado = 'activo' 
    AND ultimo_acceso < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND total_items > 0;

-- Evento para expirar carritos viejos
DROP EVENT IF EXISTS evento_expirar_carritos;
CREATE EVENT evento_expirar_carritos
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 3 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO 
    UPDATE carritos 
    SET estado = 'expirado' 
    WHERE estado IN ('activo', 'abandonado') 
    AND ultimo_acceso < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ============================================================================
-- FIN DEL SCRIPT - FASE 6
-- ============================================================================
