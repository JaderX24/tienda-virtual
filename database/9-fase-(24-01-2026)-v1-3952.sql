-- ============================================================================
-- TIENDA VIRTUAL - FASE 9
-- ============================================================================
-- Módulo: Promociones y Ofertas Avanzadas
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script implementa:
-- - Flash Sales (ventas relámpago con contador)
-- - Bundles y Combos (paquetes de productos)
-- - Descuentos por tiempo (happy hours)
-- - Descuentos por volumen (compra más, ahorra más)
-- - Ofertas especiales (2x1, 3x2, regalo con compra)
-- - Campañas promocionales
-- - Banners y publicidad interna
-- - Descuentos por categoría
-- - Precios especiales por segmento de cliente
-- ============================================================================
-- Ejecutar DESPUÉS de las Fases 1-8
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- LIMPIEZA: Eliminar tablas de Fase 9 si existen
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS promociones_uso_historial;
DROP TABLE IF EXISTS promociones_segmentos;
DROP TABLE IF EXISTS promociones_categorias;
DROP TABLE IF EXISTS promociones_productos_excluidos;
DROP TABLE IF EXISTS promociones_productos;
DROP TABLE IF EXISTS promociones_reglas;
DROP TABLE IF EXISTS promociones;
DROP TABLE IF EXISTS flash_sales_productos;
DROP TABLE IF EXISTS flash_sales;
DROP TABLE IF EXISTS bundles_items;
DROP TABLE IF EXISTS bundles;
DROP TABLE IF EXISTS descuentos_volumen;
DROP TABLE IF EXISTS ofertas_especiales_productos;
DROP TABLE IF EXISTS ofertas_especiales;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS campanas;
DROP TABLE IF EXISTS precios_segmento;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- ESQUEMA: CAMPAÑAS PROMOCIONALES
-- ============================================================================

CREATE TABLE campanas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    slug VARCHAR(150) UNIQUE,
    
    -- Período de vigencia
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    
    -- Tipo de campaña
    tipo ENUM(
        'temporada',
        'evento',
        'liquidacion',
        'lanzamiento',
        'aniversario',
        'black_friday',
        'cyber_monday',
        'navidad',
        'dia_madre',
        'dia_padre',
        'san_valentin',
        'otro'
    ) NOT NULL DEFAULT 'otro',
    
    -- Configuración visual
    color_primario VARCHAR(7) DEFAULT '#dc3545',
    color_secundario VARCHAR(7) DEFAULT '#ffc107',
    imagen_banner VARCHAR(500),
    imagen_movil VARCHAR(500),
    
    -- Presupuesto y límites
    presupuesto_maximo DECIMAL(15,2),
    presupuesto_usado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_maximo_total DECIMAL(15,2),
    
    -- Métricas
    total_ventas DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_pedidos INT UNSIGNED NOT NULL DEFAULT 0,
    total_descuentos DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Estado
    estado ENUM('borrador', 'programada', 'activa', 'pausada', 'finalizada', 'cancelada') NOT NULL DEFAULT 'borrador',
    es_destacada BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    -- Auditoría
    creado_por INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_destacada (es_destacada),
    INDEX idx_empresa (empresa_id),
    CONSTRAINT fk_campana_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PROMOCIONES (Sistema flexible de reglas)
-- ============================================================================

CREATE TABLE promociones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    descripcion_corta VARCHAR(255),
    
    -- Relación con campaña (opcional)
    campana_id INT UNSIGNED,
    
    -- Tipo de promoción
    tipo ENUM(
        'porcentaje',
        'monto_fijo',
        'precio_especial',
        'envio_gratis',
        'regalo',
        '2x1',
        '3x2',
        'segundo_descuento',
        'volumen',
        'bundle'
    ) NOT NULL,
    
    -- Valor del descuento
    valor_descuento DECIMAL(10,2),
    porcentaje_descuento DECIMAL(5,2),
    
    -- Para tipo "segundo_descuento" (ej: segundo al 50%)
    porcentaje_segundo DECIMAL(5,2),
    porcentaje_tercero DECIMAL(5,2),
    
    -- Período de vigencia
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    
    -- Horarios específicos (happy hours)
    hora_inicio TIME,
    hora_fin TIME,
    dias_semana VARCHAR(20),
    
    -- Requisitos mínimos
    monto_minimo DECIMAL(15,2) DEFAULT 0.00,
    cantidad_minima INT UNSIGNED DEFAULT 1,
    
    -- Límites de uso
    uso_maximo_total INT UNSIGNED,
    uso_maximo_cliente INT UNSIGNED DEFAULT 1,
    uso_actual INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Aplicación
    aplicar_a ENUM('todos', 'productos', 'categorias', 'marcas', 'segmentos') NOT NULL DEFAULT 'todos',
    es_acumulable BOOLEAN NOT NULL DEFAULT FALSE,
    prioridad INT UNSIGNED NOT NULL DEFAULT 100,
    
    -- Estado
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    es_visible BOOLEAN NOT NULL DEFAULT TRUE,
    requiere_cupon BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métricas
    veces_aplicada INT UNSIGNED NOT NULL DEFAULT 0,
    total_descuento_otorgado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    -- Auditoría
    creado_por INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_tipo (tipo),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_campana (campana_id),
    INDEX idx_activa (es_activa),
    INDEX idx_prioridad (prioridad),
    INDEX idx_empresa (empresa_id),
    CONSTRAINT fk_promocion_campana 
        FOREIGN KEY (campana_id) REFERENCES campanas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_promocion_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas adicionales de promoción
