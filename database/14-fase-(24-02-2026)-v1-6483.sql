-- ============================================================================
-- TIENDA VIRTUAL - FASE 14: COLABORADORES - SEGURIDAD AVANZADA Y GESTIÓN RRHH
-- ============================================================================
-- Versión: 1.0
-- Fecha: 24/02/2026
-- Descripción: Capa complementaria de seguridad empresarial y gestión de
--              recursos humanos para el módulo de colaboradores. Incluye
--              control de acceso avanzado, auditoría de intentos de login,
--              bloqueos automáticos, gestión documental, capacitaciones,
--              evaluaciones de desempeño, equipos de trabajo e incidencias.
-- Dependencias: Fases 1-13 instaladas
-- ============================================================================
-- PRINCIPIO DE DISEÑO: Complemento de seguridad + RRHH
-- - Intentos de login y bloqueos aislados del módulo admin
-- - IPs confiables y horarios de acceso por colaborador
-- - Gestión documental de contratos y documentos de identidad
-- - Sistema de capacitaciones y evaluaciones de desempeño
-- - Equipos de trabajo con líderes y miembros
-- - Incidencias operativas con trazabilidad completa
-- - Alertas de seguridad automatizadas
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
DROP VIEW IF EXISTS vista_colab_intentos_login_recientes;
DROP VIEW IF EXISTS vista_colab_bloqueos_activos;
DROP VIEW IF EXISTS vista_colab_documentos_vencidos;
DROP VIEW IF EXISTS vista_colab_capacitaciones_pendientes;
DROP VIEW IF EXISTS vista_colab_evaluaciones_resumen;
DROP VIEW IF EXISTS vista_colab_equipos_completa;
DROP VIEW IF EXISTS vista_colab_incidencias_abiertas;
DROP VIEW IF EXISTS vista_colab_alertas_no_leidas;
DROP VIEW IF EXISTS vista_colab_seguridad_resumen;

-- Procedimientos
DROP PROCEDURE IF EXISTS sp_colab_registrar_intento_login;
DROP PROCEDURE IF EXISTS sp_colab_verificar_bloqueo;
DROP PROCEDURE IF EXISTS sp_colab_bloquear_cuenta;
DROP PROCEDURE IF EXISTS sp_colab_desbloquear_cuenta;
DROP PROCEDURE IF EXISTS sp_colab_generar_alerta_seguridad;
DROP PROCEDURE IF EXISTS sp_colab_registrar_incidencia;
DROP PROCEDURE IF EXISTS sp_colab_cerrar_incidencia;

-- Triggers
DROP TRIGGER IF EXISTS trg_colab_auto_bloqueo_login;
DROP TRIGGER IF EXISTS trg_colab_auditoria_cambio_estado;
DROP TRIGGER IF EXISTS trg_colab_historial_contrasena;
DROP TRIGGER IF EXISTS trg_colab_alerta_documento_vencido;

-- Eventos
DROP EVENT IF EXISTS evento_colab_auto_bloqueo_intentos;
DROP EVENT IF EXISTS evento_colab_limpiar_intentos_login;
DROP EVENT IF EXISTS evento_colab_alertar_documentos_vencidos;
DROP EVENT IF EXISTS evento_colab_alertar_capacitaciones_vencidas;
DROP EVENT IF EXISTS evento_colab_alertar_evaluaciones_pendientes;

-- Tablas (orden inverso de dependencias)
DROP TABLE IF EXISTS colab_alertas;
DROP TABLE IF EXISTS colab_incidencias_seguimiento;
DROP TABLE IF EXISTS colab_incidencias;
DROP TABLE IF EXISTS colab_equipos_miembros;
DROP TABLE IF EXISTS colab_equipos;
DROP TABLE IF EXISTS colab_evaluaciones_criterios;
DROP TABLE IF EXISTS colab_evaluaciones;
DROP TABLE IF EXISTS colab_capacitaciones_participantes;
DROP TABLE IF EXISTS colab_capacitaciones;
DROP TABLE IF EXISTS colab_documentos;
DROP TABLE IF EXISTS colab_horarios_acceso;
DROP TABLE IF EXISTS colab_ips_confiables;
DROP TABLE IF EXISTS colab_bloqueos;
DROP TABLE IF EXISTS colab_intentos_login;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SECCIÓN 1: SEGURIDAD AVANZADA
-- ============================================================================

-- ============================================================================
-- TABLA: colab_intentos_login
-- Registro de cada intento de inicio de sesión (exitoso o fallido)
-- Estructura paralela a seguridad_intentos_login del módulo admin
-- ============================================================================

