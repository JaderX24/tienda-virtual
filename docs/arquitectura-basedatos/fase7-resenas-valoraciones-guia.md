# Fase 7: Reseñas y Valoraciones (Sistema de Reviews - Estilo Amazon)

## Descripción General

La Fase 7 implementa un sistema completo de reseñas con calificación de estrellas, verificación de compra, multimedia, votos de utilidad, moderación, respuestas del vendedor y preguntas/respuestas de productos.

## Características Implementadas

### 1. Reseñas de Productos
- **Calificación 1-5 estrellas**
- Calificaciones por aspecto: calidad, precio, envío, empaque
- Título y contenido de la reseña
- Compra verificada (badge especial)
- Opción de reseña anónima
- Edición con versionado

### 2. Multimedia en Reseñas
- Hasta 10 imágenes por reseña
- 1 video por reseña
- Moderación de contenido multimedia
- Thumbnails automáticos

### 3. Interacción Social
- Votos de utilidad ("¿Te resultó útil? Sí/No")
- Ordenamiento por utilidad
- Destacar reseñas más útiles

### 4. Sistema de Moderación
- **Estados**: pendiente, aprobada, rechazada, oculta, destacada
- Cola de moderación para administradores
- Motivo de rechazo registrado
- Reportes de contenido inapropiado

### 5. Respuestas del Vendedor
- Una respuesta oficial por reseña
- Visible debajo de la reseña
- Identificación clara como respuesta de tienda

### 6. Reportes de Contenido
- Motivos: spam, ofensivo, falso, irrelevante, otro
- Cola de revisión para moderadores
- Estados: pendiente, revisado, accion_tomada, ignorado

### 7. Preguntas y Respuestas (Q&A)
- Preguntas públicas sobre productos
- Respuestas de la tienda o comunidad
- Respuesta oficial marcada
- Votos de utilidad en respuestas

### 8. Puntos de Fidelidad
- Puntos por reseña aprobada
- Bonus por incluir fotos/video
- Bonus por reseña verificada

### 9. Estadísticas de Producto
- Promedio de calificación calculado
- Distribución de estrellas (5☆: 60%, 4☆: 25%, etc.)
- Total de reseñas
- Porcentaje de recomendación

## Estructura de Tablas

```
resenas
├── resenas_imagenes
├── resenas_videos
├── resenas_votos
├── resenas_respuestas
└── resenas_reportes
preguntas_productos
├── preguntas_respuestas
│   └── preguntas_respuestas_votos
└── preguntas_reportes
resenas_estadisticas (agregada por producto)
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_crear_resena` | Crea reseña con validaciones |
| `sp_moderar_resena` | Aprueba/rechaza reseña |
| `sp_votar_resena` | Registra voto útil/no útil |
| `sp_responder_resena` | Agrega respuesta de tienda |
| `sp_reportar_resena` | Registra reporte |
| `sp_calcular_estadisticas` | Recalcula promedios |
| `sp_crear_pregunta` | Nueva pregunta de producto |
| `sp_responder_pregunta` | Respuesta a pregunta |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_resenas_pendientes` | Cola de moderación |
| `vista_resenas_destacadas` | Top reseñas por producto |
| `vista_reportes_pendientes` | Reportes por revisar |
| `vista_estadisticas_productos` | Promedios y distribución |
| `vista_preguntas_sin_respuesta` | Q&A pendientes |

## Casos de Uso

### Crear Reseña
```sql
CALL sp_crear_resena(
    :producto_id,
    :variante_id,
    :cliente_id,
    :pedido_id,       -- NULL si no es compra verificada
    5,                -- calificación (1-5)
    'Excelente producto',
    'Superó mis expectativas. La calidad es increíble...',
    4,                -- calificación calidad
    5,                -- calificación precio
    5,                -- calificación envío
    FALSE             -- es anónima
);
```

### Votar Reseña
```sql
CALL sp_votar_resena(
    :resena_id,
    :cliente_id,
    TRUE  -- TRUE = útil, FALSE = no útil
);
```

### Obtener Reseñas de Producto
```sql
SELECT 
    r.*,
    c.nombre_completo AS cliente_nombre,
    c.avatar_url,
    rr.contenido AS respuesta_tienda,
    (SELECT COUNT(*) FROM resenas_imagenes WHERE resena_id = r.id) AS total_imagenes
