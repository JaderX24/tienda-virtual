-- ============================================================================
-- TIENDA VIRTUAL - FASE 8
-- ============================================================================
-- Módulo: Notificaciones Transaccionales + Reportes y Analytics
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script implementa:
-- PARTE A - NOTIFICACIONES:
-- - Plantillas de notificación (email, SMS, push, WhatsApp)
-- - Cola de envío con reintentos
-- - Historial de notificaciones enviadas
-- - Preferencias de notificación por cliente
-- - Triggers automáticos por eventos
-- - Notificaciones en tiempo real (WebSocket ready)
--
-- PARTE B - REPORTES Y ANALYTICS:
-- - Métricas de ventas diarias/semanales/mensuales
-- - Análisis de productos (más vendidos, menos vendidos)
-- - Análisis de clientes (RFM, segmentación)
-- - Métricas de conversión de carrito
-- - Dashboard KPIs en tiempo real
-- - Reportes programados
-- ============================================================================
-- Ejecutar DESPUÉS de las Fases 1-7
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- CORRECCIÓN: Eliminar tablas de Fase 8 que ya existan (limpieza completa)
-- Esto permite re-ejecutar el script con estructura correcta
-- ============================================================================

-- Desactivar verificación de FK temporalmente para poder eliminar tablas
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas de Fase 8
DROP TABLE IF EXISTS analytics_eventos;
DROP TABLE IF EXISTS reportes_historial;
DROP TABLE IF EXISTS reportes_programados;
DROP TABLE IF EXISTS analytics_kpis;
DROP TABLE IF EXISTS analytics_conversion;
DROP TABLE IF EXISTS analytics_categorias;
DROP TABLE IF EXISTS analytics_clientes;
DROP TABLE IF EXISTS analytics_productos;
DROP TABLE IF EXISTS analytics_ventas_mensuales;
DROP TABLE IF EXISTS analytics_ventas_diarias;
DROP TABLE IF EXISTS notificaciones_eventos;
DROP TABLE IF EXISTS notificaciones_proveedores;
DROP TABLE IF EXISTS notificaciones_cliente;
DROP TABLE IF EXISTS notificaciones_cola;
DROP TABLE IF EXISTS notificaciones_plantillas;

-- Reactivar verificación de FK
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- PARTE A: SISTEMA DE NOTIFICACIONES TRANSACCIONALES
-- ============================================================================

-- ============================================================================
-- ESQUEMA: PLANTILLAS DE NOTIFICACIÓN
-- ============================================================================

CREATE TABLE notificaciones_plantillas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Categoría
    categoria ENUM(
        'pedidos',
        'pagos',
        'envios',
        'cuenta',
        'marketing',
        'sistema',
        'seguridad',
        'fidelidad'
    ) NOT NULL,
    
    -- Evento que dispara la notificación
    evento_trigger VARCHAR(100),
    
    -- Canales disponibles
    canal_email BOOLEAN NOT NULL DEFAULT TRUE,
    canal_sms BOOLEAN NOT NULL DEFAULT FALSE,
    canal_push BOOLEAN NOT NULL DEFAULT FALSE,
    canal_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    canal_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Contenido Email
    email_asunto VARCHAR(255),
    email_cuerpo_html TEXT,
    email_cuerpo_texto TEXT,
    email_remitente VARCHAR(255),
    email_responder_a VARCHAR(255),
    
    -- Contenido SMS
    sms_mensaje VARCHAR(160),
    
    -- Contenido Push
    push_titulo VARCHAR(100),
    push_cuerpo VARCHAR(255),
    push_icono VARCHAR(255),
    push_url_accion VARCHAR(500),
    
    -- Contenido WhatsApp
    whatsapp_plantilla_id VARCHAR(100),
    whatsapp_parametros JSON,
    
    -- Contenido In-App
    in_app_titulo VARCHAR(150),
    in_app_mensaje TEXT,
    in_app_tipo ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    in_app_accion_url VARCHAR(500),
    in_app_icono VARCHAR(50),
    
    -- Variables disponibles (documentación)
    variables_disponibles JSON,
    
    -- Control
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    es_obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_categoria (categoria),
    INDEX idx_evento (evento_trigger),
    INDEX idx_activa (es_activa),
    INDEX idx_empresa (empresa_id),
    CONSTRAINT fk_plantilla_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: COLA DE NOTIFICACIONES
-- ============================================================================

