-- ============================================================================
-- TIENDA VIRTUAL - FASE 10: BÚSQUEDA AVANZADA
-- ============================================================================
-- Versión: 1.0
-- Fecha: 24-01-2026
-- Descripción: Sistema completo de búsqueda con filtros facetados,
--              autocompletado, sinónimos, historial y tendencias
-- Dependencias: Fases 1-9 instaladas
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
DROP VIEW IF EXISTS vista_busquedas_populares;
DROP VIEW IF EXISTS vista_sugerencias_activas;
DROP VIEW IF EXISTS vista_sinonimos_activos;
DROP VIEW IF EXISTS vista_filtros_facetados;
DROP VIEW IF EXISTS vista_tendencias_busqueda;

-- Eliminar procedimientos
DROP PROCEDURE IF EXISTS sp_buscar_productos;
DROP PROCEDURE IF EXISTS sp_obtener_sugerencias;
DROP PROCEDURE IF EXISTS sp_registrar_busqueda;
DROP PROCEDURE IF EXISTS sp_obtener_filtros_facetados;
DROP PROCEDURE IF EXISTS sp_busqueda_con_sinonimos;
DROP PROCEDURE IF EXISTS sp_actualizar_tendencias;
DROP PROCEDURE IF EXISTS sp_limpiar_historial_antiguo;

-- Eliminar funciones
DROP FUNCTION IF EXISTS fn_expandir_sinonimos;
DROP FUNCTION IF EXISTS fn_calcular_relevancia;

-- Eliminar eventos
DROP EVENT IF EXISTS evento_actualizar_tendencias;
DROP EVENT IF EXISTS evento_limpiar_historial;
DROP EVENT IF EXISTS evento_recalcular_popularidad;

-- Eliminar triggers
DROP TRIGGER IF EXISTS trg_actualizar_indice_producto;
DROP TRIGGER IF EXISTS trg_click_conversion;

-- Eliminar tablas
DROP TABLE IF EXISTS busqueda_clicks;
DROP TABLE IF EXISTS busqueda_historial;
DROP TABLE IF EXISTS busqueda_guardadas;
DROP TABLE IF EXISTS busqueda_tendencias;
DROP TABLE IF EXISTS busqueda_sugerencias;
DROP TABLE IF EXISTS busqueda_sinonimos_terminos;
DROP TABLE IF EXISTS busqueda_sinonimos_grupos;
DROP TABLE IF EXISTS busqueda_palabras_excluidas;
DROP TABLE IF EXISTS busqueda_palabras_clave;
DROP TABLE IF EXISTS busqueda_filtros_valores;
DROP TABLE IF EXISTS busqueda_filtros;
DROP TABLE IF EXISTS busqueda_indices_productos;
DROP TABLE IF EXISTS busqueda_configuracion;
DROP TABLE IF EXISTS busqueda_correcciones;
DROP TABLE IF EXISTS busqueda_autocompletado;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLA: busqueda_configuracion
-- Configuración general del motor de búsqueda
-- ============================================================================

CREATE TABLE busqueda_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato ENUM('texto', 'numero', 'booleano', 'json') DEFAULT 'texto',
    descripcion VARCHAR(500),
    empresa_id INT UNSIGNED NULL,
    es_global BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_config_clave_empresa (clave, empresa_id),
    INDEX idx_config_empresa (empresa_id),
    
    CONSTRAINT fk_busq_config_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_indices_productos
-- Índice de texto completo para búsqueda rápida
-- ============================================================================

CREATE TABLE busqueda_indices_productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED NOT NULL,
    
    -- Campos indexables
    nombre VARCHAR(500) NOT NULL,
    descripcion_corta TEXT,
    descripcion_larga TEXT,
    palabras_clave TEXT,
    marca VARCHAR(200),
    categoria_nombre VARCHAR(200),
    categoria_ruta TEXT,
    atributos_texto TEXT,
    sku VARCHAR(100),
    codigo_barras VARCHAR(100),
    
    -- Metadatos para ranking
    precio_actual DECIMAL(12,2),
    precio_anterior DECIMAL(12,2),
    tiene_descuento BOOLEAN DEFAULT FALSE,
    porcentaje_descuento DECIMAL(5,2) DEFAULT 0,
    stock_disponible INT DEFAULT 0,
    total_ventas INT UNSIGNED DEFAULT 0,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0,
    total_resenas INT UNSIGNED DEFAULT 0,
    
    -- Control
    es_activo BOOLEAN DEFAULT TRUE,
    ultima_indexacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_indice_producto (producto_id),
    INDEX idx_indice_empresa (empresa_id),
    INDEX idx_indice_activo (es_activo),
    INDEX idx_indice_precio (precio_actual),
    INDEX idx_indice_ventas (total_ventas),
    INDEX idx_indice_calificacion (calificacion_promedio),
    
    -- Índice FULLTEXT para búsqueda de texto completo
    FULLTEXT INDEX ft_busqueda_producto (nombre, descripcion_corta, palabras_clave, marca, categoria_nombre),
    FULLTEXT INDEX ft_busqueda_completa (nombre, descripcion_corta, descripcion_larga, palabras_clave, marca, categoria_nombre, atributos_texto),
    
    CONSTRAINT fk_busq_indice_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_busq_indice_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_sinonimos_grupos
-- Grupos de sinónimos para expandir búsquedas
-- ============================================================================

CREATE TABLE busqueda_sinonimos_grupos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion VARCHAR(500),
    tipo ENUM('sinonimo', 'variacion', 'correccion', 'expansion') DEFAULT 'sinonimo',
    idioma VARCHAR(10) DEFAULT 'es',
    empresa_id INT UNSIGNED NULL,
    es_global BOOLEAN DEFAULT TRUE,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sinonimos_grupo_empresa (empresa_id),
    INDEX idx_sinonimos_grupo_tipo (tipo),
    INDEX idx_sinonimos_grupo_activo (es_activo),
    
    CONSTRAINT fk_busq_sin_grupo_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_busq_sin_grupo_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_sinonimos_terminos
