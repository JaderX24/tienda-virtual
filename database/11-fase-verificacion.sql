-- ============================================================================
-- TIENDA VIRTUAL - FASE 11 - VERIFICACIÓN
-- ============================================================================
-- Script para verificar la correcta instalación de la Fase 11
-- Ejecutar después de 11-fase-(24-01-2026)-v1-7892.sql
-- ============================================================================

USE tienda_virtual;

SELECT '=================================================' AS '';
SELECT 'VERIFICACIÓN FASE 11: PAGOS AVANZADOS' AS 'RESULTADO';
SELECT '=================================================' AS '';

-- ============================================================================
-- 1. VERIFICAR TABLAS PRINCIPALES
-- ============================================================================

SELECT '--- TABLAS DE CONFIGURACIÓN Y PASARELAS ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_configuracion') AS config,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_monedas') AS monedas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_pasarelas') AS pasarelas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_pasarelas_credenciales') AS credenciales,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_pasarelas_comisiones') AS comisiones;

SELECT '--- TABLAS DE MÉTODOS DE PAGO ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_tokens_tarjeta') AS tokens,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_metodos_cliente') AS metodos;

SELECT '--- TABLAS DE WALLETS ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_wallets') AS wallets,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_wallets_movimientos') AS movimientos;

SELECT '--- TABLAS DE TRANSACCIONES ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_transacciones') AS transacciones,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_transacciones_log') AS log_trans;

SELECT '--- TABLAS DE REEMBOLSOS Y DISPUTAS ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_reembolsos') AS reembolsos,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_disputas') AS disputas,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_disputas_evidencia') AS evidencia;

SELECT '--- TABLAS DE SUSCRIPCIONES ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_planes_suscripcion') AS planes,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_suscripciones') AS suscripciones,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_suscripciones_historial') AS historial;

SELECT '--- TABLAS DE SPLIT PAYMENTS ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_splits') AS splits,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_split_detalle') AS split_detalle;

SELECT '--- TABLAS DE LIQUIDACIONES ---' AS '';

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_liquidaciones') AS liquidaciones,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' AND table_name = 'pagos_liquidaciones_detalle') AS liq_detalle;

-- ============================================================================
-- 2. VERIFICAR PROCEDIMIENTOS
-- ============================================================================

SELECT '--- PROCEDIMIENTOS ALMACENADOS ---' AS '';

SELECT 
    routine_name AS procedimiento,
    'OK' AS estado
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND routine_name IN (
    'sp_procesar_pago',
    'sp_crear_suscripcion',
    'sp_renovar_suscripcion',
    'sp_cancelar_suscripcion',
    'sp_procesar_reembolso',
    'sp_split_payment',
    'sp_recargar_wallet',
    'sp_transferir_wallet'
)
ORDER BY routine_name;

-- ============================================================================
-- 3. VERIFICAR VISTAS
-- ============================================================================

SELECT '--- VISTAS ---' AS '';

SELECT 
    table_name AS vista,
    'OK' AS estado
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND table_name IN (
    'vista_transacciones_recientes',
    'vista_suscripciones_activas',
    'vista_pagos_pendientes',
    'vista_reembolsos_pendientes',
    'vista_comisiones_marketplace',
    'vista_balance_wallets'
)
ORDER BY table_name;

-- ============================================================================
-- 4. VERIFICAR EVENTOS PROGRAMADOS
-- ============================================================================

SELECT '--- EVENTOS PROGRAMADOS ---' AS '';

SELECT 
    event_name AS evento,
    status AS estado
FROM information_schema.events
WHERE event_schema = 'tienda_virtual'
AND event_name IN (
    'evento_renovar_suscripciones',
    'evento_verificar_pagos_pendientes',
    'evento_limpiar_tokens_expirados'
)
ORDER BY event_name;

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '--- TRIGGERS ---' AS '';

SELECT 
    trigger_name AS trigger_nombre,
    event_manipulation AS evento,
    event_object_table AS tabla
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_log_transaccion',
    'trg_actualizar_balance_wallet'
)
ORDER BY trigger_name;

