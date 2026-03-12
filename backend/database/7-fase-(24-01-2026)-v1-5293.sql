-- ============================================================================
-- TIENDA VIRTUAL - FASE 7
-- ============================================================================
-- Módulo: Reseñas y Valoraciones (Sistema de Reviews - Estilo Amazon)
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script implementa:
-- - Reseñas de productos con calificación de estrellas (1-5)
-- - Reseñas verificadas (de compradores confirmados)
-- - Imágenes y videos en reseñas
-- - Votos de utilidad ("¿Te resultó útil?")
-- - Sistema de moderación con estados
-- - Respuestas del vendedor/tienda
-- - Reportes de contenido inapropiado
-- - Preguntas y respuestas de productos
-- - Estadísticas y promedios de valoraciones
-- - Puntos de fidelidad por reseñas
-- ============================================================================
-- Ejecutar DESPUÉS de las Fases 1-6
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- ESQUEMA: RESEÑAS DE PRODUCTOS
-- ============================================================================

CREATE TABLE resenas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    cliente_id BIGINT UNSIGNED NOT NULL,
    pedido_id BIGINT UNSIGNED,
    pedido_item_id BIGINT UNSIGNED,
    
    -- Calificación
    calificacion TINYINT UNSIGNED NOT NULL,
    
    -- Contenido
    titulo VARCHAR(200),
    contenido TEXT,
    
    -- Aspectos específicos (calificaciones opcionales)
    calificacion_calidad TINYINT UNSIGNED,
    calificacion_precio TINYINT UNSIGNED,
    calificacion_envio TINYINT UNSIGNED,
    calificacion_empaque TINYINT UNSIGNED,
    
    -- Verificación
    es_compra_verificada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_compra DATE,
    
    -- Moderación
    estado ENUM(
        'pendiente',
        'aprobada',
        'rechazada',
        'oculta',
        'destacada'
    ) NOT NULL DEFAULT 'pendiente',
    
    motivo_rechazo TEXT,
    moderado_por INT UNSIGNED,
    moderado_en DATETIME,
    
    -- Interacción
    votos_util INT UNSIGNED NOT NULL DEFAULT 0,
    votos_no_util INT UNSIGNED NOT NULL DEFAULT 0,
    total_reportes INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Respuesta de la tienda
    tiene_respuesta BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Medios
    tiene_imagenes BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_video BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Puntos otorgados
    puntos_otorgados INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Control
    es_anonima BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Edición
    editada BOOLEAN NOT NULL DEFAULT FALSE,
    editada_en DATETIME,
    version INT UNSIGNED NOT NULL DEFAULT 1,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_producto (producto_id),
    INDEX idx_variante (variante_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_pedido (pedido_id),
    INDEX idx_calificacion (calificacion),
    INDEX idx_estado (estado),
    INDEX idx_verificada (es_compra_verificada),
    INDEX idx_votos (votos_util),
    INDEX idx_fecha (creado_en),
    
    -- Una reseña por producto por cliente
    UNIQUE KEY uk_cliente_producto (cliente_id, producto_id),
    
    -- Constraints
    CONSTRAINT chk_calificacion CHECK (calificacion BETWEEN 1 AND 5),
    CONSTRAINT chk_calificacion_calidad CHECK (calificacion_calidad IS NULL OR calificacion_calidad BETWEEN 1 AND 5),
    CONSTRAINT chk_calificacion_precio CHECK (calificacion_precio IS NULL OR calificacion_precio BETWEEN 1 AND 5),
    CONSTRAINT chk_calificacion_envio CHECK (calificacion_envio IS NULL OR calificacion_envio BETWEEN 1 AND 5),
    CONSTRAINT chk_calificacion_empaque CHECK (calificacion_empaque IS NULL OR calificacion_empaque BETWEEN 1 AND 5),
    
    CONSTRAINT fk_resena_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resena_variante 
        FOREIGN KEY (variante_id) REFERENCES catalogo_productos_variantes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_resena_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resena_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_resena_pedido_item 
        FOREIGN KEY (pedido_item_id) REFERENCES pedidos_items(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: IMÁGENES Y VIDEOS DE RESEÑAS
-- ============================================================================

CREATE TABLE resenas_medios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resena_id BIGINT UNSIGNED NOT NULL,
    
    -- Tipo de medio
    tipo ENUM('imagen', 'video') NOT NULL DEFAULT 'imagen',
    
    -- URLs
    url_original VARCHAR(500) NOT NULL,
    url_thumbnail VARCHAR(500),
    url_medium VARCHAR(500),
    
    -- Metadatos
    nombre_archivo VARCHAR(255),
    mime_type VARCHAR(100),
    tamano_bytes INT UNSIGNED,
    ancho INT UNSIGNED,
    alto INT UNSIGNED,
    duracion_segundos INT UNSIGNED,
    
    -- Moderación
    estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    
    -- Control
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_resena (resena_id),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    CONSTRAINT fk_medio_resena 
        FOREIGN KEY (resena_id) REFERENCES resenas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: VOTOS DE UTILIDAD
-- ============================================================================

CREATE TABLE resenas_votos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resena_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED,
    sesion_id VARCHAR(100),
    
    -- Tipo de voto
    es_util BOOLEAN NOT NULL,
    
    ip_address VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Un voto por reseña por cliente/sesión
    UNIQUE KEY uk_resena_cliente (resena_id, cliente_id),
    UNIQUE KEY uk_resena_sesion (resena_id, sesion_id),
    
    INDEX idx_resena (resena_id),
    INDEX idx_cliente (cliente_id),
    CONSTRAINT fk_voto_resena 
        FOREIGN KEY (resena_id) REFERENCES resenas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_voto_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: RESPUESTAS A RESEÑAS
-- ============================================================================

CREATE TABLE resenas_respuestas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resena_id BIGINT UNSIGNED NOT NULL,
    
    -- Quién responde
    tipo_autor ENUM('tienda', 'vendedor', 'cliente') NOT NULL DEFAULT 'tienda',
    autor_id INT UNSIGNED,
    autor_nombre VARCHAR(200),
    
    -- Contenido
    contenido TEXT NOT NULL,
    
    -- Moderación
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'aprobada',
    
    -- Control
    es_oficial BOOLEAN NOT NULL DEFAULT FALSE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_resena (resena_id),
    INDEX idx_autor (tipo_autor, autor_id),
    CONSTRAINT fk_respuesta_resena 
        FOREIGN KEY (resena_id) REFERENCES resenas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: REPORTES DE RESEÑAS
-- ============================================================================

CREATE TABLE resenas_reportes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resena_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED,
    
    -- Motivo del reporte
    motivo ENUM(
        'spam',
        'lenguaje_ofensivo',
        'contenido_falso',
        'no_relacionado',
        'informacion_personal',
        'publicidad',
        'otro'
    ) NOT NULL,
    
    descripcion TEXT,
    
    -- Estado del reporte
    estado ENUM('pendiente', 'revisado', 'accion_tomada', 'descartado') NOT NULL DEFAULT 'pendiente',
    
    -- Resolución
    resolucion TEXT,
    resuelto_por INT UNSIGNED,
    resuelto_en DATETIME,
    
    ip_address VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_resena (resena_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_estado (estado),
    INDEX idx_motivo (motivo),
    CONSTRAINT fk_reporte_resena 
        FOREIGN KEY (resena_id) REFERENCES resenas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reporte_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: PREGUNTAS Y RESPUESTAS DE PRODUCTOS
-- ============================================================================

CREATE TABLE productos_preguntas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED,
    
    -- Contenido
    pregunta TEXT NOT NULL,
    
    -- Estado
    estado ENUM('pendiente', 'publicada', 'rechazada', 'oculta') NOT NULL DEFAULT 'pendiente',
    
    -- Respuestas
    total_respuestas INT UNSIGNED NOT NULL DEFAULT 0,
    tiene_respuesta_oficial BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Votos
    votos_util INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Moderación
    moderado_por INT UNSIGNED,
    moderado_en DATETIME,
    
    -- Control
    es_anonima BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_pregunta_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pregunta_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE productos_respuestas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pregunta_id BIGINT UNSIGNED NOT NULL,
    
    -- Quién responde
    tipo_autor ENUM('cliente', 'tienda', 'vendedor') NOT NULL DEFAULT 'cliente',
    cliente_id BIGINT UNSIGNED,
    admin_id INT UNSIGNED,
    autor_nombre VARCHAR(200),
    
    -- Contenido
    respuesta TEXT NOT NULL,
    
    -- Estado
    estado ENUM('pendiente', 'publicada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    
    -- Votos
    votos_util INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Control
    es_oficial BOOLEAN NOT NULL DEFAULT FALSE,
    es_mejor_respuesta BOOLEAN NOT NULL DEFAULT FALSE,
    
    ip_address VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pregunta (pregunta_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_estado (estado),
    INDEX idx_oficial (es_oficial),
    CONSTRAINT fk_respuesta_pregunta 
        FOREIGN KEY (pregunta_id) REFERENCES productos_preguntas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_respuesta_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Votos para preguntas y respuestas
CREATE TABLE productos_qa_votos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    tipo ENUM('pregunta', 'respuesta') NOT NULL,
    referencia_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED,
    sesion_id VARCHAR(100),
    
    es_util BOOLEAN NOT NULL,
    
    ip_address VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_voto_cliente (tipo, referencia_id, cliente_id),
    UNIQUE KEY uk_voto_sesion (tipo, referencia_id, sesion_id),
    
    INDEX idx_referencia (tipo, referencia_id),
    INDEX idx_cliente (cliente_id),
    CONSTRAINT fk_qa_voto_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ESTADÍSTICAS DE PRODUCTOS
-- ============================================================================

CREATE TABLE productos_estadisticas_resenas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT UNSIGNED NOT NULL UNIQUE,
    
    -- Totales
    total_resenas INT UNSIGNED NOT NULL DEFAULT 0,
    total_resenas_verificadas INT UNSIGNED NOT NULL DEFAULT 0,
    total_resenas_con_imagenes INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Promedio
    calificacion_promedio DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    
    -- Distribución de estrellas
    estrellas_5 INT UNSIGNED NOT NULL DEFAULT 0,
    estrellas_4 INT UNSIGNED NOT NULL DEFAULT 0,
    estrellas_3 INT UNSIGNED NOT NULL DEFAULT 0,
    estrellas_2 INT UNSIGNED NOT NULL DEFAULT 0,
    estrellas_1 INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Porcentajes
    porcentaje_5 DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    porcentaje_4 DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    porcentaje_3 DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    porcentaje_2 DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    porcentaje_1 DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Promedios específicos
    promedio_calidad DECIMAL(3,2),
    promedio_precio DECIMAL(3,2),
    promedio_envio DECIMAL(3,2),
    promedio_empaque DECIMAL(3,2),
    
    -- Preguntas
    total_preguntas INT UNSIGNED NOT NULL DEFAULT 0,
    total_preguntas_respondidas INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Última actualización
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_producto (producto_id),
    INDEX idx_promedio (calificacion_promedio),
    INDEX idx_total (total_resenas),
    CONSTRAINT fk_estadisticas_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: HISTORIAL DE MODERACIÓN
-- ============================================================================

CREATE TABLE resenas_moderacion_historial (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resena_id BIGINT UNSIGNED NOT NULL,
    
    accion ENUM(
        'aprobada',
        'rechazada',
        'ocultada',
        'destacada',
        'restaurada',
        'editada_admin'
    ) NOT NULL,
    
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    
    motivo TEXT,
    notas_internas TEXT,
    
    -- Quién moderó
    moderador_id INT UNSIGNED NOT NULL,
    moderador_nombre VARCHAR(200),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_resena (resena_id),
    INDEX idx_moderador (moderador_id),
    INDEX idx_fecha (creado_en),
    CONSTRAINT fk_historial_mod_resena 
        FOREIGN KEY (resena_id) REFERENCES resenas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: CONFIGURACIÓN DE RESEÑAS
-- ============================================================================

CREATE TABLE resenas_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT UNSIGNED,
    
    -- Requisitos
    requiere_compra_verificada BOOLEAN NOT NULL DEFAULT FALSE,
    dias_minimos_para_resenar INT UNSIGNED DEFAULT 3,
    dias_maximos_para_resenar INT UNSIGNED DEFAULT 365,
    
    -- Contenido
    contenido_minimo_caracteres INT UNSIGNED DEFAULT 20,
    contenido_maximo_caracteres INT UNSIGNED DEFAULT 5000,
    permite_imagenes BOOLEAN NOT NULL DEFAULT TRUE,
    max_imagenes INT UNSIGNED DEFAULT 5,
    permite_videos BOOLEAN NOT NULL DEFAULT TRUE,
    max_videos INT UNSIGNED DEFAULT 1,
    
    -- Moderación
    moderacion_automatica BOOLEAN NOT NULL DEFAULT TRUE,
    auto_aprobar_verificadas BOOLEAN NOT NULL DEFAULT TRUE,
    auto_aprobar_calificacion_minima TINYINT UNSIGNED DEFAULT 3,
    palabras_prohibidas TEXT,
    
    -- Puntos de fidelidad
    puntos_por_resena INT UNSIGNED DEFAULT 50,
    puntos_por_resena_con_foto INT UNSIGNED DEFAULT 100,
    puntos_por_resena_verificada INT UNSIGNED DEFAULT 75,
    
    -- Notificaciones
    notificar_nuevas_resenas BOOLEAN NOT NULL DEFAULT TRUE,
    notificar_resenas_negativas BOOLEAN NOT NULL DEFAULT TRUE,
    calificacion_negativa_umbral TINYINT UNSIGNED DEFAULT 2,
    
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_empresa (empresa_id),
    CONSTRAINT fk_config_resenas_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NUEVOS MÓDULOS Y PERMISOS
-- ============================================================================

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('resenas', 'Reseñas', 'Gestión de reseñas y valoraciones', 'bi-star-half', '/admin/resenas', 28, TRUE),
('preguntas_respuestas', 'Preguntas', 'Preguntas y respuestas de productos', 'bi-chat-dots', '/admin/preguntas', 29, FALSE);

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'resenas.ver', 'Ver reseñas', id, 'ver' FROM admin_modulos WHERE codigo = 'resenas'
UNION ALL SELECT 'resenas.moderar', 'Moderar reseñas', id, 'editar' FROM admin_modulos WHERE codigo = 'resenas'
UNION ALL SELECT 'resenas.responder', 'Responder reseñas', id, 'crear' FROM admin_modulos WHERE codigo = 'resenas'
UNION ALL SELECT 'resenas.eliminar', 'Eliminar reseñas', id, 'eliminar' FROM admin_modulos WHERE codigo = 'resenas'
UNION ALL SELECT 'resenas.exportar', 'Exportar reseñas', id, 'exportar' FROM admin_modulos WHERE codigo = 'resenas'
UNION ALL SELECT 'resenas.configurar', 'Configurar reseñas', id, 'editar' FROM admin_modulos WHERE codigo = 'resenas';

INSERT IGNORE INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'preguntas.ver', 'Ver preguntas', id, 'ver' FROM admin_modulos WHERE codigo = 'preguntas_respuestas'
UNION ALL SELECT 'preguntas.responder', 'Responder preguntas', id, 'crear' FROM admin_modulos WHERE codigo = 'preguntas_respuestas'
UNION ALL SELECT 'preguntas.moderar', 'Moderar preguntas', id, 'editar' FROM admin_modulos WHERE codigo = 'preguntas_respuestas';

INSERT IGNORE INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos 
WHERE codigo LIKE 'resenas%' 
   OR codigo LIKE 'preguntas%';

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de reseñas con información completa
CREATE OR REPLACE VIEW vista_resenas_completas AS
SELECT 
    r.id,
    r.producto_id,
    p.nombre AS producto_nombre,
    p.sku AS producto_sku,
    r.cliente_id,
    CASE WHEN r.es_anonima THEN 'Cliente Anónimo' ELSE c.nombre_completo END AS cliente_nombre,
    r.calificacion,
    r.titulo,
    r.contenido,
    r.es_compra_verificada,
    r.estado,
    r.votos_util,
    r.votos_no_util,
    r.tiene_imagenes,
    r.tiene_video,
    r.tiene_respuesta,
    r.creado_en,
    DATEDIFF(NOW(), r.creado_en) AS dias_desde_publicacion
FROM resenas r
JOIN catalogo_productos p ON r.producto_id = p.id
JOIN clientes c ON r.cliente_id = c.id;

-- Vista de reseñas pendientes de moderación
CREATE OR REPLACE VIEW vista_resenas_pendientes AS
SELECT 
    r.id,
    p.nombre AS producto,
    c.nombre_completo AS cliente,
    r.calificacion,
    r.titulo,
    LEFT(r.contenido, 200) AS contenido_preview,
    r.es_compra_verificada,
    r.tiene_imagenes,
    r.total_reportes,
    r.creado_en,
    TIMESTAMPDIFF(HOUR, r.creado_en, NOW()) AS horas_pendiente
FROM resenas r
JOIN catalogo_productos p ON r.producto_id = p.id
JOIN clientes c ON r.cliente_id = c.id
WHERE r.estado = 'pendiente'
ORDER BY r.total_reportes DESC, r.creado_en ASC;

-- Vista de productos mejor valorados
CREATE OR REPLACE VIEW vista_productos_mejor_valorados AS
SELECT 
    e.producto_id,
    p.nombre AS producto,
    p.sku,
    e.calificacion_promedio,
    e.total_resenas,
    e.total_resenas_verificadas,
    e.estrellas_5,
    e.estrellas_4,
    e.estrellas_3,
    e.estrellas_2,
    e.estrellas_1
FROM productos_estadisticas_resenas e
JOIN catalogo_productos p ON e.producto_id = p.id
WHERE e.total_resenas >= 5
ORDER BY e.calificacion_promedio DESC, e.total_resenas DESC
LIMIT 100;

-- Vista de reseñas negativas recientes
CREATE OR REPLACE VIEW vista_resenas_negativas AS
SELECT 
    r.id,
    p.nombre AS producto,
    c.nombre_completo AS cliente,
    c.correo AS cliente_correo,
    r.calificacion,
    r.titulo,
    r.contenido,
    r.es_compra_verificada,
    r.tiene_respuesta,
    r.creado_en
FROM resenas r
JOIN catalogo_productos p ON r.producto_id = p.id
JOIN clientes c ON r.cliente_id = c.id
WHERE r.calificacion <= 2
AND r.estado = 'aprobada'
ORDER BY r.creado_en DESC
LIMIT 50;

-- Vista de preguntas sin responder
CREATE OR REPLACE VIEW vista_preguntas_sin_responder AS
SELECT 
    q.id,
    p.nombre AS producto,
    q.pregunta,
    CASE WHEN q.es_anonima THEN 'Anónimo' ELSE c.nombre_completo END AS cliente,
    q.votos_util,
    q.creado_en,
    TIMESTAMPDIFF(HOUR, q.creado_en, NOW()) AS horas_sin_respuesta
FROM productos_preguntas q
JOIN catalogo_productos p ON q.producto_id = p.id
LEFT JOIN clientes c ON q.cliente_id = c.id
WHERE q.estado = 'publicada'
AND q.total_respuestas = 0
ORDER BY q.votos_util DESC, q.creado_en ASC;

-- Vista resumen de reseñas por día
CREATE OR REPLACE VIEW vista_resenas_diarias AS
SELECT 
    DATE(creado_en) AS fecha,
    COUNT(*) AS total_resenas,
    AVG(calificacion) AS promedio_calificacion,
    SUM(CASE WHEN calificacion = 5 THEN 1 ELSE 0 END) AS cinco_estrellas,
    SUM(CASE WHEN calificacion <= 2 THEN 1 ELSE 0 END) AS negativas,
    SUM(CASE WHEN es_compra_verificada THEN 1 ELSE 0 END) AS verificadas
FROM resenas
WHERE estado IN ('aprobada', 'destacada')
GROUP BY DATE(creado_en)
ORDER BY fecha DESC
LIMIT 30;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Crear o actualizar estadísticas de un producto
CREATE PROCEDURE sp_actualizar_estadisticas_resenas(IN p_producto_id BIGINT UNSIGNED)
BEGIN
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_verificadas INT DEFAULT 0;
    DECLARE v_con_imagenes INT DEFAULT 0;
    DECLARE v_promedio DECIMAL(3,2) DEFAULT 0;
    DECLARE v_est_5 INT DEFAULT 0;
    DECLARE v_est_4 INT DEFAULT 0;
    DECLARE v_est_3 INT DEFAULT 0;
    DECLARE v_est_2 INT DEFAULT 0;
    DECLARE v_est_1 INT DEFAULT 0;
    
    SELECT 
        COUNT(*),
        SUM(CASE WHEN es_compra_verificada THEN 1 ELSE 0 END),
        SUM(CASE WHEN tiene_imagenes THEN 1 ELSE 0 END),
        COALESCE(AVG(calificacion), 0),
        SUM(CASE WHEN calificacion = 5 THEN 1 ELSE 0 END),
        SUM(CASE WHEN calificacion = 4 THEN 1 ELSE 0 END),
        SUM(CASE WHEN calificacion = 3 THEN 1 ELSE 0 END),
        SUM(CASE WHEN calificacion = 2 THEN 1 ELSE 0 END),
        SUM(CASE WHEN calificacion = 1 THEN 1 ELSE 0 END)
    INTO v_total, v_verificadas, v_con_imagenes, v_promedio,
         v_est_5, v_est_4, v_est_3, v_est_2, v_est_1
    FROM resenas
    WHERE producto_id = p_producto_id
    AND estado IN ('aprobada', 'destacada');
    
    INSERT INTO productos_estadisticas_resenas (
        producto_id, total_resenas, total_resenas_verificadas,
        total_resenas_con_imagenes, calificacion_promedio,
        estrellas_5, estrellas_4, estrellas_3, estrellas_2, estrellas_1,
        porcentaje_5, porcentaje_4, porcentaje_3, porcentaje_2, porcentaje_1
    ) VALUES (
        p_producto_id, v_total, v_verificadas,
        v_con_imagenes, v_promedio,
        v_est_5, v_est_4, v_est_3, v_est_2, v_est_1,
        IF(v_total > 0, (v_est_5 / v_total) * 100, 0),
        IF(v_total > 0, (v_est_4 / v_total) * 100, 0),
        IF(v_total > 0, (v_est_3 / v_total) * 100, 0),
        IF(v_total > 0, (v_est_2 / v_total) * 100, 0),
        IF(v_total > 0, (v_est_1 / v_total) * 100, 0)
    )
    ON DUPLICATE KEY UPDATE
        total_resenas = v_total,
        total_resenas_verificadas = v_verificadas,
        total_resenas_con_imagenes = v_con_imagenes,
        calificacion_promedio = v_promedio,
        estrellas_5 = v_est_5,
        estrellas_4 = v_est_4,
        estrellas_3 = v_est_3,
        estrellas_2 = v_est_2,
        estrellas_1 = v_est_1,
        porcentaje_5 = IF(v_total > 0, (v_est_5 / v_total) * 100, 0),
        porcentaje_4 = IF(v_total > 0, (v_est_4 / v_total) * 100, 0),
        porcentaje_3 = IF(v_total > 0, (v_est_3 / v_total) * 100, 0),
        porcentaje_2 = IF(v_total > 0, (v_est_2 / v_total) * 100, 0),
        porcentaje_1 = IF(v_total > 0, (v_est_1 / v_total) * 100, 0),
        actualizado_en = NOW();
    
    UPDATE catalogo_productos
    SET 
        calificacion_promedio = v_promedio,
        total_resenas = v_total
    WHERE id = p_producto_id;
END //

-- Crear una reseña
CREATE PROCEDURE sp_crear_resena(
    IN p_producto_id BIGINT UNSIGNED,
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_calificacion TINYINT,
    IN p_titulo VARCHAR(200),
    IN p_contenido TEXT,
    IN p_pedido_id BIGINT UNSIGNED,
    IN p_ip VARCHAR(45),
    OUT p_resena_id BIGINT UNSIGNED,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_verificada BOOLEAN DEFAULT FALSE;
    DECLARE v_fecha_compra DATE;
    DECLARE v_estado VARCHAR(20) DEFAULT 'pendiente';
    DECLARE v_puntos INT DEFAULT 0;
    DECLARE v_auto_aprobar BOOLEAN DEFAULT FALSE;
    
    SELECT COUNT(*) INTO v_existe
    FROM resenas
    WHERE producto_id = p_producto_id AND cliente_id = p_cliente_id;
    
    IF v_existe > 0 THEN
        SET p_resena_id = NULL;
        SET p_mensaje = 'Ya has reseñado este producto';
    ELSE
        IF p_pedido_id IS NOT NULL THEN
            SELECT 1, DATE(p.creado_en)
            INTO v_verificada, v_fecha_compra
            FROM pedidos p
            JOIN pedidos_items pi ON p.id = pi.pedido_id
            WHERE p.id = p_pedido_id
            AND p.cliente_id = p_cliente_id
            AND pi.producto_id = p_producto_id
            AND p.estado = 'entregado'
            LIMIT 1;
        ELSE
            SELECT 1, DATE(p.creado_en)
            INTO v_verificada, v_fecha_compra
            FROM pedidos p
            JOIN pedidos_items pi ON p.id = pi.pedido_id
            WHERE p.cliente_id = p_cliente_id
            AND pi.producto_id = p_producto_id
            AND p.estado = 'entregado'
            ORDER BY p.creado_en DESC
            LIMIT 1;
        END IF;
        
        SELECT auto_aprobar_verificadas, puntos_por_resena
        INTO v_auto_aprobar, v_puntos
        FROM resenas_configuracion
        WHERE es_activo = TRUE
        LIMIT 1;
        
        IF v_verificada AND v_auto_aprobar THEN
            SET v_estado = 'aprobada';
        END IF;
        
        INSERT INTO resenas (
            producto_id, cliente_id, pedido_id,
            calificacion, titulo, contenido,
            es_compra_verificada, fecha_compra,
            estado, ip_address
        ) VALUES (
            p_producto_id, p_cliente_id, p_pedido_id,
            p_calificacion, p_titulo, p_contenido,
            COALESCE(v_verificada, FALSE), v_fecha_compra,
            v_estado, p_ip
        );
        
        SET p_resena_id = LAST_INSERT_ID();
        
        IF v_estado = 'aprobada' THEN
            CALL sp_actualizar_estadisticas_resenas(p_producto_id);
            
            IF v_puntos > 0 THEN
                CALL sp_acumular_puntos_resena(p_cliente_id, p_resena_id, v_puntos);
            END IF;
        END IF;
        
        UPDATE clientes
        SET total_resenas = total_resenas + 1
        WHERE id = p_cliente_id;
        
        SET p_mensaje = CASE 
            WHEN v_estado = 'aprobada' THEN 'Reseña publicada exitosamente'
            ELSE 'Reseña enviada, pendiente de moderación'
        END;
    END IF;
END //

-- Acumular puntos por reseña
CREATE PROCEDURE sp_acumular_puntos_resena(
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_resena_id BIGINT UNSIGNED,
    IN p_puntos INT UNSIGNED
)
BEGIN
    DECLARE v_puntos_anteriores INT UNSIGNED;
    
    SELECT puntos_actuales INTO v_puntos_anteriores
    FROM clientes WHERE id = p_cliente_id;
    
    UPDATE clientes
    SET 
        puntos_actuales = puntos_actuales + p_puntos,
        puntos_totales_historico = puntos_totales_historico + p_puntos
    WHERE id = p_cliente_id;
    
    INSERT INTO clientes_puntos_movimientos (
        cliente_id, tipo, puntos,
        puntos_anteriores, puntos_nuevos,
        referencia_tipo, referencia_id, descripcion
    ) VALUES (
        p_cliente_id, 'acumulacion_resena', p_puntos,
        v_puntos_anteriores, v_puntos_anteriores + p_puntos,
        'resena', p_resena_id, 'Puntos por publicar reseña'
    );
    
    UPDATE resenas
    SET puntos_otorgados = p_puntos
    WHERE id = p_resena_id;
END //

-- Moderar reseña
CREATE PROCEDURE sp_moderar_resena(
    IN p_resena_id BIGINT UNSIGNED,
    IN p_accion VARCHAR(20),
    IN p_motivo TEXT,
    IN p_moderador_id INT UNSIGNED,
    IN p_moderador_nombre VARCHAR(200)
)
BEGIN
    DECLARE v_estado_anterior VARCHAR(20);
    DECLARE v_estado_nuevo VARCHAR(20);
    DECLARE v_producto_id BIGINT UNSIGNED;
    DECLARE v_cliente_id BIGINT UNSIGNED;
    DECLARE v_puntos INT DEFAULT 0;
    
    SELECT estado, producto_id, cliente_id
    INTO v_estado_anterior, v_producto_id, v_cliente_id
    FROM resenas WHERE id = p_resena_id;
    
    SET v_estado_nuevo = CASE p_accion
        WHEN 'aprobar' THEN 'aprobada'
        WHEN 'rechazar' THEN 'rechazada'
        WHEN 'ocultar' THEN 'oculta'
        WHEN 'destacar' THEN 'destacada'
        WHEN 'restaurar' THEN 'aprobada'
        ELSE v_estado_anterior
    END;
    
    UPDATE resenas
    SET 
        estado = v_estado_nuevo,
        motivo_rechazo = IF(p_accion = 'rechazar', p_motivo, motivo_rechazo),
        moderado_por = p_moderador_id,
        moderado_en = NOW()
    WHERE id = p_resena_id;
    
    INSERT INTO resenas_moderacion_historial (
        resena_id, accion, estado_anterior, estado_nuevo,
        motivo, moderador_id, moderador_nombre
    ) VALUES (
        p_resena_id, p_accion, v_estado_anterior, v_estado_nuevo,
        p_motivo, p_moderador_id, p_moderador_nombre
    );
    
    IF v_estado_nuevo IN ('aprobada', 'destacada') AND v_estado_anterior = 'pendiente' THEN
        SELECT puntos_por_resena INTO v_puntos
        FROM resenas_configuracion WHERE es_activo = TRUE LIMIT 1;
        
        IF v_puntos > 0 THEN
            CALL sp_acumular_puntos_resena(v_cliente_id, p_resena_id, v_puntos);
        END IF;
    END IF;
    
    CALL sp_actualizar_estadisticas_resenas(v_producto_id);
    
    SELECT 'ok' AS resultado, v_estado_nuevo AS nuevo_estado;
END //

-- Votar reseña
CREATE PROCEDURE sp_votar_resena(
    IN p_resena_id BIGINT UNSIGNED,
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_sesion_id VARCHAR(100),
    IN p_es_util BOOLEAN,
    IN p_ip VARCHAR(45)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    
    IF p_cliente_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_existe
        FROM resenas_votos
        WHERE resena_id = p_resena_id AND cliente_id = p_cliente_id;
    ELSE
        SELECT COUNT(*) INTO v_existe
        FROM resenas_votos
        WHERE resena_id = p_resena_id AND sesion_id = p_sesion_id;
    END IF;
    
    IF v_existe > 0 THEN
        IF p_cliente_id IS NOT NULL THEN
            UPDATE resenas_votos
            SET es_util = p_es_util
            WHERE resena_id = p_resena_id AND cliente_id = p_cliente_id;
        ELSE
            UPDATE resenas_votos
            SET es_util = p_es_util
            WHERE resena_id = p_resena_id AND sesion_id = p_sesion_id;
        END IF;
    ELSE
        INSERT INTO resenas_votos (resena_id, cliente_id, sesion_id, es_util, ip_address)
        VALUES (p_resena_id, p_cliente_id, p_sesion_id, p_es_util, p_ip);
    END IF;
    
    UPDATE resenas
    SET 
        votos_util = (SELECT COUNT(*) FROM resenas_votos WHERE resena_id = p_resena_id AND es_util = TRUE),
        votos_no_util = (SELECT COUNT(*) FROM resenas_votos WHERE resena_id = p_resena_id AND es_util = FALSE)
    WHERE id = p_resena_id;
    
    SELECT 'ok' AS resultado;
END //

-- Responder a reseña (tienda)
CREATE PROCEDURE sp_responder_resena(
    IN p_resena_id BIGINT UNSIGNED,
    IN p_contenido TEXT,
    IN p_autor_id INT UNSIGNED,
    IN p_autor_nombre VARCHAR(200)
)
BEGIN
    INSERT INTO resenas_respuestas (
        resena_id, tipo_autor, autor_id, autor_nombre,
        contenido, es_oficial
    ) VALUES (
        p_resena_id, 'tienda', p_autor_id, p_autor_nombre,
        p_contenido, TRUE
    );
    
    UPDATE resenas
    SET tiene_respuesta = TRUE
    WHERE id = p_resena_id;
    
    SELECT LAST_INSERT_ID() AS respuesta_id, 'ok' AS resultado;
END //

-- Reportar reseña
CREATE PROCEDURE sp_reportar_resena(
    IN p_resena_id BIGINT UNSIGNED,
    IN p_cliente_id BIGINT UNSIGNED,
    IN p_motivo VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_ip VARCHAR(45)
)
BEGIN
    INSERT INTO resenas_reportes (
        resena_id, cliente_id, motivo, descripcion, ip_address
    ) VALUES (
        p_resena_id, p_cliente_id, p_motivo, p_descripcion, p_ip
    );
    
    UPDATE resenas
    SET total_reportes = total_reportes + 1
    WHERE id = p_resena_id;
    
    SELECT 'ok' AS resultado, 'Reporte enviado' AS mensaje;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger para actualizar estadísticas cuando se aprueba una reseña
CREATE TRIGGER trg_resena_aprobada
AFTER UPDATE ON resenas
FOR EACH ROW
BEGIN
    IF NEW.estado IN ('aprobada', 'destacada') AND OLD.estado NOT IN ('aprobada', 'destacada') THEN
        CALL sp_actualizar_estadisticas_resenas(NEW.producto_id);
    ELSEIF OLD.estado IN ('aprobada', 'destacada') AND NEW.estado NOT IN ('aprobada', 'destacada') THEN
        CALL sp_actualizar_estadisticas_resenas(NEW.producto_id);
    END IF;
END //

-- Trigger para marcar que tiene imágenes
CREATE TRIGGER trg_resena_medio_insert
AFTER INSERT ON resenas_medios
FOR EACH ROW
BEGIN
    IF NEW.tipo = 'imagen' AND NEW.estado = 'aprobado' THEN
        UPDATE resenas SET tiene_imagenes = TRUE WHERE id = NEW.resena_id;
    ELSEIF NEW.tipo = 'video' AND NEW.estado = 'aprobado' THEN
        UPDATE resenas SET tiene_video = TRUE WHERE id = NEW.resena_id;
    END IF;
END //

-- Trigger para actualizar contador de respuestas en preguntas
CREATE TRIGGER trg_respuesta_pregunta_insert
AFTER INSERT ON productos_respuestas
FOR EACH ROW
BEGIN
    UPDATE productos_preguntas
    SET 
        total_respuestas = total_respuestas + 1,
        tiene_respuesta_oficial = IF(NEW.es_oficial, TRUE, tiene_respuesta_oficial)
    WHERE id = NEW.pregunta_id;
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Configuración por defecto de reseñas
INSERT INTO resenas_configuracion (
    requiere_compra_verificada,
    dias_minimos_para_resenar,
    dias_maximos_para_resenar,
    contenido_minimo_caracteres,
    contenido_maximo_caracteres,
    permite_imagenes,
    max_imagenes,
    permite_videos,
    max_videos,
    moderacion_automatica,
    auto_aprobar_verificadas,
    auto_aprobar_calificacion_minima,
    puntos_por_resena,
    puntos_por_resena_con_foto,
    puntos_por_resena_verificada,
    notificar_nuevas_resenas,
    notificar_resenas_negativas,
    calificacion_negativa_umbral,
    es_activo
) VALUES (
    FALSE,
    1,
    365,
    20,
    5000,
    TRUE,
    5,
    TRUE,
    1,
    TRUE,
    TRUE,
    3,
    50,
    100,
    75,
    TRUE,
    TRUE,
    2,
    TRUE
);

-- ============================================================================
-- ACTUALIZAR TABLA DE PRODUCTOS (agregar campos si no existen)
-- ============================================================================

-- Verificar y agregar columnas de reseñas a productos si no existen
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'tienda_virtual' 
     AND TABLE_NAME = 'catalogo_productos' 
     AND COLUMN_NAME = 'calificacion_promedio') = 0,
    'ALTER TABLE catalogo_productos ADD COLUMN calificacion_promedio DECIMAL(3,2) NOT NULL DEFAULT 0.00 AFTER stock_actual',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'tienda_virtual' 
     AND TABLE_NAME = 'catalogo_productos' 
     AND COLUMN_NAME = 'total_resenas') = 0,
    'ALTER TABLE catalogo_productos ADD COLUMN total_resenas INT UNSIGNED NOT NULL DEFAULT 0 AFTER calificacion_promedio',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- FIN DEL SCRIPT - FASE 7
-- ============================================================================