-- Términos dentro de cada grupo de sinónimos
-- ============================================================================

CREATE TABLE busqueda_sinonimos_terminos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    grupo_id INT UNSIGNED NOT NULL,
    termino VARCHAR(200) NOT NULL,
    es_termino_principal BOOLEAN DEFAULT FALSE,
    peso DECIMAL(3,2) DEFAULT 1.00,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_sinonimo_grupo_termino (grupo_id, termino),
    INDEX idx_sinonimo_termino (termino),
    INDEX idx_sinonimo_principal (es_termino_principal),
    
    CONSTRAINT fk_busq_sin_termino_grupo 
        FOREIGN KEY (grupo_id) REFERENCES busqueda_sinonimos_grupos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_palabras_excluidas
-- Stop words que se ignoran en búsquedas
-- ============================================================================

CREATE TABLE busqueda_palabras_excluidas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    palabra VARCHAR(100) NOT NULL,
    idioma VARCHAR(10) DEFAULT 'es',
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_palabra_excluida (palabra, idioma),
    INDEX idx_palabra_idioma (idioma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_palabras_clave
-- Palabras clave adicionales asociadas a productos
-- ============================================================================

CREATE TABLE busqueda_palabras_clave (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    palabra_clave VARCHAR(200) NOT NULL,
    peso DECIMAL(3,2) DEFAULT 1.00,
    origen ENUM('manual', 'automatico', 'ia') DEFAULT 'manual',
    creado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_producto_palabra (producto_id, palabra_clave),
    INDEX idx_palabra_clave (palabra_clave),
    
    CONSTRAINT fk_busq_palabra_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_busq_palabra_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_filtros
-- Definición de filtros facetados disponibles
-- ============================================================================

CREATE TABLE busqueda_filtros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    tipo ENUM('rango', 'lista', 'checkbox', 'color', 'talla', 'rating', 'precio', 'disponibilidad') NOT NULL,
    campo_origen VARCHAR(200) NOT NULL,
    tabla_origen VARCHAR(100),
    icono VARCHAR(100),
    orden INT DEFAULT 0,
    es_colapsable BOOLEAN DEFAULT TRUE,
    colapsado_por_defecto BOOLEAN DEFAULT FALSE,
    mostrar_conteo BOOLEAN DEFAULT TRUE,
    limite_valores INT DEFAULT 10,
    es_activo BOOLEAN DEFAULT TRUE,
    empresa_id INT UNSIGNED NULL,
    categoria_id INT UNSIGNED NULL,
    configuracion_extra JSON,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_filtro_codigo_empresa (codigo, empresa_id),
    INDEX idx_filtro_tipo (tipo),
    INDEX idx_filtro_activo (es_activo),
    INDEX idx_filtro_orden (orden),
    INDEX idx_filtro_categoria (categoria_id),
    
    CONSTRAINT fk_busq_filtro_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_busq_filtro_categoria 
        FOREIGN KEY (categoria_id) REFERENCES catalogo_categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_filtros_valores
-- Valores predefinidos para filtros tipo lista
-- ============================================================================

CREATE TABLE busqueda_filtros_valores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filtro_id INT UNSIGNED NOT NULL,
    valor VARCHAR(200) NOT NULL,
    etiqueta VARCHAR(200) NOT NULL,
    valor_adicional VARCHAR(200),
    icono VARCHAR(100),
    color_hex VARCHAR(7),
    orden INT DEFAULT 0,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_filtro_valor (filtro_id, valor),
    INDEX idx_filtro_valor_orden (filtro_id, orden),
    
    CONSTRAINT fk_busq_filtro_valor 
        FOREIGN KEY (filtro_id) REFERENCES busqueda_filtros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_autocompletado
-- Sugerencias de autocompletado
-- ============================================================================

CREATE TABLE busqueda_autocompletado (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    termino VARCHAR(300) NOT NULL,
    tipo ENUM('producto', 'categoria', 'marca', 'busqueda_popular', 'sugerencia') DEFAULT 'sugerencia',
    referencia_id INT UNSIGNED,
    referencia_tipo VARCHAR(50),
    imagen_url VARCHAR(500),
    texto_secundario VARCHAR(200),
    peso INT DEFAULT 0,
    busquedas_count INT UNSIGNED DEFAULT 0,
    empresa_id INT UNSIGNED NULL,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_autocompletado_termino (termino),
    INDEX idx_autocompletado_tipo (tipo),
    INDEX idx_autocompletado_peso (peso DESC),
    INDEX idx_autocompletado_empresa (empresa_id),
    
    CONSTRAINT fk_busq_auto_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_sugerencias
-- Sugerencias "Quizás quisiste decir..."
-- ============================================================================

CREATE TABLE busqueda_sugerencias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    termino_original VARCHAR(300) NOT NULL,
    termino_sugerido VARCHAR(300) NOT NULL,
    tipo ENUM('correccion', 'alternativa', 'relacionado') DEFAULT 'correccion',
    confianza DECIMAL(3,2) DEFAULT 0.80,
    veces_aceptada INT UNSIGNED DEFAULT 0,
    veces_rechazada INT UNSIGNED DEFAULT 0,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_sugerencia (termino_original, termino_sugerido),
    INDEX idx_sugerencia_original (termino_original),
    INDEX idx_sugerencia_confianza (confianza DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_correcciones
-- Correcciones ortográficas manuales
-- ============================================================================

CREATE TABLE busqueda_correcciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    termino_incorrecto VARCHAR(200) NOT NULL,
    termino_correcto VARCHAR(200) NOT NULL,
    es_automatica BOOLEAN DEFAULT FALSE,
    veces_aplicada INT UNSIGNED DEFAULT 0,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_correccion (termino_incorrecto),
    INDEX idx_correccion_correcto (termino_correcto),
    
    CONSTRAINT fk_busq_correccion_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_historial
-- Historial de búsquedas de usuarios
-- ============================================================================

CREATE TABLE busqueda_historial (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED,
    sesion_id VARCHAR(100),
    termino_busqueda VARCHAR(500) NOT NULL,
    termino_normalizado VARCHAR(500),
    filtros_aplicados JSON,
    ordenamiento VARCHAR(50),
    pagina INT DEFAULT 1,
    total_resultados INT UNSIGNED DEFAULT 0,
    tiempo_respuesta_ms INT UNSIGNED,
    tuvo_resultados BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    dispositivo ENUM('desktop', 'tablet', 'mobile') DEFAULT 'desktop',
    empresa_id INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_historial_cliente (cliente_id),
    INDEX idx_historial_sesion (sesion_id),
    INDEX idx_historial_termino (termino_busqueda(100)),
    INDEX idx_historial_fecha (creado_en),
    INDEX idx_historial_empresa (empresa_id),
    INDEX idx_historial_resultados (tuvo_resultados),
    
    CONSTRAINT fk_busq_historial_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_busq_historial_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_clicks
-- Clicks en resultados de búsqueda (para mejorar ranking)
-- ============================================================================

CREATE TABLE busqueda_clicks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    historial_id BIGINT UNSIGNED,
    producto_id BIGINT UNSIGNED NOT NULL,
    posicion_resultado INT,
    tipo_accion ENUM('click', 'agregar_carrito', 'compra', 'favorito') DEFAULT 'click',
    tiempo_hasta_click_segundos INT,
    cliente_id BIGINT UNSIGNED,
    sesion_id VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_click_historial (historial_id),
    INDEX idx_click_producto (producto_id),
    INDEX idx_click_cliente (cliente_id),
    INDEX idx_click_fecha (creado_en),
    INDEX idx_click_accion (tipo_accion),
    
    CONSTRAINT fk_busq_click_historial 
        FOREIGN KEY (historial_id) REFERENCES busqueda_historial(id) ON DELETE SET NULL,
    CONSTRAINT fk_busq_click_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_busq_click_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_guardadas
-- Búsquedas guardadas por usuarios
-- ============================================================================

CREATE TABLE busqueda_guardadas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(200),
    termino_busqueda VARCHAR(500) NOT NULL,
    filtros JSON,
    ordenamiento VARCHAR(50),
    notificar_nuevos BOOLEAN DEFAULT FALSE,
    frecuencia_notificacion ENUM('diario', 'semanal', 'mensual'),
    ultima_notificacion TIMESTAMP NULL,
    es_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_guardada_cliente (cliente_id),
    INDEX idx_guardada_notificar (notificar_nuevos, frecuencia_notificacion),
    
    CONSTRAINT fk_busq_guardada_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: busqueda_tendencias
-- Tendencias de búsqueda por período
-- ============================================================================

CREATE TABLE busqueda_tendencias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    termino VARCHAR(300) NOT NULL,
    periodo ENUM('hora', 'dia', 'semana', 'mes') DEFAULT 'dia',
    fecha_periodo DATE NOT NULL,
    hora_periodo TINYINT,
    total_busquedas INT UNSIGNED DEFAULT 0,
    total_clicks INT UNSIGNED DEFAULT 0,
    total_conversiones INT UNSIGNED DEFAULT 0,
    tasa_conversion DECIMAL(5,2) DEFAULT 0,
    posicion_promedio DECIMAL(5,2),
    tendencia ENUM('subiendo', 'estable', 'bajando') DEFAULT 'estable',
    cambio_porcentual DECIMAL(7,2) DEFAULT 0,
    empresa_id INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tendencia (termino(100), periodo, fecha_periodo, hora_periodo, empresa_id),
    INDEX idx_tendencia_periodo (periodo, fecha_periodo),
    INDEX idx_tendencia_busquedas (total_busquedas DESC),
    INDEX idx_tendencia_empresa (empresa_id),
    
    CONSTRAINT fk_busq_tendencia_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista: Búsquedas más populares
CREATE VIEW vista_busquedas_populares AS
SELECT 
    t.termino,
    t.periodo,
    t.fecha_periodo,
    t.total_busquedas,
    t.total_clicks,
    t.tasa_conversion,
    t.tendencia,
    t.cambio_porcentual,
    t.empresa_id
FROM busqueda_tendencias t
WHERE t.fecha_periodo >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
AND t.periodo = 'dia'
ORDER BY t.total_busquedas DESC;

-- Vista: Sugerencias activas con métricas
CREATE VIEW vista_sugerencias_activas AS
SELECT 
    s.termino_original,
    s.termino_sugerido,
    s.tipo,
    s.confianza,
    s.veces_aceptada,
    s.veces_rechazada,
    CASE 
        WHEN (s.veces_aceptada + s.veces_rechazada) > 0 
        THEN s.veces_aceptada / (s.veces_aceptada + s.veces_rechazada)
        ELSE s.confianza
    END AS tasa_aceptacion
FROM busqueda_sugerencias s
WHERE s.es_activo = TRUE
ORDER BY s.confianza DESC;

-- Vista: Sinónimos activos expandidos
CREATE VIEW vista_sinonimos_activos AS
SELECT 
    g.id AS grupo_id,
    g.nombre AS grupo_nombre,
    g.tipo,
    t.termino,
    t.es_termino_principal,
    t.peso,
    g.empresa_id
FROM busqueda_sinonimos_grupos g
INNER JOIN busqueda_sinonimos_terminos t ON g.id = t.grupo_id
WHERE g.es_activo = TRUE
ORDER BY g.id, t.es_termino_principal DESC;

-- Vista: Filtros facetados configurados
CREATE VIEW vista_filtros_facetados AS
SELECT 
    f.id,
    f.codigo,
    f.nombre,
    f.tipo,
    f.campo_origen,
    f.icono,
    f.orden,
    f.es_colapsable,
    f.mostrar_conteo,
    f.limite_valores,
    f.empresa_id,
    f.categoria_id,
    COUNT(fv.id) AS total_valores
FROM busqueda_filtros f
LEFT JOIN busqueda_filtros_valores fv ON f.id = fv.filtro_id AND fv.es_activo = TRUE
WHERE f.es_activo = TRUE
GROUP BY f.id
ORDER BY f.orden;

-- Vista: Tendencias de búsqueda actuales
CREATE VIEW vista_tendencias_busqueda AS
SELECT 
    t.termino,
    t.total_busquedas,
    t.total_clicks,
    t.tasa_conversion,
    t.tendencia,
    t.cambio_porcentual,
    LAG(t.total_busquedas) OVER (PARTITION BY t.termino ORDER BY t.fecha_periodo) AS busquedas_anterior,
    t.fecha_periodo,
    t.empresa_id
FROM busqueda_tendencias t
WHERE t.periodo = 'dia'
AND t.fecha_periodo >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY t.fecha_periodo DESC, t.total_busquedas DESC;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Procedimiento: Buscar productos con texto completo
CREATE PROCEDURE sp_buscar_productos(
    IN p_termino VARCHAR(500),
    IN p_empresa_id INT UNSIGNED,
    IN p_categoria_id INT UNSIGNED,
    IN p_precio_min DECIMAL(12,2),
    IN p_precio_max DECIMAL(12,2),
    IN p_solo_disponibles BOOLEAN,
    IN p_solo_ofertas BOOLEAN,
    IN p_ordenar_por VARCHAR(50),
    IN p_pagina INT,
    IN p_por_pagina INT
)
BEGIN
    DECLARE v_offset INT;
    DECLARE v_termino_expandido VARCHAR(1000);
    
    SET v_offset = (p_pagina - 1) * p_por_pagina;
    SET v_termino_expandido = p_termino;
    
    -- Expandir con sinónimos si existen
    SELECT GROUP_CONCAT(DISTINCT t2.termino SEPARATOR ' ')
    INTO v_termino_expandido
    FROM busqueda_sinonimos_terminos t1
    INNER JOIN busqueda_sinonimos_grupos g ON t1.grupo_id = g.id
    INNER JOIN busqueda_sinonimos_terminos t2 ON g.id = t2.grupo_id
    WHERE LOWER(t1.termino) = LOWER(p_termino)
    AND g.es_activo = TRUE;
    
    IF v_termino_expandido IS NULL OR v_termino_expandido = '' THEN
        SET v_termino_expandido = p_termino;
    END IF;
    
    -- Búsqueda principal
    SELECT 
        bip.producto_id,
        bip.nombre,
        bip.descripcion_corta,
        bip.marca,
        bip.categoria_nombre,
        bip.precio_actual,
        bip.precio_anterior,
        bip.tiene_descuento,
        bip.porcentaje_descuento,
        bip.stock_disponible,
        bip.calificacion_promedio,
        bip.total_resenas,
        MATCH(bip.nombre, bip.descripcion_corta, bip.palabras_clave, bip.marca, bip.categoria_nombre) 
            AGAINST(v_termino_expandido IN NATURAL LANGUAGE MODE) AS relevancia
    FROM busqueda_indices_productos bip
    WHERE bip.es_activo = TRUE
    AND (p_empresa_id IS NULL OR bip.empresa_id = p_empresa_id)
    AND (p_categoria_id IS NULL OR EXISTS (
        SELECT 1 FROM catalogo_productos p 
        INNER JOIN catalogo_categorias c ON p.categoria_id = c.id
        WHERE p.id = bip.producto_id 
        AND (c.id = p_categoria_id OR c.categoria_padre_id = p_categoria_id)
    ))
    AND (p_precio_min IS NULL OR bip.precio_actual >= p_precio_min)
    AND (p_precio_max IS NULL OR bip.precio_actual <= p_precio_max)
    AND (p_solo_disponibles = FALSE OR bip.stock_disponible > 0)
    AND (p_solo_ofertas = FALSE OR bip.tiene_descuento = TRUE)
    AND MATCH(bip.nombre, bip.descripcion_corta, bip.palabras_clave, bip.marca, bip.categoria_nombre) 
        AGAINST(v_termino_expandido IN NATURAL LANGUAGE MODE)
    ORDER BY 
        CASE p_ordenar_por
            WHEN 'relevancia' THEN relevancia
            WHEN 'precio_asc' THEN -bip.precio_actual
            WHEN 'precio_desc' THEN bip.precio_actual
            WHEN 'popularidad' THEN bip.total_ventas
            WHEN 'calificacion' THEN bip.calificacion_promedio
            WHEN 'novedades' THEN UNIX_TIMESTAMP(bip.creado_en)
            ELSE relevancia
        END DESC,
        bip.total_ventas DESC
    LIMIT p_por_pagina OFFSET v_offset;
END //

-- Procedimiento: Obtener sugerencias de autocompletado
CREATE PROCEDURE sp_obtener_sugerencias(
    IN p_termino VARCHAR(100),
    IN p_empresa_id INT UNSIGNED,
    IN p_limite INT
)
BEGIN
    SELECT 
        a.termino,
        a.tipo,
        a.referencia_id,
        a.referencia_tipo,
        a.imagen_url,
        a.texto_secundario,
        a.peso,
        a.busquedas_count
    FROM busqueda_autocompletado a
    WHERE a.es_activo = TRUE
    AND (a.empresa_id IS NULL OR a.empresa_id = p_empresa_id)
    AND a.termino LIKE CONCAT(p_termino, '%')
    ORDER BY 
        CASE a.tipo
            WHEN 'producto' THEN 1
            WHEN 'categoria' THEN 2
            WHEN 'marca' THEN 3
            WHEN 'busqueda_popular' THEN 4
            ELSE 5
        END,
        a.peso DESC,
        a.busquedas_count DESC
    LIMIT p_limite;
END //

-- Procedimiento: Registrar búsqueda en historial
CREATE PROCEDURE sp_registrar_busqueda(
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_sesion_id VARCHAR(100),
    IN p_termino VARCHAR(500),
    IN p_filtros JSON,
    IN p_ordenamiento VARCHAR(50),
    IN p_total_resultados INT,
    IN p_tiempo_ms INT,
    IN p_ip VARCHAR(45),
    IN p_user_agent VARCHAR(500),
    IN p_dispositivo VARCHAR(20),
    IN p_empresa_id INT UNSIGNED
)
BEGIN
    DECLARE v_termino_normalizado VARCHAR(500);
    
    -- Normalizar término (minúsculas, sin espacios extra)
    SET v_termino_normalizado = LOWER(TRIM(REGEXP_REPLACE(p_termino, '\\s+', ' ')));
    
    -- Insertar en historial
    INSERT INTO busqueda_historial (
        cliente_id, sesion_id, termino_busqueda, termino_normalizado,
        filtros_aplicados, ordenamiento, total_resultados, tiempo_respuesta_ms,
        tuvo_resultados, ip_address, user_agent, dispositivo, empresa_id
    ) VALUES (
        p_cliente_id, p_sesion_id, p_termino, v_termino_normalizado,
        p_filtros, p_ordenamiento, p_total_resultados, p_tiempo_ms,
        p_total_resultados > 0, p_ip, p_user_agent, p_dispositivo, p_empresa_id
    );
    
    -- Actualizar contador de autocompletado
    INSERT INTO busqueda_autocompletado (termino, tipo, busquedas_count, empresa_id)
    VALUES (v_termino_normalizado, 'busqueda_popular', 1, p_empresa_id)
    ON DUPLICATE KEY UPDATE 
        busquedas_count = busquedas_count + 1,
        actualizado_en = CURRENT_TIMESTAMP;
END //

-- Procedimiento: Obtener filtros facetados con conteos
CREATE PROCEDURE sp_obtener_filtros_facetados(
    IN p_termino VARCHAR(500),
    IN p_empresa_id INT UNSIGNED,
    IN p_categoria_id INT UNSIGNED
)
BEGIN
    -- Filtro de categorías con conteo
    SELECT 
        'categoria' AS filtro_tipo,
        c.id AS valor,
        c.nombre AS etiqueta,
        COUNT(DISTINCT bip.producto_id) AS conteo
    FROM busqueda_indices_productos bip
    INNER JOIN catalogo_productos p ON bip.producto_id = p.id
    INNER JOIN catalogo_categorias c ON p.categoria_id = c.id
    WHERE bip.es_activo = TRUE
    AND (p_empresa_id IS NULL OR bip.empresa_id = p_empresa_id)
    AND MATCH(bip.nombre, bip.descripcion_corta, bip.palabras_clave, bip.marca, bip.categoria_nombre) 
        AGAINST(p_termino IN NATURAL LANGUAGE MODE)
    GROUP BY c.id, c.nombre
    HAVING conteo > 0
    ORDER BY conteo DESC
    LIMIT 20;
    
    -- Filtro de marcas con conteo
    SELECT 
        'marca' AS filtro_tipo,
        bip.marca AS valor,
        bip.marca AS etiqueta,
        COUNT(DISTINCT bip.producto_id) AS conteo
    FROM busqueda_indices_productos bip
    WHERE bip.es_activo = TRUE
    AND bip.marca IS NOT NULL AND bip.marca != ''
    AND (p_empresa_id IS NULL OR bip.empresa_id = p_empresa_id)
    AND MATCH(bip.nombre, bip.descripcion_corta, bip.palabras_clave, bip.marca, bip.categoria_nombre) 
        AGAINST(p_termino IN NATURAL LANGUAGE MODE)
    GROUP BY bip.marca
    HAVING conteo > 0
    ORDER BY conteo DESC
    LIMIT 20;
    
    -- Filtro de rangos de precio
    SELECT 
        'precio' AS filtro_tipo,
        CASE 
            WHEN bip.precio_actual < 100 THEN 'bajo'
            WHEN bip.precio_actual < 500 THEN 'medio'
            WHEN bip.precio_actual < 1000 THEN 'alto'
            ELSE 'premium'
        END AS valor,
        CASE 
            WHEN bip.precio_actual < 100 THEN 'Menos de L 100'
            WHEN bip.precio_actual < 500 THEN 'L 100 - L 500'
            WHEN bip.precio_actual < 1000 THEN 'L 500 - L 1,000'
            ELSE 'Más de L 1,000'
        END AS etiqueta,
        COUNT(DISTINCT bip.producto_id) AS conteo
    FROM busqueda_indices_productos bip
    WHERE bip.es_activo = TRUE
    AND (p_empresa_id IS NULL OR bip.empresa_id = p_empresa_id)
    AND MATCH(bip.nombre, bip.descripcion_corta, bip.palabras_clave, bip.marca, bip.categoria_nombre) 
        AGAINST(p_termino IN NATURAL LANGUAGE MODE)
    GROUP BY valor, etiqueta
    ORDER BY 
        CASE valor
            WHEN 'bajo' THEN 1
            WHEN 'medio' THEN 2
            WHEN 'alto' THEN 3
            ELSE 4
        END;
    
    -- Filtro de calificación
    SELECT 
        'calificacion' AS filtro_tipo,
        FLOOR(bip.calificacion_promedio) AS valor,
        CONCAT(FLOOR(bip.calificacion_promedio), ' estrellas o más') AS etiqueta,
        COUNT(DISTINCT bip.producto_id) AS conteo
    FROM busqueda_indices_productos bip
    WHERE bip.es_activo = TRUE
    AND bip.calificacion_promedio >= 1
    AND (p_empresa_id IS NULL OR bip.empresa_id = p_empresa_id)
    AND MATCH(bip.nombre, bip.descripcion_corta, bip.palabras_clave, bip.marca, bip.categoria_nombre) 
        AGAINST(p_termino IN NATURAL LANGUAGE MODE)
    GROUP BY FLOOR(bip.calificacion_promedio)
    HAVING conteo > 0
    ORDER BY valor DESC;
END //

-- Procedimiento: Actualizar tendencias de búsqueda
CREATE PROCEDURE sp_actualizar_tendencias()
BEGIN
    -- Tendencias diarias
    INSERT INTO busqueda_tendencias (
        termino, periodo, fecha_periodo, total_busquedas, 
        total_clicks, empresa_id
    )
    SELECT 
        h.termino_normalizado,
        'dia',
        DATE(h.creado_en),
        COUNT(*) AS total_busquedas,
        (SELECT COUNT(*) FROM busqueda_clicks c 
         WHERE c.historial_id IN (
             SELECT id FROM busqueda_historial 
             WHERE termino_normalizado = h.termino_normalizado 
             AND DATE(creado_en) = DATE(h.creado_en)
         )) AS total_clicks,
        h.empresa_id
    FROM busqueda_historial h
    WHERE DATE(h.creado_en) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))
    AND h.termino_normalizado IS NOT NULL
    AND h.termino_normalizado != ''
    GROUP BY h.termino_normalizado, DATE(h.creado_en), h.empresa_id
    ON DUPLICATE KEY UPDATE
        total_busquedas = VALUES(total_busquedas),
        total_clicks = VALUES(total_clicks),
        actualizado_en = CURRENT_TIMESTAMP;
    
    -- Calcular tendencia comparando con día anterior
    UPDATE busqueda_tendencias t1
    SET tendencia = (
        SELECT 
            CASE 
                WHEN t1.total_busquedas > COALESCE(t2.total_busquedas, 0) * 1.1 THEN 'subiendo'
                WHEN t1.total_busquedas < COALESCE(t2.total_busquedas, 0) * 0.9 THEN 'bajando'
                ELSE 'estable'
            END
        FROM busqueda_tendencias t2
        WHERE t2.termino = t1.termino
        AND t2.periodo = t1.periodo
        AND t2.fecha_periodo = DATE_SUB(t1.fecha_periodo, INTERVAL 1 DAY)
        AND (t2.empresa_id = t1.empresa_id OR (t2.empresa_id IS NULL AND t1.empresa_id IS NULL))
    ),
    cambio_porcentual = (
        SELECT 
            CASE 
                WHEN COALESCE(t2.total_busquedas, 0) > 0 
                THEN ((t1.total_busquedas - t2.total_busquedas) / t2.total_busquedas) * 100
                ELSE 0
            END
        FROM busqueda_tendencias t2
        WHERE t2.termino = t1.termino
        AND t2.periodo = t1.periodo
        AND t2.fecha_periodo = DATE_SUB(t1.fecha_periodo, INTERVAL 1 DAY)
        AND (t2.empresa_id = t1.empresa_id OR (t2.empresa_id IS NULL AND t1.empresa_id IS NULL))
    )
    WHERE t1.fecha_periodo = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY));
END //

-- Procedimiento: Limpiar historial antiguo
CREATE PROCEDURE sp_limpiar_historial_antiguo(
    IN p_dias_conservar INT
)
BEGIN
    DECLARE v_fecha_limite DATETIME;
    SET v_fecha_limite = DATE_SUB(NOW(), INTERVAL p_dias_conservar DAY);
    
    -- Eliminar clicks antiguos
    DELETE FROM busqueda_clicks 
    WHERE creado_en < v_fecha_limite;
    
    -- Eliminar historial antiguo
    DELETE FROM busqueda_historial 
    WHERE creado_en < v_fecha_limite;
    
    -- Limpiar tendencias muy antiguas (más de 1 año)
    DELETE FROM busqueda_tendencias 
    WHERE fecha_periodo < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);