-- ============================================================================
-- 6. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '--- MONEDAS CONFIGURADAS ---' AS '';

SELECT codigo, nombre, simbolo, es_principal
FROM pagos_monedas
WHERE es_activo = TRUE;

SELECT '--- PASARELAS DE PAGO ---' AS '';

SELECT codigo, nombre, tipo, soporta_tokenizacion, soporta_suscripciones, soporta_split_payment
FROM pagos_pasarelas
WHERE es_activo = TRUE
ORDER BY orden_prioridad;

SELECT '--- COMISIONES POR PASARELA ---' AS '';

SELECT 
    p.nombre AS pasarela,
    pc.tipo_comision,
    pc.porcentaje,
    pc.monto_fijo
FROM pagos_pasarelas_comisiones pc
INNER JOIN pagos_pasarelas p ON pc.pasarela_id = p.id
WHERE pc.es_activo = TRUE;

SELECT '--- CONFIGURACIÓN GENERAL ---' AS '';

SELECT clave, valor, tipo_dato
FROM pagos_configuracion
WHERE es_global = TRUE
LIMIT 10;

-- ============================================================================
-- 7. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '--- MÓDULOS REGISTRADOS ---' AS '';

SELECT codigo, nombre, icono
FROM admin_modulos
WHERE codigo LIKE 'pagos%'
ORDER BY orden;

SELECT '--- PERMISOS POR MÓDULO ---' AS '';

SELECT 
    m.codigo AS modulo,
    COUNT(p.id) AS total_permisos
FROM admin_modulos m
LEFT JOIN admin_permisos p ON m.id = p.modulo_id
WHERE m.codigo LIKE 'pagos%'
GROUP BY m.codigo
ORDER BY m.codigo;

-- ============================================================================
-- 8. CONTEO TOTAL DE OBJETOS FASE 11
-- ============================================================================

SELECT '--- RESUMEN FASE 11 ---' AS '';

SELECT 
    'Tablas Principales' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'tienda_virtual'
AND table_name LIKE 'pagos_%'

UNION ALL

SELECT 
    'Procedimientos' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.routines
WHERE routine_schema = 'tienda_virtual'
AND routine_type = 'PROCEDURE'
AND (routine_name LIKE 'sp_%pago%' OR routine_name LIKE 'sp_%suscripcion%' 
     OR routine_name LIKE 'sp_%wallet%' OR routine_name LIKE 'sp_%reembolso%'
     OR routine_name LIKE 'sp_%split%')

UNION ALL

SELECT 
    'Vistas' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.views
WHERE table_schema = 'tienda_virtual'
AND (table_name LIKE 'vista_transacciones%' OR table_name LIKE 'vista_suscripciones%' 
     OR table_name LIKE 'vista_pagos%' OR table_name LIKE 'vista_reembolsos%'
     OR table_name LIKE 'vista_comisiones%' OR table_name LIKE 'vista_balance%')

UNION ALL

SELECT 
    'Triggers' AS tipo,
    COUNT(*) AS cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'tienda_virtual'
AND (trigger_name LIKE 'trg_%transaccion%' OR trigger_name LIKE 'trg_%wallet%' 
     OR trigger_name LIKE 'trg_%pago%');

-- ============================================================================
-- 9. VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=================================================' AS '';
SELECT 'VERIFICACIÓN COMPLETADA' AS 'ESTADO';
SELECT '=================================================' AS '';

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'tienda_virtual' 
            AND table_name IN (
                'pagos_configuracion', 'pagos_monedas', 'pagos_pasarelas',
                'pagos_transacciones', 'pagos_wallets', 'pagos_suscripciones',
                'pagos_reembolsos', 'pagos_splits', 'pagos_liquidaciones'
            )
        ) >= 9 THEN '✓ FASE 11 INSTALADA CORRECTAMENTE'
        ELSE '✗ ERROR: Faltan tablas principales'
    END AS resultado_final;

-- ============================================================================
-- FIN VERIFICACIÓN FASE 11
-- ============================================================================
