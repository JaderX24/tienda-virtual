-- ============================================================================
-- TIENDA VIRTUAL - FASE 12: LOGÃSTICA AVANZADA
-- ============================================================================
-- VersiÃ³n: 1.0
-- Fecha: 24-01-2026
-- DescripciÃ³n: Sistema completo de logÃ­stica con multi-almacÃ©n,
--              rutas de entrega, tracking en tiempo real y optimizaciÃ³n
-- Dependencias: Fases 1-11 instaladas
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- CONFIGURACIÃ“N INICIAL
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- LIMPIEZA DE OBJETOS EXISTENTES
-- ============================================================================

-- Eliminar vistas
DROP VIEW IF EXISTS vista_almacenes_stock;
DROP VIEW IF EXISTS vista_envios_pendientes;
DROP VIEW IF EXISTS vista_rutas_activas;
DROP VIEW IF EXISTS vista_entregas_hoy;
DROP VIEW IF EXISTS vista_rendimiento_transportistas;
DROP VIEW IF EXISTS vista_cobertura_zonas;

-- Eliminar procedimientos
DROP PROCEDURE IF EXISTS sp_asignar_almacen_pedido;
DROP PROCEDURE IF EXISTS sp_calcular_costo_envio;
DROP PROCEDURE IF EXISTS sp_crear_ruta_entrega;
DROP PROCEDURE IF EXISTS sp_optimizar_ruta;
DROP PROCEDURE IF EXISTS sp_actualizar_tracking;
DROP PROCEDURE IF EXISTS sp_transferir_inventario;
DROP PROCEDURE IF EXISTS sp_asignar_transportista;
DROP PROCEDURE IF EXISTS sp_completar_entrega;

-- Eliminar eventos
DROP EVENT IF EXISTS evento_actualizar_etiquetas_envio;
DROP EVENT IF EXISTS evento_optimizar_rutas_diarias;
DROP EVENT IF EXISTS evento_notificar_entregas_retrasadas;
DROP EVENT IF EXISTS evento_limpiar_tracking_antiguo;

-- Eliminar triggers
DROP TRIGGER IF EXISTS trg_log_movimiento_inventario;
DROP TRIGGER IF EXISTS trg_actualizar_stock_almacen;
DROP TRIGGER IF EXISTS trg_notificar_stock_bajo;

-- Eliminar tablas (orden por dependencias)
DROP TABLE IF EXISTS logistica_entregas_fotos;
DROP TABLE IF EXISTS logistica_entregas_firmas;
DROP TABLE IF EXISTS logistica_entregas_intentos;
DROP TABLE IF EXISTS logistica_rutas_paradas;
DROP TABLE IF EXISTS logistica_rutas;
DROP TABLE IF EXISTS logistica_vehiculos_mantenimiento;
DROP TABLE IF EXISTS logistica_vehiculos;
DROP TABLE IF EXISTS logistica_transportistas_zonas;
DROP TABLE IF EXISTS logistica_transportistas_documentos;
DROP TABLE IF EXISTS logistica_transportistas_horarios;
DROP TABLE IF EXISTS logistica_transportistas;
DROP TABLE IF EXISTS logistica_tracking_eventos;
DROP TABLE IF EXISTS logistica_envios_etiquetas;
DROP TABLE IF EXISTS logistica_envios_paquetes;
DROP TABLE IF EXISTS logistica_tarifas_especiales;
DROP TABLE IF EXISTS logistica_tarifas_peso;
DROP TABLE IF EXISTS logistica_tarifas_zonas;
DROP TABLE IF EXISTS logistica_zonas_cobertura_codigos;
DROP TABLE IF EXISTS logistica_zonas_cobertura;
DROP TABLE IF EXISTS logistica_zonas;
DROP TABLE IF EXISTS logistica_almacenes_movimientos;
DROP TABLE IF EXISTS logistica_almacenes_stock;
DROP TABLE IF EXISTS logistica_almacenes_ubicaciones;
DROP TABLE IF EXISTS logistica_almacenes_horarios;
DROP TABLE IF EXISTS logistica_almacenes;
DROP TABLE IF EXISTS logistica_configuracion;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLA: logistica_configuracion
-- ConfiguraciÃ³n general del sistema de logÃ­stica
-- ============================================================================

CREATE TABLE logistica_configuracion (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo_dato ENUM('texto', 'numero', 'booleano', 'json', 'fecha') NOT NULL DEFAULT 'texto',
    descripcion VARCHAR(500),
    categoria VARCHAR(50) NOT NULL DEFAULT 'general',
    es_editable BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_log_config_categoria (categoria),
    INDEX idx_log_config_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_almacenes
-- Almacenes y centros de distribuciÃ³n
-- ============================================================================

CREATE TABLE logistica_almacenes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- IdentificaciÃ³n
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Tipo de almacÃ©n
    tipo ENUM(
        'principal',
        'secundario', 
        'centro_distribucion',
        'punto_recogida',
        'tienda',
        'proveedor_dropship'
    ) NOT NULL DEFAULT 'secundario',
    
    -- Empresa (multi-tenant)
    empresa_id INT UNSIGNED,
    
    -- UbicaciÃ³n
    direccion VARCHAR(500) NOT NULL,
    direccion_adicional VARCHAR(200),
    ciudad VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20),
    pais VARCHAR(100) NOT NULL DEFAULT 'Honduras',
    
    -- Coordenadas GPS
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Contacto
    telefono VARCHAR(20),
    telefono_emergencia VARCHAR(20),
    correo VARCHAR(255),
    responsable_nombre VARCHAR(200),
    responsable_telefono VARCHAR(20),
    
    -- Capacidad
    capacidad_total_m3 DECIMAL(10,2),
    capacidad_usada_m3 DECIMAL(10,2) DEFAULT 0.00,
    capacidad_pallets INT UNSIGNED,
    
    -- CaracterÃ­sticas
    tiene_refrigeracion BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_congelacion BOOLEAN NOT NULL DEFAULT FALSE,
    permite_picking BOOLEAN NOT NULL DEFAULT TRUE,
    permite_packing BOOLEAN NOT NULL DEFAULT TRUE,
    permite_devolucion BOOLEAN NOT NULL DEFAULT TRUE,
    es_punto_entrega BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Prioridad para asignaciÃ³n
    prioridad INT UNSIGNED NOT NULL DEFAULT 100,
    radio_cobertura_km DECIMAL(10,2) DEFAULT 50.00,
    
    -- Estado
    estado ENUM('activo', 'inactivo', 'mantenimiento', 'cerrado_temporal') NOT NULL DEFAULT 'activo',
    
    -- AuditorÃ­a
    creado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_almacen_codigo (codigo),
    INDEX idx_almacen_tipo (tipo),
    INDEX idx_almacen_empresa (empresa_id),
    INDEX idx_almacen_estado (estado),
    INDEX idx_almacen_ciudad (ciudad),
    INDEX idx_almacen_coords (latitud, longitud),
    
    CONSTRAINT fk_log_almacen_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_almacen_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_almacenes_horarios
-- Horarios de operaciÃ³n de almacenes
-- ============================================================================

CREATE TABLE logistica_almacenes_horarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    almacen_id INT UNSIGNED NOT NULL,
    
    dia_semana TINYINT UNSIGNED NOT NULL, -- 0=Domingo, 1=Lunes...6=SÃ¡bado
    
    hora_apertura TIME,
    hora_cierre TIME,
    
    -- Horario de recepciÃ³n de mercancÃ­a
    hora_recepcion_inicio TIME,
    hora_recepcion_fin TIME,
    
    -- Horario de despacho
    hora_despacho_inicio TIME,
    hora_despacho_fin TIME,
    
    es_cerrado BOOLEAN NOT NULL DEFAULT FALSE,
    notas VARCHAR(255),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_horario_almacen (almacen_id),
    INDEX idx_horario_dia (dia_semana),
    UNIQUE KEY uk_almacen_dia (almacen_id, dia_semana),
    
    CONSTRAINT fk_log_horario_almacen 
        FOREIGN KEY (almacen_id) REFERENCES logistica_almacenes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_almacenes_ubicaciones
-- Ubicaciones dentro del almacÃ©n (pasillos, estantes, etc.)
-- ============================================================================

CREATE TABLE logistica_almacenes_ubicaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    almacen_id INT UNSIGNED NOT NULL,
    
    -- CÃ³digo de ubicaciÃ³n (ej: A-01-02-03 = Pasillo A, Estante 1, Nivel 2, PosiciÃ³n 3)
    codigo VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(100),
    
    -- JerarquÃ­a
    zona VARCHAR(20),        -- Zona del almacÃ©n
    pasillo VARCHAR(10),     -- NÃºmero de pasillo
    estante VARCHAR(10),     -- NÃºmero de estante
    nivel VARCHAR(10),       -- Nivel/altura
    posicion VARCHAR(10),    -- PosiciÃ³n horizontal
    
    -- Tipo
    tipo ENUM(
        'picking',           -- Para picking directo
        'bulk',              -- Almacenamiento a granel
        'reserve',           -- Reserva/restock
        'receiving',         -- RecepciÃ³n
        'shipping',          -- Despacho
        'returns',           -- Devoluciones
        'quarantine',        -- Cuarentena/revisiÃ³n
        'damaged'            -- Productos daÃ±ados
    ) NOT NULL DEFAULT 'picking',
    
    -- Dimensiones (cm)
    ancho DECIMAL(10,2),
    alto DECIMAL(10,2),
    profundidad DECIMAL(10,2),
    capacidad_peso_kg DECIMAL(10,2),
    
    -- Restricciones
    requiere_refrigeracion BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_congelacion BOOLEAN NOT NULL DEFAULT FALSE,
    permite_liquidos BOOLEAN NOT NULL DEFAULT TRUE,
    permite_fragil BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Estado
    esta_ocupada BOOLEAN NOT NULL DEFAULT FALSE,
    esta_bloqueada BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_bloqueo VARCHAR(255),
    
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ubicacion_almacen (almacen_id),
    INDEX idx_ubicacion_codigo (codigo),
    INDEX idx_ubicacion_tipo (tipo),
    INDEX idx_ubicacion_zona (zona),
    UNIQUE KEY uk_almacen_ubicacion (almacen_id, codigo),
    
    CONSTRAINT fk_log_ubicacion_almacen 
        FOREIGN KEY (almacen_id) REFERENCES logistica_almacenes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_almacenes_stock
