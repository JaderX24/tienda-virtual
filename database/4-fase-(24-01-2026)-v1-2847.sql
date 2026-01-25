-- ============================================================================
-- TIENDA VIRTUAL - FASE 4
-- ============================================================================
-- Módulo: Catálogo de Productos (Escalable - Estilo Amazon)
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script implementa:
-- - Categorías jerárquicas multinivel
-- - Productos con variantes (SKU)
-- - Atributos dinámicos
-- - Sistema de precios multi-moneda
-- - Inventario multi-almacén
-- - Imágenes y multimedia
-- - SEO optimizado
-- - Marcas y fabricantes
-- - Reseñas y valoraciones
-- ============================================================================
-- Ejecutar DESPUÉS de las Fases 1, 2 y 3
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- ESQUEMA: CATÁLOGO - MARCAS Y FABRICANTES
-- ============================================================================

-- Tabla de marcas
CREATE TABLE catalogo_marcas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    logo_url VARCHAR(500),
    sitio_web VARCHAR(255),
    
    -- SEO
    meta_titulo VARCHAR(200),
    meta_descripcion VARCHAR(500),
    
    -- Control
    es_destacada BOOLEAN NOT NULL DEFAULT FALSE,
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    es_global BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    actualizado_por INT UNSIGNED,
    
    INDEX idx_slug (slug),
    INDEX idx_nombre (nombre),
    INDEX idx_activa (es_activa),
    INDEX idx_destacada (es_destacada),
    INDEX idx_empresa (empresa_id),
    CONSTRAINT fk_marca_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: CATÁLOGO - CATEGORÍAS
-- ============================================================================