END //

DELIMITER ;

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Evento: Actualizar tendencias diariamente
CREATE EVENT IF NOT EXISTS evento_actualizar_tendencias
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '02:00:00')
DO
    CALL sp_actualizar_tendencias();

-- Evento: Limpiar historial antiguo semanalmente
CREATE EVENT IF NOT EXISTS evento_limpiar_historial
ON SCHEDULE EVERY 1 WEEK
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '03:00:00')
DO
    CALL sp_limpiar_historial_antiguo(90);

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Configuración del motor de búsqueda
INSERT IGNORE INTO busqueda_configuracion (clave, valor, tipo_dato, descripcion, es_global) VALUES
('resultados_por_pagina', '20', 'numero', 'Cantidad de resultados por página', TRUE),
('max_sugerencias_autocompletado', '10', 'numero', 'Máximo de sugerencias en autocompletado', TRUE),
('min_caracteres_busqueda', '2', 'numero', 'Mínimo de caracteres para iniciar búsqueda', TRUE),
('habilitar_correccion_ortografica', 'true', 'booleano', 'Activar corrección ortográfica automática', TRUE),
('habilitar_sinonimos', 'true', 'booleano', 'Expandir búsquedas con sinónimos', TRUE),
('peso_nombre_producto', '2.0', 'numero', 'Peso del nombre en relevancia', TRUE),
('peso_descripcion', '1.0', 'numero', 'Peso de descripción en relevancia', TRUE),
('peso_palabras_clave', '1.5', 'numero', 'Peso de palabras clave en relevancia', TRUE),
('dias_historial', '90', 'numero', 'Días a conservar en historial', TRUE),
('mostrar_productos_sin_stock', 'true', 'booleano', 'Mostrar productos agotados en búsqueda', TRUE);

