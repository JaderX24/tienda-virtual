# Fase 10: Búsqueda Avanzada

## Descripción General

La Fase 10 implementa un motor de búsqueda empresarial con autocompletado, sinónimos, filtros facetados, historial de búsquedas, corrección ortográfica y tendencias.

## Características Implementadas

### 1. Índice de Búsqueda
- Índice FULLTEXT optimizado
- Campos indexados: nombre, descripción, marca, categoría, SKU, tags
- Pesos por campo (título > descripción > tags)
- Actualización automática con triggers

### 2. Autocompletado
- Sugerencias en tiempo real
- Basado en productos, categorías, marcas
- Ordenado por popularidad
- Máximo 10 sugerencias
- Respuesta <100ms

### 3. Sistema de Sinónimos
- Grupos de sinónimos (ej: "celular", "teléfono", "móvil")
- Expansión automática de búsqueda
- Sinónimos por categoría
- Administración desde backend

### 4. Filtros Facetados
- Filtros dinámicos según resultados
- **Tipos de filtro**:
  - Categoría
  - Marca
  - Precio (rangos)
  - Calificación
  - Atributos del producto
  - Disponibilidad
  - Ofertas
- Conteo de resultados por filtro

### 5. Corrección Ortográfica
- "¿Quiso decir...?"
- Distancia de Levenshtein
- Diccionario de correcciones comunes
- Aprendizaje de correcciones

### 6. Historial de Búsquedas
- Por cliente (logueado)
- Por sesión (invitado)
- Búsquedas recientes
- Búsquedas guardadas/favoritas

### 7. Tendencias de Búsqueda
- Búsquedas populares (día/semana/mes)
- Búsquedas en ascenso
- Estacionalidad detectada
- Sugerencias basadas en tendencias

### 8. Palabras Excluidas (Stopwords)
- Lista de palabras ignoradas
- Personalizable por idioma
- Ej: "el", "la", "de", "para", "con"

### 9. Palabras Clave (Boost)
- Palabras que aumentan relevancia
- Configurables por producto
- SEO interno

## Estructura de Tablas

```
busqueda_configuracion
busqueda_indices_productos
busqueda_filtros
├── busqueda_filtros_valores
busqueda_sinonimos_grupos
├── busqueda_sinonimos_terminos
busqueda_palabras_excluidas
busqueda_palabras_clave
busqueda_correcciones
busqueda_autocompletado
busqueda_historial
busqueda_guardadas
busqueda_tendencias
busqueda_clicks
```

## Procedimientos Almacenados

| Procedimiento | Función |
|---------------|---------|
| `sp_buscar_productos` | Búsqueda principal con filtros |
| `sp_obtener_sugerencias` | Autocompletado |
| `sp_registrar_busqueda` | Guarda en historial |
| `sp_obtener_filtros_facetados` | Filtros para resultados |
| `sp_busqueda_con_sinonimos` | Expande búsqueda |
| `sp_actualizar_tendencias` | Calcula tendencias |
| `sp_limpiar_historial_antiguo` | Limpieza periódica |

## Funciones Disponibles

| Función | Descripción |
|---------|-------------|
| `fn_expandir_sinonimos(termino)` | Retorna términos sinónimos |
| `fn_calcular_relevancia(...)` | Score de relevancia |
| `fn_corregir_ortografia(termino)` | Sugerencia de corrección |

## Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| `vista_busquedas_populares` | Top búsquedas recientes |
| `vista_sugerencias_activas` | Para autocompletado |
| `vista_sinonimos_activos` | Grupos de sinónimos |
| `vista_filtros_facetados` | Estructura de filtros |
| `vista_tendencias_busqueda` | Búsquedas trending |

## Casos de Uso

### Búsqueda con Filtros
```sql
CALL sp_buscar_productos(
    'laptop gamer',           -- término de búsqueda
    JSON_OBJECT(
        'categoria_id', 5,
        'marca_ids', JSON_ARRAY(1, 2, 3),
        'precio_min', 15000,
        'precio_max', 50000,
        'calificacion_min', 4,
        'solo_disponibles', TRUE,
        'solo_ofertas', FALSE
    ),
    'relevancia',             -- ordenar por
    1,                        -- página
    20,                       -- por página
    :cliente_id               -- para personalización
);
```

### Obtener Autocompletado
```sql
CALL sp_obtener_sugerencias(
    'lapt',                   -- texto parcial
    10,                       -- máximo sugerencias
    :cliente_id               -- para personalización
);

-- Resultado:
-- | tipo      | texto           | relevancia |
-- |-----------|-----------------|------------|
-- | producto  | Laptop HP 15"   | 95         |
-- | producto  | Laptop Lenovo   | 90         |
-- | categoria | Laptops Gaming  | 85         |
-- | marca     | Laptop Dell     | 80         |
-- | busqueda  | laptop barata   | 75         |
```

