# Fase 8: Notificaciones Transaccionales + Reportes y Analytics

## Descripción General

La Fase 8 implementa dos sistemas complementarios:
- **Parte A**: Sistema de notificaciones multicanal (email, SMS, push, WhatsApp, in-app)
- **Parte B**: Sistema de reportes y analytics con KPIs en tiempo real

---

## PARTE A: SISTEMA DE NOTIFICACIONES

### Características Implementadas

#### 1. Plantillas de Notificación
- Código único por plantilla
- **Categorías**: pedidos, pagos, envíos, cuenta, marketing, sistema, seguridad, fidelidad
- Contenido por canal: email (HTML/texto), SMS, push, WhatsApp
- Variables dinámicas con placeholders `{{variable}}`
- Evento trigger automático

#### 2. Canales de Envío
| Canal | Descripción |
|-------|-------------|
| Email | HTML y texto plano, adjuntos |
| SMS | Mensajes cortos (<160 chars) |
| Push | Notificaciones web/móvil |
| WhatsApp | API de WhatsApp Business |
| In-app | Notificaciones dentro de la app |

#### 3. Cola de Envío
- Sistema de cola con reintentos automáticos
- Máximo 3 intentos por notificación
- Backoff exponencial entre reintentos
- Prioridad de envío (alta, normal, baja)
- Programación de envío diferido

#### 4. Preferencias del Cliente
- Opt-in/opt-out por categoría y canal
- Horarios de no molestar
- Frecuencia máxima de marketing
- Desuscripción con un clic

#### 5. Proveedores de Envío
- Múltiples proveedores por canal (failover)
- Credenciales por empresa
- Monitoreo de disponibilidad
- Costos por mensaje

### Estructura de Tablas (Notificaciones)

```
notificaciones_plantillas
notificaciones_cola
├── notificaciones_cola_logs
notificaciones_cliente (preferencias)
notificaciones_eventos (disparadores)
notificaciones_proveedores
```

### Eventos que Disparan Notificaciones

| Evento | Plantilla | Canales |
|--------|-----------|---------|
| `pedido.creado` | Confirmación de pedido | Email, In-app |
| `pedido.pagado` | Pago recibido | Email, SMS |
| `pedido.enviado` | Pedido en camino | Email, SMS, Push |
| `pedido.entregado` | Entrega confirmada | Email, In-app |
| `cuenta.bienvenida` | Bienvenida nuevo usuario | Email |
| `cuenta.recuperar_clave` | Reset de contraseña | Email |
| `seguridad.login_nuevo` | Nuevo dispositivo | Email, Push |
| `fidelidad.puntos_vencer` | Puntos por expirar | Email, Push |

---

## PARTE B: REPORTES Y ANALYTICS

### Características Implementadas

#### 1. Métricas de Ventas
- Ventas diarias con comparativa
- Ventas semanales y mensuales
- Ticket promedio
- Número de transacciones
- Crecimiento porcentual

#### 2. Análisis de Productos
- Productos más vendidos
- Productos menos vendidos
- Productos sin movimiento
- Análisis ABC (Pareto)
- Rentabilidad por producto

#### 3. Análisis de Clientes (RFM)
- **Recency**: Última compra
- **Frequency**: Frecuencia de compra
- **Monetary**: Valor total gastado
- Segmentación automática:
  - Campeones
  - Clientes leales
  - Potenciales
  - En riesgo
  - Hibernando
  - Perdidos

#### 4. Métricas de Conversión
- Tasa de conversión del carrito
- Carritos abandonados
- Embudo de ventas completo
- Tiempo promedio de decisión

#### 5. Dashboard KPIs
- Ventas del día/semana/mes
- Pedidos pendientes
- Stock bajo
- Clientes nuevos
- Promedio calificación

#### 6. Reportes Programados
- Frecuencia: diario, semanal, mensual
- Formato: PDF, Excel, CSV
- Envío automático por email
- Historial de reportes generados

### Estructura de Tablas (Analytics)

```
analytics_ventas_diarias
analytics_ventas_mensuales
analytics_productos
analytics_clientes (RFM)
analytics_categorias
analytics_conversion
analytics_kpis
analytics_eventos (tracking)
reportes_programados
reportes_historial
```

### Métricas Calculadas

```sql
-- KPIs principales actualizados cada hora
UPDATE analytics_kpis SET
    valor = (SELECT SUM(total) FROM pedidos WHERE DATE(creado_en) = CURDATE()),
    fecha_calculo = NOW()
WHERE codigo = 'ventas_hoy';
```

---

## Procedimientos Almacenados

### Notificaciones
| Procedimiento | Función |
|---------------|---------|
| `sp_encolar_notificacion` | Agrega notificación a cola |
| `sp_procesar_cola` | Procesa notificaciones pendientes |
| `sp_enviar_notificacion` | Envía por canal específico |
| `sp_registrar_preferencia` | Guarda preferencia de cliente |

### Analytics
| Procedimiento | Función |
|---------------|---------|
| `sp_calcular_ventas_diarias` | Agrega ventas del día |
| `sp_calcular_rfm` | Calcula scores RFM |
| `sp_generar_reporte` | Genera reporte en formato |
| `sp_actualizar_kpis` | Actualiza dashboard |
| `sp_analizar_embudo` | Calcula conversión |

## Vistas Disponibles