-- Palabras excluidas (stop words) en español
INSERT IGNORE INTO busqueda_palabras_excluidas (palabra, idioma) VALUES
('el', 'es'), ('la', 'es'), ('los', 'es'), ('las', 'es'),
('un', 'es'), ('una', 'es'), ('unos', 'es'), ('unas', 'es'),
('de', 'es'), ('del', 'es'), ('al', 'es'), ('a', 'es'),
('en', 'es'), ('con', 'es'), ('por', 'es'), ('para', 'es'),
('y', 'es'), ('o', 'es'), ('u', 'es'), ('e', 'es'),
('que', 'es'), ('se', 'es'), ('su', 'es'), ('sus', 'es'),
('es', 'es'), ('son', 'es'), ('como', 'es'), ('mas', 'es'),
('pero', 'es'), ('sin', 'es'), ('sobre', 'es'), ('entre', 'es'),
('este', 'es'), ('esta', 'es'), ('estos', 'es'), ('estas', 'es'),
('ese', 'es'), ('esa', 'es'), ('esos', 'es'), ('esas', 'es'),
('muy', 'es'), ('ya', 'es'), ('solo', 'es'), ('todo', 'es');

-- Grupos de sinónimos comunes
INSERT IGNORE INTO busqueda_sinonimos_grupos (nombre, tipo, idioma, es_global) VALUES
('Teléfono móvil', 'sinonimo', 'es', TRUE),
('Computadora', 'sinonimo', 'es', TRUE),
('Televisor', 'sinonimo', 'es', TRUE),
('Ropa', 'sinonimo', 'es', TRUE),
('Calzado', 'sinonimo', 'es', TRUE),
('Auriculares', 'sinonimo', 'es', TRUE),
('Barato/Económico', 'sinonimo', 'es', TRUE),
('Nuevo/Reciente', 'sinonimo', 'es', TRUE);