CREATE TABLE notificaciones_cola (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencia a plantilla
    plantilla_id INT UNSIGNED,
    plantilla_codigo VARCHAR(50),
    
    -- Destinatario
    cliente_id BIGINT UNSIGNED,
    destinatario_email VARCHAR(255),
    destinatario_telefono VARCHAR(20),
    destinatario_nombre VARCHAR(200),
    
    -- Canal de envío
    canal ENUM('email', 'sms', 'push', 'whatsapp', 'in_app') NOT NULL,
    
    -- Contenido renderizado
    asunto VARCHAR(255),
    contenido_html TEXT,
    contenido_texto TEXT,
    
    -- Datos adicionales
    datos_json JSON,
    
    -- Referencia al objeto relacionado
    referencia_tipo VARCHAR(50),
    referencia_id BIGINT UNSIGNED,
    
    -- Estado
    estado ENUM(
        'pendiente',
        'procesando',
        'enviado',
        'entregado',
        'fallido',
        'cancelado'
    ) NOT NULL DEFAULT 'pendiente',
    
    -- Programación
    programado_para DATETIME,
    
    -- Intentos
    intentos INT UNSIGNED NOT NULL DEFAULT 0,
    max_intentos INT UNSIGNED NOT NULL DEFAULT 3,
    ultimo_intento DATETIME,
    proximo_intento DATETIME,
    
    -- Resultado
    enviado_en DATETIME,
    entregado_en DATETIME,
    error_mensaje TEXT,
    error_codigo VARCHAR(50),
    
    -- Proveedor externo
    proveedor VARCHAR(50),
    proveedor_id VARCHAR(255),
    proveedor_respuesta JSON,
    
    -- Tracking
    abierto BOOLEAN NOT NULL DEFAULT FALSE,
    abierto_en DATETIME,
    abierto_veces INT UNSIGNED NOT NULL DEFAULT 0,
    clicked BOOLEAN NOT NULL DEFAULT FALSE,
    clicked_en DATETIME,
    
    -- Prioridad
    prioridad TINYINT UNSIGNED NOT NULL DEFAULT 5,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_plantilla (plantilla_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_canal (canal),
    INDEX idx_estado (estado),
    INDEX idx_programado (programado_para),
    INDEX idx_proximo (proximo_intento),
    INDEX idx_referencia (referencia_tipo, referencia_id),
    INDEX idx_prioridad_estado (prioridad, estado),
    CONSTRAINT fk_cola_plantilla 
        FOREIGN KEY (plantilla_id) REFERENCES notificaciones_plantillas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cola_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: NOTIFICACIONES IN-APP (Tiempo Real)
-- ============================================================================

CREATE TABLE notificaciones_cliente (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    
    -- Contenido
    tipo ENUM('info', 'success', 'warning', 'error', 'pedido', 'promocion', 'sistema') NOT NULL DEFAULT 'info',
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    icono VARCHAR(50),
    imagen_url VARCHAR(500),
    
    -- Acción
    accion_url VARCHAR(500),
    accion_texto VARCHAR(100),
    
    -- Referencia
    referencia_tipo VARCHAR(50),
    referencia_id BIGINT UNSIGNED,
    
    -- Estado
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    leida_en DATETIME,
    
    -- Expiración
    expira_en DATETIME,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_leida (leida),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (creado_en),
    INDEX idx_expira (expira_en),
    CONSTRAINT fk_notif_cliente_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: CONFIGURACIÓN DE PROVEEDORES
-- ============================================================================

CREATE TABLE notificaciones_proveedores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    
    -- Tipo
    tipo ENUM('email', 'sms', 'push', 'whatsapp') NOT NULL,
    
    -- Configuración (encriptada en producción)
    configuracion JSON NOT NULL,
    
    -- Límites
    limite_por_hora INT UNSIGNED,
    limite_por_dia INT UNSIGNED,
    
    -- Estado
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Estadísticas
    total_enviados BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_fallidos BIGINT UNSIGNED NOT NULL DEFAULT 0,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tipo (tipo),
    INDEX idx_activo (es_activo),
    INDEX idx_default (es_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: EVENTOS DE NOTIFICACIÓN
-- ============================================================================

CREATE TABLE notificaciones_eventos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Categoría
    categoria VARCHAR(50) NOT NULL,
    
    -- Plantilla por defecto
    plantilla_id INT UNSIGNED,
    
    -- Canales habilitados por defecto
    email_habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    sms_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
    push_habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    permite_desactivar BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_categoria (categoria),
    CONSTRAINT fk_evento_plantilla 
        FOREIGN KEY (plantilla_id) REFERENCES notificaciones_plantillas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE B: SISTEMA DE REPORTES Y ANALYTICS
-- ============================================================================

-- ============================================================================
-- ESQUEMA: MÉTRICAS DE VENTAS
-- ============================================================================

CREATE TABLE analytics_ventas_diarias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    empresa_id INT UNSIGNED,
    
    -- Pedidos
    total_pedidos INT UNSIGNED NOT NULL DEFAULT 0,
    pedidos_completados INT UNSIGNED NOT NULL DEFAULT 0,
    pedidos_cancelados INT UNSIGNED NOT NULL DEFAULT 0,
    pedidos_devueltos INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Montos
    ingresos_brutos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuentos_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    cupones_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    puntos_canjeados_valor DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    envios_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    impuestos_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ingresos_netos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Reembolsos
    reembolsos_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    reembolsos_cantidad INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Productos
    productos_vendidos INT UNSIGNED NOT NULL DEFAULT 0,
    unidades_vendidas INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Ticket promedio
    ticket_promedio DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Clientes
    clientes_unicos INT UNSIGNED NOT NULL DEFAULT 0,
    clientes_nuevos INT UNSIGNED NOT NULL DEFAULT 0,
    clientes_recurrentes INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Carritos
    carritos_creados INT UNSIGNED NOT NULL DEFAULT 0,
    carritos_abandonados INT UNSIGNED NOT NULL DEFAULT 0,
    carritos_convertidos INT UNSIGNED NOT NULL DEFAULT 0,
    tasa_conversion DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Por canal
    pedidos_web INT UNSIGNED NOT NULL DEFAULT 0,
    pedidos_mobile INT UNSIGNED NOT NULL DEFAULT 0,
    pedidos_app INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Métodos de pago
    pagos_tarjeta DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    pagos_transferencia DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    pagos_efectivo DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    pagos_otros DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_fecha_empresa (fecha, empresa_id),
    INDEX idx_fecha (fecha),
    INDEX idx_empresa (empresa_id),
    CONSTRAINT fk_ventas_diarias_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Métricas mensuales (agregadas)
CREATE TABLE analytics_ventas_mensuales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    anio SMALLINT UNSIGNED NOT NULL,
    mes TINYINT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED,
    
    -- Totales del mes
    total_pedidos INT UNSIGNED NOT NULL DEFAULT 0,
    pedidos_completados INT UNSIGNED NOT NULL DEFAULT 0,
    
    ingresos_brutos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuentos_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ingresos_netos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    productos_vendidos INT UNSIGNED NOT NULL DEFAULT 0,
    unidades_vendidas INT UNSIGNED NOT NULL DEFAULT 0,
    
    ticket_promedio DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    clientes_unicos INT UNSIGNED NOT NULL DEFAULT 0,
    clientes_nuevos INT UNSIGNED NOT NULL DEFAULT 0,
    
    tasa_conversion DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Comparación mes anterior
    variacion_ingresos DECIMAL(10,2),
    variacion_pedidos DECIMAL(10,2),
    variacion_clientes DECIMAL(10,2),
    
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_periodo_empresa (anio, mes, empresa_id),
    INDEX idx_periodo (anio, mes),
    INDEX idx_empresa (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ANALYTICS DE PRODUCTOS
-- ============================================================================

CREATE TABLE analytics_productos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    -- Ventas
    cantidad_vendida INT UNSIGNED NOT NULL DEFAULT 0,
    ingresos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    pedidos_con_producto INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Vistas
    vistas INT UNSIGNED NOT NULL DEFAULT 0,
    vistas_unicas INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Carrito
    agregado_carrito INT UNSIGNED NOT NULL DEFAULT 0,
    removido_carrito INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Wishlist
    agregado_wishlist INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Conversión
    tasa_conversion DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Devoluciones
    devoluciones INT UNSIGNED NOT NULL DEFAULT 0,
    
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_fecha_producto (fecha, producto_id),
    INDEX idx_fecha (fecha),
    INDEX idx_producto (producto_id),
    INDEX idx_cantidad (cantidad_vendida),
    CONSTRAINT fk_analytics_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ANALYTICS DE CLIENTES (Segmentación RFM)
-- ============================================================================

CREATE TABLE analytics_clientes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL UNIQUE,
    
    -- RFM (Recency, Frequency, Monetary)
    dias_desde_ultima_compra INT UNSIGNED,
    total_pedidos INT UNSIGNED NOT NULL DEFAULT 0,
    total_gastado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Scores RFM (1-5)
    score_recencia TINYINT UNSIGNED,
    score_frecuencia TINYINT UNSIGNED,
    score_monetario TINYINT UNSIGNED,
    score_rfm VARCHAR(3),
    
    -- Segmento
    segmento ENUM(
        'champions',
        'loyal_customers',
        'potential_loyalist',
        'recent_customers',
        'promising',
        'need_attention',
        'about_to_sleep',
        'at_risk',
        'cant_lose_them',
        'hibernating',
        'lost'
    ),
    
    -- Métricas adicionales
    ticket_promedio DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    primera_compra DATE,
    ultima_compra DATE,
    
    -- Engagement
    dias_como_cliente INT UNSIGNED,
    frecuencia_compra_dias DECIMAL(10,2),
    
    -- Valor del cliente
    valor_vida_cliente DECIMAL(15,2),
    prediccion_proxima_compra DATE,
    
    -- Preferencias
    categoria_favorita VARCHAR(100),
    metodo_pago_preferido VARCHAR(50),
    dia_semana_preferido TINYINT UNSIGNED,
    
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cliente (cliente_id),
    INDEX idx_segmento (segmento),
    INDEX idx_score_rfm (score_rfm),
    INDEX idx_ultima_compra (ultima_compra),
    CONSTRAINT fk_analytics_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ANALYTICS DE CATEGORÍAS
-- ============================================================================

CREATE TABLE analytics_categorias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    categoria_id INT UNSIGNED NOT NULL,
    
    -- Métricas
    productos_vendidos INT UNSIGNED NOT NULL DEFAULT 0,
    unidades_vendidas INT UNSIGNED NOT NULL DEFAULT 0,
    ingresos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Vistas
    vistas INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Participación
    porcentaje_ventas DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_fecha_categoria (fecha, categoria_id),
    INDEX idx_fecha (fecha),
    INDEX idx_categoria (categoria_id),
    CONSTRAINT fk_analytics_categoria 
        FOREIGN KEY (categoria_id) REFERENCES catalogo_categorias(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: MÉTRICAS DE CONVERSIÓN
-- ============================================================================

CREATE TABLE analytics_conversion (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    empresa_id INT UNSIGNED,
    
    -- Embudo de conversión
    visitantes_unicos INT UNSIGNED NOT NULL DEFAULT 0,
    visitantes_con_busqueda INT UNSIGNED NOT NULL DEFAULT 0,
    visitantes_vieron_producto INT UNSIGNED NOT NULL DEFAULT 0,
    visitantes_agregaron_carrito INT UNSIGNED NOT NULL DEFAULT 0,
    visitantes_iniciaron_checkout INT UNSIGNED NOT NULL DEFAULT 0,
    visitantes_completaron_compra INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Tasas de conversión
    tasa_busqueda DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tasa_vista_producto DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tasa_agregar_carrito DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tasa_checkout DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tasa_compra DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Abandono
    carritos_abandonados INT UNSIGNED NOT NULL DEFAULT 0,
    valor_carritos_abandonados DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    checkout_abandonados INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Por dispositivo
    conversion_desktop DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    conversion_mobile DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    conversion_tablet DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_fecha_empresa (fecha, empresa_id),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: KPIs DEL DASHBOARD
-- ============================================================================

CREATE TABLE analytics_kpis (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Valor actual
    valor_actual DECIMAL(15,4) NOT NULL DEFAULT 0,
    valor_anterior DECIMAL(15,4),
    variacion_porcentaje DECIMAL(10,2),
    
    -- Formato
    formato ENUM('numero', 'moneda', 'porcentaje', 'entero') DEFAULT 'numero',
    decimales TINYINT UNSIGNED DEFAULT 2,
    prefijo VARCHAR(10),
    sufijo VARCHAR(10),
    
    -- Meta
    meta DECIMAL(15,4),
    progreso_meta DECIMAL(5,2),
    
    -- Período
    periodo ENUM('tiempo_real', 'hoy', 'semana', 'mes', 'anio') DEFAULT 'hoy',
    
    -- Tendencia
    tendencia ENUM('subiendo', 'bajando', 'estable'),
    
    -- Visualización
    color VARCHAR(7) DEFAULT '#0d6efd',
    icono VARCHAR(50),
    orden INT UNSIGNED DEFAULT 100,
    
    -- Control
    es_visible BOOLEAN NOT NULL DEFAULT TRUE,
    
    ultima_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_periodo (periodo),
    INDEX idx_visible (es_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: REPORTES PROGRAMADOS
-- ============================================================================

CREATE TABLE reportes_programados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Tipo de reporte
    tipo ENUM(
        'ventas_diario',
        'ventas_semanal',
        'ventas_mensual',
        'productos_vendidos',
        'productos_stock_bajo',
        'clientes_nuevos',
        'clientes_inactivos',
        'pedidos_pendientes',
        'devoluciones',
        'cupones_uso',
        'rendimiento_categorias',
        'personalizado'
    ) NOT NULL,
    
    -- Programación
    frecuencia ENUM('diario', 'semanal', 'mensual', 'bajo_demanda') NOT NULL,
    dia_semana TINYINT UNSIGNED,
    dia_mes TINYINT UNSIGNED,
    hora_ejecucion TIME DEFAULT '08:00:00',
    
    -- Formato de salida
    formato ENUM('pdf', 'excel', 'csv', 'html') NOT NULL DEFAULT 'excel',
    
    -- Destinatarios
    enviar_email BOOLEAN NOT NULL DEFAULT TRUE,
    destinatarios_email JSON,
    
    -- Filtros y parámetros
    parametros JSON,
    
    -- Estado
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_ejecucion DATETIME,
    proxima_ejecucion DATETIME,
    
    -- Auditoría
    creado_por INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tipo (tipo),
    INDEX idx_frecuencia (frecuencia),
    INDEX idx_proxima (proxima_ejecucion),
    INDEX idx_activo (es_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de reportes generados
CREATE TABLE reportes_historial (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporte_programado_id INT UNSIGNED,
    
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    
    -- Período del reporte
    fecha_inicio DATE,
    fecha_fin DATE,
    
    -- Archivo generado
    archivo_url VARCHAR(500),
    archivo_tamano INT UNSIGNED,
    formato VARCHAR(10),
    
    -- Estado
    estado ENUM('generando', 'completado', 'fallido') NOT NULL DEFAULT 'generando',
    error_mensaje TEXT,
    
    -- Tiempo de generación
    tiempo_generacion_segundos INT UNSIGNED,
    
    -- Distribución
    enviado BOOLEAN NOT NULL DEFAULT FALSE,
    enviado_a JSON,
    enviado_en DATETIME,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_reporte (reporte_programado_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (creado_en),
    INDEX idx_estado (estado),
    CONSTRAINT fk_historial_reporte 
        FOREIGN KEY (reporte_programado_id) REFERENCES reportes_programados(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: TRACKING DE EVENTOS (Para Analytics)
-- ============================================================================

CREATE TABLE analytics_eventos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Sesión
    sesion_id VARCHAR(100),
    cliente_id BIGINT UNSIGNED,
    
    -- Evento
    categoria VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    etiqueta VARCHAR(255),
    valor DECIMAL(15,2),
    
    -- Contexto
    pagina_url VARCHAR(500),
    pagina_titulo VARCHAR(255),
    referrer VARCHAR(500),
    
    -- Producto relacionado
    producto_id BIGINT UNSIGNED,
    categoria_id INT UNSIGNED,
    
    -- Dispositivo
    dispositivo VARCHAR(50),
    navegador VARCHAR(100),
    sistema_operativo VARCHAR(100),
    es_mobile BOOLEAN,
    
    -- Ubicación
    ip_address VARCHAR(45),
    pais VARCHAR(100),
    ciudad VARCHAR(100),
    
    -- UTM
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_sesion (sesion_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_categoria_accion (categoria, accion),
    INDEX idx_producto (producto_id),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_evento_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_evento_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NUEVOS MÓDULOS Y PERMISOS
-- ============================================================================

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('notificaciones_admin', 'Notificaciones', 'Gestión de notificaciones', 'bi-bell', '/admin/notificaciones', 30, TRUE),
('reportes', 'Reportes', 'Reportes y análisis', 'bi-graph-up', '/admin/reportes', 31, TRUE),
('analytics', 'Analytics', 'Dashboard analítico', 'bi-bar-chart-line', '/admin/analytics', 32, TRUE);

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'notificaciones_admin.ver', 'Ver notificaciones', id, 'ver' FROM admin_modulos WHERE codigo = 'notificaciones_admin'
UNION ALL SELECT 'notificaciones_admin.crear', 'Crear notificaciones', id, 'crear' FROM admin_modulos WHERE codigo = 'notificaciones_admin'
UNION ALL SELECT 'notificaciones_admin.editar_plantillas', 'Editar plantillas', id, 'editar' FROM admin_modulos WHERE codigo = 'notificaciones_admin'
UNION ALL SELECT 'notificaciones_admin.configurar', 'Configurar proveedores', id, 'editar' FROM admin_modulos WHERE codigo = 'notificaciones_admin';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'reportes.ver', 'Ver reportes', id, 'ver' FROM admin_modulos WHERE codigo = 'reportes'
UNION ALL SELECT 'reportes.crear', 'Crear reportes', id, 'crear' FROM admin_modulos WHERE codigo = 'reportes'
UNION ALL SELECT 'reportes.exportar', 'Exportar reportes', id, 'exportar' FROM admin_modulos WHERE codigo = 'reportes'
UNION ALL SELECT 'reportes.programar', 'Programar reportes', id, 'editar' FROM admin_modulos WHERE codigo = 'reportes';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'analytics.ver', 'Ver analytics', id, 'ver' FROM admin_modulos WHERE codigo = 'analytics'
UNION ALL SELECT 'analytics.exportar', 'Exportar datos', id, 'exportar' FROM admin_modulos WHERE codigo = 'analytics';

INSERT IGNORE INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos 
WHERE codigo LIKE 'notificaciones_admin%' 
   OR codigo LIKE 'reportes%' 
   OR codigo LIKE 'analytics%';

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista del dashboard principal
CREATE OR REPLACE VIEW vista_dashboard_hoy AS
SELECT 
    (SELECT COUNT(*) FROM pedidos WHERE DATE(creado_en) = CURDATE()) AS pedidos_hoy,
    (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE DATE(creado_en) = CURDATE() AND estado NOT IN ('cancelado')) AS ventas_hoy,
    (SELECT COUNT(DISTINCT cliente_id) FROM pedidos WHERE DATE(creado_en) = CURDATE()) AS clientes_hoy,
    (SELECT COUNT(*) FROM clientes WHERE DATE(creado_en) = CURDATE()) AS clientes_nuevos_hoy,
    (SELECT COUNT(*) FROM pedidos WHERE estado IN ('pendiente_pago', 'pagado', 'confirmado')) AS pedidos_pendientes,
    (SELECT COUNT(*) FROM carritos WHERE estado = 'activo' AND total_items > 0) AS carritos_activos,
    (SELECT COALESCE(SUM(total), 0) FROM carritos WHERE estado = 'abandonado' AND DATE(actualizado_en) = CURDATE()) AS valor_abandonados_hoy,
    (SELECT COUNT(*) FROM resenas WHERE estado = 'pendiente') AS resenas_pendientes,
    (SELECT AVG(calificacion) FROM resenas WHERE estado IN ('aprobada', 'destacada') AND DATE(creado_en) = CURDATE()) AS calificacion_promedio_hoy;

-- Vista de ventas por período
CREATE OR REPLACE VIEW vista_ventas_periodo AS
SELECT 
    'Hoy' AS periodo,
    COUNT(*) AS pedidos,
    COALESCE(SUM(total), 0) AS ingresos,
    COUNT(DISTINCT cliente_id) AS clientes
FROM pedidos
WHERE DATE(creado_en) = CURDATE() AND estado NOT IN ('cancelado')
UNION ALL
SELECT 
    'Ayer' AS periodo,
    COUNT(*) AS pedidos,
    COALESCE(SUM(total), 0) AS ingresos,
    COUNT(DISTINCT cliente_id) AS clientes
FROM pedidos
WHERE DATE(creado_en) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND estado NOT IN ('cancelado')
UNION ALL
SELECT 
    'Esta Semana' AS periodo,
    COUNT(*) AS pedidos,
    COALESCE(SUM(total), 0) AS ingresos,
    COUNT(DISTINCT cliente_id) AS clientes
FROM pedidos
WHERE YEARWEEK(creado_en) = YEARWEEK(CURDATE()) AND estado NOT IN ('cancelado')
UNION ALL
SELECT 
    'Este Mes' AS periodo,
    COUNT(*) AS pedidos,
    COALESCE(SUM(total), 0) AS ingresos,
    COUNT(DISTINCT cliente_id) AS clientes
FROM pedidos
WHERE YEAR(creado_en) = YEAR(CURDATE()) AND MONTH(creado_en) = MONTH(CURDATE()) AND estado NOT IN ('cancelado');

-- Vista de productos top vendidos
CREATE OR REPLACE VIEW vista_productos_top_ventas AS
SELECT 
    pi.producto_id,
    MAX(pi.nombre_producto) AS producto,
    MAX(pi.sku) AS sku,
    SUM(pi.cantidad) AS unidades_vendidas,
    SUM(pi.total) AS ingresos,
    COUNT(DISTINCT pi.pedido_id) AS pedidos
FROM pedidos_items pi
JOIN pedidos p ON pi.pedido_id = p.id
WHERE p.estado NOT IN ('cancelado', 'devuelto', 'reembolsado')
AND p.creado_en >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY pi.producto_id
ORDER BY unidades_vendidas DESC
LIMIT 20;

-- Vista de notificaciones pendientes
CREATE OR REPLACE VIEW vista_notificaciones_pendientes AS
SELECT 
    nc.id,
    nc.canal,
    nc.destinatario_email,
    nc.destinatario_nombre,
    nc.asunto,
    nc.estado,
    nc.intentos,
    nc.max_intentos,
    nc.proximo_intento,
    nc.error_mensaje,
    nc.creado_en,
    TIMESTAMPDIFF(MINUTE, nc.creado_en, NOW()) AS minutos_en_cola
FROM notificaciones_cola nc
WHERE nc.estado IN ('pendiente', 'procesando')
ORDER BY nc.prioridad DESC, nc.creado_en ASC;

-- Vista de clientes por segmento
CREATE OR REPLACE VIEW vista_clientes_segmentos AS
SELECT 
    segmento,
    COUNT(*) AS total_clientes,
    ROUND(AVG(total_gastado), 2) AS gasto_promedio,
    ROUND(AVG(total_pedidos), 1) AS pedidos_promedio,
    ROUND(AVG(dias_desde_ultima_compra), 0) AS dias_promedio_sin_comprar
FROM analytics_clientes
WHERE segmento IS NOT NULL
GROUP BY segmento
ORDER BY gasto_promedio DESC;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Eliminar procedimientos si existen
DROP PROCEDURE IF EXISTS sp_encolar_notificacion //
DROP PROCEDURE IF EXISTS sp_notificar_evento_pedido //
DROP PROCEDURE IF EXISTS sp_calcular_metricas_diarias //
DROP PROCEDURE IF EXISTS sp_calcular_rfm_clientes //
DROP PROCEDURE IF EXISTS sp_actualizar_kpis //
DROP PROCEDURE IF EXISTS sp_procesar_cola_notificaciones //
DROP PROCEDURE IF EXISTS sp_marcar_notificacion_enviada //
DROP PROCEDURE IF EXISTS sp_marcar_notificacion_fallida //

-- Encolar notificación
CREATE PROCEDURE sp_encolar_notificacion(
    IN p_plantilla_codigo VARCHAR(50),
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_canal VARCHAR(20),
    IN p_datos JSON,
    IN p_referencia_tipo VARCHAR(50),
    IN p_referencia_id BIGINT UNSIGNED,
    IN p_prioridad TINYINT
)
BEGIN
    DECLARE v_plantilla_id INT UNSIGNED;
    DECLARE v_email VARCHAR(255);
    DECLARE v_telefono VARCHAR(20);
    DECLARE v_nombre VARCHAR(200);
    DECLARE v_asunto VARCHAR(255);
    DECLARE v_contenido_html TEXT;
    DECLARE v_contenido_texto TEXT;
    
    SELECT id, email_asunto, email_cuerpo_html, email_cuerpo_texto
    INTO v_plantilla_id, v_asunto, v_contenido_html, v_contenido_texto
    FROM notificaciones_plantillas
    WHERE codigo = p_plantilla_codigo AND es_activa = TRUE;
    
    IF v_plantilla_id IS NOT NULL THEN
        SELECT correo, telefono, nombre_completo
        INTO v_email, v_telefono, v_nombre
        FROM clientes WHERE id = p_cliente_id;
        
        INSERT INTO notificaciones_cola (
            plantilla_id, plantilla_codigo, cliente_id,
            destinatario_email, destinatario_telefono, destinatario_nombre,
            canal, asunto, contenido_html, contenido_texto,
            datos_json, referencia_tipo, referencia_id,
            prioridad, programado_para
        ) VALUES (
            v_plantilla_id, p_plantilla_codigo, p_cliente_id,
            v_email, v_telefono, v_nombre,
            p_canal, v_asunto, v_contenido_html, v_contenido_texto,
            p_datos, p_referencia_tipo, p_referencia_id,
            COALESCE(p_prioridad, 5), NOW()
        );
        
        SELECT LAST_INSERT_ID() AS notificacion_id, 'ok' AS resultado;
    ELSE
        SELECT NULL AS notificacion_id, 'plantilla_no_encontrada' AS resultado;
    END IF;
END //

-- Notificar evento de pedido
CREATE PROCEDURE sp_notificar_evento_pedido(
    IN p_pedido_id BIGINT UNSIGNED,
    IN p_evento VARCHAR(50)
)
BEGIN
    DECLARE v_cliente_id BIGINT UNSIGNED;
    DECLARE v_numero_pedido VARCHAR(30);
    DECLARE v_total DECIMAL(15,2);
    DECLARE v_plantilla VARCHAR(50);
    DECLARE v_datos JSON;
    
    SELECT cliente_id, numero_pedido, total
    INTO v_cliente_id, v_numero_pedido, v_total
    FROM pedidos WHERE id = p_pedido_id;
    
    SET v_plantilla = CASE p_evento
        WHEN 'creado' THEN 'pedido_confirmacion'
        WHEN 'pagado' THEN 'pedido_pagado'
        WHEN 'enviado' THEN 'pedido_enviado'
        WHEN 'entregado' THEN 'pedido_entregado'
        WHEN 'cancelado' THEN 'pedido_cancelado'
        ELSE NULL
    END;
    
    IF v_plantilla IS NOT NULL THEN
        SET v_datos = JSON_OBJECT(
            'pedido_id', p_pedido_id,
            'numero_pedido', v_numero_pedido,
            'total', v_total
        );
        
        CALL sp_encolar_notificacion(
            v_plantilla, v_cliente_id, 'email',
            v_datos, 'pedido', p_pedido_id, 3
        );
        
        INSERT INTO notificaciones_cliente (
            cliente_id, tipo, titulo, mensaje,
            accion_url, referencia_tipo, referencia_id
        ) VALUES (
            v_cliente_id, 'pedido',
            CONCAT('Pedido ', v_numero_pedido),
            CASE p_evento
                WHEN 'creado' THEN 'Tu pedido ha sido recibido'
                WHEN 'pagado' THEN 'Pago confirmado'
                WHEN 'enviado' THEN 'Tu pedido está en camino'
                WHEN 'entregado' THEN 'Pedido entregado'
                WHEN 'cancelado' THEN 'Pedido cancelado'
            END,
            CONCAT('/cuenta/pedidos/', p_pedido_id),
            'pedido', p_pedido_id
        );
    END IF;
END //

-- Calcular métricas diarias de ventas
CREATE PROCEDURE sp_calcular_metricas_diarias(IN p_fecha DATE)
BEGIN
    DECLARE v_fecha DATE;
    SET v_fecha = COALESCE(p_fecha, CURDATE());
    
    INSERT INTO analytics_ventas_diarias (
        fecha, total_pedidos, pedidos_completados, pedidos_cancelados,
        ingresos_brutos, descuentos_total, impuestos_total, ingresos_netos,
        productos_vendidos, unidades_vendidas, ticket_promedio,
        clientes_unicos, clientes_nuevos, clientes_recurrentes,
        carritos_creados, carritos_abandonados, carritos_convertidos, tasa_conversion
    )
    SELECT 
        v_fecha,
        COUNT(DISTINCT p.id),
        COUNT(DISTINCT CASE WHEN p.estado = 'entregado' THEN p.id END),
        COUNT(DISTINCT CASE WHEN p.estado = 'cancelado' THEN p.id END),
        COALESCE(SUM(p.subtotal), 0),
        COALESCE(SUM(p.descuento_total), 0),
        COALESCE(SUM(p.impuestos), 0),
        COALESCE(SUM(p.total), 0),
        COUNT(DISTINCT pi.producto_id),
        COALESCE(SUM(pi.cantidad), 0),
        COALESCE(AVG(p.total), 0),
        COUNT(DISTINCT p.cliente_id),
        (SELECT COUNT(*) FROM clientes WHERE DATE(creado_en) = v_fecha),
        COUNT(DISTINCT CASE WHEN c.total_pedidos > 1 THEN p.cliente_id END),
        (SELECT COUNT(*) FROM carritos WHERE DATE(creado_en) = v_fecha),
        (SELECT COUNT(*) FROM carritos WHERE DATE(actualizado_en) = v_fecha AND estado = 'abandonado'),
        (SELECT COUNT(*) FROM carritos WHERE DATE(convertido_en) = v_fecha),
        CASE 
            WHEN (SELECT COUNT(*) FROM carritos WHERE DATE(creado_en) = v_fecha) > 0 
            THEN ((SELECT COUNT(*) FROM carritos WHERE DATE(convertido_en) = v_fecha) / 
                  (SELECT COUNT(*) FROM carritos WHERE DATE(creado_en) = v_fecha)) * 100
            ELSE 0
        END
    FROM pedidos p
    LEFT JOIN pedidos_items pi ON p.id = pi.pedido_id
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE DATE(p.creado_en) = v_fecha
    AND p.estado NOT IN ('cancelado')
    ON DUPLICATE KEY UPDATE
        total_pedidos = VALUES(total_pedidos),
        pedidos_completados = VALUES(pedidos_completados),
        pedidos_cancelados = VALUES(pedidos_cancelados),
        ingresos_brutos = VALUES(ingresos_brutos),
        descuentos_total = VALUES(descuentos_total),
        impuestos_total = VALUES(impuestos_total),
        ingresos_netos = VALUES(ingresos_netos),
        productos_vendidos = VALUES(productos_vendidos),
        unidades_vendidas = VALUES(unidades_vendidas),
        ticket_promedio = VALUES(ticket_promedio),
        clientes_unicos = VALUES(clientes_unicos),
        clientes_nuevos = VALUES(clientes_nuevos),
        clientes_recurrentes = VALUES(clientes_recurrentes),
        carritos_creados = VALUES(carritos_creados),
        carritos_abandonados = VALUES(carritos_abandonados),
        carritos_convertidos = VALUES(carritos_convertidos),
        tasa_conversion = VALUES(tasa_conversion),
        actualizado_en = NOW();
END //

-- Calcular segmentación RFM de clientes
CREATE PROCEDURE sp_calcular_rfm_clientes()
BEGIN
    DECLARE v_max_recencia INT;
    DECLARE v_max_frecuencia INT;
    DECLARE v_max_monetario DECIMAL(15,2);
    
    SELECT 
        MAX(DATEDIFF(CURDATE(), ultimo_pedido_fecha)),
        MAX(total_pedidos),
        MAX(total_gastado)
    INTO v_max_recencia, v_max_frecuencia, v_max_monetario
    FROM clientes
    WHERE total_pedidos > 0;
    
    INSERT INTO analytics_clientes (
        cliente_id, dias_desde_ultima_compra, total_pedidos, total_gastado,
        score_recencia, score_frecuencia, score_monetario, score_rfm,
        ticket_promedio, primera_compra, ultima_compra, dias_como_cliente
    )
    SELECT 
        c.id,
        DATEDIFF(CURDATE(), c.ultimo_pedido_fecha),
        c.total_pedidos,
        c.total_gastado,
        CASE 
            WHEN DATEDIFF(CURDATE(), c.ultimo_pedido_fecha) <= v_max_recencia * 0.2 THEN 5
            WHEN DATEDIFF(CURDATE(), c.ultimo_pedido_fecha) <= v_max_recencia * 0.4 THEN 4
            WHEN DATEDIFF(CURDATE(), c.ultimo_pedido_fecha) <= v_max_recencia * 0.6 THEN 3
            WHEN DATEDIFF(CURDATE(), c.ultimo_pedido_fecha) <= v_max_recencia * 0.8 THEN 2
            ELSE 1
        END,
        CASE 
            WHEN c.total_pedidos >= v_max_frecuencia * 0.8 THEN 5
            WHEN c.total_pedidos >= v_max_frecuencia * 0.6 THEN 4
            WHEN c.total_pedidos >= v_max_frecuencia * 0.4 THEN 3
            WHEN c.total_pedidos >= v_max_frecuencia * 0.2 THEN 2
            ELSE 1
        END,
        CASE 
            WHEN c.total_gastado >= v_max_monetario * 0.8 THEN 5
            WHEN c.total_gastado >= v_max_monetario * 0.6 THEN 4
            WHEN c.total_gastado >= v_max_monetario * 0.4 THEN 3
            WHEN c.total_gastado >= v_max_monetario * 0.2 THEN 2
            ELSE 1
        END,
        NULL,
        c.ticket_promedio,
        (SELECT MIN(DATE(creado_en)) FROM pedidos WHERE cliente_id = c.id AND estado = 'entregado'),
        c.ultimo_pedido_fecha,
        DATEDIFF(CURDATE(), c.creado_en)
    FROM clientes c
    WHERE c.total_pedidos > 0
    ON DUPLICATE KEY UPDATE
        dias_desde_ultima_compra = VALUES(dias_desde_ultima_compra),
        total_pedidos = VALUES(total_pedidos),
        total_gastado = VALUES(total_gastado),
        score_recencia = VALUES(score_recencia),
        score_frecuencia = VALUES(score_frecuencia),
        score_monetario = VALUES(score_monetario),
        ticket_promedio = VALUES(ticket_promedio),
        ultima_compra = VALUES(ultima_compra),
        dias_como_cliente = VALUES(dias_como_cliente),
        actualizado_en = NOW();
    
    UPDATE analytics_clientes
    SET 
        score_rfm = CONCAT(score_recencia, score_frecuencia, score_monetario),
        segmento = CASE
            WHEN score_recencia >= 4 AND score_frecuencia >= 4 AND score_monetario >= 4 THEN 'champions'
            WHEN score_recencia >= 3 AND score_frecuencia >= 3 AND score_monetario >= 3 THEN 'loyal_customers'
            WHEN score_recencia >= 4 AND score_frecuencia <= 2 AND score_monetario <= 2 THEN 'recent_customers'
            WHEN score_recencia >= 3 AND score_frecuencia >= 1 AND score_monetario >= 2 THEN 'potential_loyalist'
            WHEN score_recencia >= 3 AND score_frecuencia <= 2 AND score_monetario <= 2 THEN 'promising'
            WHEN score_recencia = 3 AND score_frecuencia = 3 THEN 'need_attention'
            WHEN score_recencia = 2 AND score_frecuencia >= 2 THEN 'about_to_sleep'
            WHEN score_recencia <= 2 AND score_frecuencia >= 3 AND score_monetario >= 3 THEN 'at_risk'
            WHEN score_recencia = 1 AND score_frecuencia >= 4 AND score_monetario >= 4 THEN 'cant_lose_them'
            WHEN score_recencia <= 2 AND score_frecuencia <= 2 AND score_monetario >= 2 THEN 'hibernating'
            ELSE 'lost'
        END;
END //

-- Actualizar KPIs del dashboard
CREATE PROCEDURE sp_actualizar_kpis()
BEGIN
    DECLARE v_ventas_hoy DECIMAL(15,2);
    DECLARE v_ventas_ayer DECIMAL(15,2);
    DECLARE v_pedidos_hoy INT;
    DECLARE v_pedidos_ayer INT;
    
    SELECT COALESCE(SUM(total), 0) INTO v_ventas_hoy
    FROM pedidos WHERE DATE(creado_en) = CURDATE() AND estado NOT IN ('cancelado');
    
    SELECT COALESCE(SUM(total), 0) INTO v_ventas_ayer
    FROM pedidos WHERE DATE(creado_en) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND estado NOT IN ('cancelado');
    
    SELECT COUNT(*) INTO v_pedidos_hoy
    FROM pedidos WHERE DATE(creado_en) = CURDATE();
    
    SELECT COUNT(*) INTO v_pedidos_ayer
    FROM pedidos WHERE DATE(creado_en) = DATE_SUB(CURDATE(), INTERVAL 1 DAY);
    
    INSERT INTO analytics_kpis (codigo, nombre, valor_actual, valor_anterior, variacion_porcentaje, formato, periodo, icono, orden)
    VALUES 
        ('ventas_hoy', 'Ventas Hoy', v_ventas_hoy, v_ventas_ayer, 
         IF(v_ventas_ayer > 0, ((v_ventas_hoy - v_ventas_ayer) / v_ventas_ayer) * 100, 0),
         'moneda', 'hoy', 'bi-currency-dollar', 1),
        ('pedidos_hoy', 'Pedidos Hoy', v_pedidos_hoy, v_pedidos_ayer,
         IF(v_pedidos_ayer > 0, ((v_pedidos_hoy - v_pedidos_ayer) / v_pedidos_ayer) * 100, 0),
         'entero', 'hoy', 'bi-bag-check', 2)
    ON DUPLICATE KEY UPDATE
        valor_anterior = valor_actual,
        valor_actual = VALUES(valor_actual),
        variacion_porcentaje = VALUES(variacion_porcentaje),
        tendencia = CASE 
            WHEN VALUES(valor_actual) > valor_actual THEN 'subiendo'
            WHEN VALUES(valor_actual) < valor_actual THEN 'bajando'
            ELSE 'estable'
        END,
        ultima_actualizacion = NOW();
END //

-- Procesar cola de notificaciones
CREATE PROCEDURE sp_procesar_cola_notificaciones(IN p_limite INT)
BEGIN
    DECLARE v_limite INT DEFAULT COALESCE(p_limite, 100);
    
    UPDATE notificaciones_cola
    SET estado = 'procesando', ultimo_intento = NOW()
    WHERE estado = 'pendiente'
    AND (programado_para IS NULL OR programado_para <= NOW())
    AND intentos < max_intentos
    ORDER BY prioridad DESC, creado_en ASC
    LIMIT v_limite;
    
    SELECT 
        id, plantilla_codigo, canal,
        destinatario_email, destinatario_telefono, destinatario_nombre,
        asunto, contenido_html, contenido_texto,
        datos_json, referencia_tipo, referencia_id
    FROM notificaciones_cola
    WHERE estado = 'procesando'
    ORDER BY prioridad DESC, creado_en ASC;
END //

-- Marcar notificación como enviada
CREATE PROCEDURE sp_marcar_notificacion_enviada(
    IN p_notificacion_id BIGINT UNSIGNED,
    IN p_proveedor VARCHAR(50),
    IN p_proveedor_id VARCHAR(255),
    IN p_respuesta JSON
)
BEGIN
    UPDATE notificaciones_cola
    SET 
        estado = 'enviado',
        enviado_en = NOW(),
        proveedor = p_proveedor,
        proveedor_id = p_proveedor_id,
        proveedor_respuesta = p_respuesta
    WHERE id = p_notificacion_id;
    
    UPDATE notificaciones_proveedores
    SET total_enviados = total_enviados + 1
    WHERE codigo = p_proveedor;
END //

-- Marcar notificación como fallida
CREATE PROCEDURE sp_marcar_notificacion_fallida(
    IN p_notificacion_id BIGINT UNSIGNED,
    IN p_error_codigo VARCHAR(50),
    IN p_error_mensaje TEXT
)
BEGIN
    DECLARE v_intentos INT;
    DECLARE v_max_intentos INT;
    
    SELECT intentos, max_intentos INTO v_intentos, v_max_intentos
    FROM notificaciones_cola WHERE id = p_notificacion_id;
    
    UPDATE notificaciones_cola
    SET 
        estado = IF(v_intentos + 1 >= v_max_intentos, 'fallido', 'pendiente'),
        intentos = intentos + 1,
        error_codigo = p_error_codigo,
        error_mensaje = p_error_mensaje,
        proximo_intento = IF(v_intentos + 1 < v_max_intentos, 
            DATE_ADD(NOW(), INTERVAL POW(2, v_intentos + 1) MINUTE), NULL)
    WHERE id = p_notificacion_id;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Eliminar triggers si existen
DROP TRIGGER IF EXISTS trg_pedido_notificar_estado;
DROP TRIGGER IF EXISTS trg_producto_visto;

DELIMITER //

-- Trigger para notificar cambio de estado de pedido
CREATE TRIGGER trg_pedido_notificar_estado
AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF NEW.estado != OLD.estado THEN
        CALL sp_notificar_evento_pedido(NEW.id, NEW.estado);
    END IF;
END //

-- Trigger para registrar evento de vista de producto
CREATE TRIGGER trg_producto_visto
AFTER INSERT ON clientes_productos_vistos
FOR EACH ROW
BEGIN
    INSERT INTO analytics_eventos (
        cliente_id, categoria, accion, producto_id, creado_en
    ) VALUES (
        NEW.cliente_id, 'producto', 'vista', NEW.producto_id, NOW()
    );
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Plantillas de notificación por defecto
INSERT IGNORE INTO notificaciones_plantillas (codigo, nombre, categoria, evento_trigger, canal_email, canal_in_app, email_asunto, email_cuerpo_html, email_cuerpo_texto, in_app_titulo, in_app_mensaje, variables_disponibles, es_activa, es_obligatoria, prioridad) VALUES
('pedido_confirmacion', 'Confirmación de Pedido', 'pedidos', 'pedido.creado', TRUE, TRUE,
 'Tu pedido {{numero_pedido}} ha sido recibido',
 '<h1>¡Gracias por tu compra!</h1><p>Tu pedido <strong>{{numero_pedido}}</strong> ha sido recibido.</p><p>Total: L {{total}}</p>',
 'Gracias por tu compra. Tu pedido {{numero_pedido}} ha sido recibido. Total: L {{total}}',
 'Pedido Recibido',
 'Tu pedido {{numero_pedido}} ha sido recibido',
 '["numero_pedido", "total", "cliente_nombre", "items"]', TRUE, TRUE, 'alta'),

('pedido_pagado', 'Pago Confirmado', 'pedidos', 'pedido.pagado', TRUE, TRUE,
 'Pago confirmado - Pedido {{numero_pedido}}',
 '<h1>Pago Confirmado</h1><p>Hemos recibido el pago de tu pedido <strong>{{numero_pedido}}</strong>.</p>',
 'Pago confirmado para el pedido {{numero_pedido}}.',
 'Pago Confirmado',
 'El pago de tu pedido {{numero_pedido}} ha sido confirmado',
 '["numero_pedido", "total", "metodo_pago"]', TRUE, TRUE, 'alta'),

('pedido_enviado', 'Pedido Enviado', 'pedidos', 'pedido.enviado', TRUE, TRUE,
 'Tu pedido {{numero_pedido}} está en camino',
 '<h1>¡Tu pedido está en camino!</h1><p>Tu pedido <strong>{{numero_pedido}}</strong> ha sido enviado.</p><p>Número de guía: {{numero_guia}}</p>',
 'Tu pedido {{numero_pedido}} ha sido enviado. Guía: {{numero_guia}}',
 'Pedido Enviado',
 'Tu pedido {{numero_pedido}} está en camino',
 '["numero_pedido", "numero_guia", "transportista", "url_tracking"]', TRUE, TRUE, 'alta'),

('pedido_entregado', 'Pedido Entregado', 'pedidos', 'pedido.entregado', TRUE, TRUE,
 'Tu pedido {{numero_pedido}} ha sido entregado',
 '<h1>¡Pedido Entregado!</h1><p>Tu pedido <strong>{{numero_pedido}}</strong> ha sido entregado.</p><p>¡Esperamos que disfrutes tu compra!</p>',
 'Tu pedido {{numero_pedido}} ha sido entregado. ¡Gracias por tu compra!',
 'Pedido Entregado',
 'Tu pedido {{numero_pedido}} ha sido entregado',
 '["numero_pedido"]', TRUE, FALSE, 'normal'),

('bienvenida', 'Bienvenida', 'cuenta', 'cliente.registro', TRUE, TRUE,
 '¡Bienvenido a TiendaVirtual, {{nombre}}!',
 '<h1>¡Bienvenido!</h1><p>Hola {{nombre}}, gracias por registrarte en TiendaVirtual.</p><p>Has ganado {{puntos_bienvenida}} puntos de bienvenida.</p>',
 'Hola {{nombre}}, bienvenido a TiendaVirtual. Has ganado {{puntos_bienvenida}} puntos de bienvenida.',
 '¡Bienvenido!',
 'Gracias por unirte a TiendaVirtual',
 '["nombre", "correo", "puntos_bienvenida"]', TRUE, TRUE, 'normal'),

('recuperar_contrasena', 'Recuperar Contraseña', 'seguridad', 'cuenta.recuperar_contrasena', TRUE, FALSE,
 'Recupera tu contraseña',
 '<h1>Recuperar Contraseña</h1><p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><p><a href="{{url_reset}}">Restablecer Contraseña</a></p><p>Este enlace expira en {{expiracion_minutos}} minutos.</p>',
 'Para restablecer tu contraseña, visita: {{url_reset}}. Expira en {{expiracion_minutos}} minutos.',
 NULL, NULL,
 '["url_reset", "expiracion_minutos"]', TRUE, TRUE, 'urgente'),

('carrito_abandonado', 'Carrito Abandonado', 'marketing', 'carrito.abandonado', TRUE, FALSE,
 '¿Olvidaste algo? Tu carrito te espera',
 '<h1>Tu carrito te extraña</h1><p>Dejaste productos en tu carrito. ¡Completa tu compra antes de que se agoten!</p>',
 'Dejaste productos en tu carrito. Completa tu compra en: {{url_carrito}}',
 'Carrito Abandonado',
 'Tienes productos esperándote en tu carrito',
 '["url_carrito", "items", "total"]', TRUE, FALSE, 'baja'),

('puntos_por_vencer', 'Puntos por Vencer', 'fidelidad', 'puntos.por_vencer', TRUE, TRUE,
 'Tus puntos están por vencer',
 '<h1>¡No pierdas tus puntos!</h1><p>Tienes {{puntos}} puntos que vencen el {{fecha_vencimiento}}.</p><p>¡Úsalos antes de que expiren!</p>',
 'Tienes {{puntos}} puntos que vencen el {{fecha_vencimiento}}. ¡Úsalos!',
 'Puntos por Vencer',
 'Tienes {{puntos}} puntos que vencen pronto',
 '["puntos", "fecha_vencimiento", "valor_puntos"]', TRUE, FALSE, 'normal');

-- Eventos de notificación
INSERT IGNORE INTO notificaciones_eventos (codigo, nombre, categoria, email_habilitado, sms_habilitado, push_habilitado, in_app_habilitado) VALUES
('pedido.creado', 'Pedido Creado', 'pedidos', TRUE, FALSE, TRUE, TRUE),
('pedido.pagado', 'Pedido Pagado', 'pedidos', TRUE, FALSE, TRUE, TRUE),
('pedido.enviado', 'Pedido Enviado', 'pedidos', TRUE, TRUE, TRUE, TRUE),
('pedido.entregado', 'Pedido Entregado', 'pedidos', TRUE, FALSE, TRUE, TRUE),
('pedido.cancelado', 'Pedido Cancelado', 'pedidos', TRUE, FALSE, TRUE, TRUE),
('cliente.registro', 'Registro de Cliente', 'cuenta', TRUE, FALSE, FALSE, TRUE),
('cuenta.recuperar_contrasena', 'Recuperar Contraseña', 'seguridad', TRUE, FALSE, FALSE, FALSE),
('carrito.abandonado', 'Carrito Abandonado', 'marketing', TRUE, FALSE, FALSE, FALSE),
('puntos.por_vencer', 'Puntos por Vencer', 'fidelidad', TRUE, FALSE, TRUE, TRUE);

-- Proveedores por defecto
INSERT IGNORE INTO notificaciones_proveedores (codigo, nombre, tipo, configuracion, es_activo, es_default) VALUES
('smtp_default', 'SMTP Default', 'email', '{"host": "smtp.ejemplo.com", "port": 587}', TRUE, TRUE),
('twilio', 'Twilio SMS', 'sms', '{"account_sid": "", "auth_token": ""}', FALSE, FALSE),
('firebase', 'Firebase Cloud Messaging', 'push', '{"project_id": "", "api_key": ""}', FALSE, FALSE);

-- KPIs iniciales
INSERT IGNORE INTO analytics_kpis (codigo, nombre, descripcion, formato, periodo, icono, orden, es_visible) VALUES
('ventas_hoy', 'Ventas Hoy', 'Total de ventas del día', 'moneda', 'hoy', 'bi-currency-dollar', 1, TRUE),
('pedidos_hoy', 'Pedidos Hoy', 'Cantidad de pedidos del día', 'entero', 'hoy', 'bi-bag-check', 2, TRUE),
('clientes_nuevos_hoy', 'Clientes Nuevos', 'Registros del día', 'entero', 'hoy', 'bi-person-plus', 3, TRUE),
('ticket_promedio', 'Ticket Promedio', 'Valor promedio por pedido', 'moneda', 'hoy', 'bi-receipt', 4, TRUE),
('tasa_conversion', 'Tasa Conversión', 'Carritos convertidos a pedidos', 'porcentaje', 'hoy', 'bi-funnel', 5, TRUE),
('carritos_abandonados', 'Carritos Abandonados', 'Valor de carritos abandonados hoy', 'moneda', 'hoy', 'bi-cart-x', 6, TRUE),
('ventas_mes', 'Ventas del Mes', 'Total acumulado del mes', 'moneda', 'mes', 'bi-graph-up', 7, TRUE),
('pedidos_pendientes', 'Pedidos Pendientes', 'Pedidos por procesar', 'entero', 'tiempo_real', 'bi-hourglass-split', 8, TRUE);

-- Reportes programados por defecto
INSERT IGNORE INTO reportes_programados (codigo, nombre, tipo, frecuencia, hora_ejecucion, formato, es_activo) VALUES
('ventas_diario', 'Reporte de Ventas Diario', 'ventas_diario', 'diario', '08:00:00', 'excel', TRUE),
('ventas_semanal', 'Reporte de Ventas Semanal', 'ventas_semanal', 'semanal', '08:00:00', 'excel', TRUE),
('stock_bajo', 'Productos con Stock Bajo', 'productos_stock_bajo', 'diario', '07:00:00', 'excel', TRUE),
('clientes_inactivos', 'Clientes Inactivos', 'clientes_inactivos', 'mensual', '09:00:00', 'excel', TRUE);

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Evento para calcular métricas diarias (ejecuta a medianoche)
DROP EVENT IF EXISTS evento_calcular_metricas_diarias;
CREATE EVENT evento_calcular_metricas_diarias
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 1 MINUTE)
ON COMPLETION PRESERVE
ENABLE
DO CALL sp_calcular_metricas_diarias(DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- Evento para actualizar KPIs (cada 5 minutos)
DROP EVENT IF EXISTS evento_actualizar_kpis;
CREATE EVENT evento_actualizar_kpis
ON SCHEDULE EVERY 5 MINUTE
STARTS (CURRENT_TIMESTAMP + INTERVAL 5 MINUTE)
ON COMPLETION PRESERVE
ENABLE
DO CALL sp_actualizar_kpis();

-- Evento para calcular RFM (semanal)
DROP EVENT IF EXISTS evento_calcular_rfm;
CREATE EVENT evento_calcular_rfm
ON SCHEDULE EVERY 1 WEEK
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 3 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO CALL sp_calcular_rfm_clientes();

-- Evento para detectar carritos abandonados y notificar
DROP EVENT IF EXISTS evento_notificar_carritos_abandonados;
CREATE EVENT evento_notificar_carritos_abandonados
ON SCHEDULE EVERY 1 HOUR
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO 
    INSERT INTO notificaciones_cola (
        plantilla_codigo, cliente_id, canal,
        destinatario_email, destinatario_nombre,
        referencia_tipo, referencia_id, prioridad
    )
    SELECT 
        'carrito_abandonado', ca.cliente_id, 'email',
        c.correo, c.nombre_completo,
        'carrito', ca.id, 3
    FROM carritos ca
    JOIN clientes c ON ca.cliente_id = c.id
    WHERE ca.estado = 'abandonado'
    AND ca.total_items > 0
    AND ca.total >= 500
    AND TIMESTAMPDIFF(HOUR, ca.ultimo_acceso, NOW()) BETWEEN 24 AND 25
    AND NOT EXISTS (
        SELECT 1 FROM notificaciones_cola nc 
        WHERE nc.referencia_tipo = 'carrito' 
        AND nc.referencia_id = ca.id 
        AND nc.plantilla_codigo = 'carrito_abandonado'
    );

-- ============================================================================
-- FIN DEL SCRIPT - FASE 8
-- ============================================================================