-- Tabla de categorías (jerárquica - multinivel)
CREATE TABLE catalogo_categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    
    -- Jerarquía
    categoria_padre_id INT UNSIGNED,
    nivel TINYINT UNSIGNED NOT NULL DEFAULT 1,
    ruta_completa VARCHAR(500),
    ruta_ids VARCHAR(200),
    
    -- Imágenes
    imagen_url VARCHAR(500),
    icono VARCHAR(100),
    banner_url VARCHAR(500),
    
    -- SEO
    meta_titulo VARCHAR(200),
    meta_descripcion VARCHAR(500),
    palabras_clave TEXT,
    
    -- Configuración
    es_destacada BOOLEAN NOT NULL DEFAULT FALSE,
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    es_visible_menu BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Plantilla de atributos (qué atributos aplican a esta categoría)
    plantilla_atributos_id INT UNSIGNED,
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    es_global BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Estadísticas (desnormalizadas para performance)
    total_productos INT UNSIGNED NOT NULL DEFAULT 0,
    total_subcategorias INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    actualizado_por INT UNSIGNED,
    
    INDEX idx_slug (slug),
    INDEX idx_padre (categoria_padre_id),
    INDEX idx_nivel (nivel),
    INDEX idx_activa (es_activa),
    INDEX idx_visible (es_visible_menu),
    INDEX idx_destacada (es_destacada),
    INDEX idx_empresa (empresa_id),
    INDEX idx_ruta_ids (ruta_ids),
    CONSTRAINT fk_categoria_padre 
        FOREIGN KEY (categoria_padre_id) REFERENCES catalogo_categorias(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_categoria_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: CATÁLOGO - ATRIBUTOS DINÁMICOS
-- ============================================================================

-- Grupos de atributos (ej: Especificaciones técnicas, Dimensiones)
CREATE TABLE catalogo_atributos_grupos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_orden (orden),
    INDEX idx_activo (es_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Definición de atributos (ej: Color, Talla, Memoria RAM)
CREATE TABLE catalogo_atributos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    grupo_id INT UNSIGNED,
    
    -- Tipo de atributo
    tipo_dato ENUM(
        'texto', 'numero', 'decimal', 'booleano', 
        'fecha', 'seleccion', 'seleccion_multiple',
        'color', 'rango_numerico', 'dimension'
    ) NOT NULL DEFAULT 'texto',
    
    -- Configuración según tipo
    opciones_predefinidas JSON,
    unidad_medida VARCHAR(20),
    valor_minimo DECIMAL(15,4),
    valor_maximo DECIMAL(15,4),
    
    -- Comportamiento
    es_filtrable BOOLEAN NOT NULL DEFAULT TRUE,
    es_buscable BOOLEAN NOT NULL DEFAULT TRUE,
    es_visible_listado BOOLEAN NOT NULL DEFAULT FALSE,
    es_visible_detalle BOOLEAN NOT NULL DEFAULT TRUE,
    es_requerido BOOLEAN NOT NULL DEFAULT FALSE,
    es_variante BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_grupo (grupo_id),
    INDEX idx_tipo (tipo_dato),
    INDEX idx_filtrable (es_filtrable),
    INDEX idx_variante (es_variante),
    INDEX idx_activo (es_activo),
    CONSTRAINT fk_atributo_grupo 
        FOREIGN KEY (grupo_id) REFERENCES catalogo_atributos_grupos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación Categoría-Atributos (qué atributos aplican a cada categoría)
CREATE TABLE catalogo_categorias_atributos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT UNSIGNED NOT NULL,
    atributo_id INT UNSIGNED NOT NULL,
    es_requerido BOOLEAN NOT NULL DEFAULT FALSE,
    es_heredable BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_categoria_atributo (categoria_id, atributo_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_atributo (atributo_id),
    CONSTRAINT fk_cat_attr_categoria 
        FOREIGN KEY (categoria_id) REFERENCES catalogo_categorias(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cat_attr_atributo 
        FOREIGN KEY (atributo_id) REFERENCES catalogo_atributos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: CATÁLOGO - PRODUCTOS
-- ============================================================================

-- Tabla principal de productos
CREATE TABLE catalogo_productos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    sku VARCHAR(50) NOT NULL UNIQUE,
    codigo_barras VARCHAR(50),
    codigo_fabricante VARCHAR(100),
    
    -- Información básica
    nombre VARCHAR(300) NOT NULL,
    slug VARCHAR(350) NOT NULL UNIQUE,
    descripcion_corta VARCHAR(500),
    descripcion TEXT,
    
    -- Relaciones principales
    categoria_id INT UNSIGNED NOT NULL,
    marca_id INT UNSIGNED,
    empresa_id INT UNSIGNED,
    
    -- Tipo de producto
    tipo_producto ENUM(
        'simple',
        'variable',
        'digital',
        'servicio',
        'suscripcion',
        'paquete'
    ) NOT NULL DEFAULT 'simple',
    
    -- Estado
    estado ENUM(
        'borrador',
        'pendiente_revision',
        'publicado',
        'pausado',
        'agotado',
        'descontinuado'
    ) NOT NULL DEFAULT 'borrador',
    
    -- Precios (precio base en moneda principal)
    precio_base DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    precio_comparacion DECIMAL(15,2),
    costo DECIMAL(15,2),
    margen_ganancia DECIMAL(5,2),
    
    -- Impuestos
    es_gravable BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_impuesto VARCHAR(20),
    porcentaje_impuesto DECIMAL(5,2) DEFAULT 15.00,
    
    -- Inventario (para productos simples)
    gestiona_inventario BOOLEAN NOT NULL DEFAULT TRUE,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_reservado INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    stock_maximo INT,
    permite_backorder BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Dimensiones y peso (para envío)
    peso DECIMAL(10,3),
    peso_unidad ENUM('g', 'kg', 'lb', 'oz') DEFAULT 'kg',
    largo DECIMAL(10,2),
    ancho DECIMAL(10,2),
    alto DECIMAL(10,2),
    dimension_unidad ENUM('cm', 'm', 'in', 'ft') DEFAULT 'cm',
    
    -- Envío
    requiere_envio BOOLEAN NOT NULL DEFAULT TRUE,
    envio_gratis BOOLEAN NOT NULL DEFAULT FALSE,
    clase_envio VARCHAR(50),
    
    -- Digital
    es_descargable BOOLEAN NOT NULL DEFAULT FALSE,
    archivo_url VARCHAR(500),
    limite_descargas INT,
    dias_expiracion_descarga INT,
    
    -- SEO
    meta_titulo VARCHAR(200),
    meta_descripcion VARCHAR(500),
    palabras_clave TEXT,
    
    -- Configuración
    es_destacado BOOLEAN NOT NULL DEFAULT FALSE,
    es_nuevo BOOLEAN NOT NULL DEFAULT TRUE,
    es_visible BOOLEAN NOT NULL DEFAULT TRUE,
    permite_resenas BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Estadísticas (desnormalizadas)
    total_ventas INT UNSIGNED NOT NULL DEFAULT 0,
    total_vistas INT UNSIGNED NOT NULL DEFAULT 0,
    total_resenas INT UNSIGNED NOT NULL DEFAULT 0,
    promedio_calificacion DECIMAL(2,1) DEFAULT 0.0,
    
    -- Fechas especiales
    fecha_disponibilidad DATE,
    fecha_lanzamiento DATE,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    publicado_en DATETIME,
    creado_por INT UNSIGNED,
    actualizado_por INT UNSIGNED,
    
    -- Índices
    INDEX idx_sku (sku),
    INDEX idx_slug (slug),
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria_id),
    INDEX idx_marca (marca_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo_producto),
    INDEX idx_estado (estado),
    INDEX idx_precio (precio_base),
    INDEX idx_destacado (es_destacado),
    INDEX idx_visible (es_visible),
    INDEX idx_stock (stock_actual),
    INDEX idx_ventas (total_ventas),
    INDEX idx_calificacion (promedio_calificacion),
    FULLTEXT idx_busqueda (nombre, descripcion_corta, descripcion),
    
    CONSTRAINT fk_producto_categoria 
        FOREIGN KEY (categoria_id) REFERENCES catalogo_categorias(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_producto_marca 
        FOREIGN KEY (marca_id) REFERENCES catalogo_marcas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_producto_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: VARIANTES DE PRODUCTOS (SKU)
-- ============================================================================

-- Variantes de producto (combinaciones de atributos: Talla M + Color Azul)
CREATE TABLE catalogo_productos_variantes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    -- Identificación
    sku VARCHAR(50) NOT NULL UNIQUE,
    codigo_barras VARCHAR(50),
    nombre_variante VARCHAR(200),
    
    -- Precios (puede sobrescribir producto padre)
    precio DECIMAL(15,2),
    precio_comparacion DECIMAL(15,2),
    costo DECIMAL(15,2),
    
    -- Inventario específico de variante
    stock_actual INT NOT NULL DEFAULT 0,
    stock_reservado INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    
    -- Dimensiones específicas
    peso DECIMAL(10,3),
    largo DECIMAL(10,2),
    ancho DECIMAL(10,2),
    alto DECIMAL(10,2),
    
    -- Imagen específica de variante
    imagen_url VARCHAR(500),
    
    -- Estado
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    es_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Combinación de atributos (JSON para búsqueda rápida)
    atributos_json JSON,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_sku (sku),
    INDEX idx_stock (stock_actual),
    INDEX idx_activa (es_activa),
    INDEX idx_default (es_default),
    CONSTRAINT fk_variante_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valores de atributos por variante
CREATE TABLE catalogo_variantes_atributos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    variante_id BIGINT UNSIGNED NOT NULL,
    atributo_id INT UNSIGNED NOT NULL,
    valor_texto VARCHAR(500),
    valor_numero DECIMAL(15,4),
    valor_opcion_id INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_variante_atributo (variante_id, atributo_id),
    INDEX idx_variante (variante_id),
    INDEX idx_atributo (atributo_id),
    INDEX idx_valor_texto (valor_texto(100)),
    CONSTRAINT fk_var_attr_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_var_attr_atributo 
        FOREIGN KEY (atributo_id) REFERENCES catalogo_atributos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ATRIBUTOS DE PRODUCTOS (ESPECIFICACIONES)
-- ============================================================================

-- Valores de atributos del producto (no variantes, especificaciones)
CREATE TABLE catalogo_productos_atributos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    atributo_id INT UNSIGNED NOT NULL,
    
    -- Valor según tipo de atributo
    valor_texto VARCHAR(500),
    valor_numero DECIMAL(15,4),
    valor_booleano BOOLEAN,
    valor_fecha DATE,
    valor_json JSON,
    
    -- Control
    es_visible BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_producto_atributo (producto_id, atributo_id),
    INDEX idx_producto (producto_id),
    INDEX idx_atributo (atributo_id),
    INDEX idx_valor_texto (valor_texto(100)),
    INDEX idx_valor_numero (valor_numero),
    CONSTRAINT fk_prod_attr_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_prod_attr_atributo 
        FOREIGN KEY (atributo_id) REFERENCES catalogo_atributos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: IMÁGENES Y MULTIMEDIA
-- ============================================================================

-- Galería de imágenes del producto
CREATE TABLE catalogo_productos_imagenes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    
    -- URLs de imagen
    url_original VARCHAR(500) NOT NULL,
    url_thumbnail VARCHAR(500),
    url_mediana VARCHAR(500),
    url_grande VARCHAR(500),
    
    -- Metadatos
    nombre_archivo VARCHAR(255),
    tipo_mime VARCHAR(50),
    tamano_bytes INT UNSIGNED,
    ancho_px INT UNSIGNED,
    alto_px INT UNSIGNED,
    
    -- SEO
    alt_text VARCHAR(255),
    titulo VARCHAR(255),
    
    -- Control
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_principal (es_principal),
    INDEX idx_orden (orden),
    CONSTRAINT fk_imagen_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_imagen_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Videos del producto
CREATE TABLE catalogo_productos_videos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    tipo ENUM('youtube', 'vimeo', 'mp4', 'otro') NOT NULL DEFAULT 'youtube',
    url VARCHAR(500) NOT NULL,
    video_id VARCHAR(50),
    titulo VARCHAR(255),
    descripcion TEXT,
    thumbnail_url VARCHAR(500),
    duracion_segundos INT UNSIGNED,
    
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    CONSTRAINT fk_video_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PRECIOS Y PROMOCIONES
-- ============================================================================

-- Precios por moneda/región (multi-moneda)
CREATE TABLE catalogo_productos_precios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    
    -- Moneda y región
    moneda_codigo VARCHAR(3) NOT NULL DEFAULT 'HNL',
    pais_codigo VARCHAR(2),
    region_codigo VARCHAR(10),
    
    -- Precios
    precio DECIMAL(15,2) NOT NULL,
    precio_comparacion DECIMAL(15,2),
    costo DECIMAL(15,2),
    
    -- Vigencia
    fecha_inicio DATE,
    fecha_fin DATE,
    
    -- Control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_producto_moneda_region (producto_id, variante_id, moneda_codigo, pais_codigo, region_codigo),
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_moneda (moneda_codigo),
    INDEX idx_pais (pais_codigo),
    INDEX idx_vigencia (fecha_inicio, fecha_fin),
    CONSTRAINT fk_precio_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_precio_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de precios (para análisis)
CREATE TABLE catalogo_productos_precios_historial (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    moneda_codigo VARCHAR(3) NOT NULL,
    
    precio_anterior DECIMAL(15,2) NOT NULL,
    precio_nuevo DECIMAL(15,2) NOT NULL,
    porcentaje_cambio DECIMAL(5,2),
    motivo VARCHAR(200),
    
    cambiado_por INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_historial_precio_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: INVENTARIO MULTI-ALMACÉN
-- ============================================================================

-- Almacenes/Bodegas
CREATE TABLE inventario_almacenes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Ubicación
    direccion TEXT,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    pais VARCHAR(100) NOT NULL DEFAULT 'Honduras',
    codigo_postal VARCHAR(20),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Contacto
    telefono VARCHAR(20),
    correo VARCHAR(255),
    responsable_nombre VARCHAR(200),
    
    -- Tipo
    tipo ENUM('principal', 'secundario', 'dropship', 'proveedor', 'virtual') NOT NULL DEFAULT 'secundario',
    
    -- Capacidad
    capacidad_unidades INT UNSIGNED,
    capacidad_m3 DECIMAL(10,2),
    
    -- Multi-empresa
    empresa_id INT UNSIGNED,
    
    -- Control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_punto_venta BOOLEAN NOT NULL DEFAULT FALSE,
    permite_envios BOOLEAN NOT NULL DEFAULT TRUE,
    prioridad_envio INT UNSIGNED NOT NULL DEFAULT 100,
    
    -- Horarios
    horario_apertura TIME,
    horario_cierre TIME,
    dias_operacion VARCHAR(50),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_tipo (tipo),
    INDEX idx_empresa (empresa_id),
    INDEX idx_activo (es_activo),
    INDEX idx_pais_ciudad (pais, ciudad),
    CONSTRAINT fk_almacen_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock por almacén
CREATE TABLE inventario_stock (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    almacen_id INT UNSIGNED NOT NULL,
    
    -- Cantidades
    cantidad_disponible INT NOT NULL DEFAULT 0,
    cantidad_reservada INT NOT NULL DEFAULT 0,
    cantidad_en_transito INT NOT NULL DEFAULT 0,
    cantidad_danada INT NOT NULL DEFAULT 0,
    
    -- Umbrales
    stock_minimo INT NOT NULL DEFAULT 5,
    stock_maximo INT,
    punto_reorden INT,
    
    -- Ubicación física en almacén
    ubicacion_pasillo VARCHAR(10),
    ubicacion_estante VARCHAR(10),
    ubicacion_nivel VARCHAR(10),
    ubicacion_bin VARCHAR(20),
    
    -- Costos
    costo_promedio DECIMAL(15,4),
    ultimo_costo DECIMAL(15,4),
    
    -- Fechas
    ultimo_movimiento DATETIME,
    ultimo_conteo DATETIME,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_producto_variante_almacen (producto_id, variante_id, almacen_id),
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_almacen (almacen_id),
    INDEX idx_disponible (cantidad_disponible),
    INDEX idx_bajo_stock (cantidad_disponible, stock_minimo),
    CONSTRAINT fk_stock_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_stock_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_stock_almacen 
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movimientos de inventario
CREATE TABLE inventario_movimientos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencias
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    almacen_origen_id INT UNSIGNED,
    almacen_destino_id INT UNSIGNED,
    
    -- Tipo de movimiento
    tipo ENUM(
        'entrada_compra',
        'entrada_devolucion',
        'entrada_ajuste',
        'entrada_transferencia',
        'salida_venta',
        'salida_devolucion',
        'salida_ajuste',
        'salida_transferencia',
        'salida_danado',
        'reserva',
        'liberacion_reserva',
        'conteo_inventario'
    ) NOT NULL,
    
    -- Cantidades
    cantidad INT NOT NULL,
    cantidad_anterior INT NOT NULL DEFAULT 0,
    cantidad_nueva INT NOT NULL DEFAULT 0,
    
    -- Costos
    costo_unitario DECIMAL(15,4),
    costo_total DECIMAL(15,4),
    
    -- Referencia a documento origen
    documento_tipo VARCHAR(50),
    documento_id BIGINT UNSIGNED,
    documento_numero VARCHAR(50),
    
    -- Descripción
    motivo TEXT,
    notas TEXT,
    
    -- Auditoría
    realizado_por INT UNSIGNED,
    ip_address VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_almacen_origen (almacen_origen_id),
    INDEX idx_almacen_destino (almacen_destino_id),
    INDEX idx_tipo (tipo),
    INDEX idx_documento (documento_tipo, documento_id),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_movimiento_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_almacen_origen 
        FOREIGN KEY (almacen_origen_id) REFERENCES inventario_almacenes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_almacen_destino 
        FOREIGN KEY (almacen_destino_id) REFERENCES inventario_almacenes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservas de inventario (pedidos pendientes)
CREATE TABLE inventario_reservas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    almacen_id INT UNSIGNED NOT NULL,
    
    cantidad INT NOT NULL,
    
    -- Referencia al pedido
    pedido_id BIGINT UNSIGNED,
    pedido_item_id BIGINT UNSIGNED,
    
    -- Estado
    estado ENUM('activa', 'confirmada', 'cancelada', 'expirada') NOT NULL DEFAULT 'activa',
    
    -- Tiempos
    expira_en DATETIME,
    confirmada_en DATETIME,
    cancelada_en DATETIME,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_almacen (almacen_id),
    INDEX idx_pedido (pedido_id),
    INDEX idx_estado (estado),
    INDEX idx_expira (expira_en),
    CONSTRAINT fk_reserva_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reserva_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reserva_almacen 
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ETIQUETAS Y TAGS
-- ============================================================================

CREATE TABLE catalogo_etiquetas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    color VARCHAR(7),
    
    -- SEO
    meta_titulo VARCHAR(200),
    meta_descripcion VARCHAR(500),
    
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_nombre (nombre),
    INDEX idx_activa (es_activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación productos-etiquetas
CREATE TABLE catalogo_productos_etiquetas (
    producto_id BIGINT UNSIGNED NOT NULL,
    etiqueta_id INT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (producto_id, etiqueta_id),
    INDEX idx_etiqueta (etiqueta_id),
    CONSTRAINT fk_prod_etiq_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_prod_etiq_etiqueta 
        FOREIGN KEY (etiqueta_id) REFERENCES catalogo_etiquetas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PRODUCTOS RELACIONADOS
-- ============================================================================

CREATE TABLE catalogo_productos_relacionados (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    producto_relacionado_id BIGINT UNSIGNED NOT NULL,
    
    tipo_relacion ENUM(
        'similar',
        'complementario',
        'accesorio',
        'repuesto',
        'upgrade',
        'frecuentemente_comprado_junto',
        'tambien_visto'
    ) NOT NULL DEFAULT 'similar',
    
    -- Si es bidireccional
    es_bidireccional BOOLEAN NOT NULL DEFAULT TRUE,
    
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_producto_relacionado (producto_id, producto_relacionado_id, tipo_relacion),
    INDEX idx_producto (producto_id),
    INDEX idx_relacionado (producto_relacionado_id),
    INDEX idx_tipo (tipo_relacion),
    CONSTRAINT fk_rel_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rel_relacionado 
        FOREIGN KEY (producto_relacionado_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: CATEGORÍAS ADICIONALES (Multi-categoría)
-- ============================================================================

CREATE TABLE catalogo_productos_categorias (
    producto_id BIGINT UNSIGNED NOT NULL,
    categoria_id INT UNSIGNED NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (producto_id, categoria_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_principal (es_principal),
    CONSTRAINT fk_prod_cat_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_prod_cat_categoria 
        FOREIGN KEY (categoria_id) REFERENCES catalogo_categorias(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NUEVOS MÓDULOS Y PERMISOS
-- ============================================================================

-- Módulos de catálogo
INSERT INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('catalogo', 'Catálogo', 'Gestión del catálogo', 'bi-box-seam', '/admin/catalogo', 14, TRUE),
('catalogo_categorias', 'Categorías', 'Gestión de categorías', 'bi-diagram-3', '/admin/catalogo/categorias', 15, TRUE),
('catalogo_marcas', 'Marcas', 'Gestión de marcas', 'bi-bookmark-star', '/admin/catalogo/marcas', 16, TRUE),
('inventario', 'Inventario', 'Control de inventario', 'bi-boxes', '/admin/inventario', 17, TRUE),
('almacenes', 'Almacenes', 'Gestión de almacenes', 'bi-building', '/admin/inventario/almacenes', 18, TRUE);

-- Permisos para catálogo
INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'catalogo.ver', 'Ver catálogo', id, 'ver' FROM admin_modulos WHERE codigo = 'catalogo'
UNION ALL
SELECT 'catalogo.crear', 'Crear productos', id, 'crear' FROM admin_modulos WHERE codigo = 'catalogo'
UNION ALL
SELECT 'catalogo.editar', 'Editar productos', id, 'editar' FROM admin_modulos WHERE codigo = 'catalogo'
UNION ALL
SELECT 'catalogo.eliminar', 'Eliminar productos', id, 'eliminar' FROM admin_modulos WHERE codigo = 'catalogo'
UNION ALL
SELECT 'catalogo.exportar', 'Exportar catálogo', id, 'exportar' FROM admin_modulos WHERE codigo = 'catalogo'
UNION ALL
SELECT 'catalogo.importar', 'Importar catálogo', id, 'importar' FROM admin_modulos WHERE codigo = 'catalogo';

INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'catalogo_categorias.ver', 'Ver categorías', id, 'ver' FROM admin_modulos WHERE codigo = 'catalogo_categorias'
UNION ALL
SELECT 'catalogo_categorias.crear', 'Crear categorías', id, 'crear' FROM admin_modulos WHERE codigo = 'catalogo_categorias'
UNION ALL
SELECT 'catalogo_categorias.editar', 'Editar categorías', id, 'editar' FROM admin_modulos WHERE codigo = 'catalogo_categorias'
UNION ALL
SELECT 'catalogo_categorias.eliminar', 'Eliminar categorías', id, 'eliminar' FROM admin_modulos WHERE codigo = 'catalogo_categorias';

INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'catalogo_marcas.ver', 'Ver marcas', id, 'ver' FROM admin_modulos WHERE codigo = 'catalogo_marcas'
UNION ALL
SELECT 'catalogo_marcas.crear', 'Crear marcas', id, 'crear' FROM admin_modulos WHERE codigo = 'catalogo_marcas'
UNION ALL
SELECT 'catalogo_marcas.editar', 'Editar marcas', id, 'editar' FROM admin_modulos WHERE codigo = 'catalogo_marcas'
UNION ALL
SELECT 'catalogo_marcas.eliminar', 'Eliminar marcas', id, 'eliminar' FROM admin_modulos WHERE codigo = 'catalogo_marcas';

INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'inventario.ver', 'Ver inventario', id, 'ver' FROM admin_modulos WHERE codigo = 'inventario'
UNION ALL
SELECT 'inventario.editar', 'Ajustar inventario', id, 'editar' FROM admin_modulos WHERE codigo = 'inventario'
UNION ALL
SELECT 'inventario.exportar', 'Exportar inventario', id, 'exportar' FROM admin_modulos WHERE codigo = 'inventario';

INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'almacenes.ver', 'Ver almacenes', id, 'ver' FROM admin_modulos WHERE codigo = 'almacenes'
UNION ALL
SELECT 'almacenes.crear', 'Crear almacenes', id, 'crear' FROM admin_modulos WHERE codigo = 'almacenes'
UNION ALL
SELECT 'almacenes.editar', 'Editar almacenes', id, 'editar' FROM admin_modulos WHERE codigo = 'almacenes'
UNION ALL
SELECT 'almacenes.eliminar', 'Eliminar almacenes', id, 'eliminar' FROM admin_modulos WHERE codigo = 'almacenes';

-- Asignar permisos al super_admin
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos 
WHERE codigo LIKE 'catalogo%' 
   OR codigo LIKE 'inventario%' 
   OR codigo LIKE 'almacenes%';

-- Permisos para rol bodega (solo inventario)
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 
    (SELECT id FROM admin_roles WHERE codigo = 'bodega'),
    id 
FROM admin_permisos 
WHERE codigo IN ('inventario.ver', 'inventario.editar', 'catalogo.ver');

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de productos con stock total
CREATE OR REPLACE VIEW vista_productos_stock AS
SELECT 
    p.id,
    p.sku,
    p.nombre,
    p.slug,
    p.estado,
    p.precio_base,
    c.nombre AS categoria,
    m.nombre AS marca,
    p.stock_actual AS stock_propio,
    COALESCE(SUM(s.cantidad_disponible), 0) AS stock_almacenes,
    COALESCE(SUM(s.cantidad_reservada), 0) AS stock_reservado,
    (p.stock_actual + COALESCE(SUM(s.cantidad_disponible), 0) - COALESCE(SUM(s.cantidad_reservada), 0)) AS stock_disponible_total,
    p.stock_minimo,
    CASE 
        WHEN (p.stock_actual + COALESCE(SUM(s.cantidad_disponible), 0)) <= 0 THEN 'sin_stock'
        WHEN (p.stock_actual + COALESCE(SUM(s.cantidad_disponible), 0)) <= p.stock_minimo THEN 'bajo_stock'
        ELSE 'en_stock'
    END AS estado_stock
FROM catalogo_productos p
LEFT JOIN catalogo_categorias c ON p.categoria_id = c.id
LEFT JOIN catalogo_marcas m ON p.marca_id = m.id
LEFT JOIN inventario_stock s ON p.id = s.producto_id AND s.variante_id IS NULL
GROUP BY p.id, c.nombre, m.nombre;

-- Vista de productos bajo stock
CREATE OR REPLACE VIEW vista_productos_bajo_stock AS
SELECT 
    p.id,
    p.sku,
    p.nombre,
    a.nombre AS almacen,
    s.cantidad_disponible,
    s.stock_minimo,
    (s.stock_minimo - s.cantidad_disponible) AS cantidad_faltante,
    p.estado
FROM catalogo_productos p
JOIN inventario_stock s ON p.id = s.producto_id
JOIN inventario_almacenes a ON s.almacen_id = a.id
WHERE s.cantidad_disponible <= s.stock_minimo
AND a.es_activo = TRUE
ORDER BY (s.stock_minimo - s.cantidad_disponible) DESC;

-- Vista de categorías con conteo
CREATE OR REPLACE VIEW vista_categorias_arbol AS
SELECT 
    c.id,
    c.codigo,
    c.nombre,
    c.slug,
    c.nivel,
    c.ruta_completa,
    cp.nombre AS categoria_padre,
    c.total_productos,
    c.total_subcategorias,
    c.es_activa,
    c.es_visible_menu
FROM catalogo_categorias c
LEFT JOIN catalogo_categorias cp ON c.categoria_padre_id = cp.id
ORDER BY c.ruta_ids, c.orden;

-- Vista de movimientos de inventario recientes
CREATE OR REPLACE VIEW vista_movimientos_recientes AS
SELECT 
    m.id,
    m.tipo,
    p.sku,
    p.nombre AS producto,
    pv.sku AS variante_sku,
    ao.nombre AS almacen_origen,
    ad.nombre AS almacen_destino,
    m.cantidad,
    m.costo_total,
    m.documento_tipo,
    m.documento_numero,
    m.motivo,
    CONCAT(u.nombre, ' ', u.apellido) AS realizado_por,
    m.creado_en
FROM inventario_movimientos m
JOIN catalogo_productos p ON m.producto_id = p.id
LEFT JOIN catalogo_productos_variantes pv ON m.variante_id = pv.id
LEFT JOIN inventario_almacenes ao ON m.almacen_origen_id = ao.id
LEFT JOIN inventario_almacenes ad ON m.almacen_destino_id = ad.id
LEFT JOIN admin_usuarios u ON m.realizado_por = u.id
ORDER BY m.creado_en DESC
LIMIT 1000;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Procedimiento para actualizar ruta de categoría
CREATE PROCEDURE sp_actualizar_ruta_categoria(IN p_categoria_id INT UNSIGNED)
BEGIN
    DECLARE v_ruta_nombre VARCHAR(500) DEFAULT '';
    DECLARE v_ruta_ids VARCHAR(200) DEFAULT '';
    DECLARE v_nivel INT DEFAULT 0;
    DECLARE v_padre_id INT UNSIGNED;
    DECLARE v_nombre VARCHAR(150);
    DECLARE v_current_id INT UNSIGNED;
    
    SET v_current_id = p_categoria_id;
    
    WHILE v_current_id IS NOT NULL DO
        SELECT nombre, categoria_padre_id 
        INTO v_nombre, v_padre_id
        FROM catalogo_categorias 
        WHERE id = v_current_id;
        
        IF v_ruta_nombre = '' THEN
            SET v_ruta_nombre = v_nombre;
            SET v_ruta_ids = CAST(v_current_id AS CHAR);
        ELSE
            SET v_ruta_nombre = CONCAT(v_nombre, ' > ', v_ruta_nombre);
            SET v_ruta_ids = CONCAT(CAST(v_current_id AS CHAR), ',', v_ruta_ids);
        END IF;
        
        SET v_nivel = v_nivel + 1;
        SET v_current_id = v_padre_id;
    END WHILE;
    
    UPDATE catalogo_categorias 
    SET ruta_completa = v_ruta_nombre,
        ruta_ids = v_ruta_ids,
        nivel = v_nivel
    WHERE id = p_categoria_id;
END //

-- Procedimiento para registrar movimiento de inventario
CREATE PROCEDURE sp_registrar_movimiento_inventario(
    IN p_producto_id BIGINT UNSIGNED,
    IN p_variante_id BIGINT UNSIGNED,
    IN p_almacen_origen_id INT UNSIGNED,
    IN p_almacen_destino_id INT UNSIGNED,
    IN p_tipo VARCHAR(50),
    IN p_cantidad INT,
    IN p_costo_unitario DECIMAL(15,4),
    IN p_documento_tipo VARCHAR(50),
    IN p_documento_id BIGINT UNSIGNED,
    IN p_documento_numero VARCHAR(50),
    IN p_motivo TEXT,
    IN p_usuario_id INT UNSIGNED
)
BEGIN
    DECLARE v_cantidad_anterior INT DEFAULT 0;
    DECLARE v_cantidad_nueva INT DEFAULT 0;
    DECLARE v_almacen_afectado INT UNSIGNED;
    DECLARE v_es_salida BOOLEAN;
    
    SET v_es_salida = p_tipo LIKE 'salida%' OR p_tipo = 'reserva';
    SET v_almacen_afectado = IF(v_es_salida, p_almacen_origen_id, p_almacen_destino_id);
    
    IF v_almacen_afectado IS NOT NULL THEN
        SELECT cantidad_disponible INTO v_cantidad_anterior
        FROM inventario_stock
        WHERE producto_id = p_producto_id 
        AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL))
        AND almacen_id = v_almacen_afectado
        FOR UPDATE;
        
        IF v_es_salida THEN
            SET v_cantidad_nueva = v_cantidad_anterior - p_cantidad;
        ELSE
            SET v_cantidad_nueva = v_cantidad_anterior + p_cantidad;
        END IF;
        
        INSERT INTO inventario_stock (
            producto_id, variante_id, almacen_id, 
            cantidad_disponible, ultimo_movimiento
        ) VALUES (
            p_producto_id, p_variante_id, v_almacen_afectado,
            IF(v_es_salida, -p_cantidad, p_cantidad), NOW()
        )
        ON DUPLICATE KEY UPDATE
            cantidad_disponible = cantidad_disponible + IF(v_es_salida, -p_cantidad, p_cantidad),
            ultimo_movimiento = NOW();
    END IF;
    
    INSERT INTO inventario_movimientos (
        producto_id, variante_id, almacen_origen_id, almacen_destino_id,
        tipo, cantidad, cantidad_anterior, cantidad_nueva,
        costo_unitario, costo_total,
        documento_tipo, documento_id, documento_numero,
        motivo, realizado_por
    ) VALUES (
        p_producto_id, p_variante_id, p_almacen_origen_id, p_almacen_destino_id,
        p_tipo, p_cantidad, v_cantidad_anterior, v_cantidad_nueva,
        p_costo_unitario, p_cantidad * COALESCE(p_costo_unitario, 0),
        p_documento_tipo, p_documento_id, p_documento_numero,
        p_motivo, p_usuario_id
    );
    
    SELECT LAST_INSERT_ID() AS movimiento_id, v_cantidad_nueva AS stock_actual;
END //

-- Función para obtener stock disponible de un producto
CREATE FUNCTION fn_obtener_stock_disponible(
    p_producto_id BIGINT UNSIGNED,
    p_variante_id BIGINT UNSIGNED,
    p_almacen_id INT UNSIGNED
) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_stock INT DEFAULT 0;
    
    IF p_almacen_id IS NOT NULL THEN
        SELECT COALESCE(cantidad_disponible - cantidad_reservada, 0) INTO v_stock
        FROM inventario_stock
        WHERE producto_id = p_producto_id
        AND (variante_id = p_variante_id OR (variante_id IS NULL AND p_variante_id IS NULL))
        AND almacen_id = p_almacen_id;
    ELSE
        SELECT COALESCE(SUM(cantidad_disponible - cantidad_reservada), 0) INTO v_stock
        FROM inventario_stock s
        JOIN inventario_almacenes a ON s.almacen_id = a.id
        WHERE s.producto_id = p_producto_id
        AND (s.variante_id = p_variante_id OR (s.variante_id IS NULL AND p_variante_id IS NULL))
        AND a.es_activo = TRUE;
    END IF;
    
    RETURN v_stock;
END //

-- Procedimiento para generar slug único
CREATE PROCEDURE sp_generar_slug(
    IN p_texto VARCHAR(500),
    IN p_tabla VARCHAR(100),
    OUT p_slug VARCHAR(500)
)
BEGIN
    DECLARE v_slug_base VARCHAR(500);
    DECLARE v_slug VARCHAR(500);
    DECLARE v_contador INT DEFAULT 0;
    DECLARE v_existe INT DEFAULT 1;
    
    SET v_slug_base = LOWER(p_texto);
    SET v_slug_base = REPLACE(v_slug_base, ' ', '-');
    SET v_slug_base = REPLACE(v_slug_base, 'á', 'a');
    SET v_slug_base = REPLACE(v_slug_base, 'é', 'e');
    SET v_slug_base = REPLACE(v_slug_base, 'í', 'i');
    SET v_slug_base = REPLACE(v_slug_base, 'ó', 'o');
    SET v_slug_base = REPLACE(v_slug_base, 'ú', 'u');
    SET v_slug_base = REPLACE(v_slug_base, 'ñ', 'n');
    SET v_slug_base = REPLACE(v_slug_base, 'ü', 'u');
    
    SET v_slug = v_slug_base;
    
    WHILE v_existe > 0 DO
        IF p_tabla = 'catalogo_productos' THEN
            SELECT COUNT(*) INTO v_existe FROM catalogo_productos WHERE slug = v_slug;
        ELSEIF p_tabla = 'catalogo_categorias' THEN
            SELECT COUNT(*) INTO v_existe FROM catalogo_categorias WHERE slug = v_slug;
        ELSEIF p_tabla = 'catalogo_marcas' THEN
            SELECT COUNT(*) INTO v_existe FROM catalogo_marcas WHERE slug = v_slug;
        ELSE
            SET v_existe = 0;
        END IF;
        
        IF v_existe > 0 THEN
            SET v_contador = v_contador + 1;
            SET v_slug = CONCAT(v_slug_base, '-', v_contador);
        END IF;
    END WHILE;
    
    SET p_slug = v_slug;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger para actualizar contadores de categoría al insertar producto
CREATE TRIGGER trg_producto_insert_categoria
AFTER INSERT ON catalogo_productos
FOR EACH ROW
BEGIN
    UPDATE catalogo_categorias 
    SET total_productos = total_productos + 1,
        actualizado_en = NOW()
    WHERE id = NEW.categoria_id;
END //

-- Trigger para actualizar contadores de categoría al eliminar producto
CREATE TRIGGER trg_producto_delete_categoria
AFTER DELETE ON catalogo_productos
FOR EACH ROW
BEGIN
    UPDATE catalogo_categorias 
    SET total_productos = total_productos - 1,
        actualizado_en = NOW()
    WHERE id = OLD.categoria_id;
END //

-- Trigger para actualizar contadores al cambiar categoría de producto
CREATE TRIGGER trg_producto_update_categoria
AFTER UPDATE ON catalogo_productos
FOR EACH ROW
BEGIN
    IF OLD.categoria_id <> NEW.categoria_id THEN
        UPDATE catalogo_categorias 
        SET total_productos = total_productos - 1
        WHERE id = OLD.categoria_id;
        
        UPDATE catalogo_categorias 
        SET total_productos = total_productos + 1
        WHERE id = NEW.categoria_id;
    END IF;
END //

-- Trigger para registrar historial de precios
CREATE TRIGGER trg_producto_precio_historial
BEFORE UPDATE ON catalogo_productos
FOR EACH ROW
BEGIN
    IF OLD.precio_base <> NEW.precio_base THEN
        INSERT INTO catalogo_productos_precios_historial (
            producto_id, moneda_codigo,
            precio_anterior, precio_nuevo,
            porcentaje_cambio, cambiado_por
        ) VALUES (
            NEW.id, 'HNL',
            OLD.precio_base, NEW.precio_base,
            ROUND(((NEW.precio_base - OLD.precio_base) / OLD.precio_base) * 100, 2),
            NEW.actualizado_por
        );
    END IF;
END //

-- Trigger para actualizar stock del producto desde stock de almacenes
CREATE TRIGGER trg_stock_actualizar_producto
AFTER UPDATE ON inventario_stock
FOR EACH ROW
BEGIN
    DECLARE v_stock_total INT;
    DECLARE v_reservado_total INT;
    
    IF NEW.variante_id IS NULL THEN
        SELECT 
            COALESCE(SUM(cantidad_disponible), 0),
            COALESCE(SUM(cantidad_reservada), 0)
        INTO v_stock_total, v_reservado_total
        FROM inventario_stock
        WHERE producto_id = NEW.producto_id
        AND variante_id IS NULL;
        
        UPDATE catalogo_productos
        SET stock_actual = v_stock_total,
            stock_reservado = v_reservado_total,
            actualizado_en = NOW()
        WHERE id = NEW.producto_id;
    ELSE
        SELECT 
            COALESCE(SUM(cantidad_disponible), 0),
            COALESCE(SUM(cantidad_reservada), 0)
        INTO v_stock_total, v_reservado_total
        FROM inventario_stock
        WHERE variante_id = NEW.variante_id;
        
        UPDATE catalogo_productos_variantes
        SET stock_actual = v_stock_total,
            stock_reservado = v_reservado_total,
            actualizado_en = NOW()
        WHERE id = NEW.variante_id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES DE EJEMPLO
-- ============================================================================

-- Grupos de atributos
INSERT INTO catalogo_atributos_grupos (codigo, nombre, orden) VALUES
('especificaciones', 'Especificaciones Técnicas', 1),
('dimensiones', 'Dimensiones y Peso', 2),
('apariencia', 'Apariencia', 3),
('conectividad', 'Conectividad', 4),
('rendimiento', 'Rendimiento', 5);

-- Atributos comunes
INSERT INTO catalogo_atributos (codigo, nombre, grupo_id, tipo_dato, es_filtrable, es_variante, opciones_predefinidas) VALUES
('color', 'Color', 3, 'color', TRUE, TRUE, '["Blanco", "Negro", "Azul", "Rojo", "Verde", "Gris", "Dorado", "Plateado"]'),
('talla', 'Talla', NULL, 'seleccion', TRUE, TRUE, '["XS", "S", "M", "L", "XL", "XXL", "XXXL"]'),
('talla_zapato', 'Talla de Zapato', NULL, 'seleccion', TRUE, TRUE, '["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]'),
('material', 'Material', 1, 'seleccion', TRUE, FALSE, '["Algodón", "Poliéster", "Cuero", "Plástico", "Metal", "Madera", "Vidrio"]'),
('memoria_ram', 'Memoria RAM', 1, 'seleccion', TRUE, TRUE, '["4GB", "8GB", "16GB", "32GB", "64GB", "128GB"]'),
('almacenamiento', 'Almacenamiento', 1, 'seleccion', TRUE, TRUE, '["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]'),
('peso', 'Peso', 2, 'decimal', TRUE, FALSE, NULL),
('garantia_meses', 'Garantía (meses)', 1, 'numero', TRUE, FALSE, NULL);

-- Actualizar unidades de medida
UPDATE catalogo_atributos SET unidad_medida = 'kg' WHERE codigo = 'peso';

-- Almacén principal
INSERT INTO inventario_almacenes (codigo, nombre, tipo, direccion, ciudad, departamento, es_activo, prioridad_envio) VALUES
('ALM-CENTRAL', 'Almacén Central', 'principal', 'Boulevard Morazán, Edificio Central', 'Tegucigalpa', 'Francisco Morazán', TRUE, 1),
('ALM-SPS', 'Almacén San Pedro Sula', 'secundario', 'Zona Industrial, Sector Norte', 'San Pedro Sula', 'Cortés', TRUE, 2);

-- Categorías de ejemplo
INSERT INTO catalogo_categorias (codigo, nombre, slug, descripcion, nivel, es_activa, es_visible_menu) VALUES
('electronica', 'Electrónica', 'electronica', 'Dispositivos electrónicos y gadgets', 1, TRUE, TRUE),
('ropa', 'Ropa y Moda', 'ropa-moda', 'Ropa, calzado y accesorios de moda', 1, TRUE, TRUE),
('hogar', 'Hogar y Jardín', 'hogar-jardin', 'Artículos para el hogar y jardín', 1, TRUE, TRUE),
('deportes', 'Deportes', 'deportes', 'Artículos deportivos y fitness', 1, TRUE, TRUE);

-- Subcategorías
INSERT INTO catalogo_categorias (codigo, nombre, slug, descripcion, categoria_padre_id, nivel, es_activa, es_visible_menu) VALUES
('celulares', 'Celulares y Smartphones', 'electronica/celulares', 'Teléfonos móviles y smartphones', 1, 2, TRUE, TRUE),
('laptops', 'Laptops y Computadoras', 'electronica/laptops', 'Computadoras portátiles y de escritorio', 1, 2, TRUE, TRUE),
('audio', 'Audio y Sonido', 'electronica/audio', 'Audífonos, bocinas y equipos de sonido', 1, 2, TRUE, TRUE),
('ropa_hombre', 'Ropa de Hombre', 'ropa/hombre', 'Ropa para caballeros', 2, 2, TRUE, TRUE),
('ropa_mujer', 'Ropa de Mujer', 'ropa/mujer', 'Ropa para damas', 2, 2, TRUE, TRUE),
('zapatos', 'Zapatos', 'ropa/zapatos', 'Calzado para toda la familia', 2, 2, TRUE, TRUE);

-- Actualizar rutas de categorías
CALL sp_actualizar_ruta_categoria(1);
CALL sp_actualizar_ruta_categoria(2);
CALL sp_actualizar_ruta_categoria(3);
CALL sp_actualizar_ruta_categoria(4);
CALL sp_actualizar_ruta_categoria(5);
CALL sp_actualizar_ruta_categoria(6);
CALL sp_actualizar_ruta_categoria(7);
CALL sp_actualizar_ruta_categoria(8);
CALL sp_actualizar_ruta_categoria(9);
CALL sp_actualizar_ruta_categoria(10);

-- Marcas de ejemplo
INSERT INTO catalogo_marcas (codigo, nombre, slug, es_destacada, es_activa) VALUES
('apple', 'Apple', 'apple', TRUE, TRUE),
('samsung', 'Samsung', 'samsung', TRUE, TRUE),
('sony', 'Sony', 'sony', TRUE, TRUE),
('nike', 'Nike', 'nike', TRUE, TRUE),
('adidas', 'Adidas', 'adidas', TRUE, TRUE),
('lg', 'LG', 'lg', FALSE, TRUE),
('hp', 'HP', 'hp', FALSE, TRUE),
('dell', 'Dell', 'dell', FALSE, TRUE);

-- Etiquetas
INSERT INTO catalogo_etiquetas (nombre, slug, color) VALUES
('Nuevo', 'nuevo', '#28a745'),
('Oferta', 'oferta', '#dc3545'),
('Más Vendido', 'mas-vendido', '#ffc107'),
('Recomendado', 'recomendado', '#17a2b8'),
('Edición Limitada', 'edicion-limitada', '#6f42c1'),
('Envío Gratis', 'envio-gratis', '#007bff');

-- ============================================================================
-- FIN DEL SCRIPT - FASE 4
-- ============================================================================