-- Términos de sinónimos
INSERT IGNORE INTO busqueda_sinonimos_terminos (grupo_id, termino, es_termino_principal) VALUES
-- Teléfono móvil
(1, 'celular', TRUE), (1, 'teléfono', FALSE), (1, 'móvil', FALSE), 
(1, 'smartphone', FALSE), (1, 'telefono', FALSE), (1, 'cel', FALSE),
-- Computadora
(2, 'computadora', TRUE), (2, 'laptop', FALSE), (2, 'portátil', FALSE),
(2, 'notebook', FALSE), (2, 'pc', FALSE), (2, 'ordenador', FALSE), (2, 'compu', FALSE),
-- Televisor
(3, 'televisor', TRUE), (3, 'tv', FALSE), (3, 'televisión', FALSE),
(3, 'tele', FALSE), (3, 'pantalla', FALSE), (3, 'smart tv', FALSE),
-- Ropa
(4, 'ropa', TRUE), (4, 'vestimenta', FALSE), (4, 'prendas', FALSE),
(4, 'indumentaria', FALSE), (4, 'atuendo', FALSE),
-- Calzado
(5, 'zapatos', TRUE), (5, 'calzado', FALSE), (5, 'tenis', FALSE),
(5, 'zapatillas', FALSE), (5, 'sandalias', FALSE), (5, 'botas', FALSE),
-- Auriculares
(6, 'auriculares', TRUE), (6, 'audífonos', FALSE), (6, 'cascos', FALSE),
(6, 'earbuds', FALSE), (6, 'headphones', FALSE),
-- Barato
(7, 'barato', TRUE), (7, 'económico', FALSE), (7, 'oferta', FALSE),
(7, 'descuento', FALSE), (7, 'promoción', FALSE), (7, 'rebaja', FALSE),
-- Nuevo
(8, 'nuevo', TRUE), (8, 'reciente', FALSE), (8, 'último', FALSE),
(8, 'novedad', FALSE), (8, 'lanzamiento', FALSE);