CREATE TABLE colab_intentos_login (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(255) NOT NULL,
    usuario_id INT UNSIGNED,

    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    huella_dispositivo VARCHAR(255),

    -- Resultado
    exitoso BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_fallo ENUM(
        'usuario_no_existe',
        'contrasena_incorrecta',
        'cuenta_inactiva',
        'cuenta_bloqueada',
        'sesion_expirada',
        '2fa_fallido',
        'ip_no_autorizada',
        'dispositivo_no_confiable',
        'fuera_de_horario',
        'contrasena_expirada',
        'max_sesiones_alcanzado'
    ),

    -- Geolocalización
    ip_pais VARCHAR(100),
    ip_ciudad VARCHAR(100),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_il_correo (correo),
    INDEX idx_colab_il_usuario (usuario_id),
    INDEX idx_colab_il_ip (ip_address),
    INDEX idx_colab_il_exitoso (exitoso),
    INDEX idx_colab_il_creado (creado_en),
    INDEX idx_colab_il_huella (huella_dispositivo),
    CONSTRAINT fk_colab_il_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_bloqueos
-- Bloqueos de acceso por cuenta, IP o dispositivo
-- Implementa escalamiento progresivo de bloqueos
-- ============================================================================

CREATE TABLE colab_bloqueos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo_bloqueo ENUM('usuario', 'ip', 'dispositivo', 'correo') NOT NULL,
    valor_bloqueado VARCHAR(255) NOT NULL,
    usuario_id INT UNSIGNED,

    motivo ENUM(
        'intentos_fallidos',
        'actividad_sospechosa',
        'reporte_abuso',
        'administrativo',
        'automatico',
        'fuerza_bruta',
        'ip_maliciosa',
        'dispositivo_comprometido'
    ) NOT NULL,
    descripcion TEXT,

    -- Duración y escalamiento
    bloqueado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME,
    es_permanente BOOLEAN NOT NULL DEFAULT FALSE,
    nivel_bloqueo TINYINT UNSIGNED NOT NULL DEFAULT 1,

    -- Gestión de desbloqueo
    desbloqueado_en DATETIME,
    desbloqueado_por INT UNSIGNED,
    motivo_desbloqueo TEXT,

    -- Contadores
    intentos_durante_bloqueo INT UNSIGNED NOT NULL DEFAULT 0,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_bloq_tipo_valor (tipo_bloqueo, valor_bloqueado),
    INDEX idx_colab_bloq_usuario (usuario_id),
    INDEX idx_colab_bloq_expira (expira_en),
    INDEX idx_colab_bloq_activo (desbloqueado_en),
    INDEX idx_colab_bloq_nivel (nivel_bloqueo),
    CONSTRAINT fk_colab_bloq_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_ips_confiables
-- Lista blanca de IPs desde las cuales un colaborador puede acceder
-- Se evalúa si el flag acceso_solo_ip_confiable está activo en colab_usuarios
-- ============================================================================

CREATE TABLE colab_ips_confiables (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,

    ip_address VARCHAR(45) NOT NULL,
    mascara_subred VARCHAR(45),
    descripcion VARCHAR(200),

    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    registrada_por_admin INT UNSIGNED,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_ip_usuario (usuario_id, ip_address),
    INDEX idx_colab_ip_usuario (usuario_id),
    INDEX idx_colab_ip_activa (es_activa),
    CONSTRAINT fk_colab_ip_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_horarios_acceso
-- Horarios permitidos de acceso al portal por colaborador
-- Se evalúa si el flag acceso_solo_horario_turno está activo en colab_usuarios
-- ============================================================================

CREATE TABLE colab_horarios_acceso (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,

    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    registrado_por_admin INT UNSIGNED,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_horario_dia (usuario_id, dia_semana),
    INDEX idx_colab_horario_usuario (usuario_id),
    INDEX idx_colab_horario_dia (dia_semana),
    CONSTRAINT fk_colab_horario_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECCIÓN 2: GESTIÓN DOCUMENTAL
-- ============================================================================

-- ============================================================================
-- TABLA: colab_documentos
-- Documentos del colaborador: contratos, identidad, licencias, certificados
-- ============================================================================

CREATE TABLE colab_documentos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,

    tipo_documento ENUM(
        'contrato',
        'identidad',
        'curriculum',
        'licencia_conducir',
        'titulo_academico',
        'certificado',
        'antecedentes_penales',
        'constancia_trabajo',
        'carta_recomendacion',
        'acuerdo_confidencialidad',
        'recibo_pago',
        'otro'
    ) NOT NULL,

    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    archivo_url VARCHAR(500) NOT NULL,
    archivo_tipo VARCHAR(50) NOT NULL,
    archivo_tamano INT UNSIGNED NOT NULL,

    -- Vigencia
    fecha_emision DATE,
    fecha_vencimiento DATE,
    es_vigente BOOLEAN NOT NULL DEFAULT TRUE,

    -- Control
    es_confidencial BOOLEAN NOT NULL DEFAULT FALSE,
    es_obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    verificado_por INT UNSIGNED,
    verificado_en DATETIME,

    -- Auditoría
    subido_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_doc_usuario (usuario_id),
    INDEX idx_colab_doc_tipo (tipo_documento),
    INDEX idx_colab_doc_vencimiento (fecha_vencimiento),
    INDEX idx_colab_doc_vigente (es_vigente),
    INDEX idx_colab_doc_verificado (verificado),
    CONSTRAINT fk_colab_doc_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECCIÓN 3: CAPACITACIONES Y FORMACIÓN
-- ============================================================================

-- ============================================================================
-- TABLA: colab_capacitaciones
-- Programas de capacitación y formación para colaboradores
-- ============================================================================

CREATE TABLE colab_capacitaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,

    tipo ENUM(
        'induccion',
        'seguridad_laboral',
        'manejo_inventario',
        'operacion_equipo',
        'atencion_cliente',
        'normativas',
        'sistemas',
        'liderazgo',
        'otro'
    ) NOT NULL,

    -- Modalidad
    modalidad ENUM('presencial', 'virtual', 'mixta', 'autoestudio') NOT NULL DEFAULT 'presencial',
    duracion_horas DECIMAL(5,1) NOT NULL,
    ubicacion VARCHAR(300),
    url_recurso VARCHAR(500),

    -- Instructor
    instructor_nombre VARCHAR(200),
    instructor_externo BOOLEAN NOT NULL DEFAULT FALSE,

    -- Programación
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    fecha_limite_inscripcion DATETIME,

    -- Requisitos
    es_obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_evaluacion BOOLEAN NOT NULL DEFAULT FALSE,
    nota_minima_aprobacion DECIMAL(5,2) DEFAULT 70.00,

    -- Vigencia de la certificación
    certificacion_vigencia_meses INT UNSIGNED,

    -- Estado
    estado ENUM('programada', 'en_curso', 'completada', 'cancelada', 'pospuesta') NOT NULL DEFAULT 'programada',
    max_participantes INT UNSIGNED,

    -- Empresa
    empresa_id INT,

    -- Auditoría
    creado_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_cap_tipo (tipo),
    INDEX idx_colab_cap_estado (estado),
    INDEX idx_colab_cap_fecha (fecha_inicio),
    INDEX idx_colab_cap_obligatoria (es_obligatoria),
    INDEX idx_colab_cap_empresa (empresa_id),
    CONSTRAINT fk_colab_cap_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_capacitaciones_participantes
-- Inscripción y seguimiento de participantes en capacitaciones
-- ============================================================================

CREATE TABLE colab_capacitaciones_participantes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    capacitacion_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,

    -- Estado del participante
    estado ENUM('inscrito', 'en_progreso', 'completado', 'reprobado', 'ausente', 'retirado') NOT NULL DEFAULT 'inscrito',

    -- Asistencia
    asistio BOOLEAN,
    porcentaje_asistencia DECIMAL(5,2) DEFAULT 0.00,

    -- Evaluación
    nota_final DECIMAL(5,2),
    aprobado BOOLEAN,
    fecha_evaluacion DATETIME,

    -- Certificación
    certificado_emitido BOOLEAN NOT NULL DEFAULT FALSE,
    certificado_url VARCHAR(500),
    certificado_fecha DATETIME,
    certificado_vence_en DATE,

    -- Observaciones
    observaciones TEXT,

    -- Auditoría
    inscrito_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_cap_participante (capacitacion_id, usuario_id),
    INDEX idx_colab_cap_part_cap (capacitacion_id),
    INDEX idx_colab_cap_part_usuario (usuario_id),
    INDEX idx_colab_cap_part_estado (estado),
    INDEX idx_colab_cap_part_aprobado (aprobado),
    INDEX idx_colab_cap_part_cert_vence (certificado_vence_en),
    CONSTRAINT fk_colab_cap_part_cap
        FOREIGN KEY (capacitacion_id) REFERENCES colab_capacitaciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_cap_part_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECCIÓN 4: EVALUACIONES DE DESEMPEÑO
-- ============================================================================

-- ============================================================================
-- TABLA: colab_evaluaciones
-- Evaluaciones de desempeño periódicas de colaboradores
-- ============================================================================

CREATE TABLE colab_evaluaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    evaluador_id INT UNSIGNED,

    -- Periodo evaluado
    periodo_tipo ENUM('mensual', 'trimestral', 'semestral', 'anual') NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,

    -- Resultados
    puntuacion_general DECIMAL(4,2),
    calificacion ENUM('excepcional', 'sobresaliente', 'satisfactorio', 'necesita_mejora', 'insuficiente'),

    -- Categorías de evaluación
    puntaje_productividad DECIMAL(4,2),
    puntaje_calidad DECIMAL(4,2),
    puntaje_puntualidad DECIMAL(4,2),
    puntaje_trabajo_equipo DECIMAL(4,2),
    puntaje_iniciativa DECIMAL(4,2),
    puntaje_cumplimiento_normas DECIMAL(4,2),

    -- Observaciones
    fortalezas TEXT,
    areas_mejora TEXT,
    compromisos TEXT,
    comentarios_evaluador TEXT,
    comentarios_colaborador TEXT,

    -- Estado
    estado ENUM('borrador', 'en_revision', 'completada', 'firmada', 'archivada') NOT NULL DEFAULT 'borrador',

    -- Firmas
    firmado_evaluador BOOLEAN NOT NULL DEFAULT FALSE,
    firmado_evaluador_en DATETIME,
    firmado_colaborador BOOLEAN NOT NULL DEFAULT FALSE,
    firmado_colaborador_en DATETIME,

    -- Empresa y almacén en el que trabajó durante el periodo
    empresa_id INT,
    almacen_id INT UNSIGNED,

    -- Auditoría
    creado_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_eval_usuario (usuario_id),
    INDEX idx_colab_eval_evaluador (evaluador_id),
    INDEX idx_colab_eval_periodo (periodo_inicio, periodo_fin),
    INDEX idx_colab_eval_estado (estado),
    INDEX idx_colab_eval_calificacion (calificacion),
    INDEX idx_colab_eval_empresa (empresa_id),
    INDEX idx_colab_eval_almacen (almacen_id),
    CONSTRAINT fk_colab_eval_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_eval_evaluador
        FOREIGN KEY (evaluador_id) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_eval_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_eval_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_evaluaciones_criterios
-- Criterios personalizados de evaluación por evaluación
-- ============================================================================

CREATE TABLE colab_evaluaciones_criterios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    evaluacion_id INT UNSIGNED NOT NULL,

    criterio VARCHAR(200) NOT NULL,
    descripcion TEXT,
    peso_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    puntaje DECIMAL(4,2),
    puntaje_maximo DECIMAL(4,2) NOT NULL DEFAULT 10.00,

    observaciones TEXT,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_ec_evaluacion (evaluacion_id),
    CONSTRAINT fk_colab_ec_evaluacion
        FOREIGN KEY (evaluacion_id) REFERENCES colab_evaluaciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECCIÓN 5: EQUIPOS DE TRABAJO
-- ============================================================================

-- ============================================================================
-- TABLA: colab_equipos
-- Equipos/brigadas de trabajo para organizar colaboradores
-- ============================================================================

CREATE TABLE colab_equipos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#0d6efd',

    -- Líder del equipo
    lider_id INT UNSIGNED,

    -- Asignación
    almacen_id INT UNSIGNED,
    empresa_id INT,

    -- Turno por defecto
    turno_tipo ENUM('manana', 'tarde', 'noche', 'rotativo', 'flexible') NOT NULL DEFAULT 'manana',
    hora_inicio_defecto TIME,
    hora_fin_defecto TIME,

    -- Estado
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    max_miembros INT UNSIGNED DEFAULT 20,

    -- Auditoría
    creado_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_equipo_lider (lider_id),
    INDEX idx_colab_equipo_almacen (almacen_id),
    INDEX idx_colab_equipo_empresa (empresa_id),
    INDEX idx_colab_equipo_activo (es_activo),
    CONSTRAINT fk_colab_equipo_lider
        FOREIGN KEY (lider_id) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_equipo_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_equipo_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_equipos_miembros
-- Membresía de colaboradores en equipos de trabajo
-- ============================================================================

CREATE TABLE colab_equipos_miembros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,

    rol_equipo ENUM('lider', 'sublider', 'miembro', 'apoyo') NOT NULL DEFAULT 'miembro',

    -- Vigencia
    fecha_ingreso DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_salida DATE,
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoría
    asignado_por_admin INT UNSIGNED,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_colab_equipo_miembro (equipo_id, usuario_id),
    INDEX idx_colab_em_equipo (equipo_id),
    INDEX idx_colab_em_usuario (usuario_id),
    INDEX idx_colab_em_activo (es_activo),
    INDEX idx_colab_em_rol (rol_equipo),
    CONSTRAINT fk_colab_em_equipo
        FOREIGN KEY (equipo_id) REFERENCES colab_equipos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_em_usuario
        FOREIGN KEY (usuario_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECCIÓN 6: INCIDENCIAS OPERATIVAS
-- ============================================================================

-- ============================================================================
-- TABLA: colab_incidencias
-- Registro de incidencias operativas, disciplinarias y de seguridad
-- ============================================================================

CREATE TABLE colab_incidencias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,

    -- Clasificación
    tipo ENUM(
        'operativa',
        'seguridad_laboral',
        'seguridad_informatica',
        'disciplinaria',
        'ausentismo',
        'dano_equipo',
        'dano_mercancia',
        'accidente_laboral',
        'conflicto_personal',
        'incumplimiento_norma',
        'otro'
    ) NOT NULL,

    prioridad ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    estado ENUM('abierta', 'en_investigacion', 'pendiente_resolucion', 'resuelta', 'cerrada', 'escalada') NOT NULL DEFAULT 'abierta',

    -- Descripción
    titulo VARCHAR(300) NOT NULL,
    descripcion TEXT NOT NULL,
    ubicacion VARCHAR(200),

    -- Personas involucradas
    reportado_por INT UNSIGNED NOT NULL,
    colaborador_involucrado_id INT UNSIGNED,
    asignado_a INT UNSIGNED,

    -- Contexto
    almacen_id INT UNSIGNED,
    empresa_id INT,
    turno_id INT UNSIGNED,

    -- Evidencia
    foto_evidencia_url VARCHAR(500),
    documentos_adjuntos JSON,

    -- Resolución
    resolucion TEXT,
    accion_correctiva TEXT,
    fecha_resolucion DATETIME,
    resuelto_por INT UNSIGNED,

    -- Impacto
    impacto_economico DECIMAL(15,2),
    dias_perdidos INT UNSIGNED DEFAULT 0,

    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_colab_inc_tipo (tipo),
    INDEX idx_colab_inc_prioridad (prioridad),
    INDEX idx_colab_inc_estado (estado),
    INDEX idx_colab_inc_reportado (reportado_por),
    INDEX idx_colab_inc_involucrado (colaborador_involucrado_id),
    INDEX idx_colab_inc_asignado (asignado_a),
    INDEX idx_colab_inc_almacen (almacen_id),
    INDEX idx_colab_inc_empresa (empresa_id),
    INDEX idx_colab_inc_fecha (creado_en),
    CONSTRAINT fk_colab_inc_reportado
        FOREIGN KEY (reportado_por) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_inc_involucrado
        FOREIGN KEY (colaborador_involucrado_id) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_inc_asignado
        FOREIGN KEY (asignado_a) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_inc_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_inc_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_inc_turno
        FOREIGN KEY (turno_id) REFERENCES colab_turnos(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colab_incidencias_seguimiento
-- Historial de seguimiento de incidencias (comentarios, cambios de estado)
-- ============================================================================

CREATE TABLE colab_incidencias_seguimiento (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    incidencia_id INT UNSIGNED NOT NULL,

    accion ENUM(
        'comentario',
        'cambio_estado',
        'cambio_prioridad',
        'reasignacion',
        'escalacion',
        'adjunto_agregado',
        'resolucion'
    ) NOT NULL,

    descripcion TEXT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    prioridad_anterior VARCHAR(20),
    prioridad_nueva VARCHAR(20),

    -- Adjuntos
    archivo_adjunto_url VARCHAR(500),

    -- Autor
    realizado_por INT UNSIGNED NOT NULL,
    es_admin BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_is_incidencia (incidencia_id),
    INDEX idx_colab_is_accion (accion),
    INDEX idx_colab_is_autor (realizado_por),
    INDEX idx_colab_is_fecha (creado_en),
    CONSTRAINT fk_colab_is_incidencia
        FOREIGN KEY (incidencia_id) REFERENCES colab_incidencias(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_is_autor
        FOREIGN KEY (realizado_por) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECCIÓN 7: ALERTAS DE SEGURIDAD Y OPERATIVAS
-- ============================================================================

-- ============================================================================
-- TABLA: colab_alertas
-- Alertas automáticas y manuales de seguridad/operaciones
-- ============================================================================

CREATE TABLE colab_alertas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    tipo ENUM(
        'login_sospechoso',
        'multiples_intentos_fallidos',
        'acceso_fuera_horario',
        'ip_no_autorizada',
        'dispositivo_nuevo',
        'contrasena_expirada',
        'documento_vencido',
        'capacitacion_vencida',
        'evaluacion_pendiente',
        'incidencia_critica',
        'bloqueo_automatico',
        'anomalia_inventario',
        'turno_no_registrado',
        'sesion_multiple'
    ) NOT NULL,

    severidad ENUM('info', 'advertencia', 'critico', 'emergencia') NOT NULL DEFAULT 'advertencia',

    titulo VARCHAR(300) NOT NULL,
    mensaje TEXT NOT NULL,
    datos_contexto JSON,

    -- Destinatario
    usuario_destino_id INT UNSIGNED,
    usuario_origen_id INT UNSIGNED,
    almacen_id INT UNSIGNED,

    -- Estado
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    leida_en DATETIME,
    leida_por INT UNSIGNED,

    atendida BOOLEAN NOT NULL DEFAULT FALSE,
    atendida_en DATETIME,
    atendida_por INT UNSIGNED,
    accion_tomada TEXT,

    -- Referencia
    referencia_tipo VARCHAR(50),
    referencia_id BIGINT UNSIGNED,

    -- Expiración
    expira_en DATETIME,

    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_colab_alerta_tipo (tipo),
    INDEX idx_colab_alerta_severidad (severidad),
    INDEX idx_colab_alerta_destino (usuario_destino_id),
    INDEX idx_colab_alerta_origen (usuario_origen_id),
    INDEX idx_colab_alerta_leida (leida),
    INDEX idx_colab_alerta_atendida (atendida),
    INDEX idx_colab_alerta_almacen (almacen_id),
    INDEX idx_colab_alerta_fecha (creado_en),
    INDEX idx_colab_alerta_referencia (referencia_tipo, referencia_id),
    CONSTRAINT fk_colab_alerta_destino
        FOREIGN KEY (usuario_destino_id) REFERENCES colab_usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_colab_alerta_origen
        FOREIGN KEY (usuario_origen_id) REFERENCES colab_usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_colab_alerta_almacen
        FOREIGN KEY (almacen_id) REFERENCES inventario_almacenes(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS INICIALES: MÓDULOS COMPLEMENTARIOS
-- ============================================================================

-- Agregar módulos de las nuevas funcionalidades al portal de colaboradores
INSERT INTO colab_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu, actualizado_en) VALUES
('colab_seguridad',      'Seguridad',         'Centro de seguridad del colaborador',       'bi-shield-check',    '/colaborador/seguridad',        13, TRUE, NOW()),
('colab_documentos',     'Mis Documentos',    'Documentos personales y laborales',         'bi-file-earmark-text','/colaborador/documentos',      14, TRUE, NOW()),
('colab_capacitaciones', 'Capacitaciones',    'Programas de formación y certificaciones',  'bi-mortarboard',     '/colaborador/capacitaciones',   15, TRUE, NOW()),
('colab_evaluaciones',   'Evaluaciones',      'Evaluaciones de desempeño',                 'bi-star',            '/colaborador/evaluaciones',     16, TRUE, NOW()),
('colab_mi_equipo',      'Mi Equipo',         'Equipo de trabajo asignado',                'bi-people',          '/colaborador/mi-equipo',        17, TRUE, NOW()),
('colab_incidencias',    'Incidencias',       'Reporte y seguimiento de incidencias',      'bi-exclamation-triangle', '/colaborador/incidencias',  18, TRUE, NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);

-- ============================================================================
-- DATOS INICIALES: PERMISOS COMPLEMENTARIOS
-- ============================================================================

-- Permisos de Seguridad
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion, actualizado_en) VALUES
('colab_seguridad.ver',     'Ver centro de seguridad',      (SELECT id FROM colab_modulos WHERE codigo = 'colab_seguridad'), 'ver', NOW()),
('colab_seguridad.editar',  'Gestionar configuración seguridad', (SELECT id FROM colab_modulos WHERE codigo = 'colab_seguridad'), 'editar', NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), accion = VALUES(accion);

-- Permisos de Documentos
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion, actualizado_en) VALUES
('colab_documentos.ver',     'Ver mis documentos',          (SELECT id FROM colab_modulos WHERE codigo = 'colab_documentos'), 'ver', NOW()),
('colab_documentos.crear',   'Subir documentos',            (SELECT id FROM colab_modulos WHERE codigo = 'colab_documentos'), 'crear', NOW()),
('colab_documentos.eliminar','Eliminar documentos propios', (SELECT id FROM colab_modulos WHERE codigo = 'colab_documentos'), 'eliminar', NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), accion = VALUES(accion);

-- Permisos de Capacitaciones
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion, actualizado_en) VALUES
('colab_capacitaciones.ver',       'Ver capacitaciones disponibles', (SELECT id FROM colab_modulos WHERE codigo = 'colab_capacitaciones'), 'ver', NOW()),
('colab_capacitaciones.crear',     'Crear programa de capacitación', (SELECT id FROM colab_modulos WHERE codigo = 'colab_capacitaciones'), 'crear', NOW()),
('colab_capacitaciones.editar',    'Editar capacitaciones',          (SELECT id FROM colab_modulos WHERE codigo = 'colab_capacitaciones'), 'editar', NOW()),
('colab_capacitaciones.ejecutar',  'Registrar asistencia y notas',   (SELECT id FROM colab_modulos WHERE codigo = 'colab_capacitaciones'), 'ejecutar', NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), accion = VALUES(accion);

-- Permisos de Evaluaciones
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion, actualizado_en) VALUES
('colab_evaluaciones.ver',     'Ver mis evaluaciones',          (SELECT id FROM colab_modulos WHERE codigo = 'colab_evaluaciones'), 'ver', NOW()),
('colab_evaluaciones.crear',   'Crear evaluaciones',            (SELECT id FROM colab_modulos WHERE codigo = 'colab_evaluaciones'), 'crear', NOW()),
('colab_evaluaciones.editar',  'Editar evaluaciones',           (SELECT id FROM colab_modulos WHERE codigo = 'colab_evaluaciones'), 'editar', NOW()),
('colab_evaluaciones.aprobar', 'Aprobar/firmar evaluaciones',   (SELECT id FROM colab_modulos WHERE codigo = 'colab_evaluaciones'), 'aprobar', NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), accion = VALUES(accion);

-- Permisos de Equipo
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion, actualizado_en) VALUES
('colab_equipo.ver',     'Ver mi equipo de trabajo',       (SELECT id FROM colab_modulos WHERE codigo = 'colab_mi_equipo'), 'ver', NOW()),
('colab_equipo.editar',  'Gestionar miembros del equipo',  (SELECT id FROM colab_modulos WHERE codigo = 'colab_mi_equipo'), 'editar', NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), accion = VALUES(accion);

-- Permisos de Incidencias
INSERT INTO colab_permisos (codigo, nombre, modulo_id, accion, actualizado_en) VALUES
('colab_incidencias.ver',      'Ver incidencias',           (SELECT id FROM colab_modulos WHERE codigo = 'colab_incidencias'), 'ver', NOW()),
('colab_incidencias.crear',    'Reportar incidencias',      (SELECT id FROM colab_modulos WHERE codigo = 'colab_incidencias'), 'crear', NOW()),
('colab_incidencias.editar',   'Gestionar incidencias',     (SELECT id FROM colab_modulos WHERE codigo = 'colab_incidencias'), 'editar', NOW()),
('colab_incidencias.aprobar',  'Cerrar/resolver incidencias', (SELECT id FROM colab_modulos WHERE codigo = 'colab_incidencias'), 'aprobar', NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), accion = VALUES(accion);

-- ============================================================================
-- ASIGNACIÓN DE PERMISOS DE FASE 14 A LOS ROLES EXISTENTES
-- ============================================================================

-- JEFE DE BODEGA: Todos los permisos nuevos
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'jefe_bodega'),
    p.id
FROM colab_permisos p
WHERE p.codigo LIKE 'colab_seguridad.%'
   OR p.codigo LIKE 'colab_documentos.%'
   OR p.codigo LIKE 'colab_capacitaciones.%'
   OR p.codigo LIKE 'colab_evaluaciones.%'
   OR p.codigo LIKE 'colab_equipo.%'
   OR p.codigo LIKE 'colab_incidencias.%'
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- SUPERVISOR: Casi todos (sin crear capacitaciones ni eliminar documentos)
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'supervisor'),
    p.id
