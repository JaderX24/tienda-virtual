---
applyTo: '**'
---

# Prohibición de Datos Hardcodeados

**DOCUMENTO DE CUMPLIMIENTO OBLIGATORIO**

Este documento establece las reglas para eliminar y prevenir cualquier dato hardcodeado en el proyecto. Todo valor dinámico, configurable o que pueda cambiar con el tiempo DEBE provenir de una fuente de datos externa (base de datos, variables de entorno o configuración centralizada).

**Principio rector:** Si un valor puede cambiar sin modificar código, NO debe estar en el código.

---

## Regla General

**NUNCA hardcodear datos que representen:**
- Opciones de formularios (selects, radios, checkboxes)
- Listas de valores (estados, tipos, categorías)
- Configuraciones del sistema (tiempos, límites, tamaños)
- Textos o etiquetas que el administrador podría querer modificar
- Credenciales, URLs, puertos o datos de conexión
- Precios, tasas, montos o valores financieros
- Permisos, roles o reglas de negocio

---

## Fuentes de Datos Permitidas

### 1. Tabla `catalogos` (Catálogos Dinámicos)
**Usar para:** Opciones de selects, tipos, estados, listas de valores, clasificaciones.

```typescript
// ✅ CORRECTO — Leer opciones desde la base de datos
const tipos = await this.prisma.catalogo.findMany({
    where: { grupo: 'tiposNegocio', activo: true },
    orderBy: { orden: 'asc' },
});

// ✅ CORRECTO — Validar con decorador dinámico
@EsCatalogoValido('tiposNegocio', { message: 'Tipo de negocio no válido' })
tipoNegocio: string;

// ❌ PROHIBIDO — Listas hardcodeadas
const TIPOS_NEGOCIO = ['tienda_ropa', 'restaurante', 'supermercado'];

// ❌ PROHIBIDO — Validar contra constantes
@IsIn(['tienda_ropa', 'restaurante', 'supermercado'])
tipoNegocio: string;
```

**Grupos de catálogos existentes:** tiposNegocio, planesSuscripcion, rangosEmpleados, tiposTienda, estadosTienda, tiposContrato, generos, metodos2fa, tiposProveedorEnvio, tiposServicioEnvio, zonasCobertura, tiposPasarela, modosIntegracion, departamentos, paises, monedas, zonasHorarias.

**Para agregar nuevos catálogos:**
1. Agregar registros al seed (`backend/prisma/seed.ts`) en el array `catalogos`
2. Ejecutar el seed: `npm run prisma:seed`
3. Usar `@EsCatalogoValido('nuevoGrupo')` en los DTOs
4. Consumir desde el endpoint GET `/api/v1/admin/opciones/:grupo`

### 2. Tabla `parametro_sistema` (Parámetros del Sistema)
**Usar para:** Configuraciones del sistema, límites, tiempos, flags de funcionalidad.

```typescript
// ✅ CORRECTO — Leer parámetros desde la base de datos
const maxIntentos = await this.parametrosService.obtener('INTENTOS_MAXIMOS_LOGIN');

// ❌ PROHIBIDO — Valores mágicos en el código
const MAX_INTENTOS = 5;
if (intentos >= 5) { ... }
```

### 3. Variables de Entorno (`.env`)
**Usar para:** Credenciales, URLs, configuración de infraestructura, datos sensibles.

```typescript
// ✅ CORRECTO — Usar ConfigService de NestJS
const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

// ❌ PROHIBIDO — Acceso directo o hardcodeado
const secret = process.env.JWT_ACCESS_SECRET;
const secret = 'mi-clave-secreta-123';
```

### 4. Constantes de Código (Uso Muy Limitado)
**Usar SOLO para:** Valores que NUNCA cambian y son inherentes al lenguaje/framework.

```typescript
// ✅ PERMITIDO — Constantes técnicas inmutables
const MILISEGUNDOS_POR_SEGUNDO = 1000;
const CODIGO_HTTP_OK = 200;
const FORMATO_FECHA = 'dd/MM/yyyy';

// ❌ PROHIBIDO — Datos de negocio como constantes
const TIPOS_NEGOCIO = ['tienda_ropa', 'restaurante'];
const DEPARTAMENTOS = ['Francisco Morazán', 'Cortés'];
const PLANES = ['basico', 'profesional', 'empresarial'];
```

---

## Reglas por Capa

### Backend (NestJS)

#### DTOs y Validación
- Usar `@EsCatalogoValido('grupo')` para validar contra catálogos de la BD
- NO usar `@IsIn([...])` con arrays hardcodeados de opciones de negocio
- `@IsIn()` solo se permite para valores técnicos fijos (ej: `['asc', 'desc']` para ordenamiento)