-- Filtros facetados predeterminados
INSERT IGNORE INTO busqueda_filtros (codigo, nombre, tipo, campo_origen, icono, orden, es_activo) VALUES
('precio', 'Precio', 'rango', 'precio_actual', 'bi-currency-dollar', 1, TRUE),
('categoria', 'Categoría', 'lista', 'categoria_id', 'bi-grid', 2, TRUE),
('marca', 'Marca', 'lista', 'marca', 'bi-tag', 3, TRUE),
('calificacion', 'Calificación', 'rating', 'calificacion_promedio', 'bi-star', 4, TRUE),
('disponibilidad', 'Disponibilidad', 'checkbox', 'stock_disponible', 'bi-box', 5, TRUE),
('descuento', 'En oferta', 'checkbox', 'tiene_descuento', 'bi-percent', 6, TRUE),
('envio_gratis', 'Envío gratis', 'checkbox', 'envio_gratis', 'bi-truck', 7, TRUE);

-- Valores para filtro de calificación
INSERT IGNORE INTO busqueda_filtros_valores (filtro_id, valor, etiqueta, orden) VALUES
(4, '4', '4 estrellas o más', 1),
(4, '3', '3 estrellas o más', 2),
(4, '2', '2 estrellas o más', 3),
(4, '1', '1 estrella o más', 4);