CREATE TABLE promociones_reglas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT UNSIGNED NOT NULL,
    
    -- Tipo de regla
    tipo_regla ENUM(
        'cantidad_minima',
        'monto_minimo',
        'producto_requerido',
        'categoria_requerida',
        'cliente_nuevo',
        'primera_compra_categoria',
        'metodo_pago',
        'dia_semana',
        'rango_hora'
    ) NOT NULL,
    
    -- Valor de la regla
    valor VARCHAR(255) NOT NULL,
    operador ENUM('=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN') DEFAULT '=',
    
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT fk_regla_promocion 
        FOREIGN KEY (promocion_id) REFERENCES promociones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Productos incluidos en promoción
CREATE TABLE promociones_productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    -- Precio especial para este producto en esta promoción
    precio_promocion DECIMAL(15,2),
    cantidad_maxima INT UNSIGNED,
    
    UNIQUE KEY uk_promocion_producto (promocion_id, producto_id),
    CONSTRAINT fk_pp_promocion 
        FOREIGN KEY (promocion_id) REFERENCES promociones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pp_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Productos excluidos de promoción
CREATE TABLE promociones_productos_excluidos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    UNIQUE KEY uk_promocion_excluido (promocion_id, producto_id),
    CONSTRAINT fk_ppe_promocion 
        FOREIGN KEY (promocion_id) REFERENCES promociones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ppe_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorías incluidas en promoción
CREATE TABLE promociones_categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT UNSIGNED NOT NULL,
    categoria_id INT UNSIGNED NOT NULL,
    incluir_subcategorias BOOLEAN NOT NULL DEFAULT TRUE,
    
    UNIQUE KEY uk_promocion_categoria (promocion_id, categoria_id),
    CONSTRAINT fk_pc_promocion 
        FOREIGN KEY (promocion_id) REFERENCES promociones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pc_categoria 
        FOREIGN KEY (categoria_id) REFERENCES catalogo_categorias(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Segmentos de clientes que aplican
CREATE TABLE promociones_segmentos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT UNSIGNED NOT NULL,
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
        'lost',
        'todos'
    ) NOT NULL,
    
    UNIQUE KEY uk_promocion_segmento (promocion_id, segmento),
    CONSTRAINT fk_ps_promocion 
        FOREIGN KEY (promocion_id) REFERENCES promociones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de uso de promociones