FROM resenas r
LEFT JOIN clientes c ON r.cliente_id = c.id AND r.es_anonima = FALSE
LEFT JOIN resenas_respuestas rr ON r.id = rr.resena_id
WHERE r.producto_id = :producto_id
AND r.estado = 'aprobada'
ORDER BY r.votos_util DESC, r.creado_en DESC
LIMIT 10;
```

### Obtener Estadísticas de Producto
```sql
SELECT 
    promedio_calificacion,
    total_resenas,
    distribucion_estrellas,  -- JSON: {"5": 60, "4": 25, "3": 10, "2": 3, "1": 2}
    porcentaje_recomendacion
FROM resenas_estadisticas
WHERE producto_id = :producto_id;
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_verificar_compra` | BEFORE INSERT | Marca si es compra verificada |
| `trg_actualizar_estadisticas` | AFTER INSERT/UPDATE | Recalcula promedios |
| `trg_otorgar_puntos` | AFTER UPDATE (→aprobada) | Otorga puntos fidelidad |
| `trg_notificar_respuesta` | AFTER INSERT | Notifica al cliente |

## Eventos Programados

| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_recalcular_estadisticas` | Diario | Actualiza promedios |
| `evento_limpiar_reportes_viejos` | Semanal | Archiva reportes procesados |
| `evento_destacar_resenas` | Semanal | Selecciona reseñas destacadas |

## Reglas de Negocio

### Elegibilidad para Reseñar
1. Una reseña por producto/cliente (o por variante si aplica)
2. Puede editar su reseña (se marca como editada)
3. Solo clientes registrados (puede ser anónima)

### Puntos por Reseña
| Condición | Puntos |
|-----------|--------|
| Reseña básica aprobada | 10 |
| Con 1+ imagen | +5 |
| Con video | +10 |
| Compra verificada | +5 |
| Reseña >100 palabras | +5 |

### Criterios de Moderación
- **Aprobar**: Contenido relevante, respetuoso, relacionado al producto
- **Rechazar**: Spam, lenguaje ofensivo, contenido falso, irrelevante
- **Ocultar**: Contenido previamente aprobado pero reportado

## Cálculo de Promedio

```sql
-- Promedio ponderado por relevancia
promedio = (
    SUM(calificacion * (1 + LOG(1 + votos_util))) / 
    SUM(1 + LOG(1 + votos_util))
);

-- O promedio simple
promedio = AVG(calificacion);
```

## Distribución de Estrellas

```sql
-- Genera JSON con distribución porcentual
SELECT JSON_OBJECT(
    '5', ROUND(SUM(calificacion = 5) / COUNT(*) * 100),
    '4', ROUND(SUM(calificacion = 4) / COUNT(*) * 100),
    '3', ROUND(SUM(calificacion = 3) / COUNT(*) * 100),
    '2', ROUND(SUM(calificacion = 2) / COUNT(*) * 100),
    '1', ROUND(SUM(calificacion = 1) / COUNT(*) * 100)
) AS distribucion
FROM resenas
WHERE producto_id = :producto_id AND estado = 'aprobada';
```

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 4 | Reseñas pertenecen a productos |
| Fase 5 | Clientes escriben reseñas |
| Fase 6 | Verificación de compra por pedido |
| Fase 8 | Notificaciones de respuestas |

## Consideraciones de Rendimiento

1. **Estadísticas pre-calculadas**: Evita COUNT/AVG en cada vista
2. **Índice en producto_id + estado**: Consultas frecuentes
3. **Caché de distribución**: JSON calculado periódicamente
4. **Paginación obligatoria**: Máximo 20 reseñas por página

## Verificación Post-Instalación

```sql
-- Verificar tablas de reseñas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND (table_name LIKE 'resenas%' OR table_name LIKE 'preguntas%');

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name LIKE 'sp_%resena%';
```

## Archivo SQL

- **Nombre**: `7-fase-(24-01-2026)-v1-5293.sql`
- **Líneas**: ~1,150
- **Dependencias**: Fases 1-6 instaladas
- **Script verificación**: `7-fase-verificacion.sql`