-- Correcciones ortográficas comunes
INSERT IGNORE INTO busqueda_correcciones (termino_incorrecto, termino_correcto, es_automatica) VALUES
('celulares', 'celular', TRUE),
('telefonos', 'teléfono', TRUE),
('computadoras', 'computadora', TRUE),
('televisores', 'televisor', TRUE),
('audifonos', 'audífonos', TRUE),
('movil', 'móvil', TRUE),
('portatil', 'portátil', TRUE),
('camara', 'cámara', TRUE),
('electronica', 'electrónica', TRUE),
('tecnologia', 'tecnología', TRUE);

-- ============================================================================
-- REGISTRAR MÓDULOS Y PERMISOS
-- ============================================================================

-- Módulo de Búsqueda
INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo)
VALUES ('busqueda', 'Búsqueda', 'Gestión del motor de búsqueda', 'bi-search', 110, TRUE);

-- Submódulos
INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'busqueda_sinonimos', 'Sinónimos', 'Gestión de sinónimos y expansiones', 'bi-diagram-3', 111, TRUE, id
FROM admin_modulos WHERE codigo = 'busqueda';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'busqueda_filtros', 'Filtros', 'Configuración de filtros facetados', 'bi-funnel', 112, TRUE, id
FROM admin_modulos WHERE codigo = 'busqueda';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'busqueda_tendencias', 'Tendencias', 'Análisis de tendencias de búsqueda', 'bi-graph-up', 113, TRUE, id
FROM admin_modulos WHERE codigo = 'busqueda';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'busqueda_configuracion', 'Configuración', 'Configuración del motor de búsqueda', 'bi-gear', 114, TRUE, id
FROM admin_modulos WHERE codigo = 'busqueda';