FROM colab_permisos p
WHERE p.codigo IN (
    'colab_seguridad.ver',
    'colab_documentos.ver', 'colab_documentos.crear',
    'colab_capacitaciones.ver', 'colab_capacitaciones.ejecutar',
    'colab_evaluaciones.ver', 'colab_evaluaciones.crear', 'colab_evaluaciones.editar', 'colab_evaluaciones.aprobar',
    'colab_equipo.ver', 'colab_equipo.editar',
    'colab_incidencias.ver', 'colab_incidencias.crear', 'colab_incidencias.editar', 'colab_incidencias.aprobar'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- INVENTARISTA: Ver y capacitaciones básicas
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'inventarista'),
    p.id
FROM colab_permisos p
WHERE p.codigo IN (
    'colab_seguridad.ver',
    'colab_documentos.ver', 'colab_documentos.crear',
    'colab_capacitaciones.ver',
    'colab_evaluaciones.ver',
    'colab_equipo.ver',
    'colab_incidencias.ver', 'colab_incidencias.crear'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- RECEPCIONISTA: Permisos básicos
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'recepcionista'),
    p.id
FROM colab_permisos p
WHERE p.codigo IN (
    'colab_seguridad.ver',
    'colab_documentos.ver', 'colab_documentos.crear',
    'colab_capacitaciones.ver',
    'colab_evaluaciones.ver',
    'colab_equipo.ver',
    'colab_incidencias.ver', 'colab_incidencias.crear'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- DESPACHADOR: Permisos básicos
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'despachador'),
    p.id