#### Servicios
- Leer opciones y configuraciones desde la BD o ConfigService
- NO declarar arrays de opciones o mapas de configuración en el código
- Cachear resultados de BD cuando sea apropiado (TTL máximo 5 minutos)

#### Controladores
- Las respuestas con listas de opciones deben venir de la BD
- NO construir respuestas con datos estáticos

### Frontend (Angular)

#### Componentes
- Cargar opciones de formularios desde el servicio `OpcionesCatalogoService`
- NO declarar arrays de opciones en los componentes
- Usar signals para manejar el estado de las opciones cargadas

```typescript
// ✅ CORRECTO — Opciones desde servicio
readonly tiposNegocio = this.opcionesService.obtenerOpciones('tiposNegocio');

// ❌ PROHIBIDO — Opciones hardcodeadas en el componente
tiposNegocio = [
    { valor: 'tienda_ropa', etiqueta: 'Tienda de Ropa' },
    { valor: 'restaurante', etiqueta: 'Restaurante' },
];
```

#### Templates
- Iterar sobre opciones del servicio, no sobre arrays locales
- Los textos de interfaz que deben ser configurables van en parámetros del sistema

### Estilos y Estados Visuales
- Los mapeos estado→clase CSS se centralizan en `EstadoVisualizacionService`
- Usar los pipes `ClaseEstadoPipe`, `EtiquetaEstadoPipe`, `IconoEstadoPipe`
- NO escribir mapeos manuales en cada componente

```typescript
// ✅ CORRECTO — Pipe centralizado
<span [class]="estado | claseEstado:'pedidos'">{{ estado | etiquetaEstado:'pedidos' }}</span>

// ❌ PROHIBIDO — Mapeo manual en cada componente
obtenerClase(estado: string) {
    if (estado === 'activo') return 'badge bg-success';
    if (estado === 'inactivo') return 'badge bg-danger';
}
```

---

## Checklist Anti-Hardcodeo

Antes de considerar una tarea completada:

- [ ] No hay arrays de opciones hardcodeados (selects, radios, estados, tipos)
- [ ] No hay `@IsIn([...])` con datos de negocio en DTOs
- [ ] No hay valores de configuración hardcodeados (tiempos, límites, tamaños)
- [ ] No hay credenciales o URLs en el código fuente
- [ ] No hay mapeos estado→CSS duplicados en componentes
- [ ] Las opciones de formularios se cargan desde `OpcionesCatalogoService` o la BD
- [ ] Los parámetros del sistema se leen desde `ParametroSistema` o ConfigService
- [ ] Si se necesita un nuevo catálogo, se agrega al seed y a la BD

---

## Flujo para Agregar Nuevos Datos Dinámicos

### Nuevo catálogo (lista de opciones)
1. Agregar registros al array `catalogos` en `seed.ts`
2. Ejecutar `npm run prisma:seed`
3. Usar `@EsCatalogoValido('nuevoGrupo')` en DTOs del backend
4. Consumir con `opcionesService.obtenerOpciones('nuevoGrupo')` en frontend

### Nuevo parámetro del sistema
1. Agregar al array `parametrosSistema` en `seed.ts`
2. Ejecutar `npm run prisma:seed`
3. Leer con `parametrosService.obtener('CLAVE')` en backend

### Nueva variable de entorno
1. Agregar a `.env` con su valor
2. Agregar a `.env.example` con valor de ejemplo
3. Acceder con `configService.get<tipo>('VARIABLE')` (nunca `process.env`)

---

## Señales de Alerta (Code Smells)

Si ves alguno de estos patrones en el código, es una violación:

| Patrón | Problema | Solución |
|--------|----------|----------|
| `const TIPOS = ['a', 'b', 'c']` | Catálogo hardcodeado | Mover a tabla `catalogos` |
| `@IsIn(['opcion1', 'opcion2'])` | Validación estática | Usar `@EsCatalogoValido()` |
| `if (estado === 'activo') return 'verde'` | Mapeo CSS manual | Usar `EstadoVisualizacionService` |
| `const MAX = 5` (dato de negocio) | Parámetro hardcodeado | Mover a `parametro_sistema` |
| `process.env.VARIABLE` | Acceso directo a env | Usar `ConfigService` |
| `opciones = [{valor: 'x', ...}]` en componente | Select hardcodeado | Usar `OpcionesCatalogoService` |
| `'http://localhost:3000'` en código | URL hardcodeada | Mover a `.env` |

---

**Este documento es de cumplimiento obligatorio. Todo dato dinámico debe provenir de la base de datos, variables de entorno o servicios centralizados.**

---

*Última actualización: Marzo 2026*
*Versión: 1.0*
*Clasificación: OBLIGATORIO*
