# Fase 2: Gestión de Empresas (Multi-tenancy)

## Descripción General

La Fase 2 establece la arquitectura multi-empresa (multi-tenancy) que permite gestionar múltiples negocios, sucursales o franquicias dentro de una misma instalación de la tienda virtual.

## Características Implementadas

### 1. Tabla Principal: `admin_empresas`
- Gestión completa de empresas con datos fiscales (RTN)
- Tipos de empresa: matriz, sucursal, franquicia, proveedor, aliado
- Jerarquía de empresas (empresa padre/hija)
- Representante legal con datos de contacto
- Geolocalización (latitud/longitud)
- Límites configurables: usuarios, productos, almacenamiento
- Sistema de planes: básico, profesional, empresarial, personalizado
- Branding personalizado: logo, colores primario/secundario

### 2. Configuración Regional
- Moneda principal configurable (default: HNL)
- Zona horaria (default: America/Tegucigalpa)
- Formato de fecha personalizable

### 3. Estados de Empresa
- Activa/Inactiva
- Fecha de activación y suspensión
- Motivo de suspensión registrado

## Estructura de Tablas

```
admin_empresas
├── id (PK)
├── codigo (UNIQUE)
├── nombre, nombre_comercial
├── rtn (UNIQUE)
├── tipo (ENUM)
├── empresa_padre_id (FK → self)
├── contacto (correo, teléfonos, sitio web)
├── dirección completa + geolocalización
├── representante legal
├── configuración regional
├── límites y cuotas
├── estado y suscripción
├── branding
└── auditoría
```

## Casos de Uso

### Multi-empresa
```sql
-- Obtener todas las sucursales de una empresa matriz
SELECT * FROM admin_empresas 
WHERE empresa_padre_id = :empresa_matriz_id;

-- Obtener empresas activas por tipo
SELECT * FROM admin_empresas 
WHERE tipo = 'franquicia' AND es_activa = TRUE;
```

### Validación de Límites
```sql
-- Verificar si empresa puede agregar más usuarios
SELECT 
    (SELECT COUNT(*) FROM admin_usuarios WHERE empresa_id = :id) < limite_usuarios 
    AS puede_agregar_usuario
FROM admin_empresas WHERE id = :id;
```

## Relaciones con Otras Fases

| Fase | Relación |
|------|----------|
| Fase 1 | Usuarios administrativos pertenecen a una empresa |
| Fase 4 | Productos y marcas pueden ser globales o por empresa |
| Fase 6 | Pedidos asociados a empresa |

## Índices Creados

- `idx_codigo` - Búsqueda rápida por código
- `idx_nombre` - Búsqueda por nombre
- `idx_activa` - Filtrar empresas activas
- `idx_tipo` - Filtrar por tipo de empresa
- `idx_empresa_padre` - Consultas jerárquicas
- `idx_pais_ciudad` - Búsquedas geográficas

## Consideraciones de Seguridad

1. **Aislamiento de datos**: Cada empresa solo ve sus propios datos
2. **RTN único**: Previene duplicación de empresas
3. **Auditoría completa**: Registro de quién crea/modifica

## Verificación Post-Instalación

```sql
-- Verificar tabla creada
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'tienda_virtual' 
AND table_name = 'admin_empresas';

-- Verificar columnas principales
DESCRIBE admin_empresas;
```

## Archivo SQL

- **Nombre**: `2-fase-(24-01-2026)-v1-6544.sql`
- **Líneas**: ~553
- **Dependencias**: Fase 1 debe estar instalada