-- Permisos para módulo de búsqueda
INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.ver', 'Ver búsquedas', 'Ver historial y estadísticas de búsqueda'
FROM admin_modulos WHERE codigo = 'busqueda';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.sinonimos.ver', 'Ver sinónimos', 'Ver grupos de sinónimos'
FROM admin_modulos WHERE codigo = 'busqueda_sinonimos';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.sinonimos.crear', 'Crear sinónimos', 'Crear nuevos grupos de sinónimos'
FROM admin_modulos WHERE codigo = 'busqueda_sinonimos';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.sinonimos.editar', 'Editar sinónimos', 'Modificar sinónimos existentes'
FROM admin_modulos WHERE codigo = 'busqueda_sinonimos';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.sinonimos.eliminar', 'Eliminar sinónimos', 'Eliminar sinónimos'
FROM admin_modulos WHERE codigo = 'busqueda_sinonimos';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.filtros.ver', 'Ver filtros', 'Ver filtros facetados'
FROM admin_modulos WHERE codigo = 'busqueda_filtros';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.filtros.gestionar', 'Gestionar filtros', 'Crear y modificar filtros facetados'
FROM admin_modulos WHERE codigo = 'busqueda_filtros';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.tendencias.ver', 'Ver tendencias', 'Ver tendencias de búsqueda'
FROM admin_modulos WHERE codigo = 'busqueda_tendencias';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.configuracion.ver', 'Ver configuración', 'Ver configuración del motor'
FROM admin_modulos WHERE codigo = 'busqueda_configuracion';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'busqueda.configuracion.editar', 'Editar configuración', 'Modificar configuración del motor'
FROM admin_modulos WHERE codigo = 'busqueda_configuracion';

-- ============================================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

-- Eliminar índices si existen antes de crearlos
SET @existe_idx1 = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'busqueda_autocompletado' AND index_name = 'idx_auto_termino_prefix');
SET @sql1 = IF(@existe_idx1 > 0, 'DROP INDEX idx_auto_termino_prefix ON busqueda_autocompletado', 'SELECT 1');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @existe_idx2 = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'busqueda_historial' AND index_name = 'idx_historial_reciente');
SET @sql2 = IF(@existe_idx2 > 0, 'DROP INDEX idx_historial_reciente ON busqueda_historial', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

SET @existe_idx3 = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'busqueda_tendencias' AND index_name = 'idx_tendencia_consulta');
SET @sql3 = IF(@existe_idx3 > 0, 'DROP INDEX idx_tendencia_consulta ON busqueda_tendencias', 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

-- Índice para búsqueda por prefijo en autocompletado
CREATE INDEX idx_auto_termino_prefix 
ON busqueda_autocompletado (termino(20));

-- Índice para historial reciente
CREATE INDEX idx_historial_reciente 
ON busqueda_historial (creado_en DESC, empresa_id);

-- Índice compuesto para tendencias
CREATE INDEX idx_tendencia_consulta 
ON busqueda_tendencias (empresa_id, periodo, fecha_periodo, total_busquedas DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger: Actualizar índice cuando se modifica un producto
CREATE TRIGGER trg_actualizar_indice_producto
AFTER UPDATE ON catalogo_productos
FOR EACH ROW
BEGIN
    IF NEW.nombre != OLD.nombre OR NEW.descripcion_corta != OLD.descripcion_corta 
       OR NEW.precio_base != OLD.precio_base OR NEW.estado != OLD.estado THEN
        UPDATE busqueda_indices_productos
        SET 
            nombre = NEW.nombre,
            descripcion_corta = NEW.descripcion_corta,
            precio_actual = NEW.precio_base,
            es_activo = (NEW.estado = 'publicado'),
            ultima_indexacion = CURRENT_TIMESTAMP
        WHERE producto_id = NEW.id;
    END IF;
END //

-- Trigger: Registrar click con conversión
CREATE TRIGGER trg_click_conversion
AFTER INSERT ON busqueda_clicks
FOR EACH ROW
BEGIN
    IF NEW.tipo_accion = 'compra' THEN
        UPDATE busqueda_tendencias t
        INNER JOIN busqueda_historial h ON h.id = NEW.historial_id
        SET t.total_conversiones = t.total_conversiones + 1,
            t.tasa_conversion = (t.total_conversiones + 1) / NULLIF(t.total_busquedas, 0) * 100
        WHERE t.termino = h.termino_normalizado
        AND t.fecha_periodo = DATE(h.creado_en)
        AND t.periodo = 'dia';
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=================================================' AS '';
SELECT 'FASE 10: BÚSQUEDA AVANZADA - INSTALACIÓN COMPLETADA' AS 'ESTADO';
SELECT '=================================================' AS '';

SELECT 'Tablas creadas:' AS 'Verificación',
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name LIKE 'busqueda_%') AS cantidad;

SELECT 'Procedimientos:' AS 'Verificación',
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'tienda_virtual' 
     AND routine_type = 'PROCEDURE'
     AND (routine_name LIKE 'sp_%busq%' OR routine_name LIKE 'sp_%sugerencias%' 
     OR routine_name LIKE 'sp_%tendencias%' OR routine_name LIKE 'sp_obtener_filtros%'
     OR routine_name LIKE 'sp_registrar_busqueda%' OR routine_name LIKE 'sp_limpiar_historial%')) AS cantidad;

SELECT 'Vistas:' AS 'Verificación',
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'tienda_virtual' 
     AND (table_name LIKE 'vista_busqueda%' OR table_name LIKE 'vista_sugerencias%' 
     OR table_name LIKE 'vista_sinonimos%' OR table_name LIKE 'vista_filtros%'
     OR table_name LIKE 'vista_tendencias%')) AS cantidad;

-- ============================================================================
-- FIN FASE 10
-- ============================================================================
