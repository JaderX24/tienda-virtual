-- ============================================================================
-- TIENDA VIRTUAL - VERIFICACIÓN FASE 5
-- ============================================================================
-- Script para verificar que la Fase 5 se instaló correctamente
-- Ejecutar DESPUÉS de ejecutar el script principal de Fase 5
-- ============================================================================

USE tienda_virtual;

-- ============================================================================
-- 1. VERIFICAR TABLAS DE CLIENTES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TABLAS FASE 5 - CLIENTES ===' AS titulo;

SELECT 
    'clientes' AS tabla,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes'

UNION ALL SELECT 
    'clientes_niveles_membresia',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_niveles_membresia'

UNION ALL SELECT 
    'clientes_membresias_historial',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_membresias_historial'

UNION ALL SELECT 
    'clientes_direcciones',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_direcciones'

UNION ALL SELECT 
    'clientes_metodos_pago',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_metodos_pago'

UNION ALL SELECT 
    'clientes_wishlists',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_wishlists'

UNION ALL SELECT 
    'clientes_wishlists_items',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_wishlists_items'

UNION ALL SELECT 
    'clientes_sesiones',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_sesiones'

UNION ALL SELECT 
    'clientes_intentos_login',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_intentos_login'

UNION ALL SELECT 
    'clientes_codigos_verificacion',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_codigos_verificacion'

UNION ALL SELECT 
    'clientes_preferencias',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_preferencias'

UNION ALL SELECT 
    'clientes_productos_vistos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_productos_vistos'

UNION ALL SELECT 
    'clientes_busquedas',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_busquedas';

-- ============================================================================
-- 2. VERIFICAR TABLAS DE FIDELIDAD Y REFERIDOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TABLAS FASE 5 - FIDELIDAD ===' AS titulo;

SELECT 
    'fidelidad_configuracion' AS tabla,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'fidelidad_configuracion'

UNION ALL SELECT 
    'clientes_puntos_movimientos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_puntos_movimientos'

UNION ALL SELECT 
    'clientes_referidos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' AND table_name = 'clientes_referidos';

-- ============================================================================
-- 3. VERIFICAR PROCEDIMIENTOS Y FUNCIONES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE PROCEDIMIENTOS ===' AS titulo;

SELECT 
    'sp_generar_codigo_cliente' AS objeto,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_generar_codigo_cliente'

UNION ALL SELECT 
    'sp_generar_codigo_referido',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_generar_codigo_referido'

UNION ALL SELECT 
    'sp_registrar_cliente',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_registrar_cliente'

UNION ALL SELECT 
    'sp_acumular_puntos_compra',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_acumular_puntos_compra'

UNION ALL SELECT 
    'sp_canjear_puntos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_canjear_puntos'

UNION ALL SELECT 
    'sp_agregar_wishlist',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_agregar_wishlist'

UNION ALL SELECT 
    'sp_verificar_nivel_membresia',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_verificar_nivel_membresia'

UNION ALL SELECT 
    'sp_expirar_puntos',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.routines 
WHERE routine_schema = 'tienda_virtual' AND routine_name = 'sp_expirar_puntos';

-- ============================================================================
-- 4. VERIFICAR VISTAS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE VISTAS ===' AS titulo;

SELECT 
    'vista_clientes_resumen' AS vista,
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA') AS estado
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_clientes_resumen'

UNION ALL SELECT 
    'vista_clientes_vip',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_clientes_vip'

UNION ALL SELECT 
    'vista_productos_mas_deseados',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_productos_mas_deseados'

UNION ALL SELECT 
    'vista_clientes_por_retener',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_clientes_por_retener'

UNION ALL SELECT 
    'vista_puntos_recientes',
    IF(COUNT(*) > 0, '✓ EXISTE', '✗ FALTA')
FROM information_schema.views 
WHERE table_schema = 'tienda_virtual' AND table_name = 'vista_puntos_recientes';

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TRIGGERS ===' AS titulo;

SELECT 
    trigger_name AS disparador,
    event_manipulation AS evento,
    event_object_table AS tabla
FROM information_schema.triggers 
WHERE trigger_schema = 'tienda_virtual'
AND trigger_name IN (
    'trg_cliente_crear_preferencias',
    'trg_wishlist_item_delete',
    'trg_producto_precio_wishlist'
);

-- ============================================================================
-- 6. VERIFICAR EVENTOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE EVENTOS PROGRAMADOS ===' AS titulo;

SELECT 
    event_name AS evento,
    status AS estado,
    event_type AS tipo,
    interval_value AS intervalo,
    interval_field AS unidad
FROM information_schema.events 
WHERE event_schema = 'tienda_virtual'
AND event_name IN (
    'evento_expirar_puntos',
    'evento_limpiar_sesiones_clientes',
    'evento_limpiar_codigos_verificacion'
);