### Notificaciones
| Vista | Descripción |
|-------|-------------|
| `vista_cola_pendiente` | Notificaciones por enviar |
| `vista_notificaciones_fallidas` | Errores de envío |
| `vista_preferencias_cliente` | Opt-in/opt-out por cliente |

### Analytics
| Vista | Descripción |
|-------|-------------|
| `vista_ventas_periodo` | Ventas por período |
| `vista_top_productos` | Ranking de productos |
| `vista_segmentos_clientes` | Clientes por segmento RFM |
| `vista_kpis_dashboard` | KPIs para dashboard |
| `vista_embudo_ventas` | Tasas de conversión |

## Eventos Programados

### Notificaciones
| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_procesar_cola` | Cada 5 min | Envía notificaciones |
| `evento_limpiar_cola` | Diario | Elimina procesadas >30 días |
| `evento_verificar_proveedores` | Cada hora | Chequea disponibilidad |

### Analytics
| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_calcular_diario` | 00:05 | Cierre del día anterior |
| `evento_calcular_semanal` | Lunes 01:00 | Resumen semanal |
| `evento_calcular_rfm` | Semanal | Actualiza segmentos |
| `evento_generar_reportes` | Según config | Ejecuta reportes programados |
| `evento_actualizar_kpis` | Cada hora | Refresca dashboard |

## Casos de Uso

### Encolar Notificación
```sql
CALL sp_encolar_notificacion(
    'pedido_enviado',     -- código de plantilla
    :cliente_id,
    :pedido_id,
    JSON_OBJECT(
        'numero_pedido', 'PED-2026-0001',
        'numero_tracking', 'DHL123456',
        'fecha_estimada', '2026-01-28'
    ),
    'alta'               -- prioridad
);
```

### Consultar KPIs del Dashboard
```sql
SELECT 
    (SELECT valor FROM analytics_kpis WHERE codigo = 'ventas_hoy') AS ventas_hoy,
    (SELECT valor FROM analytics_kpis WHERE codigo = 'pedidos_pendientes') AS pedidos_pendientes,
    (SELECT valor FROM analytics_kpis WHERE codigo = 'clientes_nuevos_mes') AS clientes_nuevos,
    (SELECT valor FROM analytics_kpis WHERE codigo = 'ticket_promedio') AS ticket_promedio;
```

### Obtener Segmentación RFM
```sql
SELECT 
    segmento,
    COUNT(*) AS total_clientes,
    SUM(valor_total) AS valor_segmento
FROM analytics_clientes
GROUP BY segmento
ORDER BY valor_segmento DESC;
```

### Análisis de Embudo
```sql
SELECT 
    etapa,
    total_sesiones,
    ROUND((total_sesiones / LAG(total_sesiones) OVER (ORDER BY orden)) * 100, 2) AS tasa_conversion
FROM (
    SELECT 'Visitas' AS etapa, COUNT(*) AS total_sesiones, 1 AS orden FROM analytics_eventos WHERE tipo = 'visita'
    UNION ALL
    SELECT 'Producto visto', COUNT(*), 2 FROM analytics_eventos WHERE tipo = 'producto_visto'
    UNION ALL
    SELECT 'Agregar carrito', COUNT(*), 3 FROM analytics_eventos WHERE tipo = 'agregar_carrito'
    UNION ALL
    SELECT 'Iniciar checkout', COUNT(*), 4 FROM analytics_eventos WHERE tipo = 'iniciar_checkout'
    UNION ALL
    SELECT 'Compra', COUNT(*), 5 FROM analytics_eventos WHERE tipo = 'compra'
) AS embudo
ORDER BY orden;
```

## Plantillas de Email Predefinidas

| Código | Asunto | Variables |
|--------|--------|-----------|
| `pedido_confirmado` | Tu pedido #{{numero}} | numero, items, total |
| `pedido_enviado` | Tu pedido está en camino | tracking, fecha_estimada |
| `bienvenida` | ¡Bienvenido a Tienda! | nombre, codigo_descuento |
| `recuperar_clave` | Recupera tu contraseña | link_reset, expira_en |
| `carrito_abandonado` | Olvidaste algo... | items, link_carrito |

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 5 | Preferencias de notificación por cliente |
| Fase 6 | Eventos de pedidos disparan notificaciones |
| Fase 6 | Ventas provienen de pedidos |
| Fase 11 | Notificaciones de pagos |
| Fase 12 | Notificaciones de envío/tracking |

## Consideraciones de Rendimiento

### Notificaciones
1. **Cola asíncrona**: No bloquea operaciones principales
2. **Batch processing**: Envío en lotes de 100
3. **Rate limiting**: Respeta límites de proveedores

### Analytics
1. **Tablas agregadas**: Pre-calcula métricas
2. **Particionado por fecha**: Tablas de eventos
3. **Índices en fecha**: Consultas por período
4. **Caché de KPIs**: Actualización periódica

## Verificación Post-Instalación

```sql
-- Verificar tablas de notificaciones
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND table_name LIKE 'notificaciones%';

-- Verificar tablas de analytics
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND (table_name LIKE 'analytics%' OR table_name LIKE 'reportes%');

-- Verificar eventos programados
SELECT event_name, status FROM information_schema.events 
WHERE event_schema = 'tienda_virtual';
```

## Archivo SQL

- **Nombre**: `8-fase-(24-01-2026)-v1-7841.sql`
- **Líneas**: ~1,550
- **Dependencias**: Fases 1-7 instaladas
- **Script verificación**: `8-fase-verificacion.sql`