CREATE TABLE promociones_uso_historial (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    pedido_id BIGINT UNSIGNED,
    
    -- Detalles del descuento aplicado
    descuento_aplicado DECIMAL(15,2) NOT NULL,
    productos_afectados INT UNSIGNED NOT NULL DEFAULT 0,
    
    aplicado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_promocion (promocion_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_pedido (pedido_id),
    INDEX idx_fecha (aplicado_en),
    CONSTRAINT fk_puh_promocion 
        FOREIGN KEY (promocion_id) REFERENCES promociones(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_puh_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_puh_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: FLASH SALES (Ventas Relámpago)
-- ============================================================================

CREATE TABLE flash_sales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Relación con campaña
    campana_id INT UNSIGNED,
    
    -- Período (corto, típicamente horas)
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    
    -- Configuración visual
    imagen_banner VARCHAR(500),
    color_fondo VARCHAR(7) DEFAULT '#ff0000',
    mostrar_contador BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Límites globales
    stock_total_disponible INT UNSIGNED,
    stock_vendido INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Estado
    estado ENUM('programada', 'activa', 'agotada', 'finalizada', 'cancelada') NOT NULL DEFAULT 'programada',
    
    -- Métricas
    total_ventas DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_pedidos INT UNSIGNED NOT NULL DEFAULT 0,
    visitantes_unicos INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_estado (estado),
    INDEX idx_campana (campana_id),
    CONSTRAINT fk_flash_campana 
        FOREIGN KEY (campana_id) REFERENCES campanas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Productos en flash sale
CREATE TABLE flash_sales_productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    flash_sale_id INT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    -- Precios
    precio_original DECIMAL(15,2) NOT NULL,
    precio_flash DECIMAL(15,2) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) GENERATED ALWAYS AS (
        ROUND(((precio_original - precio_flash) / precio_original) * 100, 2)
    ) STORED,
    
    -- Stock para esta venta
    stock_disponible INT UNSIGNED NOT NULL,
    stock_vendido INT UNSIGNED NOT NULL DEFAULT 0,
    stock_restante INT UNSIGNED GENERATED ALWAYS AS (stock_disponible - stock_vendido) STORED,
    
    -- Límites por cliente
    limite_por_cliente INT UNSIGNED DEFAULT 2,
    
    -- Orden de visualización
    orden INT UNSIGNED DEFAULT 100,
    
    UNIQUE KEY uk_flash_producto (flash_sale_id, producto_id),
    INDEX idx_stock (stock_restante),
    CONSTRAINT fk_fsp_flash 
        FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fsp_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: BUNDLES Y COMBOS
-- ============================================================================

CREATE TABLE bundles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    slug VARCHAR(150) UNIQUE,
    
    -- Imágenes
    imagen_principal VARCHAR(500),
    
    -- Tipo de bundle
    tipo ENUM(
        'fijo',
        'personalizable',
        'compra_x_lleva_y'
    ) NOT NULL DEFAULT 'fijo',
    
    -- Precios
    precio_individual_total DECIMAL(15,2) NOT NULL,
    precio_bundle DECIMAL(15,2) NOT NULL,
    ahorro DECIMAL(15,2) GENERATED ALWAYS AS (precio_individual_total - precio_bundle) STORED,
    porcentaje_ahorro DECIMAL(5,2) GENERATED ALWAYS AS (
        ROUND(((precio_individual_total - precio_bundle) / precio_individual_total) * 100, 2)
    ) STORED,
    
    -- Vigencia
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    
    -- Stock
    stock_disponible INT UNSIGNED,
    stock_vendido INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Para tipo "compra_x_lleva_y"
    compra_cantidad INT UNSIGNED DEFAULT 1,
    lleva_cantidad INT UNSIGNED DEFAULT 1,
    
    -- Configuración
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_ahorro BOOLEAN NOT NULL DEFAULT TRUE,
    es_destacado BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métricas
    veces_vendido INT UNSIGNED NOT NULL DEFAULT 0,
    ingresos_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_slug (slug),
    INDEX idx_tipo (tipo),
    INDEX idx_activo (es_activo),
    INDEX idx_destacado (es_destacado),
    INDEX idx_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items del bundle
CREATE TABLE bundles_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bundle_id INT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    -- Cantidad en el bundle
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    
    -- Para bundles personalizables
    es_obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
    es_intercambiable BOOLEAN NOT NULL DEFAULT FALSE,
    grupo_intercambio VARCHAR(50),
    
    -- Precio individual de referencia
    precio_individual DECIMAL(15,2) NOT NULL,
    
    -- Orden
    orden INT UNSIGNED DEFAULT 100,
    
    UNIQUE KEY uk_bundle_producto (bundle_id, producto_id),
    INDEX idx_grupo (grupo_intercambio),
    CONSTRAINT fk_bi_bundle 
        FOREIGN KEY (bundle_id) REFERENCES bundles(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bi_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: DESCUENTOS POR VOLUMEN
-- ============================================================================

CREATE TABLE descuentos_volumen (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Aplicación
    producto_id BIGINT UNSIGNED,
    categoria_id INT UNSIGNED,
    aplica_a_todo BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Rangos de cantidad
    cantidad_minima INT UNSIGNED NOT NULL,
    cantidad_maxima INT UNSIGNED,
    
    -- Descuento
    tipo_descuento ENUM('porcentaje', 'monto_fijo', 'precio_unitario') NOT NULL,
    valor_descuento DECIMAL(10,2) NOT NULL,
    
    -- Vigencia
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    
    -- Estado
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    prioridad INT UNSIGNED DEFAULT 100,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_cantidad (cantidad_minima, cantidad_maxima),
    INDEX idx_activo (es_activo),
    CONSTRAINT fk_dv_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dv_categoria 
        FOREIGN KEY (categoria_id) REFERENCES catalogo_categorias(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: OFERTAS ESPECIALES (2x1, 3x2, regalo con compra)
-- ============================================================================

CREATE TABLE ofertas_especiales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Tipo de oferta
    tipo ENUM(
        '2x1',
        '3x2',
        '4x3',
        'segundo_50',
        'tercero_gratis',
        'regalo_con_compra',
        'muestra_gratis'
    ) NOT NULL,
    
    -- Configuración del descuento
    cantidad_comprar INT UNSIGNED NOT NULL DEFAULT 2,
    cantidad_pagar INT UNSIGNED NOT NULL DEFAULT 1,
    porcentaje_descuento_extra DECIMAL(5,2),
    
    -- Para regalo con compra
    monto_minimo_regalo DECIMAL(15,2),
    producto_regalo_id BIGINT UNSIGNED,
    
    -- Vigencia
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    
    -- Límites
    uso_maximo INT UNSIGNED,
    uso_actual INT UNSIGNED NOT NULL DEFAULT 0,
    limite_por_cliente INT UNSIGNED DEFAULT 1,
    
    -- Estado
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_tipo (tipo),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_activa (es_activa),
    CONSTRAINT fk_oe_regalo 
        FOREIGN KEY (producto_regalo_id) REFERENCES catalogo_productos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Productos participantes en oferta especial
CREATE TABLE ofertas_especiales_productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oferta_id INT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    es_producto_compra BOOLEAN NOT NULL DEFAULT TRUE,
    es_producto_regalo BOOLEAN NOT NULL DEFAULT FALSE,
    
    UNIQUE KEY uk_oferta_producto (oferta_id, producto_id),
    CONSTRAINT fk_oep_oferta 
        FOREIGN KEY (oferta_id) REFERENCES ofertas_especiales(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_oep_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PRECIOS POR SEGMENTO DE CLIENTE
-- ============================================================================

CREATE TABLE precios_segmento (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    
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
    ) NOT NULL,
    
    -- Precio especial
    precio_especial DECIMAL(15,2),
    porcentaje_descuento DECIMAL(5,2),
    
    -- Vigencia
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    UNIQUE KEY uk_producto_segmento (producto_id, segmento),
    INDEX idx_segmento (segmento),
    INDEX idx_activo (es_activo),
    CONSTRAINT fk_ps_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: BANNERS PROMOCIONALES
-- ============================================================================

CREATE TABLE banners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    nombre VARCHAR(150) NOT NULL,
    
    -- Ubicación
    ubicacion ENUM(
        'home_principal',
        'home_secundario',
        'categoria',
        'producto',
        'carrito',
        'checkout',
        'sidebar',
        'popup',
        'header',
        'footer'
    ) NOT NULL,
    
    -- Contenido
    imagen_desktop VARCHAR(500) NOT NULL,
    imagen_mobile VARCHAR(500),
    titulo VARCHAR(200),
    subtitulo VARCHAR(300),
    texto_boton VARCHAR(50),
    
    -- Enlace
    url_destino VARCHAR(500),
    abrir_nueva_ventana BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Relaciones
    campana_id INT UNSIGNED,
    promocion_id INT UNSIGNED,
    categoria_id INT UNSIGNED,
    producto_id BIGINT UNSIGNED,
    
    -- Vigencia
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    
    -- Configuración
    orden INT UNSIGNED DEFAULT 100,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métricas
    impresiones INT UNSIGNED NOT NULL DEFAULT 0,
    clicks INT UNSIGNED NOT NULL DEFAULT 0,
    ctr DECIMAL(5,2) GENERATED ALWAYS AS (
        IF(impresiones > 0, (clicks / impresiones) * 100, 0)
    ) STORED,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ubicacion (ubicacion),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_activo (es_activo),
    INDEX idx_orden (orden),
    INDEX idx_campana (campana_id),
    CONSTRAINT fk_banner_campana 
        FOREIGN KEY (campana_id) REFERENCES campanas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_banner_promocion 
        FOREIGN KEY (promocion_id) REFERENCES promociones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MÓDULOS Y PERMISOS
-- ============================================================================

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('promociones', 'Promociones', 'Gestión de promociones y ofertas', 'bi-percent', '/admin/promociones', 25, TRUE),
('flash_sales', 'Flash Sales', 'Ventas relámpago', 'bi-lightning', '/admin/flash-sales', 26, TRUE),
('bundles', 'Bundles', 'Paquetes y combos', 'bi-box-seam', '/admin/bundles', 27, TRUE),
('campanas', 'Campañas', 'Campañas promocionales', 'bi-megaphone', '/admin/campanas', 28, TRUE),
('banners', 'Banners', 'Banners publicitarios', 'bi-image', '/admin/banners', 29, TRUE);

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'promociones.ver', 'Ver promociones', id, 'ver' FROM admin_modulos WHERE codigo = 'promociones'
UNION ALL SELECT 'promociones.crear', 'Crear promociones', id, 'crear' FROM admin_modulos WHERE codigo = 'promociones'
UNION ALL SELECT 'promociones.editar', 'Editar promociones', id, 'editar' FROM admin_modulos WHERE codigo = 'promociones'
UNION ALL SELECT 'promociones.eliminar', 'Eliminar promociones', id, 'eliminar' FROM admin_modulos WHERE codigo = 'promociones';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'flash_sales.ver', 'Ver flash sales', id, 'ver' FROM admin_modulos WHERE codigo = 'flash_sales'
UNION ALL SELECT 'flash_sales.crear', 'Crear flash sales', id, 'crear' FROM admin_modulos WHERE codigo = 'flash_sales'
UNION ALL SELECT 'flash_sales.editar', 'Editar flash sales', id, 'editar' FROM admin_modulos WHERE codigo = 'flash_sales';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'bundles.ver', 'Ver bundles', id, 'ver' FROM admin_modulos WHERE codigo = 'bundles'
UNION ALL SELECT 'bundles.crear', 'Crear bundles', id, 'crear' FROM admin_modulos WHERE codigo = 'bundles'
UNION ALL SELECT 'bundles.editar', 'Editar bundles', id, 'editar' FROM admin_modulos WHERE codigo = 'bundles';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'campanas.ver', 'Ver campañas', id, 'ver' FROM admin_modulos WHERE codigo = 'campanas'
UNION ALL SELECT 'campanas.crear', 'Crear campañas', id, 'crear' FROM admin_modulos WHERE codigo = 'campanas'
UNION ALL SELECT 'campanas.editar', 'Editar campañas', id, 'editar' FROM admin_modulos WHERE codigo = 'campanas';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'banners.ver', 'Ver banners', id, 'ver' FROM admin_modulos WHERE codigo = 'banners'
UNION ALL SELECT 'banners.crear', 'Crear banners', id, 'crear' FROM admin_modulos WHERE codigo = 'banners'
UNION ALL SELECT 'banners.editar', 'Editar banners', id, 'editar' FROM admin_modulos WHERE codigo = 'banners';

-- Asignar permisos al rol admin
INSERT IGNORE INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos 
WHERE codigo LIKE 'promociones%' 
   OR codigo LIKE 'flash_sales%' 
   OR codigo LIKE 'bundles%'
   OR codigo LIKE 'campanas%'
   OR codigo LIKE 'banners%';

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista de promociones activas
CREATE OR REPLACE VIEW vista_promociones_activas AS
SELECT 
    p.id,
    p.codigo,
    p.nombre,
    p.tipo,
    p.valor_descuento,
    p.porcentaje_descuento,
    p.fecha_inicio,
    p.fecha_fin,
    p.uso_actual,
    p.uso_maximo_total,
    p.es_acumulable,
    c.nombre AS campana,
    CASE 
        WHEN p.uso_maximo_total IS NOT NULL AND p.uso_actual >= p.uso_maximo_total THEN 'agotada'
        WHEN NOW() < p.fecha_inicio THEN 'programada'
        WHEN NOW() > p.fecha_fin THEN 'expirada'
        ELSE 'activa'
    END AS estado_actual
FROM promociones p
LEFT JOIN campanas c ON p.campana_id = c.id
WHERE p.es_activa = TRUE
AND NOW() BETWEEN p.fecha_inicio AND p.fecha_fin
ORDER BY p.prioridad ASC;

-- Vista de flash sales activas
CREATE OR REPLACE VIEW vista_flash_sales_activas AS
SELECT 
    fs.id,
    fs.codigo,
    fs.nombre,
    fs.fecha_inicio,
    fs.fecha_fin,
    fs.estado,
    fs.total_ventas,
    fs.total_pedidos,
    TIMESTAMPDIFF(MINUTE, NOW(), fs.fecha_fin) AS minutos_restantes,
    COUNT(fsp.id) AS total_productos,
    SUM(fsp.stock_restante) AS stock_total_restante
FROM flash_sales fs
LEFT JOIN flash_sales_productos fsp ON fs.id = fsp.flash_sale_id
WHERE fs.estado IN ('programada', 'activa')
AND NOW() <= fs.fecha_fin
GROUP BY fs.id;

-- Vista de bundles disponibles
CREATE OR REPLACE VIEW vista_bundles_disponibles AS
SELECT 
    b.id,
    b.codigo,
    b.nombre,
    b.tipo,
    b.precio_individual_total,
    b.precio_bundle,
    b.ahorro,
    b.porcentaje_ahorro,
    b.stock_disponible,
    b.stock_vendido,
    (b.stock_disponible - b.stock_vendido) AS stock_restante,
    COUNT(bi.id) AS total_items
FROM bundles b
LEFT JOIN bundles_items bi ON b.id = bi.bundle_id
WHERE b.es_activo = TRUE
AND (b.fecha_inicio IS NULL OR NOW() >= b.fecha_inicio)
AND (b.fecha_fin IS NULL OR NOW() <= b.fecha_fin)
AND (b.stock_disponible IS NULL OR b.stock_vendido < b.stock_disponible)
GROUP BY b.id;

-- Vista de ofertas del día
CREATE OR REPLACE VIEW vista_ofertas_hoy AS
SELECT 
    'promocion' AS tipo_oferta,
    p.id AS oferta_id,
    p.codigo,
    p.nombre,
    p.descripcion_corta AS descripcion,
    p.porcentaje_descuento AS descuento,
    p.fecha_fin,
    NULL AS precio_original,
    NULL AS precio_oferta
FROM promociones p
WHERE p.es_activa = TRUE AND p.es_visible = TRUE
AND NOW() BETWEEN p.fecha_inicio AND p.fecha_fin
UNION ALL
SELECT 
    'flash_sale' AS tipo_oferta,
    fs.id AS oferta_id,
    fs.codigo,
    fs.nombre,
    fs.descripcion,
    NULL AS descuento,
    fs.fecha_fin,
    NULL AS precio_original,
    NULL AS precio_oferta
FROM flash_sales fs
WHERE fs.estado = 'activa'
AND NOW() BETWEEN fs.fecha_inicio AND fs.fecha_fin
UNION ALL
SELECT 
    'bundle' AS tipo_oferta,
    b.id AS oferta_id,
    b.codigo,
    b.nombre,
    b.descripcion,
    b.porcentaje_ahorro AS descuento,
    b.fecha_fin,
    b.precio_individual_total AS precio_original,
    b.precio_bundle AS precio_oferta
FROM bundles b
WHERE b.es_activo = TRUE
AND (b.fecha_inicio IS NULL OR NOW() >= b.fecha_inicio)
AND (b.fecha_fin IS NULL OR NOW() <= b.fecha_fin);

-- Vista de banners activos por ubicación
CREATE OR REPLACE VIEW vista_banners_activos AS
SELECT 
    b.id,
    b.nombre,
    b.ubicacion,
    b.imagen_desktop,
    b.imagen_mobile,
    b.titulo,
    b.subtitulo,
    b.texto_boton,
    b.url_destino,
    b.orden,
    c.nombre AS campana
FROM banners b
LEFT JOIN campanas c ON b.campana_id = c.id
WHERE b.es_activo = TRUE
AND (b.fecha_inicio IS NULL OR NOW() >= b.fecha_inicio)
AND (b.fecha_fin IS NULL OR NOW() <= b.fecha_fin)
ORDER BY b.ubicacion, b.orden;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_obtener_precio_final;
DROP PROCEDURE IF EXISTS sp_aplicar_promocion_carrito;
DROP PROCEDURE IF EXISTS sp_verificar_promocion_valida;
DROP PROCEDURE IF EXISTS sp_actualizar_stock_flash_sale;
DROP PROCEDURE IF EXISTS sp_obtener_descuento_volumen;

DELIMITER //

-- Obtener precio final de un producto considerando todas las promociones
CREATE PROCEDURE sp_obtener_precio_final(
    IN p_producto_id BIGINT UNSIGNED,
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_cantidad INT UNSIGNED,
    OUT p_precio_original DECIMAL(15,2),
    OUT p_precio_final DECIMAL(15,2),
    OUT p_descuento_total DECIMAL(15,2),
    OUT p_promociones_aplicadas JSON
)
BEGIN
    DECLARE v_precio_base DECIMAL(15,2);
    DECLARE v_descuento DECIMAL(15,2) DEFAULT 0;
    DECLARE v_segmento VARCHAR(50);
    DECLARE v_promociones JSON DEFAULT '[]';
    
    -- Obtener precio base del producto
    SELECT precio_venta INTO v_precio_base
    FROM catalogo_productos WHERE id = p_producto_id;
    
    SET p_precio_original = v_precio_base;
    
    -- Verificar precio por segmento de cliente
    IF p_cliente_id IS NOT NULL THEN
        SELECT ac.segmento INTO v_segmento
        FROM analytics_clientes ac WHERE ac.cliente_id = p_cliente_id;
        
        SELECT COALESCE(ps.precio_especial, v_precio_base - (v_precio_base * ps.porcentaje_descuento / 100))
        INTO v_precio_base
        FROM precios_segmento ps
        WHERE ps.producto_id = p_producto_id
        AND ps.segmento = v_segmento
        AND ps.es_activo = TRUE
        AND (ps.fecha_inicio IS NULL OR NOW() >= ps.fecha_inicio)
        AND (ps.fecha_fin IS NULL OR NOW() <= ps.fecha_fin)
        LIMIT 1;
    END IF;
    
    -- Verificar descuento por volumen
    SELECT 
        CASE dv.tipo_descuento
            WHEN 'porcentaje' THEN v_precio_base * (1 - dv.valor_descuento / 100)
            WHEN 'monto_fijo' THEN v_precio_base - dv.valor_descuento
            WHEN 'precio_unitario' THEN dv.valor_descuento
        END
    INTO v_precio_base
    FROM descuentos_volumen dv
    WHERE (dv.producto_id = p_producto_id OR dv.aplica_a_todo = TRUE)
    AND dv.es_activo = TRUE
    AND p_cantidad >= dv.cantidad_minima
    AND (dv.cantidad_maxima IS NULL OR p_cantidad <= dv.cantidad_maxima)
    AND (dv.fecha_inicio IS NULL OR NOW() >= dv.fecha_inicio)
    AND (dv.fecha_fin IS NULL OR NOW() <= dv.fecha_fin)
    ORDER BY dv.prioridad ASC
    LIMIT 1;
    
    -- Verificar flash sale
    SELECT fsp.precio_flash INTO v_precio_base
    FROM flash_sales_productos fsp
    JOIN flash_sales fs ON fsp.flash_sale_id = fs.id
    WHERE fsp.producto_id = p_producto_id
    AND fs.estado = 'activa'
    AND NOW() BETWEEN fs.fecha_inicio AND fs.fecha_fin
    AND fsp.stock_restante > 0
    LIMIT 1;
    
    SET p_precio_final = v_precio_base;
    SET p_descuento_total = p_precio_original - p_precio_final;
    SET p_promociones_aplicadas = v_promociones;
END //

-- Verificar si una promoción es válida para un cliente
CREATE PROCEDURE sp_verificar_promocion_valida(
    IN p_promocion_id INT UNSIGNED,
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_monto_carrito DECIMAL(15,2),
    OUT p_es_valida BOOLEAN,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_uso_cliente INT;
    DECLARE v_uso_max_cliente INT;
    DECLARE v_uso_actual INT;
    DECLARE v_uso_max_total INT;
    DECLARE v_monto_minimo DECIMAL(15,2);
    DECLARE v_fecha_inicio DATETIME;
    DECLARE v_fecha_fin DATETIME;
    DECLARE v_es_activa BOOLEAN;
    
    SELECT 
        es_activa, fecha_inicio, fecha_fin, 
        monto_minimo, uso_actual, uso_maximo_total, uso_maximo_cliente
    INTO v_es_activa, v_fecha_inicio, v_fecha_fin, 
         v_monto_minimo, v_uso_actual, v_uso_max_total, v_uso_max_cliente
    FROM promociones WHERE id = p_promocion_id;
    
    IF NOT v_es_activa THEN
        SET p_es_valida = FALSE;
        SET p_mensaje = 'La promoción no está activa';
    ELSEIF NOW() < v_fecha_inicio THEN
        SET p_es_valida = FALSE;
        SET p_mensaje = 'La promoción aún no ha iniciado';
    ELSEIF NOW() > v_fecha_fin THEN
        SET p_es_valida = FALSE;
        SET p_mensaje = 'La promoción ha expirado';
    ELSEIF v_uso_max_total IS NOT NULL AND v_uso_actual >= v_uso_max_total THEN
        SET p_es_valida = FALSE;
        SET p_mensaje = 'La promoción ha alcanzado su límite de uso';
    ELSEIF p_monto_carrito < v_monto_minimo THEN
        SET p_es_valida = FALSE;
        SET p_mensaje = CONCAT('El monto mínimo es L ', v_monto_minimo);
    ELSE
        -- Verificar uso por cliente
        SELECT COUNT(*) INTO v_uso_cliente
        FROM promociones_uso_historial
        WHERE promocion_id = p_promocion_id AND cliente_id = p_cliente_id;
        
        IF v_uso_max_cliente IS NOT NULL AND v_uso_cliente >= v_uso_max_cliente THEN
            SET p_es_valida = FALSE;
            SET p_mensaje = 'Ya has usado esta promoción el máximo de veces permitido';
        ELSE
            SET p_es_valida = TRUE;
            SET p_mensaje = 'Promoción válida';
        END IF;
    END IF;
END //

-- Actualizar stock de flash sale al comprar
CREATE PROCEDURE sp_actualizar_stock_flash_sale(
    IN p_flash_sale_id INT UNSIGNED,
    IN p_producto_id BIGINT UNSIGNED,
    IN p_cantidad INT UNSIGNED
)
BEGIN
    UPDATE flash_sales_productos
    SET stock_vendido = stock_vendido + p_cantidad
    WHERE flash_sale_id = p_flash_sale_id AND producto_id = p_producto_id;
    
    UPDATE flash_sales
    SET 
        stock_vendido = stock_vendido + p_cantidad,
        total_pedidos = total_pedidos + 1
    WHERE id = p_flash_sale_id;
    
    -- Verificar si se agotó
    UPDATE flash_sales fs
    SET estado = 'agotada'
    WHERE fs.id = p_flash_sale_id
    AND NOT EXISTS (
        SELECT 1 FROM flash_sales_productos fsp 
        WHERE fsp.flash_sale_id = fs.id AND fsp.stock_restante > 0
    );
END //

-- Obtener descuento por volumen
CREATE PROCEDURE sp_obtener_descuento_volumen(
    IN p_producto_id BIGINT UNSIGNED,
    IN p_cantidad INT UNSIGNED,
    OUT p_tipo_descuento VARCHAR(20),
    OUT p_valor_descuento DECIMAL(10,2)
)
BEGIN
    SELECT tipo_descuento, valor_descuento
    INTO p_tipo_descuento, p_valor_descuento
    FROM descuentos_volumen
    WHERE (producto_id = p_producto_id OR aplica_a_todo = TRUE)
    AND es_activo = TRUE
    AND p_cantidad >= cantidad_minima
    AND (cantidad_maxima IS NULL OR p_cantidad <= cantidad_maxima)
    AND (fecha_inicio IS NULL OR NOW() >= fecha_inicio)
    AND (fecha_fin IS NULL OR NOW() <= fecha_fin)
    ORDER BY prioridad ASC
    LIMIT 1;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_flash_sale_estado;
DROP TRIGGER IF EXISTS trg_bundle_vendido;
DROP TRIGGER IF EXISTS trg_banner_impresion;

DELIMITER //

-- Trigger para actualizar estado de flash sale
CREATE TRIGGER trg_flash_sale_estado
BEFORE UPDATE ON flash_sales
FOR EACH ROW
BEGIN
    IF NEW.fecha_fin < NOW() AND OLD.estado = 'activa' THEN
        SET NEW.estado = 'finalizada';
    END IF;
END //

-- Trigger para registrar venta de bundle
CREATE TRIGGER trg_bundle_vendido
AFTER UPDATE ON bundles
FOR EACH ROW
BEGIN
    IF NEW.stock_vendido > OLD.stock_vendido THEN
        SET @cantidad_vendida = NEW.stock_vendido - OLD.stock_vendido;
        UPDATE bundles 
        SET ingresos_total = ingresos_total + (precio_bundle * @cantidad_vendida)
        WHERE id = NEW.id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES DE EJEMPLO
-- ============================================================================

-- Campaña de ejemplo
INSERT IGNORE INTO campanas (codigo, nombre, descripcion, tipo, fecha_inicio, fecha_fin, estado, es_destacada) VALUES
('INAUGURACION2026', 'Gran Inauguración 2026', 'Celebramos nuestra apertura con descuentos increíbles', 'lanzamiento', 
 '2026-01-24 00:00:00', '2026-02-28 23:59:59', 'activa', TRUE);

-- Ejemplo de descuento por volumen
INSERT IGNORE INTO descuentos_volumen (cantidad_minima, cantidad_maxima, tipo_descuento, valor_descuento, aplica_a_todo, es_activo) VALUES
(5, 9, 'porcentaje', 5.00, TRUE, TRUE),
(10, 19, 'porcentaje', 10.00, TRUE, TRUE),
(20, NULL, 'porcentaje', 15.00, TRUE, TRUE);

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Evento para actualizar estado de flash sales
DROP EVENT IF EXISTS evento_actualizar_flash_sales;
CREATE EVENT evento_actualizar_flash_sales
ON SCHEDULE EVERY 1 MINUTE
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 MINUTE)
ON COMPLETION PRESERVE
ENABLE
DO 
    UPDATE flash_sales 
    SET estado = CASE
        WHEN NOW() >= fecha_inicio AND NOW() <= fecha_fin AND estado = 'programada' THEN 'activa'
        WHEN NOW() > fecha_fin AND estado IN ('programada', 'activa') THEN 'finalizada'
        ELSE estado
    END
    WHERE estado IN ('programada', 'activa');

-- Evento para actualizar estado de campañas
DROP EVENT IF EXISTS evento_actualizar_campanas;
CREATE EVENT evento_actualizar_campanas
ON SCHEDULE EVERY 5 MINUTE
STARTS (CURRENT_TIMESTAMP + INTERVAL 5 MINUTE)
ON COMPLETION PRESERVE
ENABLE
DO 
    UPDATE campanas 
    SET estado = CASE
        WHEN NOW() >= fecha_inicio AND NOW() <= fecha_fin AND estado = 'programada' THEN 'activa'
        WHEN NOW() > fecha_fin AND estado IN ('programada', 'activa') THEN 'finalizada'
        ELSE estado
    END
    WHERE estado IN ('programada', 'activa');

-- ============================================================================
-- FIN DEL SCRIPT - FASE 9
-- ============================================================================