-- Stock por producto y ubicaciÃ³n
-- ============================================================================

CREATE TABLE logistica_almacenes_stock (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    almacen_id INT UNSIGNED NOT NULL,
    ubicacion_id BIGINT UNSIGNED,
    producto_id BIGINT UNSIGNED NOT NULL,
    
    -- Variante (si aplica)
    variante_id BIGINT UNSIGNED,
    
    -- Cantidades
    cantidad_disponible INT NOT NULL DEFAULT 0,
    cantidad_reservada INT NOT NULL DEFAULT 0,
    cantidad_en_transito INT NOT NULL DEFAULT 0,
    cantidad_minima INT NOT NULL DEFAULT 0,
    cantidad_maxima INT,
    punto_reorden INT,
    
    -- Lote y vencimiento
    numero_lote VARCHAR(100),
    fecha_vencimiento DATE,
    fecha_fabricacion DATE,
    
    -- Costos
    costo_unitario DECIMAL(15,2),
    costo_promedio DECIMAL(15,2),
    
    -- Ãšltima actividad
    ultima_entrada DATETIME,
    ultima_salida DATETIME,
    ultimo_conteo DATETIME,
    
    -- Estado
    estado ENUM('disponible', 'reservado', 'bloqueado', 'vencido', 'danado') NOT NULL DEFAULT 'disponible',
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_stock_almacen (almacen_id),
    INDEX idx_stock_producto (producto_id),
    INDEX idx_stock_ubicacion (ubicacion_id),
    INDEX idx_stock_variante (variante_id),
    INDEX idx_stock_estado (estado),
    INDEX idx_stock_vencimiento (fecha_vencimiento),
    INDEX idx_stock_lote (numero_lote),
    
    CONSTRAINT fk_log_stock_almacen 
        FOREIGN KEY (almacen_id) REFERENCES logistica_almacenes(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_stock_ubicacion 
        FOREIGN KEY (ubicacion_id) REFERENCES logistica_almacenes_ubicaciones(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_stock_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_almacenes_movimientos
-- Historial de movimientos de inventario
-- ============================================================================

CREATE TABLE logistica_almacenes_movimientos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Almacenes involucrados
    almacen_origen_id INT UNSIGNED,
    almacen_destino_id INT UNSIGNED,
    ubicacion_origen_id BIGINT UNSIGNED,
    ubicacion_destino_id BIGINT UNSIGNED,
    
    -- Producto
    producto_id BIGINT UNSIGNED NOT NULL,
    variante_id BIGINT UNSIGNED,
    
    -- Tipo de movimiento
    tipo ENUM(
        'entrada_compra',
        'entrada_devolucion',
        'entrada_transferencia',
        'entrada_ajuste',
        'entrada_produccion',
        'salida_venta',
        'salida_transferencia',
        'salida_ajuste',
        'salida_merma',
        'salida_danado',
        'reubicacion',
        'conteo_inventario'
    ) NOT NULL,
    
    -- Cantidades
    cantidad INT NOT NULL,
    cantidad_anterior INT NOT NULL DEFAULT 0,
    cantidad_posterior INT NOT NULL DEFAULT 0,
    
    -- Referencia
    referencia_tipo VARCHAR(50),  -- pedido, compra, transferencia, ajuste
    referencia_id BIGINT UNSIGNED,
    numero_documento VARCHAR(50),
    
    -- Lote
    numero_lote VARCHAR(100),
    
    -- Costos
    costo_unitario DECIMAL(15,2),
    costo_total DECIMAL(15,2),
    
    -- Notas
    motivo VARCHAR(500),
    notas TEXT,
    
    -- AuditorÃ­a
    realizado_por INT UNSIGNED,
    aprobado_por INT UNSIGNED,
    fecha_aprobacion DATETIME,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mov_almacen_origen (almacen_origen_id),
    INDEX idx_mov_almacen_destino (almacen_destino_id),
    INDEX idx_mov_producto (producto_id),
    INDEX idx_mov_tipo (tipo),
    INDEX idx_mov_fecha (creado_en),
    INDEX idx_mov_referencia (referencia_tipo, referencia_id),
    INDEX idx_mov_documento (numero_documento),
    
    CONSTRAINT fk_log_mov_almacen_origen 
        FOREIGN KEY (almacen_origen_id) REFERENCES logistica_almacenes(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_mov_almacen_destino 
        FOREIGN KEY (almacen_destino_id) REFERENCES logistica_almacenes(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_mov_producto 
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_mov_realizado 
        FOREIGN KEY (realizado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_mov_aprobado 
        FOREIGN KEY (aprobado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_zonas
-- Zonas geogrÃ¡ficas para envÃ­o
-- ============================================================================

CREATE TABLE logistica_zonas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Tipo
    tipo ENUM('local', 'metropolitana', 'regional', 'nacional', 'internacional') NOT NULL DEFAULT 'regional',
    
    -- PaÃ­s
    pais VARCHAR(100) NOT NULL DEFAULT 'Honduras',
    
    -- Tiempos de entrega (dÃ­as hÃ¡biles)
    tiempo_entrega_min INT UNSIGNED NOT NULL DEFAULT 1,
    tiempo_entrega_max INT UNSIGNED NOT NULL DEFAULT 5,
    
    -- AlmacÃ©n asignado por defecto
    almacen_default_id INT UNSIGNED,
    
    -- Estado
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    tiene_cobertura BOOLEAN NOT NULL DEFAULT TRUE,
    requiere_cotizacion BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Colores para mapa
    color_hex VARCHAR(7) DEFAULT '#3498db',
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_zona_codigo (codigo),
    INDEX idx_zona_tipo (tipo),
    INDEX idx_zona_activa (es_activo),
    
    CONSTRAINT fk_log_zona_almacen 
        FOREIGN KEY (almacen_default_id) REFERENCES logistica_almacenes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_zonas_cobertura
-- Ãreas de cobertura por zona (departamentos/ciudades)
-- ============================================================================

CREATE TABLE logistica_zonas_cobertura (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zona_id INT UNSIGNED NOT NULL,
    
    -- UbicaciÃ³n
    departamento VARCHAR(100) NOT NULL,
    municipio VARCHAR(100),
    ciudad VARCHAR(100),
    
    -- Cobertura completa o parcial
    cobertura_completa BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Restricciones
    solo_zona_urbana BOOLEAN NOT NULL DEFAULT FALSE,
    dias_adicionales INT UNSIGNED DEFAULT 0,
    
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cobertura_zona (zona_id),
    INDEX idx_cobertura_depto (departamento),
    INDEX idx_cobertura_ciudad (ciudad),
    
    CONSTRAINT fk_log_cobertura_zona 
        FOREIGN KEY (zona_id) REFERENCES logistica_zonas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_zonas_cobertura_codigos
-- CÃ³digos postales por cobertura
-- ============================================================================

CREATE TABLE logistica_zonas_cobertura_codigos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cobertura_id INT UNSIGNED NOT NULL,
    
    codigo_postal VARCHAR(20) NOT NULL,
    nombre_colonia VARCHAR(200),
    
    tiene_restriccion BOOLEAN NOT NULL DEFAULT FALSE,
    restriccion_nota VARCHAR(255),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cod_cobertura (cobertura_id),
    INDEX idx_cod_postal (codigo_postal),
    
    CONSTRAINT fk_log_cod_cobertura 
        FOREIGN KEY (cobertura_id) REFERENCES logistica_zonas_cobertura(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_tarifas_zonas
-- Tarifas base por zona
-- ============================================================================

CREATE TABLE logistica_tarifas_zonas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zona_id INT UNSIGNED NOT NULL,
    
    -- Tipo de servicio
    tipo_servicio ENUM('standard', 'express', 'same_day', 'economico', 'premium') NOT NULL DEFAULT 'standard',
    
    -- Tarifa base
    tarifa_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tarifa_minima DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tarifa_maxima DECIMAL(10,2),
    
    -- Por peso
    tarifa_por_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    peso_base_incluido DECIMAL(10,2) DEFAULT 1.00, -- kg incluidos en tarifa base
    
    -- Por volumen
    tarifa_por_m3 DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    factor_dimensional DECIMAL(7,2) DEFAULT 5000.00, -- Para calcular peso volumétrico
    
    -- Por distancia (si aplica)
    tarifa_por_km DECIMAL(10,2) DEFAULT 0.00,
    
    -- Tiempos
    tiempo_entrega_horas INT UNSIGNED,
    dias_entrega_min INT UNSIGNED DEFAULT 1,
    dias_entrega_max INT UNSIGNED DEFAULT 3,
    
    -- Vigencia
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE,
    
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tarifa_zona (zona_id),
    INDEX idx_tarifa_servicio (tipo_servicio),
    INDEX idx_tarifa_vigencia (vigente_desde, vigente_hasta),
    
    CONSTRAINT fk_log_tarifa_zona 
        FOREIGN KEY (zona_id) REFERENCES logistica_zonas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_tarifas_peso
-- Tarifas escalonadas por peso
-- ============================================================================

CREATE TABLE logistica_tarifas_peso (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tarifa_zona_id INT UNSIGNED NOT NULL,
    
    peso_desde DECIMAL(10,2) NOT NULL,
    peso_hasta DECIMAL(10,2) NOT NULL,
    
    tarifa_adicional DECIMAL(10,2) NOT NULL,
    tarifa_por_kg_extra DECIMAL(10,2),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tarifa_peso_zona (tarifa_zona_id),
    
    CONSTRAINT fk_log_tarifa_peso_zona 
        FOREIGN KEY (tarifa_zona_id) REFERENCES logistica_tarifas_zonas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_tarifas_especiales
-- Tarifas especiales por cliente/empresa
-- ============================================================================

CREATE TABLE logistica_tarifas_especiales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Aplica a
    empresa_id INT UNSIGNED,
    cliente_id BIGINT UNSIGNED,
    nivel_membresia_id INT UNSIGNED,
    
    zona_id INT UNSIGNED,
    tipo_servicio ENUM('standard', 'express', 'same_day', 'economico', 'premium'),
    
    -- Descuento
    tipo_descuento ENUM('porcentaje', 'monto_fijo', 'tarifa_fija') NOT NULL,
    valor_descuento DECIMAL(10,2) NOT NULL,
    
    -- Condiciones
    monto_minimo_pedido DECIMAL(15,2),
    cantidad_minima_envios INT UNSIGNED,
    
    -- Vigencia
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE,
    
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    notas TEXT,
    
    creado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tarifa_esp_empresa (empresa_id),
    INDEX idx_tarifa_esp_cliente (cliente_id),
    INDEX idx_tarifa_esp_zona (zona_id),
    
    CONSTRAINT fk_log_tarifa_esp_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_tarifa_esp_cliente 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_tarifa_esp_zona 
        FOREIGN KEY (zona_id) REFERENCES logistica_zonas(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_tarifa_esp_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_transportistas
-- Transportistas (empleados o externos)
-- ============================================================================

CREATE TABLE logistica_transportistas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- IdentificaciÃ³n
    codigo VARCHAR(20) NOT NULL UNIQUE,
    tipo ENUM('interno', 'externo', 'freelance', 'empresa_courier') NOT NULL DEFAULT 'interno',
    
    -- Datos personales/empresa
    nombre VARCHAR(200) NOT NULL,
    documento_identidad VARCHAR(50),
    tipo_documento ENUM('dni', 'rtn', 'pasaporte') DEFAULT 'dni',
    
    -- Contacto
    telefono VARCHAR(20) NOT NULL,
    telefono_alternativo VARCHAR(20),
    correo VARCHAR(255),
    
    -- DirecciÃ³n
    direccion VARCHAR(500),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    
    -- Foto
    foto_url VARCHAR(500),
    
    -- Licencia de conducir
    licencia_numero VARCHAR(50),
    licencia_tipo VARCHAR(20),
    licencia_vencimiento DATE,
    
    -- Empresa (si es externo)
    empresa_courier_nombre VARCHAR(200),
    empresa_courier_contacto VARCHAR(200),
    
    -- Capacidad
    capacidad_peso_kg DECIMAL(10,2) DEFAULT 100.00,
    capacidad_volumen_m3 DECIMAL(10,2) DEFAULT 2.00,
    max_paradas_dia INT UNSIGNED DEFAULT 30,
    
    -- CalificaciÃ³n
    calificacion_promedio DECIMAL(3,2) DEFAULT 5.00,
    total_entregas INT UNSIGNED DEFAULT 0,
    entregas_exitosas INT UNSIGNED DEFAULT 0,
    entregas_fallidas INT UNSIGNED DEFAULT 0,
    
    -- Estado
    estado ENUM('activo', 'inactivo', 'vacaciones', 'suspendido', 'baja') NOT NULL DEFAULT 'activo',
    disponible_ahora BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- GPS tracking
    ultima_latitud DECIMAL(10, 8),
    ultima_longitud DECIMAL(11, 8),
    ultima_ubicacion_fecha DATETIME,
    
    -- Empresa asignada (multi-tenant)
    empresa_id INT UNSIGNED,
    almacen_base_id INT UNSIGNED,
    
    fecha_ingreso DATE,
    fecha_baja DATE,
    motivo_baja VARCHAR(255),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_transp_codigo (codigo),
    INDEX idx_transp_tipo (tipo),
    INDEX idx_transp_estado (estado),
    INDEX idx_transp_empresa (empresa_id),
    INDEX idx_transp_almacen (almacen_base_id),
    INDEX idx_transp_disponible (disponible_ahora),
    
    CONSTRAINT fk_log_transp_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_transp_almacen 
        FOREIGN KEY (almacen_base_id) REFERENCES logistica_almacenes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_transportistas_horarios
-- Horarios de disponibilidad de transportistas
-- ============================================================================

CREATE TABLE logistica_transportistas_horarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transportista_id INT UNSIGNED NOT NULL,
    
    dia_semana TINYINT UNSIGNED NOT NULL, -- 0=Domingo...6=SÃ¡bado
    
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    es_disponible BOOLEAN NOT NULL DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_horario_transp (transportista_id),
    UNIQUE KEY uk_transp_dia (transportista_id, dia_semana),
    
    CONSTRAINT fk_log_horario_transp 
        FOREIGN KEY (transportista_id) REFERENCES logistica_transportistas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_transportistas_documentos
-- Documentos del transportista
-- ============================================================================

CREATE TABLE logistica_transportistas_documentos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transportista_id INT UNSIGNED NOT NULL,
    
    tipo ENUM(
        'identidad',
        'licencia_conducir',
        'antecedentes_penales',
        'contrato',
        'seguro',
        'certificacion',
        'otro'
    ) NOT NULL,
    
    nombre VARCHAR(200) NOT NULL,
    archivo_url VARCHAR(500) NOT NULL,
    
    fecha_emision DATE,
    fecha_vencimiento DATE,
    
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    verificado_por INT UNSIGNED,
    fecha_verificacion DATETIME,
    
    notas TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_doc_transp (transportista_id),
    INDEX idx_doc_tipo (tipo),
    INDEX idx_doc_vencimiento (fecha_vencimiento),
    
    CONSTRAINT fk_log_doc_transp 
        FOREIGN KEY (transportista_id) REFERENCES logistica_transportistas(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_doc_verificador 
        FOREIGN KEY (verificado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_transportistas_zonas
-- Zonas asignadas a transportistas
-- ============================================================================

CREATE TABLE logistica_transportistas_zonas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transportista_id INT UNSIGNED NOT NULL,
    zona_id INT UNSIGNED NOT NULL,
    
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    prioridad INT UNSIGNED DEFAULT 100,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_transp_zona (transportista_id),
    INDEX idx_zona_transp (zona_id),
    UNIQUE KEY uk_transp_zona (transportista_id, zona_id),
    
    CONSTRAINT fk_log_tz_transportista 
        FOREIGN KEY (transportista_id) REFERENCES logistica_transportistas(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_tz_zona 
        FOREIGN KEY (zona_id) REFERENCES logistica_zonas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_vehiculos
-- VehÃ­culos de la flota
-- ============================================================================

CREATE TABLE logistica_vehiculos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- IdentificaciÃ³n
    codigo VARCHAR(20) NOT NULL UNIQUE,
    placa VARCHAR(20) NOT NULL UNIQUE,
    
    -- Tipo
    tipo ENUM(
        'motocicleta',
        'bicicleta',
        'automovil',
        'pickup',
        'panel',
        'camion_pequeno',
        'camion_mediano',
        'camion_grande',
        'trailer'
    ) NOT NULL DEFAULT 'panel',
    
    -- Datos del vehÃ­culo
    marca VARCHAR(50),
    modelo VARCHAR(50),
    anio INT UNSIGNED,
    color VARCHAR(30),
    
    -- Capacidad
    capacidad_peso_kg DECIMAL(10,2) NOT NULL,
    capacidad_volumen_m3 DECIMAL(10,2),
    
    -- Dimensiones de carga (cm)
    largo_carga DECIMAL(10,2),
    ancho_carga DECIMAL(10,2),
    alto_carga DECIMAL(10,2),
    
    -- CaracterÃ­sticas
    tiene_refrigeracion BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_gps BOOLEAN NOT NULL DEFAULT TRUE,
    permite_fragil BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Documentos
    numero_motor VARCHAR(50),
    numero_chasis VARCHAR(50),
    tarjeta_circulacion VARCHAR(50),
    poliza_seguro VARCHAR(50),
    vencimiento_seguro DATE,
    vencimiento_revision DATE,
    
    -- Combustible
    tipo_combustible ENUM('gasolina', 'diesel', 'electrico', 'hibrido', 'gas') DEFAULT 'gasolina',
    rendimiento_km_por_litro DECIMAL(5,2),
    capacidad_tanque DECIMAL(5,2),
    
    -- AsignaciÃ³n
    transportista_asignado_id INT UNSIGNED,
    almacen_base_id INT UNSIGNED,
    empresa_id INT UNSIGNED,
    
    -- Estado
    estado ENUM('disponible', 'en_ruta', 'mantenimiento', 'fuera_servicio', 'baja') NOT NULL DEFAULT 'disponible',
    
    -- GPS actual
    ultima_latitud DECIMAL(10, 8),
    ultima_longitud DECIMAL(11, 8),
    ultima_ubicacion_fecha DATETIME,
    kilometraje_actual INT UNSIGNED DEFAULT 0,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vehiculo_codigo (codigo),
    INDEX idx_vehiculo_placa (placa),
    INDEX idx_vehiculo_tipo (tipo),
    INDEX idx_vehiculo_estado (estado),
    INDEX idx_vehiculo_transp (transportista_asignado_id),
    INDEX idx_vehiculo_almacen (almacen_base_id),
    
    CONSTRAINT fk_log_vehiculo_transp 
        FOREIGN KEY (transportista_asignado_id) REFERENCES logistica_transportistas(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_vehiculo_almacen 
        FOREIGN KEY (almacen_base_id) REFERENCES logistica_almacenes(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_vehiculo_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_vehiculos_mantenimiento
-- Historial de mantenimiento de vehÃ­culos
-- ============================================================================

CREATE TABLE logistica_vehiculos_mantenimiento (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT UNSIGNED NOT NULL,
    
    tipo ENUM(
        'preventivo',
        'correctivo',
        'revision_tecnica',
        'cambio_aceite',
        'cambio_llantas',
        'frenos',
        'suspension',
        'electrico',
        'carroceria',
        'otro'
    ) NOT NULL,
    
    descripcion TEXT NOT NULL,
    
    -- Kilometraje
    kilometraje INT UNSIGNED,
    proximo_mantenimiento_km INT UNSIGNED,
    proximo_mantenimiento_fecha DATE,
    
    -- Costos
    costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    proveedor VARCHAR(200),
    numero_factura VARCHAR(50),
    
    -- Fechas
    fecha_ingreso DATETIME NOT NULL,
    fecha_salida DATETIME,
    
    -- Estado
    estado ENUM('programado', 'en_proceso', 'completado', 'cancelado') NOT NULL DEFAULT 'programado',
    
    notas TEXT,
    
    registrado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mant_vehiculo (vehiculo_id),
    INDEX idx_mant_tipo (tipo),
    INDEX idx_mant_estado (estado),
    INDEX idx_mant_fecha (fecha_ingreso),
    
    CONSTRAINT fk_log_mant_vehiculo 
        FOREIGN KEY (vehiculo_id) REFERENCES logistica_vehiculos(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_mant_registrado 
        FOREIGN KEY (registrado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_envios_paquetes
-- InformaciÃ³n detallada de paquetes
-- ============================================================================

CREATE TABLE logistica_envios_paquetes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id BIGINT UNSIGNED NOT NULL,
    
    -- IdentificaciÃ³n
    numero_paquete VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(100),
    
    -- Dimensiones (cm)
    peso DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    largo DECIMAL(10,2),
    ancho DECIMAL(10,2),
    alto DECIMAL(10,2),
    peso_volumetrico DECIMAL(10,3),
    
    -- Contenido
    descripcion_contenido VARCHAR(500),
    cantidad_items INT UNSIGNED DEFAULT 1,
    valor_declarado DECIMAL(15,2),
    
    -- CaracterÃ­sticas
    es_fragil BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_refrigeracion BOOLEAN NOT NULL DEFAULT FALSE,
    es_peligroso BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_firma BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Estado
    estado ENUM(
        'preparando',
        'empacado',
        'etiquetado',
        'en_almacen',
        'en_transito',
        'en_reparto',
        'entregado',
        'devuelto'
    ) NOT NULL DEFAULT 'preparando',
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_paquete_envio (envio_id),
    INDEX idx_paquete_numero (numero_paquete),
    INDEX idx_paquete_codigo (codigo_barras),
    INDEX idx_paquete_estado (estado),
    
    CONSTRAINT fk_log_paquete_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_envios_etiquetas
-- Etiquetas de envÃ­o generadas
-- ============================================================================

CREATE TABLE logistica_envios_etiquetas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id BIGINT UNSIGNED NOT NULL,
    paquete_id BIGINT UNSIGNED,
    
    -- Etiqueta
    tipo ENUM('envio', 'devolucion', 'fragil', 'peligroso', 'refrigerado') NOT NULL DEFAULT 'envio',
    formato ENUM('pdf', 'png', 'zpl') NOT NULL DEFAULT 'pdf',
    
    -- Archivos
    archivo_url VARCHAR(500) NOT NULL,
    codigo_barras_url VARCHAR(500),
    qr_url VARCHAR(500),
    
    -- Datos de la etiqueta
    contenido_base64 LONGTEXT,
    
    -- ImpresiÃ³n
    impresa BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_impresion DATETIME,
    impresiones INT UNSIGNED DEFAULT 0,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_etiqueta_envio (envio_id),
    INDEX idx_etiqueta_paquete (paquete_id),
    INDEX idx_etiqueta_tipo (tipo),
    
    CONSTRAINT fk_log_etiqueta_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_etiqueta_paquete 
        FOREIGN KEY (paquete_id) REFERENCES logistica_envios_paquetes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_tracking_eventos
-- Eventos de tracking detallados
-- ============================================================================

CREATE TABLE logistica_tracking_eventos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id BIGINT UNSIGNED NOT NULL,
    paquete_id BIGINT UNSIGNED,
    
    -- Evento
    codigo_evento VARCHAR(50) NOT NULL,
    tipo_evento ENUM(
        'creado',
        'recogido',
        'en_almacen',
        'procesando',
        'en_transito',
        'en_centro_distribucion',
        'en_reparto',
        'intento_entrega',
        'entregado',
        'devuelto',
        'perdido',
        'danado',
        'retenido_aduana',
        'cancelado'
    ) NOT NULL,
    
    descripcion VARCHAR(500) NOT NULL,
    descripcion_publica VARCHAR(500), -- Lo que ve el cliente
    
    -- UbicaciÃ³n
    ubicacion VARCHAR(255),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Honduras',
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Operador
    transportista_id INT UNSIGNED,
    operador_nombre VARCHAR(200),
    
    -- NotificaciÃ³n
    notificacion_enviada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_notificacion DATETIME,
    
    fecha_evento DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tracking_envio (envio_id),
    INDEX idx_tracking_paquete (paquete_id),
    INDEX idx_tracking_tipo (tipo_evento),
    INDEX idx_tracking_fecha (fecha_evento),
    INDEX idx_tracking_codigo (codigo_evento),
    
    CONSTRAINT fk_log_tracking_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_tracking_paquete 
        FOREIGN KEY (paquete_id) REFERENCES logistica_envios_paquetes(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_tracking_transportista 
        FOREIGN KEY (transportista_id) REFERENCES logistica_transportistas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_rutas
-- Rutas de entrega
-- ============================================================================

CREATE TABLE logistica_rutas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- IdentificaciÃ³n
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(200),
    
    -- AsignaciÃ³n
    transportista_id INT UNSIGNED NOT NULL,
    vehiculo_id INT UNSIGNED,
    almacen_origen_id INT UNSIGNED NOT NULL,
    
    -- Zona principal
    zona_id INT UNSIGNED,
    
    -- Fecha y horario
    fecha_ruta DATE NOT NULL,
    hora_inicio_planificada TIME,
    hora_fin_planificada TIME,
    hora_inicio_real DATETIME,
    hora_fin_real DATETIME,
    
    -- MÃ©tricas planificadas
    total_paradas INT UNSIGNED NOT NULL DEFAULT 0,
    distancia_total_km DECIMAL(10,2),
    tiempo_estimado_minutos INT UNSIGNED,
    
    -- MÃ©tricas reales
    paradas_completadas INT UNSIGNED DEFAULT 0,
    paradas_fallidas INT UNSIGNED DEFAULT 0,
    distancia_real_km DECIMAL(10,2),
    tiempo_real_minutos INT UNSIGNED,
    
    -- Estado
    estado ENUM(
        'planificada',
        'asignada',
        'en_progreso',
        'pausada',
        'completada',
        'cancelada'
    ) NOT NULL DEFAULT 'planificada',
    
    -- OptimizaciÃ³n
    optimizada BOOLEAN NOT NULL DEFAULT FALSE,
    algoritmo_optimizacion VARCHAR(50),
    fecha_optimizacion DATETIME,
    
    notas TEXT,
    
    creado_por INT UNSIGNED,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ruta_codigo (codigo),
    INDEX idx_ruta_transportista (transportista_id),
    INDEX idx_ruta_vehiculo (vehiculo_id),
    INDEX idx_ruta_fecha (fecha_ruta),
    INDEX idx_ruta_estado (estado),
    INDEX idx_ruta_almacen (almacen_origen_id),
    
    CONSTRAINT fk_log_ruta_transportista 
        FOREIGN KEY (transportista_id) REFERENCES logistica_transportistas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_log_ruta_vehiculo 
        FOREIGN KEY (vehiculo_id) REFERENCES logistica_vehiculos(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_ruta_almacen 
        FOREIGN KEY (almacen_origen_id) REFERENCES logistica_almacenes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_log_ruta_zona 
        FOREIGN KEY (zona_id) REFERENCES logistica_zonas(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_ruta_creador 
        FOREIGN KEY (creado_por) REFERENCES admin_usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_rutas_paradas
-- Paradas de cada ruta
-- ============================================================================

CREATE TABLE logistica_rutas_paradas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ruta_id BIGINT UNSIGNED NOT NULL,
    envio_id BIGINT UNSIGNED NOT NULL,
    
    -- Orden
    orden_secuencia INT UNSIGNED NOT NULL,
    orden_optimizado INT UNSIGNED,
    
    -- DirecciÃ³n de entrega
    direccion VARCHAR(500) NOT NULL,
    direccion_adicional VARCHAR(200),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    codigo_postal VARCHAR(20),
    
    -- Coordenadas
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Contacto
    cliente_nombre VARCHAR(200),
    cliente_telefono VARCHAR(20),
    instrucciones_entrega TEXT,
    
    -- Tiempos
    hora_estimada_llegada TIME,
    hora_llegada_real DATETIME,
    tiempo_estimado_parada INT UNSIGNED DEFAULT 5, -- minutos
    tiempo_real_parada INT UNSIGNED,
    
    -- Ventana de entrega
    ventana_desde TIME,
    ventana_hasta TIME,
    
    -- Distancia desde parada anterior
    distancia_desde_anterior_km DECIMAL(10,2),
    
    -- Estado
    estado ENUM(
        'pendiente',
        'en_camino',
        'llegado',
        'entregado',
        'fallido',
        'reprogramado',
        'cancelado'
    ) NOT NULL DEFAULT 'pendiente',
    
    motivo_fallo VARCHAR(255),
    
    -- Prioridad
    es_prioritario BOOLEAN NOT NULL DEFAULT FALSE,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parada_ruta (ruta_id),
    INDEX idx_parada_envio (envio_id),
    INDEX idx_parada_orden (orden_secuencia),
    INDEX idx_parada_estado (estado),
    INDEX idx_parada_coords (latitud, longitud),
    
    CONSTRAINT fk_log_parada_ruta 
        FOREIGN KEY (ruta_id) REFERENCES logistica_rutas(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_parada_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_entregas_intentos
-- Registro de intentos de entrega
-- ============================================================================

CREATE TABLE logistica_entregas_intentos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id BIGINT UNSIGNED NOT NULL,
    parada_id BIGINT UNSIGNED,
    transportista_id INT UNSIGNED NOT NULL,
    
    numero_intento INT UNSIGNED NOT NULL DEFAULT 1,
    
    -- Resultado
    resultado ENUM(
        'exitoso',
        'ausente',
        'direccion_incorrecta',
        'rechazado',
        'cerrado',
        'no_accesible',
        'paquete_danado',
        'otro'
    ) NOT NULL,
    
    descripcion VARCHAR(500),
    
    -- UbicaciÃ³n del intento
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Tiempos
    fecha_intento DATETIME NOT NULL,
    duracion_minutos INT UNSIGNED,
    
    -- Si fue exitoso
    recibido_por VARCHAR(200),
    documento_receptor VARCHAR(50),
    parentesco VARCHAR(50),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_intento_envio (envio_id),
    INDEX idx_intento_parada (parada_id),
    INDEX idx_intento_transportista (transportista_id),
    INDEX idx_intento_fecha (fecha_intento),
    INDEX idx_intento_resultado (resultado),
    
    CONSTRAINT fk_log_intento_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_intento_parada 
        FOREIGN KEY (parada_id) REFERENCES logistica_rutas_paradas(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_intento_transportista 
        FOREIGN KEY (transportista_id) REFERENCES logistica_transportistas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_entregas_firmas
-- Firmas digitales de recepciÃ³n
-- ============================================================================

CREATE TABLE logistica_entregas_firmas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id BIGINT UNSIGNED NOT NULL,
    intento_id BIGINT UNSIGNED,
    
    -- Firma
    firma_base64 LONGTEXT NOT NULL,
    firma_url VARCHAR(500),
    
    -- Quien firmÃ³
    nombre_firmante VARCHAR(200) NOT NULL,
    documento_firmante VARCHAR(50),
    
    -- Dispositivo
    dispositivo_info VARCHAR(255),
    ip_captura VARCHAR(45),
    
    fecha_firma DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_firma_envio (envio_id),
    INDEX idx_firma_intento (intento_id),
    
    CONSTRAINT fk_log_firma_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_firma_intento 
        FOREIGN KEY (intento_id) REFERENCES logistica_entregas_intentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: logistica_entregas_fotos
-- Fotos de evidencia de entrega
-- ============================================================================

CREATE TABLE logistica_entregas_fotos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id BIGINT UNSIGNED NOT NULL,
    intento_id BIGINT UNSIGNED,
    
    -- Tipo de foto
    tipo ENUM('paquete', 'ubicacion', 'entrega', 'dano', 'otro') NOT NULL DEFAULT 'entrega',
    
    -- Archivo
    foto_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    
    -- Metadata
    descripcion VARCHAR(255),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    fecha_captura DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_foto_envio (envio_id),
    INDEX idx_foto_intento (intento_id),
    INDEX idx_foto_tipo (tipo),
    
    CONSTRAINT fk_log_foto_envio 
        FOREIGN KEY (envio_id) REFERENCES pedidos_envios(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_foto_intento 
        FOREIGN KEY (intento_id) REFERENCES logistica_entregas_intentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista: Stock por almacÃ©n
CREATE VIEW vista_almacenes_stock AS
SELECT 
    a.id AS almacen_id,
    a.codigo AS almacen_codigo,
    a.nombre AS almacen_nombre,
    a.tipo AS almacen_tipo,
    a.ciudad,
    s.producto_id,
    p.nombre AS producto_nombre,
    p.sku,
    SUM(s.cantidad_disponible) AS total_disponible,
    SUM(s.cantidad_reservada) AS total_reservada,
    SUM(s.cantidad_en_transito) AS total_en_transito,
    MIN(s.cantidad_minima) AS cantidad_minima,
    CASE 
        WHEN SUM(s.cantidad_disponible) <= MIN(s.cantidad_minima) THEN 'bajo'
        WHEN SUM(s.cantidad_disponible) <= MIN(s.cantidad_minima) * 2 THEN 'medio'
        ELSE 'normal'
    END AS nivel_stock
FROM logistica_almacenes a
INNER JOIN logistica_almacenes_stock s ON a.id = s.almacen_id
INNER JOIN catalogo_productos p ON s.producto_id = p.id
WHERE a.estado = 'activo'
GROUP BY a.id, a.codigo, a.nombre, a.tipo, a.ciudad, s.producto_id, p.nombre, p.sku;

-- Vista: EnvÃ­os pendientes
CREATE VIEW vista_envios_pendientes AS
SELECT 
    e.id AS envio_id,
    e.numero_guia,
    e.estado,
    e.fecha_envio,
    e.fecha_entrega_estimada,
    p.numero_pedido,
    p.cliente_id,
    c.nombre_completo AS cliente_nombre,
    c.telefono AS cliente_telefono,
    e.transportista AS transportista_nombre,
    DATEDIFF(CURDATE(), e.fecha_envio) AS dias_en_transito,
    CASE 
        WHEN e.fecha_entrega_estimada < CURDATE() THEN 'retrasado'
        WHEN e.fecha_entrega_estimada = CURDATE() THEN 'hoy'
        ELSE 'a_tiempo'
    END AS estado_tiempo
FROM pedidos_envios e
INNER JOIN pedidos p ON e.pedido_id = p.id
INNER JOIN clientes c ON p.cliente_id = c.id
WHERE e.estado NOT IN ('entregado', 'devuelto')
ORDER BY e.fecha_entrega_estimada;

-- Vista: Rutas activas
CREATE VIEW vista_rutas_activas AS
SELECT 
    r.id AS ruta_id,
    r.codigo AS ruta_codigo,
    r.fecha_ruta,
    r.estado,
    t.codigo AS transportista_codigo,
    t.nombre AS transportista_nombre,
    t.telefono AS transportista_telefono,
    v.placa AS vehiculo_placa,
    v.tipo AS vehiculo_tipo,
    a.nombre AS almacen_origen,
    r.total_paradas,
    r.paradas_completadas,
    r.paradas_fallidas,
    r.hora_inicio_real,
    r.distancia_total_km,
    CONCAT(ROUND((r.paradas_completadas / r.total_paradas) * 100, 1), '%') AS progreso
FROM logistica_rutas r
INNER JOIN logistica_transportistas t ON r.transportista_id = t.id
LEFT JOIN logistica_vehiculos v ON r.vehiculo_id = v.id
INNER JOIN logistica_almacenes a ON r.almacen_origen_id = a.id
WHERE r.estado IN ('asignada', 'en_progreso', 'pausada')
ORDER BY r.fecha_ruta, r.hora_inicio_planificada;

-- Vista: Entregas del dÃ­a
CREATE VIEW vista_entregas_hoy AS
SELECT 
    rp.id AS parada_id,
    r.codigo AS ruta_codigo,
    rp.orden_secuencia,
    rp.direccion,
    rp.ciudad,
    rp.cliente_nombre,
    rp.cliente_telefono,
    rp.hora_estimada_llegada,
    rp.ventana_desde,
    rp.ventana_hasta,
    rp.estado,
    e.numero_guia,
    t.nombre AS transportista,
    t.telefono AS transportista_telefono
FROM logistica_rutas_paradas rp
INNER JOIN logistica_rutas r ON rp.ruta_id = r.id
INNER JOIN pedidos_envios e ON rp.envio_id = e.id
INNER JOIN logistica_transportistas t ON r.transportista_id = t.id
WHERE r.fecha_ruta = CURDATE()
AND rp.estado NOT IN ('entregado', 'cancelado')
ORDER BY r.codigo, rp.orden_secuencia;

-- Vista: Rendimiento de transportistas
CREATE VIEW vista_rendimiento_transportistas AS
SELECT 
    t.id AS transportista_id,
    t.codigo,
    t.nombre,
    t.tipo,
    t.calificacion_promedio,
    t.total_entregas,
    t.entregas_exitosas,
    t.entregas_fallidas,
    CASE 
        WHEN t.total_entregas > 0 
        THEN ROUND((t.entregas_exitosas / t.total_entregas) * 100, 2)
        ELSE 0
    END AS tasa_exito,
    COUNT(DISTINCT r.id) AS rutas_este_mes,
    SUM(r.paradas_completadas) AS entregas_este_mes
FROM logistica_transportistas t
LEFT JOIN logistica_rutas r ON t.id = r.transportista_id 
    AND r.fecha_ruta >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
WHERE t.estado = 'activo'
GROUP BY t.id, t.codigo, t.nombre, t.tipo, t.calificacion_promedio, 
         t.total_entregas, t.entregas_exitosas, t.entregas_fallidas;

-- Vista: Cobertura por zona
CREATE VIEW vista_cobertura_zonas AS
SELECT 
    z.id AS zona_id,
    z.codigo AS zona_codigo,
    z.nombre AS zona_nombre,
    z.tipo AS zona_tipo,
    z.tiempo_entrega_min,
    z.tiempo_entrega_max,
    COUNT(DISTINCT zc.id) AS total_areas,
    COUNT(DISTINCT tz.transportista_id) AS total_transportistas,
    a.nombre AS almacen_default,
    tz_tarifa.tarifa_base,
    tz_tarifa.tipo_servicio AS servicio_default
FROM logistica_zonas z
LEFT JOIN logistica_zonas_cobertura zc ON z.id = zc.zona_id
LEFT JOIN logistica_transportistas_zonas tz ON z.id = tz.zona_id
LEFT JOIN logistica_almacenes a ON z.almacen_default_id = a.id
LEFT JOIN logistica_tarifas_zonas tz_tarifa ON z.id = tz_tarifa.zona_id 
    AND tz_tarifa.tipo_servicio = 'standard' AND tz_tarifa.es_activo = TRUE
WHERE z.es_activo = TRUE
GROUP BY z.id, z.codigo, z.nombre, z.tipo, z.tiempo_entrega_min, z.tiempo_entrega_max,
         a.nombre, tz_tarifa.tarifa_base, tz_tarifa.tipo_servicio;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Procedimiento: Asignar almacÃ©n Ã³ptimo para un pedido
CREATE PROCEDURE sp_asignar_almacen_pedido(
    IN p_pedido_id BIGINT UNSIGNED,
    IN p_latitud DECIMAL(10,8),
    IN p_longitud DECIMAL(11,8),
    OUT p_almacen_id INT UNSIGNED,
    OUT p_distancia_km DECIMAL(10,2)
)
BEGIN
    DECLARE v_producto_id BIGINT UNSIGNED;
    DECLARE v_cantidad INT;
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE cur_items CURSOR FOR
        SELECT pi.producto_id, pi.cantidad
        FROM pedidos_items pi
        WHERE pi.pedido_id = p_pedido_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Buscar almacÃ©n mÃ¡s cercano con stock disponible para todos los productos
    SELECT 
        a.id,
        (6371 * ACOS(
            COS(RADIANS(p_latitud)) * COS(RADIANS(a.latitud)) * 
            COS(RADIANS(a.longitud) - RADIANS(p_longitud)) + 
            SIN(RADIANS(p_latitud)) * SIN(RADIANS(a.latitud))
        )) AS distancia
    INTO p_almacen_id, p_distancia_km
    FROM logistica_almacenes a
    WHERE a.estado = 'activo'
    AND a.permite_picking = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM pedidos_items pi
        WHERE pi.pedido_id = p_pedido_id
        AND NOT EXISTS (
            SELECT 1 FROM logistica_almacenes_stock s
            WHERE s.almacen_id = a.id
            AND s.producto_id = pi.producto_id
            AND s.cantidad_disponible >= pi.cantidad
        )
    )
    ORDER BY distancia ASC
    LIMIT 1;
    
    -- Si no se encontrÃ³ almacÃ©n con todo el stock, buscar el mÃ¡s cercano
    IF p_almacen_id IS NULL THEN
        SELECT 
            a.id,
            (6371 * ACOS(
                COS(RADIANS(p_latitud)) * COS(RADIANS(a.latitud)) * 
                COS(RADIANS(a.longitud) - RADIANS(p_longitud)) + 
                SIN(RADIANS(p_latitud)) * SIN(RADIANS(a.latitud))
            )) AS distancia
        INTO p_almacen_id, p_distancia_km
        FROM logistica_almacenes a
        WHERE a.estado = 'activo'
        AND a.permite_picking = TRUE
        ORDER BY a.prioridad ASC, distancia ASC
        LIMIT 1;
    END IF;
END //

-- Procedimiento: Calcular costo de envÃ­o
CREATE PROCEDURE sp_calcular_costo_envio(
    IN p_zona_id INT UNSIGNED,
    IN p_tipo_servicio VARCHAR(20),
    IN p_peso_kg DECIMAL(10,2),
    IN p_largo_cm DECIMAL(10,2),
    IN p_ancho_cm DECIMAL(10,2),
    IN p_alto_cm DECIMAL(10,2),
    IN p_cliente_id BIGINT UNSIGNED,
    OUT p_costo DECIMAL(10,2),
    OUT p_dias_entrega_min INT,
    OUT p_dias_entrega_max INT
)
BEGIN
    DECLARE v_tarifa_base DECIMAL(10,2);
    DECLARE v_tarifa_por_kg DECIMAL(10,2);
    DECLARE v_peso_base DECIMAL(10,2);
    DECLARE v_factor_dimensional DECIMAL(7,2);
    DECLARE v_peso_volumetrico DECIMAL(10,2);
    DECLARE v_peso_facturable DECIMAL(10,2);
    DECLARE v_descuento DECIMAL(10,2) DEFAULT 0;
    
    -- Obtener tarifa base de la zona
    SELECT 
        tarifa_base, tarifa_por_kg, peso_base_incluido, factor_dimensional,
        dias_entrega_min, dias_entrega_max
    INTO 
        v_tarifa_base, v_tarifa_por_kg, v_peso_base, v_factor_dimensional,
        p_dias_entrega_min, p_dias_entrega_max
    FROM logistica_tarifas_zonas
    WHERE zona_id = p_zona_id
    AND tipo_servicio = p_tipo_servicio
    AND es_activo = TRUE
    AND vigente_desde <= CURDATE()
    AND (vigente_hasta IS NULL OR vigente_hasta >= CURDATE())
    LIMIT 1;
    
    -- Calcular peso volumÃ©trico
    SET v_peso_volumetrico = (p_largo_cm * p_ancho_cm * p_alto_cm) / COALESCE(v_factor_dimensional, 5000);
    
    -- Usar el mayor entre peso real y volumÃ©trico
    SET v_peso_facturable = GREATEST(p_peso_kg, v_peso_volumetrico);
    
    -- Calcular costo base
    SET p_costo = COALESCE(v_tarifa_base, 0);
    
    -- Agregar costo por peso extra
    IF v_peso_facturable > COALESCE(v_peso_base, 1) THEN
        SET p_costo = p_costo + ((v_peso_facturable - v_peso_base) * COALESCE(v_tarifa_por_kg, 0));
    END IF;
    
    -- Buscar descuento especial para el cliente
    SELECT valor_descuento INTO v_descuento
    FROM logistica_tarifas_especiales
    WHERE cliente_id = p_cliente_id
    AND (zona_id = p_zona_id OR zona_id IS NULL)
    AND (tipo_servicio = p_tipo_servicio OR tipo_servicio IS NULL)
    AND es_activo = TRUE
    AND vigente_desde <= CURDATE()
    AND (vigente_hasta IS NULL OR vigente_hasta >= CURDATE())
    ORDER BY zona_id DESC, tipo_servicio DESC
    LIMIT 1;
    
    -- Aplicar descuento
    IF v_descuento > 0 THEN
        SET p_costo = p_costo - v_descuento;
    END IF;
    
    -- Asegurar costo mÃ­nimo
    IF p_costo < 0 THEN
        SET p_costo = 0;
    END IF;
END //

-- Procedimiento: Crear ruta de entrega
CREATE PROCEDURE sp_crear_ruta_entrega(
    IN p_transportista_id INT UNSIGNED,
    IN p_vehiculo_id INT UNSIGNED,
    IN p_almacen_id INT UNSIGNED,
    IN p_fecha DATE,
    IN p_creado_por INT UNSIGNED,
    OUT p_ruta_id BIGINT UNSIGNED,
    OUT p_codigo_ruta VARCHAR(30)
)
BEGIN
    -- Generar cÃ³digo de ruta
    SET p_codigo_ruta = CONCAT(
        'RUT-',
        DATE_FORMAT(p_fecha, '%Y%m%d'),
        '-',
        LPAD(FLOOR(RAND() * 9999), 4, '0')
    );
    
    -- Crear la ruta
    INSERT INTO logistica_rutas (
        codigo, transportista_id, vehiculo_id, almacen_origen_id,
        fecha_ruta, estado, creado_por
    ) VALUES (
        p_codigo_ruta, p_transportista_id, p_vehiculo_id, p_almacen_id,
        p_fecha, 'planificada', p_creado_por
    );
    
    SET p_ruta_id = LAST_INSERT_ID();
    
    -- Marcar vehÃ­culo como asignado
    IF p_vehiculo_id IS NOT NULL THEN
        UPDATE logistica_vehiculos
        SET estado = 'en_ruta',
            transportista_asignado_id = p_transportista_id
        WHERE id = p_vehiculo_id;
    END IF;
END //

-- Procedimiento: Actualizar tracking
CREATE PROCEDURE sp_actualizar_tracking(
    IN p_envio_id BIGINT UNSIGNED,
    IN p_tipo_evento VARCHAR(50),
    IN p_descripcion VARCHAR(500),
    IN p_ubicacion VARCHAR(255),
    IN p_latitud DECIMAL(10,8),
    IN p_longitud DECIMAL(11,8),
    IN p_transportista_id INT UNSIGNED
)
BEGIN
    DECLARE v_codigo_evento VARCHAR(50);
    DECLARE v_estado_envio VARCHAR(50);
    
    -- Generar cÃ³digo de evento
    SET v_codigo_evento = CONCAT('EVT-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', FLOOR(RAND() * 1000));
    
    -- Determinar nuevo estado del envÃ­o
    SET v_estado_envio = CASE p_tipo_evento
        WHEN 'recogido' THEN 'recogido'
        WHEN 'en_transito' THEN 'en_transito'
        WHEN 'en_centro_distribucion' THEN 'en_centro_distribucion'
        WHEN 'en_reparto' THEN 'en_reparto'
        WHEN 'entregado' THEN 'entregado'
        WHEN 'devuelto' THEN 'devuelto'
        ELSE NULL
    END;
    
    -- Insertar evento de tracking
    INSERT INTO logistica_tracking_eventos (
        envio_id, codigo_evento, tipo_evento, descripcion,
        descripcion_publica, ubicacion, latitud, longitud,
        transportista_id, fecha_evento
    ) VALUES (
        p_envio_id, v_codigo_evento, p_tipo_evento, p_descripcion,
        p_descripcion, p_ubicacion, p_latitud, p_longitud,
        p_transportista_id, NOW()
    );
    
    -- Actualizar estado del envÃ­o
    IF v_estado_envio IS NOT NULL THEN
        UPDATE pedidos_envios
        SET estado = v_estado_envio,
            fecha_entrega_real = CASE WHEN p_tipo_evento = 'entregado' THEN NOW() ELSE fecha_entrega_real END
        WHERE id = p_envio_id;
    END IF;
    
    -- Actualizar ubicaciÃ³n del transportista
    IF p_transportista_id IS NOT NULL AND p_latitud IS NOT NULL THEN
        UPDATE logistica_transportistas
        SET ultima_latitud = p_latitud,
            ultima_longitud = p_longitud,
            ultima_ubicacion_fecha = NOW()
        WHERE id = p_transportista_id;
    END IF;
END //

-- Procedimiento: Transferir inventario entre almacenes
CREATE PROCEDURE sp_transferir_inventario(
    IN p_producto_id BIGINT UNSIGNED,
    IN p_almacen_origen_id INT UNSIGNED,
    IN p_almacen_destino_id INT UNSIGNED,
    IN p_cantidad INT,
    IN p_usuario_id INT UNSIGNED,
    IN p_motivo VARCHAR(500),
    OUT p_resultado VARCHAR(50),
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_stock_disponible INT;
    DECLARE v_numero_documento VARCHAR(50);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 'error';
        SET p_mensaje = 'Error al procesar la transferencia';
    END;
    
    START TRANSACTION;
    
    -- Verificar stock disponible en origen
    SELECT cantidad_disponible INTO v_stock_disponible
    FROM logistica_almacenes_stock
    WHERE almacen_id = p_almacen_origen_id
    AND producto_id = p_producto_id
    FOR UPDATE;
    
    IF v_stock_disponible IS NULL OR v_stock_disponible < p_cantidad THEN
        SET p_resultado = 'sin_stock';
        SET p_mensaje = CONCAT('Stock insuficiente. Disponible: ', COALESCE(v_stock_disponible, 0));
        ROLLBACK;
    ELSE
        -- Generar nÃºmero de documento
        SET v_numero_documento = CONCAT('TRF-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
        
        -- Reducir stock en origen
        UPDATE logistica_almacenes_stock
        SET cantidad_disponible = cantidad_disponible - p_cantidad,
            ultima_salida = NOW()
        WHERE almacen_id = p_almacen_origen_id
        AND producto_id = p_producto_id;
        
        -- Registrar movimiento de salida
        INSERT INTO logistica_almacenes_movimientos (
            almacen_origen_id, almacen_destino_id, producto_id,
            tipo, cantidad, cantidad_anterior, cantidad_posterior,
            referencia_tipo, numero_documento, motivo, realizado_por
        ) VALUES (
            p_almacen_origen_id, p_almacen_destino_id, p_producto_id,
            'salida_transferencia', p_cantidad, v_stock_disponible, v_stock_disponible - p_cantidad,
            'transferencia', v_numero_documento, p_motivo, p_usuario_id
        );
        
        -- Incrementar stock en destino (crear registro si no existe)
        INSERT INTO logistica_almacenes_stock (almacen_id, producto_id, cantidad_disponible, cantidad_en_transito, ultima_entrada)
        VALUES (p_almacen_destino_id, p_producto_id, p_cantidad, 0, NOW())
        ON DUPLICATE KEY UPDATE 
            cantidad_disponible = cantidad_disponible + p_cantidad,
            ultima_entrada = NOW();
        
        -- Registrar movimiento de entrada
        INSERT INTO logistica_almacenes_movimientos (
            almacen_origen_id, almacen_destino_id, producto_id,
            tipo, cantidad, referencia_tipo, numero_documento, motivo, realizado_por
        ) VALUES (
            p_almacen_origen_id, p_almacen_destino_id, p_producto_id,
            'entrada_transferencia', p_cantidad, 'transferencia', v_numero_documento, p_motivo, p_usuario_id
        );
        
        COMMIT;
        SET p_resultado = 'exitosa';
        SET p_mensaje = CONCAT('Transferencia exitosa. Documento: ', v_numero_documento);
    END IF;
END //

-- Procedimiento: Asignar transportista a envÃ­o
CREATE PROCEDURE sp_asignar_transportista(
    IN p_envio_id BIGINT UNSIGNED,
    IN p_zona_id INT UNSIGNED,
    OUT p_transportista_id INT UNSIGNED,
    OUT p_vehiculo_id INT UNSIGNED
)
BEGIN
    -- Buscar transportista disponible en la zona con menor carga
    SELECT 
        t.id,
        v.id
    INTO p_transportista_id, p_vehiculo_id
    FROM logistica_transportistas t
    INNER JOIN logistica_transportistas_zonas tz ON t.id = tz.transportista_id
    LEFT JOIN logistica_vehiculos v ON t.id = v.transportista_asignado_id AND v.estado = 'disponible'
    LEFT JOIN (
        SELECT transportista_id, COUNT(*) AS entregas_pendientes
        FROM logistica_rutas r
        INNER JOIN logistica_rutas_paradas rp ON r.id = rp.ruta_id
        WHERE r.fecha_ruta = CURDATE()
        AND rp.estado = 'pendiente'
        GROUP BY transportista_id
    ) carga ON t.id = carga.transportista_id
    WHERE t.estado = 'activo'
    AND t.disponible_ahora = TRUE
    AND tz.zona_id = p_zona_id
    ORDER BY COALESCE(carga.entregas_pendientes, 0) ASC, t.calificacion_promedio DESC
    LIMIT 1;
END //

-- Procedimiento: Completar entrega
CREATE PROCEDURE sp_completar_entrega(
    IN p_envio_id BIGINT UNSIGNED,
    IN p_parada_id BIGINT UNSIGNED,
    IN p_transportista_id INT UNSIGNED,
    IN p_recibido_por VARCHAR(200),
    IN p_documento_receptor VARCHAR(50),
    IN p_latitud DECIMAL(10,8),
    IN p_longitud DECIMAL(11,8),
    OUT p_resultado VARCHAR(50)
)
BEGIN
    DECLARE v_ruta_id BIGINT UNSIGNED;
    
    -- Registrar intento exitoso
    INSERT INTO logistica_entregas_intentos (
        envio_id, parada_id, transportista_id, numero_intento,
        resultado, fecha_intento, recibido_por, documento_receptor,
        latitud, longitud
    ) VALUES (
        p_envio_id, p_parada_id, p_transportista_id, 
        (SELECT COALESCE(MAX(numero_intento), 0) + 1 FROM logistica_entregas_intentos WHERE envio_id = p_envio_id),
        'exitoso', NOW(), p_recibido_por, p_documento_receptor,
        p_latitud, p_longitud
    );
    
    -- Actualizar parada
    UPDATE logistica_rutas_paradas
    SET estado = 'entregado',
        hora_llegada_real = NOW()
    WHERE id = p_parada_id;
    
    -- Obtener ruta
    SELECT ruta_id INTO v_ruta_id FROM logistica_rutas_paradas WHERE id = p_parada_id;
    
    -- Actualizar contadores de ruta
    UPDATE logistica_rutas
    SET paradas_completadas = paradas_completadas + 1
    WHERE id = v_ruta_id;
    
    -- Actualizar envÃ­o
    UPDATE pedidos_envios
    SET estado = 'entregado',
        fecha_entrega_real = NOW(),
        recibido_por = p_recibido_por
    WHERE id = p_envio_id;
    
    -- Actualizar estadÃ­sticas del transportista
    UPDATE logistica_transportistas
    SET total_entregas = total_entregas + 1,
        entregas_exitosas = entregas_exitosas + 1
    WHERE id = p_transportista_id;
    
    -- Registrar tracking
    CALL sp_actualizar_tracking(
        p_envio_id, 'entregado', 
        CONCAT('Entregado a: ', p_recibido_por),
        NULL, p_latitud, p_longitud, p_transportista_id
    );
    
    SET p_resultado = 'exitoso';
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger: Log automÃ¡tico de movimientos de inventario
CREATE TRIGGER trg_log_movimiento_inventario
AFTER UPDATE ON logistica_almacenes_stock
FOR EACH ROW
BEGIN
    IF NEW.cantidad_disponible != OLD.cantidad_disponible THEN
        INSERT INTO logistica_almacenes_movimientos (
            almacen_origen_id, producto_id, tipo,
            cantidad, cantidad_anterior, cantidad_posterior,
            referencia_tipo, motivo
        ) VALUES (
            NEW.almacen_id, NEW.producto_id,
            CASE 
                WHEN NEW.cantidad_disponible > OLD.cantidad_disponible THEN 'entrada_ajuste'
                ELSE 'salida_ajuste'
            END,
            ABS(NEW.cantidad_disponible - OLD.cantidad_disponible),
            OLD.cantidad_disponible, NEW.cantidad_disponible,
            'ajuste_automatico', 'Cambio detectado por trigger'
        );
    END IF;
END //

-- Trigger: Actualizar stock del almacÃ©n
CREATE TRIGGER trg_actualizar_stock_almacen
AFTER INSERT ON logistica_almacenes_movimientos
FOR EACH ROW
BEGIN
    -- Este trigger complementa los procedimientos de movimiento
    -- Actualiza la fecha de Ãºltima actividad
    IF NEW.almacen_origen_id IS NOT NULL THEN
        UPDATE logistica_almacenes
        SET actualizado_en = NOW()
        WHERE id = NEW.almacen_origen_id;
    END IF;
    
    IF NEW.almacen_destino_id IS NOT NULL THEN
        UPDATE logistica_almacenes
        SET actualizado_en = NOW()
        WHERE id = NEW.almacen_destino_id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Habilitar el programador de eventos
SET GLOBAL event_scheduler = ON;

-- Eliminar eventos existentes
DROP EVENT IF EXISTS evento_optimizar_rutas_diarias;
DROP EVENT IF EXISTS evento_notificar_entregas_retrasadas;
DROP EVENT IF EXISTS evento_limpiar_tracking_antiguo;

DELIMITER //

-- Evento: Notificar entregas retrasadas
CREATE EVENT evento_notificar_entregas_retrasadas
ON SCHEDULE EVERY 1 HOUR
STARTS TIMESTAMP(CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Detecta y marca envÃ­os retrasados cada hora'
DO
BEGIN
    -- Marcar envÃ­os retrasados
    UPDATE pedidos_envios
    SET notas = CONCAT(COALESCE(notas, ''), ' [RETRASADO: ', NOW(), ']')
    WHERE estado NOT IN ('entregado', 'devuelto', 'cancelado')
    AND fecha_entrega_estimada < CURDATE()
    AND notas NOT LIKE '%RETRASADO%';
END //

-- Evento: Limpiar tracking antiguo (más de 1 año)
CREATE EVENT evento_limpiar_tracking_antiguo
ON SCHEDULE EVERY 1 MONTH
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 MONTH, '03:00:00')
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Archiva eventos de tracking con más de 1 año'
DO
BEGIN
    -- Eliminar eventos de tracking muy antiguos de envíos completados
    -- Nota: Se usa subconsulta porque LIMIT no es válido en DELETE con JOIN
    DELETE FROM logistica_tracking_eventos
    WHERE id IN (
        SELECT id FROM (
            SELECT te.id
            FROM logistica_tracking_eventos te
            INNER JOIN pedidos_envios e ON te.envio_id = e.id
            WHERE te.fecha_evento < DATE_SUB(NOW(), INTERVAL 12 MONTH)
            AND e.estado IN ('entregado', 'devuelto')
            LIMIT 10000
        ) AS ids_a_eliminar
    );
END //

DELIMITER ;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- ConfiguraciÃ³n del sistema de logÃ­stica
INSERT IGNORE INTO logistica_configuracion (clave, valor, tipo_dato, descripcion, categoria) VALUES
('distancia_maxima_entrega_km', '100', 'numero', 'Distancia mÃ¡xima de entrega en kilÃ³metros', 'envios'),
('intentos_maximos_entrega', '3', 'numero', 'NÃºmero mÃ¡ximo de intentos de entrega', 'envios'),
('peso_maximo_paquete_kg', '50', 'numero', 'Peso mÃ¡ximo por paquete en kg', 'paquetes'),
('dias_almacenaje_gratuito', '5', 'numero', 'DÃ­as de almacenaje gratuito antes de cobro', 'almacenes'),
('costo_almacenaje_diario', '10.00', 'numero', 'Costo diario de almacenaje despuÃ©s del perÃ­odo gratuito', 'almacenes'),
('factor_peso_volumetrico', '5000', 'numero', 'Factor para cÃ¡lculo de peso volumÃ©trico', 'tarifas'),
('horario_corte_mismo_dia', '14:00', 'texto', 'Hora lÃ­mite para envÃ­os del mismo dÃ­a', 'envios'),
('radio_cobertura_default_km', '50', 'numero', 'Radio de cobertura por defecto para almacenes', 'almacenes'),
('notificar_cliente_tracking', 'true', 'booleano', 'Enviar notificaciones de tracking al cliente', 'notificaciones'),
('notificar_stock_bajo', 'true', 'booleano', 'Notificar cuando el stock estÃ© bajo', 'notificaciones'),
('umbral_stock_bajo_porcentaje', '20', 'numero', 'Porcentaje para considerar stock bajo', 'inventario'),
('habilitar_optimizacion_rutas', 'true', 'booleano', 'Habilitar optimizaciÃ³n automÃ¡tica de rutas', 'rutas');

-- Zonas de cobertura para Honduras
INSERT IGNORE INTO logistica_zonas (codigo, nombre, tipo, pais, tiempo_entrega_min, tiempo_entrega_max, color_hex) VALUES
('ZONA-TGU', 'Tegucigalpa y alrededores', 'metropolitana', 'Honduras', 1, 2, '#27ae60'),
('ZONA-SPS', 'San Pedro Sula y alrededores', 'metropolitana', 'Honduras', 1, 2, '#2980b9'),
('ZONA-CENTRO', 'Zona Central', 'regional', 'Honduras', 2, 4, '#f39c12'),
('ZONA-NORTE', 'Zona Norte', 'regional', 'Honduras', 2, 4, '#9b59b6'),
('ZONA-SUR', 'Zona Sur', 'regional', 'Honduras', 3, 5, '#e74c3c'),
('ZONA-ORIENTE', 'Zona Oriental', 'regional', 'Honduras', 3, 5, '#1abc9c'),
('ZONA-OCCIDENTE', 'Zona Occidental', 'regional', 'Honduras', 3, 5, '#34495e'),
('ZONA-NACIONAL', 'Cobertura Nacional', 'nacional', 'Honduras', 3, 7, '#95a5a6');

-- Cobertura por departamento
INSERT IGNORE INTO logistica_zonas_cobertura (zona_id, departamento, municipio, cobertura_completa) VALUES
(1, 'Francisco MorazÃ¡n', 'Distrito Central', TRUE),
(1, 'Francisco MorazÃ¡n', 'Valle de Ãngeles', TRUE),
(1, 'Francisco MorazÃ¡n', 'Santa LucÃ­a', TRUE),
(2, 'CortÃ©s', 'San Pedro Sula', TRUE),
(2, 'CortÃ©s', 'Choloma', TRUE),
(2, 'CortÃ©s', 'La Lima', TRUE),
(2, 'CortÃ©s', 'Villanueva', TRUE),
(3, 'Comayagua', NULL, TRUE),
(3, 'La Paz', NULL, TRUE),
(4, 'AtlÃ¡ntida', NULL, TRUE),
(4, 'ColÃ³n', NULL, TRUE),
(4, 'Yoro', NULL, TRUE),
(5, 'Choluteca', NULL, TRUE),
(5, 'Valle', NULL, TRUE),
(6, 'Olancho', NULL, TRUE),
(6, 'El ParaÃ­so', NULL, TRUE),
(7, 'CopÃ¡n', NULL, TRUE),
(7, 'Santa BÃ¡rbara', NULL, TRUE),
(7, 'Lempira', NULL, TRUE),
(7, 'Ocotepeque', NULL, TRUE);

-- Tarifas base por zona
INSERT IGNORE INTO logistica_tarifas_zonas (zona_id, tipo_servicio, tarifa_base, tarifa_minima, tarifa_por_kg, peso_base_incluido, dias_entrega_min, dias_entrega_max, vigente_desde) VALUES
(1, 'standard', 50.00, 50.00, 5.00, 2.00, 1, 2, CURDATE()),
(1, 'express', 100.00, 100.00, 10.00, 2.00, 0, 1, CURDATE()),
(1, 'same_day', 200.00, 200.00, 15.00, 2.00, 0, 0, CURDATE()),
(2, 'standard', 50.00, 50.00, 5.00, 2.00, 1, 2, CURDATE()),
(2, 'express', 100.00, 100.00, 10.00, 2.00, 0, 1, CURDATE()),
(2, 'same_day', 200.00, 200.00, 15.00, 2.00, 0, 0, CURDATE()),
(3, 'standard', 80.00, 80.00, 8.00, 2.00, 2, 4, CURDATE()),
(3, 'express', 150.00, 150.00, 15.00, 2.00, 1, 2, CURDATE()),
(4, 'standard', 100.00, 100.00, 10.00, 2.00, 2, 4, CURDATE()),
(4, 'express', 180.00, 180.00, 18.00, 2.00, 1, 2, CURDATE()),
(5, 'standard', 120.00, 120.00, 12.00, 2.00, 3, 5, CURDATE()),
(6, 'standard', 120.00, 120.00, 12.00, 2.00, 3, 5, CURDATE()),
(7, 'standard', 120.00, 120.00, 12.00, 2.00, 3, 5, CURDATE()),
(8, 'standard', 150.00, 150.00, 15.00, 2.00, 3, 7, CURDATE()),
(8, 'economico', 80.00, 80.00, 8.00, 2.00, 5, 10, CURDATE());

-- ============================================================================
-- REGISTRAR MÃ“DULOS Y PERMISOS
-- ============================================================================

-- MÃ³dulo de LogÃ­stica
INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo)
VALUES ('logistica', 'LogÃ­stica', 'GestiÃ³n de almacenes, envÃ­os y rutas', 'bi-truck', 130, TRUE);

-- SubmÃ³dulos
INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'logistica_almacenes', 'Almacenes', 'GestiÃ³n de almacenes e inventario', 'bi-building', 131, TRUE, id
FROM admin_modulos WHERE codigo = 'logistica';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'logistica_zonas', 'Zonas y Tarifas', 'ConfiguraciÃ³n de zonas y tarifas', 'bi-geo-alt', 132, TRUE, id
FROM admin_modulos WHERE codigo = 'logistica';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'logistica_transportistas', 'Transportistas', 'GestiÃ³n de transportistas', 'bi-person-badge', 133, TRUE, id
FROM admin_modulos WHERE codigo = 'logistica';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'logistica_vehiculos', 'VehÃ­culos', 'GestiÃ³n de flota vehicular', 'bi-car-front', 134, TRUE, id
FROM admin_modulos WHERE codigo = 'logistica';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'logistica_rutas', 'Rutas', 'PlanificaciÃ³n de rutas de entrega', 'bi-signpost-split', 135, TRUE, id
FROM admin_modulos WHERE codigo = 'logistica';

INSERT IGNORE INTO admin_modulos (codigo, nombre, descripcion, icono, orden, es_activo, modulo_padre_id)
SELECT 'logistica_tracking', 'Tracking', 'Seguimiento de envÃ­os', 'bi-geo', 136, TRUE, id
FROM admin_modulos WHERE codigo = 'logistica';

-- Permisos principales
INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.ver', 'Ver logÃ­stica', 'Ver dashboard de logÃ­stica'
FROM admin_modulos WHERE codigo = 'logistica';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.almacenes.ver', 'Ver almacenes', 'Ver listado de almacenes'
FROM admin_modulos WHERE codigo = 'logistica_almacenes';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.almacenes.crear', 'Crear almacenes', 'Crear nuevos almacenes'
FROM admin_modulos WHERE codigo = 'logistica_almacenes';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.almacenes.editar', 'Editar almacenes', 'Modificar almacenes existentes'
FROM admin_modulos WHERE codigo = 'logistica_almacenes';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.almacenes.eliminar', 'Eliminar almacenes', 'Eliminar almacenes'
FROM admin_modulos WHERE codigo = 'logistica_almacenes';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.inventario.ver', 'Ver inventario', 'Ver stock por almacÃ©n'
FROM admin_modulos WHERE codigo = 'logistica_almacenes';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.inventario.transferir', 'Transferir inventario', 'Transferir productos entre almacenes'
FROM admin_modulos WHERE codigo = 'logistica_almacenes';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.transportistas.ver', 'Ver transportistas', 'Ver listado de transportistas'
FROM admin_modulos WHERE codigo = 'logistica_transportistas';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.transportistas.gestionar', 'Gestionar transportistas', 'Crear y editar transportistas'
FROM admin_modulos WHERE codigo = 'logistica_transportistas';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.rutas.ver', 'Ver rutas', 'Ver planificaciÃ³n de rutas'
FROM admin_modulos WHERE codigo = 'logistica_rutas';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.rutas.crear', 'Crear rutas', 'Crear nuevas rutas de entrega'
FROM admin_modulos WHERE codigo = 'logistica_rutas';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.rutas.optimizar', 'Optimizar rutas', 'Ejecutar optimizaciÃ³n de rutas'
FROM admin_modulos WHERE codigo = 'logistica_rutas';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.tracking.ver', 'Ver tracking', 'Ver seguimiento de envÃ­os'
FROM admin_modulos WHERE codigo = 'logistica_tracking';

INSERT IGNORE INTO admin_permisos (modulo_id, codigo, nombre, descripcion)
SELECT id, 'logistica.tracking.actualizar', 'Actualizar tracking', 'Registrar eventos de tracking'
FROM admin_modulos WHERE codigo = 'logistica_tracking';

-- ============================================================================
-- VERIFICACIÃ“N FINAL
-- ============================================================================

SELECT '=================================================' AS '';
SELECT 'FASE 12: LOGÃSTICA AVANZADA - INSTALACIÃ“N COMPLETADA' AS 'ESTADO';
SELECT '=================================================' AS '';

SELECT 'Tablas creadas:' AS 'VerificaciÃ³n',
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name LIKE 'logistica_%') AS cantidad;

SELECT 'Procedimientos:' AS 'VerificaciÃ³n',
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'tienda_virtual' 
     AND routine_type = 'PROCEDURE'
     AND (routine_name LIKE 'sp_%almacen%' OR routine_name LIKE 'sp_%ruta%' 
     OR routine_name LIKE 'sp_%tracking%' OR routine_name LIKE 'sp_%envio%'
     OR routine_name LIKE 'sp_%transportista%' OR routine_name LIKE 'sp_%entrega%'
     OR routine_name LIKE 'sp_%inventario%')) AS cantidad;

SELECT 'Vistas:' AS 'VerificaciÃ³n',
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'tienda_virtual' 
     AND (table_name LIKE 'vista_almacenes%' OR table_name LIKE 'vista_envios%' 
     OR table_name LIKE 'vista_rutas%' OR table_name LIKE 'vista_entregas%'
     OR table_name LIKE 'vista_rendimiento%' OR table_name LIKE 'vista_cobertura%')) AS cantidad;

SELECT 'Zonas configuradas:' AS 'VerificaciÃ³n',
    (SELECT COUNT(*) FROM logistica_zonas WHERE es_activo = TRUE) AS cantidad;

SELECT 'Tarifas configuradas:' AS 'VerificaciÃ³n',
    (SELECT COUNT(*) FROM logistica_tarifas_zonas WHERE es_activo = TRUE) AS cantidad;

-- ============================================================================
-- FIN FASE 12
-- ============================================================================