-- ============================================================================
-- 7. VERIFICAR DATOS INICIALES
-- ============================================================================

SELECT '=== VERIFICACIÓN DE DATOS INICIALES ===' AS titulo;

SELECT 
    'Niveles de membresía' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 5, '✓ OK', '✗ FALTAN') AS estado
FROM clientes_niveles_membresia;

SELECT 
    'Configuración de fidelidad' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 1, '✓ OK', '✗ FALTA') AS estado
FROM fidelidad_configuracion;

SELECT 
    'Nivel por defecto (Bronce)' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) = 1, '✓ OK', '✗ FALTA') AS estado
FROM clientes_niveles_membresia WHERE es_default = TRUE;

-- ============================================================================
-- 8. VERIFICAR NIVELES DE MEMBRESÍA
-- ============================================================================

SELECT '=== NIVELES DE MEMBRESÍA CONFIGURADOS ===' AS titulo;

SELECT 
    codigo,
    nombre,
    puntos_requeridos,
    CONCAT(descuento_porcentaje, '%') AS descuento,
    CONCAT('x', puntos_multiplicador) AS multiplicador_puntos,
    IF(envio_gratis, 'Sí', 'No') AS envio_gratis,
    IF(es_pago, CONCAT('L ', precio_mensual, '/mes'), 'Gratis') AS costo,
    color_badge
FROM clientes_niveles_membresia
ORDER BY orden;

-- ============================================================================
-- 9. VERIFICAR CONFIGURACIÓN DE FIDELIDAD
-- ============================================================================

SELECT '=== CONFIGURACIÓN DEL PROGRAMA DE FIDELIDAD ===' AS titulo;

SELECT 
    nombre_programa,
    CONCAT(puntos_por_unidad_monetaria, ' puntos por cada L ', unidad_monetaria) AS acumulacion,
    CONCAT('L ', valor_punto_en_moneda, ' por punto') AS valor_canje,
    CONCAT(puntos_minimos_canje, ' puntos mínimo') AS minimo_canje,
    IF(puntos_expiran, CONCAT('Expiran en ', dias_vencimiento, ' días'), 'No expiran') AS vencimiento,
    CONCAT(puntos_registro, ' pts registro, ', puntos_referido, ' pts referido') AS bonificaciones
FROM fidelidad_configuracion
WHERE es_activo = TRUE;

-- ============================================================================
-- 10. VERIFICAR MÓDULOS Y PERMISOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE MÓDULOS Y PERMISOS ===' AS titulo;

SELECT 
    'Módulos nuevos' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 5, '✓ OK', '✗ FALTAN') AS estado
FROM admin_modulos 
WHERE codigo IN ('clientes', 'clientes_direcciones', 'clientes_wishlists', 'fidelidad', 'referidos');

SELECT 
    'Permisos de clientes' AS dato,
    COUNT(*) AS cantidad,
    IF(COUNT(*) >= 10, '✓ OK', '✗ FALTAN') AS estado
FROM admin_permisos 
WHERE codigo LIKE 'clientes%' OR codigo LIKE 'fidelidad%' OR codigo LIKE 'referidos%';

-- ============================================================================
-- 11. PRUEBA RÁPIDA DE FUNCIONALIDAD
-- ============================================================================

SELECT '=== PRUEBA DE FUNCIONALIDAD ===' AS titulo;

-- Probar generación de código de cliente
SET @codigo_test = '';
CALL sp_generar_codigo_cliente(@codigo_test);
SELECT 
    'sp_generar_codigo_cliente()' AS prueba,
    @codigo_test AS resultado,
    IF(@codigo_test LIKE 'CLI-%', '✓ CORRECTO', '✗ ERROR') AS validacion;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT '=== RESUMEN FASE 5 ===' AS titulo;

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name LIKE 'clientes%') AS tablas_clientes,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tienda_virtual' 
     AND table_name LIKE 'fidelidad%') AS tablas_fidelidad,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'tienda_virtual' 
     AND (routine_name LIKE 'sp_generar_codigo%'
          OR routine_name LIKE 'sp_registrar_cliente%'
          OR routine_name LIKE 'sp_acumular%'
          OR routine_name LIKE 'sp_canjear%'
          OR routine_name LIKE 'sp_agregar_wishlist%'
          OR routine_name LIKE 'sp_verificar_nivel%'
          OR routine_name LIKE 'sp_expirar%')) AS procedimientos,
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'tienda_virtual'
     AND (table_name LIKE 'vista_clientes%' OR table_name LIKE 'vista_puntos%' OR table_name LIKE 'vista_productos_mas%')) AS vistas,
    (SELECT COUNT(*) FROM clientes_niveles_membresia) AS niveles_membresia;

SELECT '✓ VERIFICACIÓN COMPLETADA - FASE 5 INSTALADA' AS mensaje;

-- ============================================================================
-- FIN DE VERIFICACIÓN
-- ============================================================================