### Obtener Filtros Facetados
```sql
CALL sp_obtener_filtros_facetados(
    'laptop',                 -- término
    :categoria_id             -- contexto
);

-- Resultado JSON:
{
    "categorias": [
        {"id": 5, "nombre": "Laptops", "cantidad": 150},
        {"id": 6, "nombre": "Accesorios", "cantidad": 45}
    ],
    "marcas": [
        {"id": 1, "nombre": "HP", "cantidad": 45},
        {"id": 2, "nombre": "Dell", "cantidad": 38},
        {"id": 3, "nombre": "Lenovo", "cantidad": 32}
    ],
    "precio": {
        "min": 8000,
        "max": 75000,
        "rangos": [
            {"min": 0, "max": 15000, "cantidad": 25},
            {"min": 15001, "max": 30000, "cantidad": 60},
            {"min": 30001, "max": 50000, "cantidad": 45},
            {"min": 50001, "max": null, "cantidad": 20}
        ]
    },
    "calificacion": [
        {"estrellas": 5, "cantidad": 30},
        {"estrellas": 4, "cantidad": 55}
    ],
    "atributos": {
        "RAM": [
            {"valor": "8GB", "cantidad": 50},
            {"valor": "16GB", "cantidad": 70},
            {"valor": "32GB", "cantidad": 30}
        ],
        "Procesador": [
            {"valor": "Intel i5", "cantidad": 45},
            {"valor": "Intel i7", "cantidad": 60},
            {"valor": "AMD Ryzen", "cantidad": 45}
        ]
    }
}
```

### Registrar Búsqueda
```sql
CALL sp_registrar_busqueda(
    'laptop gamer 16gb',
    :cliente_id,
    :sesion_id,
    45,                       -- resultados encontrados
    JSON_OBJECT(
        'categoria', 5,
        'precio_max', 30000
    )
);
```

## Triggers Implementados

| Trigger | Evento | Función |
|---------|--------|---------|
| `trg_actualizar_indice_producto` | AFTER INSERT/UPDATE | Actualiza índice de búsqueda |
| `trg_click_conversion` | AFTER INSERT | Registra clic en resultado |
| `trg_incrementar_popularidad` | AFTER INSERT (búsqueda) | Suma a tendencias |

## Eventos Programados

| Evento | Frecuencia | Función |
|--------|------------|---------|
| `evento_actualizar_tendencias` | Cada hora | Recalcula tendencias |
| `evento_limpiar_historial` | Diario | Elimina historial >90 días |
| `evento_recalcular_popularidad` | Diario | Actualiza scores |

## Algoritmo de Relevancia

```sql
-- Factores de relevancia (ejemplo simplificado)
relevancia = 
    (coincidencia_titulo * 10) +
    (coincidencia_descripcion * 3) +
    (coincidencia_tags * 5) +
    (popularidad_producto * 2) +
    (calificacion_promedio * 1.5) +
    (tiene_stock * 5) +
    (es_destacado * 3) -
    (dias_sin_venta / 10);
```

## Configuración del Motor

```sql
-- Configuración por defecto
INSERT INTO busqueda_configuracion (clave, valor, tipo_dato) VALUES
('resultados_por_pagina', '20', 'numero'),
('max_sugerencias', '10', 'numero'),
('min_caracteres_busqueda', '2', 'numero'),
('usar_sinonimos', 'true', 'booleano'),
('usar_correccion', 'true', 'booleano'),
('peso_titulo', '10', 'numero'),
('peso_descripcion', '3', 'numero'),
('peso_tags', '5', 'numero'),
('dias_tendencia', '7', 'numero');
```

## Sinónimos Predefinidos

```sql
-- Grupo: dispositivos móviles
INSERT INTO busqueda_sinonimos_grupos (nombre) VALUES ('dispositivos_moviles');
INSERT INTO busqueda_sinonimos_terminos (grupo_id, termino) VALUES
(:grupo_id, 'celular'),
(:grupo_id, 'teléfono'),
(:grupo_id, 'móvil'),
(:grupo_id, 'smartphone');

-- Grupo: computadoras
INSERT INTO busqueda_sinonimos_grupos (nombre) VALUES ('computadoras');
INSERT INTO busqueda_sinonimos_terminos (grupo_id, termino) VALUES
(:grupo_id, 'computadora'),
(:grupo_id, 'computador'),
(:grupo_id, 'pc'),
(:grupo_id, 'ordenador');
```

## Palabras Excluidas (Español)

```sql
INSERT INTO busqueda_palabras_excluidas (palabra) VALUES
('el'), ('la'), ('los'), ('las'), ('un'), ('una'),
('de'), ('del'), ('al'), ('a'), ('en'), ('con'),
('para'), ('por'), ('que'), ('es'), ('son'), ('y'),
('o'), ('pero'), ('como'), ('más'), ('muy');
```

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 4 | Indexa productos y categorías |
| Fase 5 | Historial por cliente |
| Fase 7 | Filtro por calificación |
| Fase 9 | Filtro "en oferta" |

## Consideraciones de Rendimiento

1. **Índice FULLTEXT**: Búsqueda rápida en texto
2. **Caché de sugerencias**: Top 1000 pre-calculadas
3. **Filtros pre-agregados**: Conteos listos
4. **Límite de resultados**: Máximo 1000
5. **Paginación obligatoria**: No cargar todo

## Verificación Post-Instalación

```sql
-- Verificar tablas de búsqueda
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND table_name LIKE 'busqueda_%';

-- Verificar índice FULLTEXT
SHOW INDEX FROM busqueda_indices_productos 
WHERE Index_type = 'FULLTEXT';

-- Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'tienda_virtual' 
AND Name LIKE 'sp_%busca%';

-- Verificar eventos
SELECT event_name, status FROM information_schema.events 
WHERE event_schema = 'tienda_virtual'
AND event_name LIKE 'evento_%tendencia%';
```

## Archivo SQL

- **Nombre**: `10-fase-(24-01-2026)-v1-4127.sql`
- **Líneas**: ~1,202
- **Dependencias**: Fases 1-9 instaladas
- **Script verificación**: `10-fase-verificacion.sql`