FROM colab_permisos p
WHERE p.codigo IN (
    'colab_seguridad.ver',
    'colab_documentos.ver', 'colab_documentos.crear',
    'colab_capacitaciones.ver',
    'colab_evaluaciones.ver',
    'colab_equipo.ver',
    'colab_incidencias.ver', 'colab_incidencias.crear'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- AUXILIAR: Permisos básicos de solo lectura + reportar incidencias
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'auxiliar'),
    p.id
FROM colab_permisos p
WHERE p.codigo IN (
    'colab_seguridad.ver',
    'colab_documentos.ver',
    'colab_capacitaciones.ver',
    'colab_evaluaciones.ver',
    'colab_equipo.ver',
    'colab_incidencias.ver', 'colab_incidencias.crear'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- SOLO CONSULTA: Solo lectura
INSERT INTO colab_roles_permisos (rol_id, permiso_id)
SELECT
    (SELECT id FROM colab_roles WHERE codigo = 'consulta'),
    p.id
FROM colab_permisos p
WHERE p.codigo IN (
    'colab_documentos.ver',
    'colab_capacitaciones.ver',
    'colab_evaluaciones.ver',
    'colab_equipo.ver',
    'colab_incidencias.ver'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ============================================================================
-- DATOS INICIALES: CONFIGURACIÓN DE SEGURIDAD AVANZADA
-- ============================================================================

INSERT INTO colab_configuracion (clave, valor, tipo_dato, descripcion, categoria, actualizado_en) VALUES
-- Bloqueos
('bloqueo_nivel1_minutos',           '15',     'numero',   'Minutos de bloqueo nivel 1 (5 intentos fallidos)',           'seguridad', NOW()),
('bloqueo_nivel2_minutos',           '60',     'numero',   'Minutos de bloqueo nivel 2 (10 intentos fallidos)',          'seguridad', NOW()),
('bloqueo_nivel3_minutos',           '1440',   'numero',   'Minutos de bloqueo nivel 3 (20 intentos / 24 horas)',        'seguridad', NOW()),
('bloqueo_nivel3_notificar_admin',   'true',   'booleano', 'Notificar al admin cuando se aplique bloqueo nivel 3',       'seguridad', NOW()),
('intentos_nivel1',                  '5',      'numero',   'Intentos fallidos para bloqueo nivel 1',                     'seguridad', NOW()),
('intentos_nivel2',                  '10',     'numero',   'Intentos fallidos para bloqueo nivel 2',                     'seguridad', NOW()),
('intentos_nivel3',                  '20',     'numero',   'Intentos fallidos para bloqueo nivel 3 (permanente)',        'seguridad', NOW()),
('intentos_ventana_minutos',         '15',     'numero',   'Ventana de tiempo para contar intentos fallidos (minutos)',  'seguridad', NOW()),

-- Alertas
('alerta_login_sospechoso',          'true',   'booleano', 'Generar alerta por login desde IP/dispositivo desconocido', 'alertas', NOW()),
('alerta_acceso_fuera_horario',      'true',   'booleano', 'Generar alerta por acceso fuera de horario permitido',      'alertas', NOW()),
('alerta_documento_dias_antes',      '30',     'numero',   'Días antes de vencimiento para alertar sobre documentos',   'alertas', NOW()),
('alerta_capacitacion_dias_antes',   '15',     'numero',   'Días antes de vencimiento de certificación',                'alertas', NOW()),
('alerta_evaluacion_dias_vencida',   '7',      'numero',   'Días después de periodo para alertar evaluación pendiente', 'alertas', NOW()),

-- Documentos
('documentos_tamano_maximo_mb',      '10',     'numero',   'Tamaño máximo de documento en MB',                          'documentos', NOW()),
('documentos_tipos_permitidos',      'pdf,jpg,jpeg,png,doc,docx', 'texto', 'Extensiones de archivo permitidas',         'documentos', NOW()),
('documentos_identidad_obligatorio', 'true',   'booleano', 'Documento de identidad obligatorio al registrar',           'documentos', NOW()),
('documentos_contrato_obligatorio',  'true',   'booleano', 'Contrato obligatorio al registrar',                         'documentos', NOW()),

-- Evaluaciones
('evaluacion_periodo_defecto',       'trimestral', 'texto','Periodo de evaluación por defecto',                         'evaluaciones', NOW()),
('evaluacion_puntaje_minimo',        '60.00',  'numero',   'Puntaje mínimo para calificación satisfactoria',            'evaluaciones', NOW()),
('evaluacion_requiere_firma',        'true',   'booleano', 'Requiere firma digital del colaborador y evaluador',        'evaluaciones', NOW())
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- ============================================================================
-- DATOS INICIALES: PERMISOS ADMIN PARA GESTIÓN DE NUEVAS TABLAS
-- ============================================================================

INSERT INTO permisos (codigo, nombre, descripcion, modulo) VALUES
('colaboradores.documentos',     'Gestionar documentos',      'Permite gestionar documentos de colaboradores',       'colaboradores'),
('colaboradores.capacitaciones', 'Gestionar capacitaciones',  'Permite gestionar programas de capacitación',          'colaboradores'),
('colaboradores.evaluaciones',   'Gestionar evaluaciones',    'Permite gestionar evaluaciones de desempeño',          'colaboradores'),
('colaboradores.equipos',        'Gestionar equipos',         'Permite gestionar equipos de trabajo',                 'colaboradores'),
('colaboradores.incidencias',    'Gestionar incidencias',     'Permite gestionar incidencias de colaboradores',       'colaboradores'),
('colaboradores.seguridad',      'Gestionar seguridad colab', 'Permite gestionar bloqueos, IPs y horarios de acceso', 'colaboradores'),
('colaboradores.alertas',        'Ver alertas colaboradores', 'Permite ver alertas de seguridad de colaboradores',    'colaboradores')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Asignar permisos nuevos al super_admin (rol_id = 1 en tabla roles_permisos)
INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos WHERE codigo IN (
    'colaboradores.documentos',
    'colaboradores.capacitaciones',
    'colaboradores.evaluaciones',
    'colaboradores.equipos',
    'colaboradores.incidencias',
    'colaboradores.seguridad',
    'colaboradores.alertas'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista de intentos de login recientes de colaboradores (últimas 24 horas)
CREATE OR REPLACE VIEW vista_colab_intentos_login_recientes AS
SELECT
    il.id,
    il.correo,
    il.ip_address,
    il.exitoso,
    il.motivo_fallo,
    il.ip_pais,
    il.ip_ciudad,
    il.huella_dispositivo,
    il.creado_en,
    u.id AS usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_colaborador,
    u.codigo_colaborador,
    u.es_activo AS usuario_activo
FROM colab_intentos_login il
LEFT JOIN colab_usuarios u ON il.usuario_id = u.id
WHERE il.creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY il.creado_en DESC;

-- Vista de bloqueos activos de colaboradores
CREATE OR REPLACE VIEW vista_colab_bloqueos_activos AS
SELECT
    b.id,
    b.tipo_bloqueo,
    b.valor_bloqueado,
    b.motivo,
    b.descripcion,
    b.bloqueado_en,
    b.expira_en,
    b.es_permanente,
    b.nivel_bloqueo,
    b.intentos_durante_bloqueo,
    CONCAT(u.nombre, ' ', u.apellido) AS colaborador_afectado,
    u.codigo_colaborador,
    u.correo AS correo_colaborador,
    CASE
        WHEN b.es_permanente THEN 'Permanente'
        WHEN b.expira_en > NOW() THEN CONCAT('Expira en ', TIMESTAMPDIFF(MINUTE, NOW(), b.expira_en), ' minutos')
        ELSE 'Expirado'
    END AS estado_bloqueo
FROM colab_bloqueos b
LEFT JOIN colab_usuarios u ON b.usuario_id = u.id
WHERE b.desbloqueado_en IS NULL
    AND (b.es_permanente = TRUE OR b.expira_en > NOW());

-- Vista de documentos próximos a vencer o vencidos
CREATE OR REPLACE VIEW vista_colab_documentos_vencidos AS
SELECT
    d.id,
    d.tipo_documento,
    d.nombre,
    d.fecha_vencimiento,
    d.es_obligatorio,
    d.verificado,
    DATEDIFF(d.fecha_vencimiento, CURRENT_DATE) AS dias_para_vencimiento,
    CASE
        WHEN d.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
        WHEN d.fecha_vencimiento <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'proximo_a_vencer'
        ELSE 'vigente'
    END AS estado_vigencia,
    d.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS colaborador,
    u.codigo_colaborador
FROM colab_documentos d
JOIN colab_usuarios u ON d.usuario_id = u.id
WHERE d.es_vigente = TRUE
    AND u.es_activo = TRUE
    AND d.fecha_vencimiento IS NOT NULL
    AND d.fecha_vencimiento <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
ORDER BY d.fecha_vencimiento ASC;

-- Vista de capacitaciones con participantes pendientes
CREATE OR REPLACE VIEW vista_colab_capacitaciones_pendientes AS
SELECT
    c.id,
    c.codigo,
    c.titulo,
    c.tipo,
    c.modalidad,
    c.duracion_horas,
    c.fecha_inicio,
    c.fecha_fin,
    c.es_obligatoria,
    c.estado,
    c.max_participantes,
    COUNT(cp.id) AS total_inscritos,
    SUM(CASE WHEN cp.estado = 'completado' THEN 1 ELSE 0 END) AS total_completados,
    SUM(CASE WHEN cp.aprobado = TRUE THEN 1 ELSE 0 END) AS total_aprobados
FROM colab_capacitaciones c
LEFT JOIN colab_capacitaciones_participantes cp ON c.id = cp.capacitacion_id
WHERE c.estado IN ('programada', 'en_curso')
GROUP BY c.id
ORDER BY c.fecha_inicio ASC;

-- Vista resumen de evaluaciones por colaborador
CREATE OR REPLACE VIEW vista_colab_evaluaciones_resumen AS
SELECT
    e.id,
    e.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS colaborador,
    u.codigo_colaborador,
    e.periodo_tipo,
    e.periodo_inicio,
    e.periodo_fin,
    e.puntuacion_general,
    e.calificacion,
    e.estado,
    e.firmado_evaluador,
    e.firmado_colaborador,
    CONCAT(ev.nombre, ' ', ev.apellido) AS evaluador,
    ia.nombre AS almacen_nombre,
    emp.nombre AS empresa_nombre
FROM colab_evaluaciones e
JOIN colab_usuarios u ON e.usuario_id = u.id
LEFT JOIN colab_usuarios ev ON e.evaluador_id = ev.id
LEFT JOIN inventario_almacenes ia ON e.almacen_id = ia.id
LEFT JOIN empresas emp ON e.empresa_id = emp.id
ORDER BY e.periodo_fin DESC, e.creado_en DESC;

-- Vista completa de equipos de trabajo con miembros
CREATE OR REPLACE VIEW vista_colab_equipos_completa AS
SELECT
    eq.id,
    eq.codigo,
    eq.nombre,
    eq.descripcion,
    eq.color,
    eq.turno_tipo,
    eq.es_activo,
    CONCAT(l.nombre, ' ', l.apellido) AS lider_nombre,
    l.codigo_colaborador AS lider_codigo,
    ia.nombre AS almacen_nombre,
    emp.nombre AS empresa_nombre,
    COUNT(em.id) AS total_miembros,
    SUM(CASE WHEN em.es_activo = TRUE THEN 1 ELSE 0 END) AS miembros_activos,
    eq.max_miembros
FROM colab_equipos eq
LEFT JOIN colab_usuarios l ON eq.lider_id = l.id
LEFT JOIN inventario_almacenes ia ON eq.almacen_id = ia.id
LEFT JOIN empresas emp ON eq.empresa_id = emp.id
LEFT JOIN colab_equipos_miembros em ON eq.id = em.equipo_id
GROUP BY eq.id, l.nombre, l.apellido, l.codigo_colaborador,
         ia.nombre, emp.nombre;

-- Vista de incidencias abiertas con detalle
CREATE OR REPLACE VIEW vista_colab_incidencias_abiertas AS
SELECT
    i.id,
    i.codigo,
    i.tipo,
    i.prioridad,
    i.estado,
    i.titulo,
    i.ubicacion,
    i.impacto_economico,
    i.dias_perdidos,
    i.creado_en,
    CONCAT(r.nombre, ' ', r.apellido) AS reportado_por_nombre,
    r.codigo_colaborador AS reportado_por_codigo,
    CONCAT(inv.nombre, ' ', inv.apellido) AS involucrado_nombre,
    CONCAT(a.nombre, ' ', a.apellido) AS asignado_a_nombre,
    ia.nombre AS almacen_nombre,
    emp.nombre AS empresa_nombre,
    DATEDIFF(NOW(), i.creado_en) AS dias_abierta
FROM colab_incidencias i
JOIN colab_usuarios r ON i.reportado_por = r.id
LEFT JOIN colab_usuarios inv ON i.colaborador_involucrado_id = inv.id
LEFT JOIN colab_usuarios a ON i.asignado_a = a.id
LEFT JOIN inventario_almacenes ia ON i.almacen_id = ia.id
LEFT JOIN empresas emp ON i.empresa_id = emp.id
WHERE i.estado NOT IN ('resuelta', 'cerrada')
ORDER BY
    FIELD(i.prioridad, 'critica', 'alta', 'media', 'baja'),
    i.creado_en ASC;

-- Vista de alertas no leídas
CREATE OR REPLACE VIEW vista_colab_alertas_no_leidas AS
SELECT
    a.id,
    a.tipo,
    a.severidad,
    a.titulo,
    a.mensaje,
    a.creado_en,
    a.usuario_destino_id,
    CONCAT(ud.nombre, ' ', ud.apellido) AS destinatario,
    a.usuario_origen_id,
    CONCAT(uo.nombre, ' ', uo.apellido) AS origen,
    ia.nombre AS almacen_nombre,
    a.referencia_tipo,
    a.referencia_id,
    a.atendida
FROM colab_alertas a
LEFT JOIN colab_usuarios ud ON a.usuario_destino_id = ud.id
LEFT JOIN colab_usuarios uo ON a.usuario_origen_id = uo.id
LEFT JOIN inventario_almacenes ia ON a.almacen_id = ia.id
WHERE a.leida = FALSE
    AND (a.expira_en IS NULL OR a.expira_en > NOW())
ORDER BY
    FIELD(a.severidad, 'emergencia', 'critico', 'advertencia', 'info'),
    a.creado_en DESC;

-- Vista resumen de seguridad por colaborador
CREATE OR REPLACE VIEW vista_colab_seguridad_resumen AS
SELECT
    u.id AS usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS colaborador,
    u.codigo_colaborador,
    u.correo,
    u.es_activo,
    u.ultimo_acceso,
    u.ultimo_cambio_contrasena,
    u.requiere_2fa,
    u.metodo_2fa,
    u.acceso_solo_ip_confiable,
    u.acceso_solo_horario_turno,
    u.acceso_solo_dispositivo_registrado,
    u.max_sesiones_simultaneas,
    (SELECT COUNT(*) FROM colab_sesiones s WHERE s.usuario_id = u.id AND s.es_activa = TRUE) AS sesiones_activas,
    (SELECT COUNT(*) FROM colab_intentos_login il WHERE il.usuario_id = u.id AND il.exitoso = FALSE AND il.creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS intentos_fallidos_24h,
    (SELECT COUNT(*) FROM colab_bloqueos b WHERE b.usuario_id = u.id AND b.desbloqueado_en IS NULL AND (b.es_permanente = TRUE OR b.expira_en > NOW())) AS bloqueos_activos,
    (SELECT COUNT(*) FROM colab_dispositivos d WHERE d.usuario_id = u.id AND d.es_activo = TRUE) AS dispositivos_registrados,
    (SELECT COUNT(*) FROM colab_ips_confiables ip WHERE ip.usuario_id = u.id AND ip.es_activa = TRUE) AS ips_confiables,
    (SELECT COUNT(*) FROM colab_horarios_acceso h WHERE h.usuario_id = u.id AND h.es_activo = TRUE) AS horarios_configurados,
    CASE
        WHEN u.contrasena_expira_en IS NOT NULL AND u.contrasena_expira_en < NOW() THEN 'expirada'
        WHEN u.contrasena_expira_en IS NOT NULL AND u.contrasena_expira_en < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'proxima_a_expirar'
        ELSE 'vigente'
    END AS estado_contrasena
FROM colab_usuarios u
WHERE u.es_activo = TRUE;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Registrar intento de login de colaborador
CREATE PROCEDURE sp_colab_registrar_intento_login(
    IN p_correo VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_huella_dispositivo VARCHAR(255),
    IN p_exitoso BOOLEAN,
    IN p_motivo_fallo VARCHAR(50)
)
BEGIN
    DECLARE v_usuario_id INT UNSIGNED;

    SELECT id INTO v_usuario_id FROM colab_usuarios WHERE correo = p_correo LIMIT 1;

    INSERT INTO colab_intentos_login (
        correo, usuario_id, ip_address, user_agent,
        huella_dispositivo, exitoso, motivo_fallo
    ) VALUES (
        p_correo, v_usuario_id, p_ip_address, p_user_agent,
        p_huella_dispositivo, p_exitoso, p_motivo_fallo
    );

    IF p_exitoso AND v_usuario_id IS NOT NULL THEN
        UPDATE colab_usuarios SET ultimo_acceso = NOW() WHERE id = v_usuario_id;

        -- Registrar en bitácora de seguridad
        INSERT INTO colab_bitacora_seguridad (usuario_id, tipo_evento, descripcion, ip_address, user_agent, severidad)
        VALUES (v_usuario_id, 'login_exitoso', 'Inicio de sesión exitoso', p_ip_address, p_user_agent, 'info');
    ELSEIF NOT p_exitoso THEN
        INSERT INTO colab_bitacora_seguridad (usuario_id, tipo_evento, descripcion, ip_address, user_agent, correo_intento, severidad)
        VALUES (v_usuario_id, 'login_fallido', CONCAT('Motivo: ', COALESCE(p_motivo_fallo, 'desconocido')), p_ip_address, p_user_agent, p_correo, 'advertencia');
    END IF;
END //

-- Verificar si un colaborador está bloqueado
CREATE PROCEDURE sp_colab_verificar_bloqueo(
    IN p_correo VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    OUT p_bloqueado BOOLEAN,
    OUT p_motivo VARCHAR(200),
    OUT p_nivel INT,
    OUT p_expira_en DATETIME
)
BEGIN
    DECLARE v_usuario_id INT UNSIGNED;
    DECLARE v_intentos_recientes INT DEFAULT 0;
    DECLARE v_ventana_minutos INT DEFAULT 15;
    DECLARE v_intentos_nivel1 INT DEFAULT 5;
    DECLARE v_intentos_nivel2 INT DEFAULT 10;
    DECLARE v_intentos_nivel3 INT DEFAULT 20;

    SET p_bloqueado = FALSE;
    SET p_motivo = NULL;
    SET p_nivel = 0;
    SET p_expira_en = NULL;

    SELECT id INTO v_usuario_id FROM colab_usuarios WHERE correo = p_correo LIMIT 1;

    -- Obtener configuración de bloqueo
    SELECT CAST(valor AS UNSIGNED) INTO v_ventana_minutos FROM colab_configuracion WHERE clave = 'intentos_ventana_minutos';
    SELECT CAST(valor AS UNSIGNED) INTO v_intentos_nivel1 FROM colab_configuracion WHERE clave = 'intentos_nivel1';
    SELECT CAST(valor AS UNSIGNED) INTO v_intentos_nivel2 FROM colab_configuracion WHERE clave = 'intentos_nivel2';
    SELECT CAST(valor AS UNSIGNED) INTO v_intentos_nivel3 FROM colab_configuracion WHERE clave = 'intentos_nivel3';

    -- Verificar bloqueo existente por correo
    SELECT nivel_bloqueo, expira_en INTO p_nivel, p_expira_en
    FROM colab_bloqueos
    WHERE tipo_bloqueo = 'correo'
        AND valor_bloqueado = p_correo
        AND desbloqueado_en IS NULL
        AND (es_permanente = TRUE OR expira_en > NOW())
    ORDER BY nivel_bloqueo DESC
    LIMIT 1;

    IF p_nivel > 0 THEN
        SET p_bloqueado = TRUE;
        SET p_motivo = CONCAT('Cuenta bloqueada (nivel ', p_nivel, ')');

        -- Incrementar contador de intentos durante bloqueo
        UPDATE colab_bloqueos
        SET intentos_durante_bloqueo = intentos_durante_bloqueo + 1
        WHERE tipo_bloqueo = 'correo'
            AND valor_bloqueado = p_correo
            AND desbloqueado_en IS NULL
            AND (es_permanente = TRUE OR expira_en > NOW());
    ELSE
        -- Verificar bloqueo por IP
        IF EXISTS (
            SELECT 1 FROM colab_bloqueos
            WHERE tipo_bloqueo = 'ip'
                AND valor_bloqueado = p_ip_address
                AND desbloqueado_en IS NULL
                AND (es_permanente = TRUE OR expira_en > NOW())
        ) THEN
            SET p_bloqueado = TRUE;
            SET p_motivo = 'Dirección IP bloqueada';
            SET p_nivel = 1;
        END IF;
    END IF;

    -- Si no hay bloqueo, verificar intentos fallidos recientes para auto-bloqueo
    IF NOT p_bloqueado AND v_usuario_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_intentos_recientes
        FROM colab_intentos_login
        WHERE correo = p_correo
            AND exitoso = FALSE
            AND creado_en >= DATE_SUB(NOW(), INTERVAL v_ventana_minutos MINUTE);

        IF v_intentos_recientes >= v_intentos_nivel3 THEN
            SET p_bloqueado = TRUE;
            SET p_motivo = 'Demasiados intentos fallidos - bloqueo nivel 3 (24 horas)';
            SET p_nivel = 3;
        ELSEIF v_intentos_recientes >= v_intentos_nivel2 THEN
            SET p_bloqueado = TRUE;
            SET p_motivo = 'Demasiados intentos fallidos - bloqueo nivel 2 (1 hora)';
            SET p_nivel = 2;
        ELSEIF v_intentos_recientes >= v_intentos_nivel1 THEN
            SET p_bloqueado = TRUE;
            SET p_motivo = 'Demasiados intentos fallidos - bloqueo nivel 1 (15 minutos)';
            SET p_nivel = 1;
        END IF;
    END IF;
END //

-- Bloquear cuenta de colaborador manualmente o por sistema
CREATE PROCEDURE sp_colab_bloquear_cuenta(
    IN p_tipo_bloqueo VARCHAR(20),
    IN p_valor VARCHAR(255),
    IN p_motivo VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_minutos_bloqueo INT,
    IN p_es_permanente BOOLEAN,
    IN p_nivel INT
)
BEGIN
    DECLARE v_usuario_id INT UNSIGNED;
    DECLARE v_expira_en DATETIME;

    IF p_tipo_bloqueo = 'correo' THEN
        SELECT id INTO v_usuario_id FROM colab_usuarios WHERE correo = p_valor LIMIT 1;
    ELSEIF p_tipo_bloqueo = 'usuario' THEN
        SET v_usuario_id = CAST(p_valor AS UNSIGNED);
    END IF;

    IF p_es_permanente THEN
        SET v_expira_en = NULL;
    ELSE
        SET v_expira_en = DATE_ADD(NOW(), INTERVAL p_minutos_bloqueo MINUTE);
    END IF;

    INSERT INTO colab_bloqueos (
        tipo_bloqueo, valor_bloqueado, usuario_id,
        motivo, descripcion,
        expira_en, es_permanente, nivel_bloqueo
    ) VALUES (
        p_tipo_bloqueo, p_valor, v_usuario_id,
        p_motivo, p_descripcion,
        v_expira_en, p_es_permanente, p_nivel
    );

    -- Registrar en bitácora
    IF v_usuario_id IS NOT NULL THEN
        INSERT INTO colab_bitacora_seguridad (
            usuario_id, tipo_evento, descripcion, severidad
        ) VALUES (
            v_usuario_id, 'bloqueo_cuenta',
            CONCAT('Bloqueo nivel ', p_nivel, ': ', COALESCE(p_descripcion, p_motivo)),
            IF(p_nivel >= 3, 'critico', 'advertencia')
        );
    END IF;

    SELECT LAST_INSERT_ID() AS bloqueo_id, 'Bloqueo aplicado correctamente' AS mensaje;
END //

-- Desbloquear cuenta de colaborador
CREATE PROCEDURE sp_colab_desbloquear_cuenta(
    IN p_bloqueo_id INT UNSIGNED,
    IN p_desbloqueado_por INT UNSIGNED,
    IN p_motivo_desbloqueo TEXT
)
BEGIN
    DECLARE v_usuario_id INT UNSIGNED;

    SELECT usuario_id INTO v_usuario_id
    FROM colab_bloqueos WHERE id = p_bloqueo_id AND desbloqueado_en IS NULL;

    IF v_usuario_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bloqueo no encontrado o ya fue desbloqueado';
    END IF;

    UPDATE colab_bloqueos
    SET desbloqueado_en = NOW(),
        desbloqueado_por = p_desbloqueado_por,
        motivo_desbloqueo = p_motivo_desbloqueo
    WHERE id = p_bloqueo_id;

    -- Registrar en bitácora
    INSERT INTO colab_bitacora_seguridad (
        usuario_id, tipo_evento, descripcion, severidad
    ) VALUES (
        v_usuario_id, 'desbloqueo_cuenta',
        CONCAT('Desbloqueado por admin #', p_desbloqueado_por, ': ', COALESCE(p_motivo_desbloqueo, 'Sin motivo especificado')),
        'info'
    );

    SELECT 'Cuenta desbloqueada correctamente' AS mensaje;
END //

-- Generar alerta de seguridad
CREATE PROCEDURE sp_colab_generar_alerta_seguridad(
    IN p_tipo VARCHAR(50),
    IN p_severidad VARCHAR(20),
    IN p_titulo VARCHAR(300),
    IN p_mensaje TEXT,
    IN p_usuario_destino_id INT UNSIGNED,
    IN p_usuario_origen_id INT UNSIGNED,
    IN p_almacen_id INT UNSIGNED,
    IN p_referencia_tipo VARCHAR(50),
    IN p_referencia_id BIGINT UNSIGNED,
    IN p_datos_contexto JSON
)
BEGIN
    INSERT INTO colab_alertas (
        tipo, severidad, titulo, mensaje,
        usuario_destino_id, usuario_origen_id, almacen_id,
        referencia_tipo, referencia_id, datos_contexto,
        expira_en
    ) VALUES (
        p_tipo, p_severidad, p_titulo, p_mensaje,
        p_usuario_destino_id, p_usuario_origen_id, p_almacen_id,
        p_referencia_tipo, p_referencia_id, p_datos_contexto,
        DATE_ADD(NOW(), INTERVAL 30 DAY)
    );

    SELECT LAST_INSERT_ID() AS alerta_id;
END //

-- Registrar incidencia operativa
CREATE PROCEDURE sp_colab_registrar_incidencia(
    IN p_tipo VARCHAR(50),
    IN p_prioridad VARCHAR(20),
    IN p_titulo VARCHAR(300),
    IN p_descripcion TEXT,
    IN p_ubicacion VARCHAR(200),
    IN p_reportado_por INT UNSIGNED,
    IN p_colaborador_involucrado_id INT UNSIGNED,
    IN p_almacen_id INT UNSIGNED,
    IN p_empresa_id INT,
    IN p_foto_url VARCHAR(500)
)
BEGIN
    DECLARE v_codigo VARCHAR(30);
    DECLARE v_turno_id INT UNSIGNED;

    -- Generar código único
    SET v_codigo = CONCAT('INC-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9999), 4, '0'));

    -- Obtener turno activo del reportante
    SELECT id INTO v_turno_id
    FROM colab_turnos
    WHERE usuario_id = p_reportado_por
        AND fecha = CURRENT_DATE
        AND estado = 'en_curso'
    LIMIT 1;

    INSERT INTO colab_incidencias (
        codigo, tipo, prioridad, estado,
        titulo, descripcion, ubicacion,
        reportado_por, colaborador_involucrado_id,
        almacen_id, empresa_id, turno_id,
        foto_evidencia_url
    ) VALUES (
        v_codigo, p_tipo, p_prioridad, 'abierta',
        p_titulo, p_descripcion, p_ubicacion,
        p_reportado_por, p_colaborador_involucrado_id,
        p_almacen_id, p_empresa_id, v_turno_id,
        p_foto_url
    );

    -- Registrar primer seguimiento
    INSERT INTO colab_incidencias_seguimiento (
        incidencia_id, accion, descripcion, estado_nuevo, realizado_por
    ) VALUES (
        LAST_INSERT_ID(), 'comentario', 'Incidencia creada', 'abierta', p_reportado_por
    );

    -- Si es crítica, generar alerta automática al supervisor del almacén
    IF p_prioridad IN ('alta', 'critica') THEN
        INSERT INTO colab_alertas (
            tipo, severidad, titulo, mensaje,
            almacen_id,
            referencia_tipo, referencia_id
        )
        SELECT
            'incidencia_critica',
            IF(p_prioridad = 'critica', 'emergencia', 'critico'),
            CONCAT('Incidencia ', p_prioridad, ': ', p_titulo),
            p_descripcion,
            p_almacen_id,
            'colab_incidencias', LAST_INSERT_ID()
        FROM DUAL;
    END IF;

    SELECT v_codigo AS codigo_incidencia, 'Incidencia registrada correctamente' AS mensaje;
END //

-- Cerrar/resolver incidencia
CREATE PROCEDURE sp_colab_cerrar_incidencia(
    IN p_incidencia_id INT UNSIGNED,
    IN p_resolucion TEXT,
    IN p_accion_correctiva TEXT,
    IN p_resuelto_por INT UNSIGNED
)
BEGIN
    DECLARE v_estado_actual VARCHAR(50);

    SELECT estado INTO v_estado_actual
    FROM colab_incidencias WHERE id = p_incidencia_id;

    IF v_estado_actual IN ('resuelta', 'cerrada') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La incidencia ya fue resuelta o cerrada';
    END IF;

    UPDATE colab_incidencias
    SET estado = 'resuelta',
        resolucion = p_resolucion,
        accion_correctiva = p_accion_correctiva,
        fecha_resolucion = NOW(),
        resuelto_por = p_resuelto_por
    WHERE id = p_incidencia_id;

    INSERT INTO colab_incidencias_seguimiento (
        incidencia_id, accion, descripcion,
        estado_anterior, estado_nuevo, realizado_por
    ) VALUES (
        p_incidencia_id, 'resolucion', COALESCE(p_resolucion, 'Incidencia resuelta'),
        v_estado_actual, 'resuelta', p_resuelto_por
    );

    SELECT 'Incidencia resuelta correctamente' AS mensaje;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Auto-bloqueo por intentos fallidos consecutivos
CREATE TRIGGER trg_colab_auto_bloqueo_login
AFTER INSERT ON colab_intentos_login
FOR EACH ROW
BEGIN
    DECLARE v_intentos_recientes INT DEFAULT 0;
    DECLARE v_ventana INT DEFAULT 15;
    DECLARE v_nivel1 INT DEFAULT 5;
    DECLARE v_nivel2 INT DEFAULT 10;
    DECLARE v_nivel3 INT DEFAULT 20;
    DECLARE v_bloqueo1 INT DEFAULT 15;
    DECLARE v_bloqueo2 INT DEFAULT 60;
    DECLARE v_bloqueo3 INT DEFAULT 1440;
    DECLARE v_bloqueado BOOLEAN DEFAULT FALSE;

    IF NOT NEW.exitoso AND NEW.correo IS NOT NULL THEN
        -- Obtener configuración
        SELECT CAST(valor AS UNSIGNED) INTO v_ventana FROM colab_configuracion WHERE clave = 'intentos_ventana_minutos';
        SELECT CAST(valor AS UNSIGNED) INTO v_nivel1 FROM colab_configuracion WHERE clave = 'intentos_nivel1';
        SELECT CAST(valor AS UNSIGNED) INTO v_nivel2 FROM colab_configuracion WHERE clave = 'intentos_nivel2';
        SELECT CAST(valor AS UNSIGNED) INTO v_nivel3 FROM colab_configuracion WHERE clave = 'intentos_nivel3';
        SELECT CAST(valor AS UNSIGNED) INTO v_bloqueo1 FROM colab_configuracion WHERE clave = 'bloqueo_nivel1_minutos';
        SELECT CAST(valor AS UNSIGNED) INTO v_bloqueo2 FROM colab_configuracion WHERE clave = 'bloqueo_nivel2_minutos';
        SELECT CAST(valor AS UNSIGNED) INTO v_bloqueo3 FROM colab_configuracion WHERE clave = 'bloqueo_nivel3_minutos';

        -- Verificar si ya hay un bloqueo activo
        SELECT EXISTS(
            SELECT 1 FROM colab_bloqueos
            WHERE tipo_bloqueo = 'correo'
                AND valor_bloqueado = NEW.correo
                AND desbloqueado_en IS NULL
                AND (es_permanente = TRUE OR expira_en > NOW())
        ) INTO v_bloqueado;

        IF NOT v_bloqueado THEN
            -- Contar intentos fallidos recientes
            SELECT COUNT(*) INTO v_intentos_recientes
            FROM colab_intentos_login
            WHERE correo = NEW.correo
                AND exitoso = FALSE
                AND creado_en >= DATE_SUB(NOW(), INTERVAL v_ventana MINUTE);

            -- Aplicar bloqueo según nivel
            IF v_intentos_recientes >= v_nivel3 THEN
                INSERT INTO colab_bloqueos (
                    tipo_bloqueo, valor_bloqueado, usuario_id,
                    motivo, descripcion,
                    expira_en, nivel_bloqueo
                ) VALUES (
                    'correo', NEW.correo, NEW.usuario_id,
                    'intentos_fallidos',
                    CONCAT(v_intentos_recientes, ' intentos fallidos en ', v_ventana, ' minutos'),
                    DATE_ADD(NOW(), INTERVAL v_bloqueo3 MINUTE), 3
                );

                INSERT INTO colab_bitacora_seguridad (
                    usuario_id, tipo_evento, descripcion, ip_address, user_agent, correo_intento, severidad
                ) VALUES (
                    NEW.usuario_id, 'bloqueo_cuenta',
                    CONCAT('Bloqueo automático nivel 3: ', v_intentos_recientes, ' intentos fallidos'),
                    NEW.ip_address, NEW.user_agent, NEW.correo, 'critico'
                );

            ELSEIF v_intentos_recientes >= v_nivel2 THEN
                INSERT INTO colab_bloqueos (
                    tipo_bloqueo, valor_bloqueado, usuario_id,
                    motivo, descripcion,
                    expira_en, nivel_bloqueo
                ) VALUES (
                    'correo', NEW.correo, NEW.usuario_id,
                    'intentos_fallidos',
                    CONCAT(v_intentos_recientes, ' intentos fallidos en ', v_ventana, ' minutos'),
                    DATE_ADD(NOW(), INTERVAL v_bloqueo2 MINUTE), 2
                );

                INSERT INTO colab_bitacora_seguridad (
                    usuario_id, tipo_evento, descripcion, ip_address, user_agent, correo_intento, severidad
                ) VALUES (
                    NEW.usuario_id, 'bloqueo_cuenta',
                    CONCAT('Bloqueo automático nivel 2: ', v_intentos_recientes, ' intentos fallidos'),
                    NEW.ip_address, NEW.user_agent, NEW.correo, 'advertencia'
                );

            ELSEIF v_intentos_recientes >= v_nivel1 THEN
                INSERT INTO colab_bloqueos (
                    tipo_bloqueo, valor_bloqueado, usuario_id,
                    motivo, descripcion,
                    expira_en, nivel_bloqueo
                ) VALUES (
                    'correo', NEW.correo, NEW.usuario_id,
                    'intentos_fallidos',
                    CONCAT(v_intentos_recientes, ' intentos fallidos en ', v_ventana, ' minutos'),
                    DATE_ADD(NOW(), INTERVAL v_bloqueo1 MINUTE), 1
                );

                INSERT INTO colab_bitacora_seguridad (
                    usuario_id, tipo_evento, descripcion, ip_address, user_agent, correo_intento, severidad
                ) VALUES (
                    NEW.usuario_id, 'bloqueo_cuenta',
                    CONCAT('Bloqueo automático nivel 1: ', v_intentos_recientes, ' intentos fallidos'),
                    NEW.ip_address, NEW.user_agent, NEW.correo, 'advertencia'
                );
            END IF;
        END IF;
    END IF;
END //

-- Auditoría de cambios de estado en colaboradores
CREATE TRIGGER trg_colab_auditoria_cambio_estado
AFTER UPDATE ON colab_usuarios
FOR EACH ROW
BEGIN
    -- Registrar cambio de estado activo/inactivo
    IF OLD.es_activo <> NEW.es_activo THEN
        INSERT INTO colab_bitacora_seguridad (
            usuario_id, tipo_evento, descripcion, severidad,
            datos_extra
        ) VALUES (
            NEW.id,
            IF(NEW.es_activo, 'desbloqueo_cuenta', 'bloqueo_cuenta'),
            IF(NEW.es_activo, 'Cuenta reactivada', CONCAT('Cuenta desactivada: ', COALESCE(NEW.motivo_inactivacion, 'Sin motivo'))),
            'advertencia',
            JSON_OBJECT(
                'estado_anterior', OLD.es_activo,
                'estado_nuevo', NEW.es_activo,
                'motivo', NEW.motivo_inactivacion
            )
        );
    END IF;

    -- Registrar cambio de contraseña
    IF OLD.contrasena_hash <> NEW.contrasena_hash THEN
        INSERT INTO colab_usuarios_historial_contrasenas (usuario_id, contrasena_hash)
        VALUES (OLD.id, OLD.contrasena_hash);

        INSERT INTO colab_bitacora_seguridad (
            usuario_id, tipo_evento, descripcion, severidad
        ) VALUES (
            NEW.id, 'cambio_contrasena', 'Contraseña actualizada', 'info'
        );

        -- Invalidar todas las sesiones activas al cambiar contraseña
        UPDATE colab_sesiones
        SET es_activa = FALSE,
            cerrada_en = NOW(),
            motivo_cierre = 'cambio_contrasena'
        WHERE usuario_id = NEW.id AND es_activa = TRUE;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Limpiar intentos de login antiguos (más de 90 días)
CREATE EVENT IF NOT EXISTS evento_colab_limpiar_intentos_login
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 4 HOUR
DO
    DELETE FROM colab_intentos_login WHERE creado_en < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Alertar sobre documentos próximos a vencer (diario a las 7 AM)
CREATE EVENT IF NOT EXISTS evento_colab_alertar_documentos_vencidos
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 7 HOUR
DO
    INSERT INTO colab_alertas (
        tipo, severidad, titulo, mensaje,
        usuario_destino_id, referencia_tipo, referencia_id
    )
    SELECT
        'documento_vencido',
        IF(d.fecha_vencimiento < CURRENT_DATE, 'critico', 'advertencia'),
        CONCAT('Documento ', IF(d.fecha_vencimiento < CURRENT_DATE, 'VENCIDO', 'próximo a vencer'), ': ', d.nombre),
        CONCAT('El documento "', d.nombre, '" de tipo ', d.tipo_documento,
               IF(d.fecha_vencimiento < CURRENT_DATE,
                  CONCAT(' venció el ', DATE_FORMAT(d.fecha_vencimiento, '%d/%m/%Y')),
                  CONCAT(' vence el ', DATE_FORMAT(d.fecha_vencimiento, '%d/%m/%Y'))
               )),
        d.usuario_id,
        'colab_documentos', d.id
    FROM colab_documentos d
    JOIN colab_usuarios u ON d.usuario_id = u.id
    WHERE d.es_vigente = TRUE
        AND u.es_activo = TRUE
        AND d.fecha_vencimiento IS NOT NULL
        AND d.fecha_vencimiento <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
        AND NOT EXISTS (
            SELECT 1 FROM colab_alertas a
            WHERE a.referencia_tipo = 'colab_documentos'
                AND a.referencia_id = d.id
                AND a.tipo = 'documento_vencido'
                AND a.creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        );

-- Alertar sobre certificaciones de capacitación próximas a vencer
CREATE EVENT IF NOT EXISTS evento_colab_alertar_capacitaciones_vencidas
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 7 HOUR + INTERVAL 30 MINUTE
DO
    INSERT INTO colab_alertas (
        tipo, severidad, titulo, mensaje,
        usuario_destino_id, referencia_tipo, referencia_id
    )
    SELECT
        'capacitacion_vencida',
        IF(cp.certificado_vence_en < CURRENT_DATE, 'critico', 'advertencia'),
        CONCAT('Certificación ', IF(cp.certificado_vence_en < CURRENT_DATE, 'VENCIDA', 'próxima a vencer'), ': ', c.titulo),
        CONCAT('La certificación de "', c.titulo, '"',
               IF(cp.certificado_vence_en < CURRENT_DATE,
                  CONCAT(' venció el ', DATE_FORMAT(cp.certificado_vence_en, '%d/%m/%Y')),
                  CONCAT(' vence el ', DATE_FORMAT(cp.certificado_vence_en, '%d/%m/%Y'))
               )),
        cp.usuario_id,
        'colab_capacitaciones_participantes', cp.id
    FROM colab_capacitaciones_participantes cp
    JOIN colab_capacitaciones c ON cp.capacitacion_id = c.id
    JOIN colab_usuarios u ON cp.usuario_id = u.id
    WHERE cp.certificado_emitido = TRUE
        AND cp.certificado_vence_en IS NOT NULL
        AND u.es_activo = TRUE
        AND cp.certificado_vence_en <= DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY)
        AND NOT EXISTS (
            SELECT 1 FROM colab_alertas a
            WHERE a.referencia_tipo = 'colab_capacitaciones_participantes'
                AND a.referencia_id = cp.id
                AND a.tipo = 'capacitacion_vencida'
                AND a.creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        );

-- Alertar sobre evaluaciones pendientes
CREATE EVENT IF NOT EXISTS evento_colab_alertar_evaluaciones_pendientes
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 8 HOUR
DO
    INSERT INTO colab_alertas (
        tipo, severidad, titulo, mensaje,
        usuario_destino_id, referencia_tipo, referencia_id
    )
    SELECT
        'evaluacion_pendiente',
        'advertencia',
        CONCAT('Evaluación pendiente: ', e.periodo_tipo, ' (', DATE_FORMAT(e.periodo_inicio, '%d/%m/%Y'), ' - ', DATE_FORMAT(e.periodo_fin, '%d/%m/%Y'), ')'),
        CONCAT('Tienes una evaluación de desempeño ', e.periodo_tipo, ' pendiente que requiere tu atención'),
        e.usuario_id,
        'colab_evaluaciones', e.id
    FROM colab_evaluaciones e
    JOIN colab_usuarios u ON e.usuario_id = u.id
    WHERE e.estado IN ('borrador', 'en_revision')
        AND u.es_activo = TRUE
        AND DATEDIFF(NOW(), e.periodo_fin) >= 7
        AND NOT EXISTS (
            SELECT 1 FROM colab_alertas a
            WHERE a.referencia_tipo = 'colab_evaluaciones'
                AND a.referencia_id = e.id
                AND a.tipo = 'evaluacion_pendiente'
                AND a.creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        );

-- ============================================================================
-- FIN DE FASE 14
-- ============================================================================

SELECT '========================================' AS '';
SELECT 'FASE 14 INSTALADA CORRECTAMENTE' AS estado;
SELECT 'Colaboradores - Seguridad Avanzada y RRHH' AS modulo;
SELECT NOW() AS fecha_instalacion;
SELECT '========================================' AS '';
