-- ============================================================================
-- TIENDA VIRTUAL - FASE 3
-- ============================================================================
-- Módulo: Seguridad Avanzada, Notificaciones y Actividad de Usuario
-- Fecha: 24/01/2026
-- Versión: 1.0.0
-- Motor: MySQL 8.0+
-- ============================================================================
-- Este script complementa las Fases 1 y 2
-- Debe ejecutarse DESPUÉS de los scripts anteriores
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- ESQUEMA: SEGURIDAD AVANZADA
-- Descripción: Políticas de contraseña, códigos de respaldo, IPs confiables
-- ============================================================================

-- Tabla de políticas de contraseña por empresa
CREATE TABLE seguridad_politicas_contrasena (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT UNSIGNED,
    
    -- Requisitos de contraseña
    longitud_minima TINYINT UNSIGNED NOT NULL DEFAULT 12,
    longitud_maxima TINYINT UNSIGNED NOT NULL DEFAULT 128,
    requiere_mayuscula BOOLEAN NOT NULL DEFAULT TRUE,
    requiere_minuscula BOOLEAN NOT NULL DEFAULT TRUE,
    requiere_numero BOOLEAN NOT NULL DEFAULT TRUE,
    requiere_especial BOOLEAN NOT NULL DEFAULT TRUE,
    caracteres_especiales_permitidos VARCHAR(100) NOT NULL DEFAULT '!@#$%^&*()_+-=[]{}|;:,.<>?',
    
    -- Historial y expiración
    historial_contrasenas TINYINT UNSIGNED NOT NULL DEFAULT 5,
    dias_expiracion INT UNSIGNED NOT NULL DEFAULT 90,
    dias_aviso_expiracion TINYINT UNSIGNED NOT NULL DEFAULT 7,
    
    -- Bloqueo
    intentos_maximos TINYINT UNSIGNED NOT NULL DEFAULT 5,
    minutos_bloqueo INT UNSIGNED NOT NULL DEFAULT 15,
    bloqueo_progresivo BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Palabras prohibidas
    palabras_prohibidas JSON,
    
    -- Auditoría
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    actualizado_por INT UNSIGNED,
    
    INDEX idx_empresa (empresa_id),
    INDEX idx_activa (es_activa),
    CONSTRAINT fk_politica_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de códigos de respaldo para 2FA
CREATE TABLE seguridad_codigos_respaldo (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    usado_en DATETIME,
    ip_uso VARCHAR(45),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_usado (usado_en),
    CONSTRAINT fk_codigo_respaldo_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de IPs de confianza
CREATE TABLE seguridad_ips_confianza (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Ámbito de aplicación
    tipo ENUM('global', 'empresa', 'usuario') NOT NULL DEFAULT 'usuario',
    empresa_id INT UNSIGNED,
    usuario_id INT UNSIGNED,
    
    -- Configuración de IP
    ip_address VARCHAR(45) NOT NULL,
    ip_rango_inicio VARCHAR(45),
    ip_rango_fin VARCHAR(45),
    mascara_cidr TINYINT UNSIGNED,
    es_rango BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Descripción
    nombre VARCHAR(100),
    descripcion TEXT,
    
    -- Control
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT UNSIGNED,
    
    INDEX idx_tipo (tipo),
    INDEX idx_empresa (empresa_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_ip (ip_address),
    INDEX idx_activa (es_activa),
    CONSTRAINT fk_ip_confianza_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ip_confianza_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de restricciones de horario de acceso
CREATE TABLE seguridad_horarios_acceso (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Ámbito
    tipo ENUM('empresa', 'rol', 'usuario') NOT NULL DEFAULT 'empresa',
    empresa_id INT UNSIGNED,
    rol_id INT UNSIGNED,
    usuario_id INT UNSIGNED,
    
    -- Horario permitido
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    -- Control
    es_activo BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tipo (tipo),
    INDEX idx_empresa (empresa_id),
    INDEX idx_rol (rol_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_dia (dia_semana),
    CONSTRAINT fk_horario_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_horario_rol 
        FOREIGN KEY (rol_id) REFERENCES admin_roles(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_horario_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: NOTIFICACIONES
-- Descripción: Sistema de notificaciones internas y externas
-- ============================================================================

-- Tabla de plantillas de notificación
CREATE TABLE notificaciones_plantillas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Tipo y canal
    tipo ENUM('sistema', 'seguridad', 'usuario', 'pedido', 'producto', 'promocion') NOT NULL,
    canal ENUM('interno', 'correo', 'sms', 'push', 'todos') NOT NULL DEFAULT 'interno',
    
    -- Contenido
    asunto VARCHAR(255),
    contenido_texto TEXT NOT NULL,
    contenido_html TEXT,
    
    -- Variables disponibles (JSON con nombre y descripción)
    variables_disponibles JSON,
    
    -- Control
    es_activa BOOLEAN NOT NULL DEFAULT TRUE,
    es_editable BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_tipo (tipo),
    INDEX idx_canal (canal),
    INDEX idx_activa (es_activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de notificaciones enviadas
CREATE TABLE notificaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Destinatario
    usuario_id INT UNSIGNED NOT NULL,
    empresa_id INT UNSIGNED,
    
    -- Plantilla y contenido
    plantilla_id INT UNSIGNED,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    mensaje_html TEXT,
    
    -- Tipo y prioridad
    tipo ENUM('info', 'exito', 'advertencia', 'error', 'seguridad') NOT NULL DEFAULT 'info',
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') NOT NULL DEFAULT 'normal',
    
    -- Canal de entrega
    canal ENUM('interno', 'correo', 'sms', 'push') NOT NULL DEFAULT 'interno',
    
    -- Estado de entrega
    estado ENUM('pendiente', 'enviado', 'entregado', 'fallido', 'leido') NOT NULL DEFAULT 'pendiente',
    intentos_envio TINYINT UNSIGNED NOT NULL DEFAULT 0,
    ultimo_intento DATETIME,
    error_envio TEXT,
    
    -- Acciones
    url_accion VARCHAR(500),
    texto_accion VARCHAR(100),
    
    -- Datos adicionales
    datos_extra JSON,
    
    -- Fechas de estado
    enviado_en DATETIME,
    leido_en DATETIME,
    archivado_en DATETIME,
    
    -- Expiración
    expira_en DATETIME,
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_creado (creado_en),
    INDEX idx_leido (leido_en),
    CONSTRAINT fk_notificacion_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notificacion_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_notificacion_plantilla 
        FOREIGN KEY (plantilla_id) REFERENCES notificaciones_plantillas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de preferencias de notificación por usuario
CREATE TABLE notificaciones_preferencias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    
    -- Canales habilitados
    recibir_interno BOOLEAN NOT NULL DEFAULT TRUE,
    recibir_correo BOOLEAN NOT NULL DEFAULT TRUE,
    recibir_sms BOOLEAN NOT NULL DEFAULT FALSE,
    recibir_push BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Tipos habilitados
    tipo_sistema BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_seguridad BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_usuario BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_pedido BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_producto BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_promocion BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Horario de no molestar
    no_molestar_activo BOOLEAN NOT NULL DEFAULT FALSE,
    no_molestar_inicio TIME,
    no_molestar_fin TIME,
    
    -- Resumen diario
    resumen_diario BOOLEAN NOT NULL DEFAULT FALSE,
    hora_resumen TIME DEFAULT '08:00:00',
    
    -- Auditoría
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_usuario (usuario_id),
    CONSTRAINT fk_preferencias_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ESQUEMA: ACTIVIDAD DE USUARIO
-- Descripción: Registro detallado de actividad y últimas acciones
-- ============================================================================

-- Tabla de actividad de usuario (registro detallado)
CREATE TABLE actividad_usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    sesion_id INT UNSIGNED,
    empresa_id INT UNSIGNED,
    
    -- Acción realizada
    tipo_accion ENUM(
        'login', 'logout', 
        'ver', 'crear', 'editar', 'eliminar', 
        'exportar', 'importar',
        'aprobar', 'rechazar',
        'buscar', 'filtrar',
        'descargar', 'subir',
        'configurar'
    ) NOT NULL,
    
    -- Contexto
    modulo VARCHAR(100) NOT NULL,
    entidad VARCHAR(100),
    entidad_id BIGINT UNSIGNED,
    descripcion VARCHAR(500),
    
    -- Datos de la acción
    datos_accion JSON,
    
    -- Información de conexión
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Resultado
    exitoso BOOLEAN NOT NULL DEFAULT TRUE,
    mensaje_error TEXT,
    
    -- Tiempo de ejecución (milisegundos)
    tiempo_ejecucion INT UNSIGNED,
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_sesion (sesion_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo_accion),
    INDEX idx_modulo (modulo),
    INDEX idx_entidad (entidad, entidad_id),
    INDEX idx_creado (creado_en),
    INDEX idx_exitoso (exitoso),
    CONSTRAINT fk_actividad_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_actividad_sesion 
        FOREIGN KEY (sesion_id) REFERENCES seguridad_sesiones(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_actividad_empresa 
        FOREIGN KEY (empresa_id) REFERENCES admin_empresas(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de elementos visitados recientemente
CREATE TABLE actividad_recientes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    
    -- Elemento visitado
    modulo VARCHAR(100) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id BIGINT UNSIGNED NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255),
    icono VARCHAR(100),
    url VARCHAR(500) NOT NULL,
    
    -- Datos adicionales para previsualización
    datos_preview JSON,
    
    -- Contador de visitas
    total_visitas INT UNSIGNED NOT NULL DEFAULT 1,
    ultima_visita DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_usuario_entidad (usuario_id, modulo, entidad, entidad_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_ultima_visita (ultima_visita),
    CONSTRAINT fk_recientes_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de favoritos/marcadores del usuario
CREATE TABLE actividad_favoritos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    
    -- Elemento marcado
    modulo VARCHAR(100) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id BIGINT UNSIGNED NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion VARCHAR(500),
    icono VARCHAR(100),
    url VARCHAR(500) NOT NULL,
    
    -- Organización
    carpeta VARCHAR(100),
    orden INT UNSIGNED NOT NULL DEFAULT 0,
    color VARCHAR(7),
    
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_usuario_favorito (usuario_id, modulo, entidad, entidad_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_carpeta (carpeta),
    INDEX idx_orden (orden),
    CONSTRAINT fk_favoritos_usuario 
        FOREIGN KEY (usuario_id) REFERENCES admin_usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MEJORAS A TABLAS EXISTENTES
-- ============================================================================

-- Agregar campo de política de contraseña a usuarios
ALTER TABLE admin_usuarios 
ADD COLUMN debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE AFTER contrasena_expira_en,
ADD COLUMN contrasena_nunca_expira BOOLEAN NOT NULL DEFAULT FALSE AFTER debe_cambiar_contrasena,
ADD COLUMN bloqueos_consecutivos TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER metodo_2fa;

-- Agregar configuración de seguridad a empresas
ALTER TABLE admin_empresas
ADD COLUMN politica_contrasena_id INT UNSIGNED AFTER plan_vence_en,
ADD COLUMN requiere_2fa_todos BOOLEAN NOT NULL DEFAULT FALSE AFTER politica_contrasena_id,
ADD COLUMN permite_acceso_externo BOOLEAN NOT NULL DEFAULT TRUE AFTER requiere_2fa_todos,
ADD COLUMN notificar_login_nuevo_dispositivo BOOLEAN NOT NULL DEFAULT TRUE AFTER permite_acceso_externo,
ADD INDEX idx_politica_contrasena (politica_contrasena_id),
ADD CONSTRAINT fk_empresa_politica_contrasena 
    FOREIGN KEY (politica_contrasena_id) REFERENCES seguridad_politicas_contrasena(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- PLANTILLAS DE NOTIFICACIÓN INICIALES
-- ============================================================================

INSERT INTO notificaciones_plantillas (codigo, nombre, tipo, canal, asunto, contenido_texto, contenido_html, variables_disponibles) VALUES
-- Seguridad
('BIENVENIDA_USUARIO', 'Bienvenida nuevo usuario', 'usuario', 'correo', 
 'Bienvenido a {{nombre_sistema}}',
 'Hola {{nombre}},\n\nTu cuenta ha sido creada exitosamente en {{nombre_sistema}}.\n\nUsuario: {{correo}}\n\nPor seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.\n\nSaludos,\nEl equipo de {{nombre_sistema}}',
 '<h2>Bienvenido {{nombre}}</h2><p>Tu cuenta ha sido creada exitosamente en <strong>{{nombre_sistema}}</strong>.</p><p><strong>Usuario:</strong> {{correo}}</p><p>Por seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.</p>',
 '["nombre", "correo", "nombre_sistema"]'),

('LOGIN_NUEVO_DISPOSITIVO', 'Inicio de sesión desde nuevo dispositivo', 'seguridad', 'correo',
 'Nuevo inicio de sesión detectado',
 'Hola {{nombre}},\n\nSe ha detectado un inicio de sesión desde un nuevo dispositivo:\n\nDispositivo: {{dispositivo}}\nNavegador: {{navegador}}\nUbicación: {{ubicacion}}\nFecha: {{fecha}}\n\nSi no fuiste tú, cambia tu contraseña inmediatamente.',
 '<h2>Nuevo inicio de sesión</h2><p>Hola {{nombre}},</p><p>Se ha detectado un inicio de sesión desde un nuevo dispositivo:</p><ul><li><strong>Dispositivo:</strong> {{dispositivo}}</li><li><strong>Navegador:</strong> {{navegador}}</li><li><strong>Ubicación:</strong> {{ubicacion}}</li><li><strong>Fecha:</strong> {{fecha}}</li></ul><p style="color: red;">Si no fuiste tú, cambia tu contraseña inmediatamente.</p>',
 '["nombre", "dispositivo", "navegador", "ubicacion", "fecha"]'),

('CONTRASENA_CAMBIADA', 'Contraseña modificada', 'seguridad', 'correo',
 'Tu contraseña ha sido cambiada',
 'Hola {{nombre}},\n\nTu contraseña ha sido cambiada exitosamente el {{fecha}}.\n\nSi no realizaste este cambio, contacta al administrador inmediatamente.',
 '<h2>Contraseña actualizada</h2><p>Hola {{nombre}},</p><p>Tu contraseña ha sido cambiada exitosamente el <strong>{{fecha}}</strong>.</p><p style="color: red;">Si no realizaste este cambio, contacta al administrador inmediatamente.</p>',
 '["nombre", "fecha"]'),

('CONTRASENA_POR_EXPIRAR', 'Contraseña próxima a expirar', 'seguridad', 'correo',
 'Tu contraseña expirará pronto',
 'Hola {{nombre}},\n\nTu contraseña expirará en {{dias}} días.\n\nTe recomendamos cambiarla antes de {{fecha_expiracion}} para evitar interrupciones en tu acceso.',
 '<h2>Contraseña por expirar</h2><p>Hola {{nombre}},</p><p>Tu contraseña expirará en <strong>{{dias}} días</strong>.</p><p>Te recomendamos cambiarla antes de <strong>{{fecha_expiracion}}</strong> para evitar interrupciones.</p>',
 '["nombre", "dias", "fecha_expiracion"]'),

('CUENTA_BLOQUEADA', 'Cuenta bloqueada', 'seguridad', 'correo',
 'Tu cuenta ha sido bloqueada temporalmente',
 'Hola {{nombre}},\n\nTu cuenta ha sido bloqueada debido a múltiples intentos de inicio de sesión fallidos.\n\nPodrás intentar nuevamente en {{minutos}} minutos.\n\nSi no fuiste tú, te recomendamos cambiar tu contraseña.',
 '<h2>Cuenta bloqueada</h2><p>Hola {{nombre}},</p><p>Tu cuenta ha sido bloqueada debido a múltiples intentos de inicio de sesión fallidos.</p><p>Podrás intentar nuevamente en <strong>{{minutos}} minutos</strong>.</p>',
 '["nombre", "minutos"]'),

('RECUPERACION_CONTRASENA', 'Recuperación de contraseña', 'seguridad', 'correo',
 'Solicitud de recuperación de contraseña',
 'Hola {{nombre}},\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nUsa el siguiente enlace (válido por {{minutos}} minutos):\n{{enlace}}\n\nSi no solicitaste este cambio, ignora este correo.',
 '<h2>Recuperación de contraseña</h2><p>Hola {{nombre}},</p><p>Hemos recibido una solicitud para restablecer tu contraseña.</p><p><a href="{{enlace}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a></p><p><small>Este enlace es válido por {{minutos}} minutos.</small></p>',
 '["nombre", "enlace", "minutos"]'),

-- Sistema
('MANTENIMIENTO_PROGRAMADO', 'Mantenimiento programado', 'sistema', 'todos',
 'Mantenimiento programado del sistema',
 'Se realizará mantenimiento del sistema el {{fecha}} de {{hora_inicio}} a {{hora_fin}}.\n\nDurante este período, el sistema podría no estar disponible.',
 '<h2>Mantenimiento programado</h2><p>Se realizará mantenimiento del sistema el <strong>{{fecha}}</strong> de <strong>{{hora_inicio}}</strong> a <strong>{{hora_fin}}</strong>.</p><p>Durante este período, el sistema podría no estar disponible.</p>',
 '["fecha", "hora_inicio", "hora_fin"]'),

('NOTIFICACION_INTERNA', 'Notificación interna genérica', 'sistema', 'interno',
 '{{titulo}}',
 '{{mensaje}}',
 '<p>{{mensaje}}</p>',
 '["titulo", "mensaje"]');

-- ============================================================================
-- POLÍTICA DE CONTRASEÑA POR DEFECTO
-- ============================================================================

INSERT INTO seguridad_politicas_contrasena (
    empresa_id, longitud_minima, longitud_maxima, 
    requiere_mayuscula, requiere_minuscula, requiere_numero, requiere_especial,
    historial_contrasenas, dias_expiracion, dias_aviso_expiracion,
    intentos_maximos, minutos_bloqueo, bloqueo_progresivo,
    palabras_prohibidas
) VALUES (
    NULL, 12, 128,
    TRUE, TRUE, TRUE, TRUE,
    5, 90, 7,
    5, 15, TRUE,
    '["password", "123456", "qwerty", "admin", "usuario", "contraseña"]'
);

-- ============================================================================
-- NUEVOS MÓDULOS
-- ============================================================================

INSERT INTO admin_modulos (codigo, nombre, descripcion, icono, ruta, orden, es_menu) VALUES
('notificaciones', 'Notificaciones', 'Centro de notificaciones', 'bi-bell', '/admin/notificaciones', 11, TRUE),
('actividad', 'Actividad', 'Registro de actividad', 'bi-activity', '/admin/actividad', 12, FALSE),
('seguridad_avanzada', 'Seguridad Avanzada', 'Configuración de seguridad', 'bi-shield-check', '/admin/seguridad', 13, TRUE);

-- Permisos para nuevos módulos
INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) 
SELECT 'notificaciones.ver', 'Ver notificaciones', id, 'ver' FROM admin_modulos WHERE codigo = 'notificaciones'
UNION ALL
SELECT 'notificaciones.crear', 'Crear notificaciones', id, 'crear' FROM admin_modulos WHERE codigo = 'notificaciones'
UNION ALL
SELECT 'notificaciones.editar', 'Editar plantillas de notificación', id, 'editar' FROM admin_modulos WHERE codigo = 'notificaciones'
UNION ALL
SELECT 'actividad.ver', 'Ver registro de actividad', id, 'ver' FROM admin_modulos WHERE codigo = 'actividad'
UNION ALL
SELECT 'actividad.exportar', 'Exportar actividad', id, 'exportar' FROM admin_modulos WHERE codigo = 'actividad'
UNION ALL
SELECT 'seguridad_avanzada.ver', 'Ver configuración de seguridad', id, 'ver' FROM admin_modulos WHERE codigo = 'seguridad_avanzada'
UNION ALL
SELECT 'seguridad_avanzada.editar', 'Editar configuración de seguridad', id, 'editar' FROM admin_modulos WHERE codigo = 'seguridad_avanzada';

-- Asignar permisos al super_admin
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM admin_permisos 
WHERE codigo LIKE 'notificaciones.%' 
   OR codigo LIKE 'actividad.%' 
   OR codigo LIKE 'seguridad_avanzada.%';

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista de notificaciones pendientes por usuario
CREATE OR REPLACE VIEW vista_notificaciones_pendientes AS
SELECT 
    n.id,
    n.usuario_id,
    u.nombre AS usuario_nombre,
    u.correo AS usuario_correo,
    n.titulo,
    n.mensaje,
    n.tipo,
    n.prioridad,
    n.canal,
    n.url_accion,
    n.creado_en,
    n.expira_en,
    TIMESTAMPDIFF(MINUTE, n.creado_en, NOW()) AS minutos_desde_creacion
FROM notificaciones n
JOIN admin_usuarios u ON n.usuario_id = u.id
WHERE n.estado IN ('pendiente', 'enviado')
    AND (n.expira_en IS NULL OR n.expira_en > NOW())
ORDER BY 
    FIELD(n.prioridad, 'urgente', 'alta', 'normal', 'baja'),
    n.creado_en DESC;

-- Vista de actividad reciente del sistema
CREATE OR REPLACE VIEW vista_actividad_reciente AS
SELECT 
    a.id,
    a.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
    u.correo AS usuario_correo,
    a.tipo_accion,
    a.modulo,
    a.entidad,
    a.entidad_id,
    a.descripcion,
    a.ip_address,
    a.exitoso,
    a.creado_en,
    e.nombre AS empresa_nombre
FROM actividad_usuarios a
JOIN admin_usuarios u ON a.usuario_id = u.id
LEFT JOIN admin_empresas e ON a.empresa_id = e.id
WHERE a.creado_en >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY a.creado_en DESC;

-- Vista de usuarios con contraseña por expirar
CREATE OR REPLACE VIEW vista_contrasenas_por_expirar AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.correo,
    u.contrasena_expira_en,
    DATEDIFF(u.contrasena_expira_en, NOW()) AS dias_restantes,
    u.ultimo_cambio_contrasena,
    e.nombre AS empresa_nombre
FROM admin_usuarios u
LEFT JOIN admin_usuarios_empresas ue ON u.id = ue.usuario_id AND ue.es_principal = TRUE
LEFT JOIN admin_empresas e ON ue.empresa_id = e.id
WHERE u.es_activo = TRUE
    AND u.contrasena_nunca_expira = FALSE
    AND u.contrasena_expira_en IS NOT NULL
    AND u.contrasena_expira_en <= DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY u.contrasena_expira_en ASC;

-- Vista de dispositivos por usuario
CREATE OR REPLACE VIEW vista_dispositivos_usuario AS
SELECT 
    d.id,
    d.usuario_id,
    CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
    d.nombre_dispositivo,
    d.tipo_dispositivo,
    d.navegador,
    d.version_navegador,
    d.sistema_operativo,
    d.es_confiable,
    d.ultima_actividad,
    d.creado_en,
    COUNT(s.id) AS sesiones_activas
FROM seguridad_dispositivos d
JOIN admin_usuarios u ON d.usuario_id = u.id
LEFT JOIN seguridad_sesiones s ON d.id = s.dispositivo_id AND s.es_activa = TRUE
GROUP BY d.id;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Procedimiento para crear notificación
CREATE PROCEDURE sp_crear_notificacion(
    IN p_usuario_id INT UNSIGNED,
    IN p_plantilla_codigo VARCHAR(50),
    IN p_datos JSON,
    IN p_prioridad VARCHAR(20)
)
BEGIN
    DECLARE v_plantilla_id INT UNSIGNED;
    DECLARE v_titulo VARCHAR(255);
    DECLARE v_mensaje TEXT;
    DECLARE v_canal VARCHAR(20);
    DECLARE v_tipo VARCHAR(20);
    
    -- Obtener plantilla
    SELECT id, asunto, contenido_texto, canal, tipo 
    INTO v_plantilla_id, v_titulo, v_mensaje, v_canal, v_tipo
    FROM notificaciones_plantillas 
    WHERE codigo = p_plantilla_codigo AND es_activa = TRUE
    LIMIT 1;
    
    IF v_plantilla_id IS NOT NULL THEN
        -- Insertar notificación
        INSERT INTO notificaciones (
            usuario_id, plantilla_id, titulo, mensaje, 
            tipo, prioridad, canal, datos_extra
        ) VALUES (
            p_usuario_id, v_plantilla_id, v_titulo, v_mensaje,
            v_tipo, COALESCE(p_prioridad, 'normal'), v_canal, p_datos
        );
        
        SELECT LAST_INSERT_ID() AS notificacion_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Plantilla no encontrada';
    END IF;
END //

-- Procedimiento para registrar actividad
CREATE PROCEDURE sp_registrar_actividad(
    IN p_usuario_id INT UNSIGNED,
    IN p_sesion_id INT UNSIGNED,
    IN p_empresa_id INT UNSIGNED,
    IN p_tipo_accion VARCHAR(50),
    IN p_modulo VARCHAR(100),
    IN p_entidad VARCHAR(100),
    IN p_entidad_id BIGINT UNSIGNED,
    IN p_descripcion VARCHAR(500),
    IN p_datos_accion JSON,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_exitoso BOOLEAN,
    IN p_tiempo_ejecucion INT UNSIGNED
)
BEGIN
    INSERT INTO actividad_usuarios (
        usuario_id, sesion_id, empresa_id,
        tipo_accion, modulo, entidad, entidad_id,
        descripcion, datos_accion,
        ip_address, user_agent,
        exitoso, tiempo_ejecucion
    ) VALUES (
        p_usuario_id, p_sesion_id, p_empresa_id,
        p_tipo_accion, p_modulo, p_entidad, p_entidad_id,
        p_descripcion, p_datos_accion,
        p_ip_address, p_user_agent,
        p_exitoso, p_tiempo_ejecucion
    );
END //

-- Procedimiento para actualizar elementos recientes
CREATE PROCEDURE sp_registrar_elemento_reciente(
    IN p_usuario_id INT UNSIGNED,
    IN p_modulo VARCHAR(100),
    IN p_entidad VARCHAR(100),
    IN p_entidad_id BIGINT UNSIGNED,
    IN p_titulo VARCHAR(255),
    IN p_subtitulo VARCHAR(255),
    IN p_icono VARCHAR(100),
    IN p_url VARCHAR(500),
    IN p_datos_preview JSON
)
BEGIN
    INSERT INTO actividad_recientes (
        usuario_id, modulo, entidad, entidad_id,
        titulo, subtitulo, icono, url, datos_preview,
        total_visitas, ultima_visita
    ) VALUES (
        p_usuario_id, p_modulo, p_entidad, p_entidad_id,
        p_titulo, p_subtitulo, p_icono, p_url, p_datos_preview,
        1, NOW()
    )
    ON DUPLICATE KEY UPDATE
        titulo = VALUES(titulo),
        subtitulo = VALUES(subtitulo),
        icono = VALUES(icono),
        url = VALUES(url),
        datos_preview = VALUES(datos_preview),
        total_visitas = total_visitas + 1,
        ultima_visita = NOW();
    
    -- Mantener solo los últimos 50 elementos por usuario
    DELETE FROM actividad_recientes 
    WHERE usuario_id = p_usuario_id 
    AND id NOT IN (
        SELECT id FROM (
            SELECT id FROM actividad_recientes 
            WHERE usuario_id = p_usuario_id 
            ORDER BY ultima_visita DESC 
            LIMIT 50
        ) AS recientes
    );
END //

-- Función para verificar si IP es de confianza
CREATE FUNCTION fn_ip_es_confianza(
    p_usuario_id INT UNSIGNED,
    p_empresa_id INT UNSIGNED,
    p_ip_address VARCHAR(45)
) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_confianza BOOLEAN DEFAULT FALSE;
    
    -- Verificar IP global
    IF EXISTS (
        SELECT 1 FROM seguridad_ips_confianza
        WHERE tipo = 'global'
        AND ip_address = p_ip_address
        AND es_activa = TRUE
        AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar IP por empresa
    IF p_empresa_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM seguridad_ips_confianza
        WHERE tipo = 'empresa'
        AND empresa_id = p_empresa_id
        AND ip_address = p_ip_address
        AND es_activa = TRUE
        AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar IP por usuario
    IF EXISTS (
        SELECT 1 FROM seguridad_ips_confianza
        WHERE tipo = 'usuario'
        AND usuario_id = p_usuario_id
        AND ip_address = p_ip_address
        AND es_activa = TRUE
        AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END //

-- Procedimiento para verificar horario de acceso
CREATE PROCEDURE sp_verificar_horario_acceso(
    IN p_usuario_id INT UNSIGNED,
    IN p_empresa_id INT UNSIGNED,
    OUT p_permitido BOOLEAN,
    OUT p_mensaje VARCHAR(200)
)
BEGIN
    DECLARE v_dia VARCHAR(20);
    DECLARE v_hora TIME;
    DECLARE v_hay_restriccion BOOLEAN DEFAULT FALSE;
    
    SET v_dia = LCASE(DAYNAME(NOW()));
    SET v_hora = CURRENT_TIME();
    SET p_permitido = TRUE;
    SET p_mensaje = NULL;
    
    -- Traducir día a español
    SET v_dia = CASE v_dia
        WHEN 'monday' THEN 'lunes'
        WHEN 'tuesday' THEN 'martes'
        WHEN 'wednesday' THEN 'miercoles'
        WHEN 'thursday' THEN 'jueves'
        WHEN 'friday' THEN 'viernes'
        WHEN 'saturday' THEN 'sabado'
        WHEN 'sunday' THEN 'domingo'
    END;
    
    -- Verificar si hay restricciones configuradas
    SELECT EXISTS(
        SELECT 1 FROM seguridad_horarios_acceso
        WHERE es_activo = TRUE
        AND (
            (tipo = 'usuario' AND usuario_id = p_usuario_id)
            OR (tipo = 'empresa' AND empresa_id = p_empresa_id)
        )
    ) INTO v_hay_restriccion;
    
    IF v_hay_restriccion THEN
        -- Verificar si está dentro del horario permitido
        IF NOT EXISTS (
            SELECT 1 FROM seguridad_horarios_acceso
            WHERE es_activo = TRUE
            AND dia_semana = v_dia
            AND v_hora BETWEEN hora_inicio AND hora_fin
            AND (
                (tipo = 'usuario' AND usuario_id = p_usuario_id)
                OR (tipo = 'empresa' AND empresa_id = p_empresa_id)
            )
        ) THEN
            SET p_permitido = FALSE;
            SET p_mensaje = CONCAT('Acceso no permitido en este horario. Día: ', v_dia, ', Hora: ', v_hora);
        END IF;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- EVENTOS PROGRAMADOS
-- ============================================================================

-- Habilitar el programador de eventos (si no está habilitado)
SET GLOBAL event_scheduler = ON;

-- Procedimiento auxiliar para notificar contraseñas por expirar
-- (Los eventos complejos se manejan mejor con procedimientos)
DELIMITER //

CREATE PROCEDURE sp_notificar_contrasenas_expirando()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_usuario_id INT UNSIGNED;
    DECLARE v_dias INT;
    
    DECLARE cur_usuarios CURSOR FOR
        SELECT id, DATEDIFF(contrasena_expira_en, NOW()) AS dias
        FROM admin_usuarios
        WHERE es_activo = TRUE
        AND contrasena_nunca_expira = FALSE
        AND contrasena_expira_en IS NOT NULL
        AND DATEDIFF(contrasena_expira_en, NOW()) IN (7, 3, 1);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur_usuarios;
    
    read_loop: LOOP
        FETCH cur_usuarios INTO v_usuario_id, v_dias;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO notificaciones (
            usuario_id, titulo, mensaje, tipo, prioridad, canal
        ) VALUES (
            v_usuario_id,
            CONCAT('Tu contraseña expira en ', v_dias, ' día(s)'),
            'Por seguridad, te recomendamos cambiar tu contraseña antes de que expire.',
            'seguridad',
            IF(v_dias = 1, 'urgente', IF(v_dias = 3, 'alta', 'normal')),
            'interno'
        );
    END LOOP;
    
    CLOSE cur_usuarios;
END //

DELIMITER ;

-- Evento para notificar contraseñas por expirar (llama al procedimiento)
DROP EVENT IF EXISTS evento_notificar_contrasenas_expirando;
CREATE EVENT evento_notificar_contrasenas_expirando
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 8 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO CALL sp_notificar_contrasenas_expirando();

-- Evento para limpiar actividad antigua (más de 180 días)
DROP EVENT IF EXISTS evento_limpiar_actividad_antigua;
CREATE EVENT evento_limpiar_actividad_antigua
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO DELETE FROM actividad_usuarios WHERE creado_en < DATE_SUB(NOW(), INTERVAL 180 DAY);

-- Evento para limpiar notificaciones leídas antiguas (más de 90 días)
DROP EVENT IF EXISTS evento_limpiar_notificaciones_antiguas;
CREATE EVENT evento_limpiar_notificaciones_antiguas
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 4 HOUR)
ON COMPLETION PRESERVE
ENABLE
DO DELETE FROM notificaciones WHERE leido_en IS NOT NULL AND leido_en < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger para crear preferencias de notificación al crear usuario
DROP TRIGGER IF EXISTS trg_crear_preferencias_notificacion //

CREATE TRIGGER trg_crear_preferencias_notificacion
AFTER INSERT ON admin_usuarios
FOR EACH ROW
BEGIN
    INSERT INTO notificaciones_preferencias (usuario_id) VALUES (NEW.id);
END //

-- Trigger para auditar cambios en políticas de contraseña
DROP TRIGGER IF EXISTS trg_politica_contrasena_auditoria //

CREATE TRIGGER trg_politica_contrasena_auditoria
AFTER UPDATE ON seguridad_politicas_contrasena
FOR EACH ROW
BEGIN
    INSERT INTO sistema_bitacora (
        tabla_afectada, registro_id, accion,
        datos_anteriores, datos_nuevos, usuario_id
    ) VALUES (
        'seguridad_politicas_contrasena', NEW.id, 'actualizar',
        JSON_OBJECT(
            'longitud_minima', OLD.longitud_minima,
            'dias_expiracion', OLD.dias_expiracion,
            'intentos_maximos', OLD.intentos_maximos
        ),
        JSON_OBJECT(
            'longitud_minima', NEW.longitud_minima,
            'dias_expiracion', NEW.dias_expiracion,
            'intentos_maximos', NEW.intentos_maximos
        ),
        NEW.actualizado_por
    );
END //

DELIMITER ;

-- ============================================================================
-- FIN DEL SCRIPT - FASE 3
-- ============================================================================
