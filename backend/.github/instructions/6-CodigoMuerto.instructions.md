---
applyTo: '**'
---

# Detección y Eliminación de Código Muerto

**DOCUMENTO DE CUMPLIMIENTO OBLIGATORIO**

Este documento establece las reglas para identificar y eliminar código muerto, inútil o sin uso en el proyecto. El código muerto aumenta la complejidad, confunde al equipo, dificulta el mantenimiento y puede ocultar vulnerabilidades de seguridad.

**Principio rector:** Si no se ejecuta, no se importa o no tiene consumidor — se elimina.

---

## Definición de Código Muerto

Código muerto es todo artefacto que existe en el repositorio pero que **no contribuye** al funcionamiento actual de la aplicación. Incluye:

| Tipo | Ejemplo | Riesgo |
|------|---------|--------|
| Archivos sin importar | Servicio definido pero nunca inyectado | Confusión, falsa sensación de funcionalidad |
| Exports sin consumidor | Constante exportada que nadie importa | Aumenta superficie de código sin valor |
| Funciones/métodos sin llamar | Método helper que ningún otro método invoca | Mantenimiento innecesario |
| Variables declaradas sin leer | `const config = {...}` que nunca se referencia | Desperdicio, potencial confusión |
| Clases/interfaces sin instanciar | Interface definida pero nunca usada como tipo | Ruido en el proyecto |
| Decoradores sin aplicar | `@MiDecorador()` definido pero nunca puesto en un controlador | Falsa sensación de protección |
| Guards sin usar | Guard definido pero nunca en `@UseGuards()` | **Brecha de seguridad**: creer que hay protección cuando no la hay |
| Imports sin usar | `import { X } from 'y'` donde X no se referencia | Warning de lint, ruido |
| Código comentado | Bloques de código entre `/* */` o `//` | Usar git para historial, no comentarios |
| Rutas sin componente | Ruta definida en router pero componente eliminado | Error en runtime |
| Módulos registrados sin uso | Módulo en imports de AppModule que nadie consume | Carga innecesaria |
| Datos mock obsoletos | Arrays de datos de prueba que no se sincronizan con la BD real | Datos incorrectos en fallbacks |

---

## Proceso de Detección

### Paso 1: Identificar el artefacto sospechoso
Antes de eliminar, confirmar que es código muerto mediante verificación exhaustiva.

### Paso 2: Búsqueda de referencias (obligatoria)
Para cada artefacto sospechoso, verificar en **todas** las capas:

```
Backend:
├── Imports directos (import { X } from ...)
├── Imports desde barrels (export * from ... que lo re-exporta)
├── Uso en decoradores (@UseGuards, @Roles, etc.)
├── Uso en módulos (providers, imports, exports de @Module)
├── Uso en tests (*.spec.ts)
└── Uso en seeds o scripts

Frontend:
├── Imports en componentes, servicios, pipes, guards
├── Referencias en templates HTML (directivas, pipes, bindings)
├── Rutas en archivos de routing
├── Providers en app.config.ts o módulos
└── Uso en interceptores
```

### Paso 3: Verificar la cadena completa
Un archivo puede parecer "vivo" porque otro archivo lo importa, pero si ese segundo archivo **tampoco** tiene consumidores, toda la cadena es código muerto.

```
Ejemplo de cadena muerta:
  colab-roles.constant.ts  →  exporta COLAB_ROLES
  colab-roles.decorator.ts →  importa TipoColabRol, define @ColabRoles
  colab-roles.guard.ts     →  importa COLAB_ROLES_KEY, define ColabRolesGuard
  
  Ningún controlador usa @ColabRoles ni ColabRolesGuard
  → TODA la cadena es código muerto
```

### Paso 4: Clasificar por severidad

| Severidad | Criterio | Acción |
|-----------|----------|--------|
| **CRÍTICA** | Guard/middleware de seguridad definido pero no aplicado — da falsa sensación de protección | Eliminar O aplicar donde corresponde |
| **ALTA** | Archivo completo sin ningún consumidor | Eliminar archivo |
| **MEDIA** | Export individual sin consumidor dentro de un archivo útil | Eliminar el export muerto |
| **BAJA** | Import sin usar en un archivo activo | Limpiar import |

---

## Reglas de Eliminación

### Lo que SIEMPRE se elimina

- ❌ Archivos `.ts` sin ningún import/referencia en el proyecto
- ❌ Constantes, interfaces o tipos exportados que nadie importa
- ❌ Decoradores definidos pero nunca aplicados a ningún controlador/método
- ❌ Guards definidos pero nunca usados en `@UseGuards()`
- ❌ Pipes definidos pero nunca usados en templates ni en `@UsePipes()`
- ❌ Interceptores definidos pero nunca registrados
- ❌ Funciones/métodos privados que ningún otro método del mismo archivo llama
- ❌ Variables declaradas pero nunca leídas
- ❌ Código comentado (el historial está en git)
- ❌ Imports sin usar
- ❌ Barrels (index.ts) que re-exportan archivos eliminados

### Lo que NO se elimina sin análisis adicional

- ⚠️ **Providers registrados en módulos**: Aunque no se importen directamente, pueden inyectarse dinámicamente
- ⚠️ **Archivos de configuración** (webpack, angular.json, tsconfig): Pueden tener efectos implícitos
- ⚠️ **Migrations de Prisma**: Nunca eliminar migraciones ya aplicadas
- ⚠️ **Archivos SQL de fases**: Son histórico de la base de datos, se mantienen
- ⚠️ **Archivos .env.example**: Son documentación viva
- ⚠️ **Interfaces usadas solo como tipo de parámetro**: Verificar en toda la cadena

### Lo que NUNCA se elimina

- ✅ Archivos de instrucciones (.instructions.md)
- ✅ Archivos de configuración del proyecto (package.json, tsconfig, etc.)
- ✅ Scripts de BD (carpeta database/)
- ✅ Seeds informativos (aunque sean stubs)
- ✅ Archivos .gitignore, .env.example, README.md

---

## Señales de Alerta (Code Smells)

Si ves alguno de estos patrones, es probable código muerto:

| Patrón | Problema |
|--------|----------|
| Archivo definido + nunca importado | Código muerto completo |
| Guard definido + 0 `@UseGuards` lo usa | **Brecha de seguridad** o código muerto |
| Decorador definido + 0 usos en controladores | Código muerto |
| Constante exportada + 0 imports fuera del archivo | Código muerto |
| Barrel re-exporta archivo que ya se eliminó | Barrel roto |
| Mock data con roles/estados que no existen en la BD | Datos desincronizados |
| Servicio en `providers` de un módulo pero nunca inyectado | Posible código muerto |
| Función `private` sin llamadas dentro de su clase | Código muerto |
| Tipo/interface exportado + nunca usado como anotación | Código muerto |
| Múltiples archivos con lógica duplicada idéntica | Uno de ellos sobra |

---

## Procedimiento de Limpieza

### 1. Antes de eliminar
- Confirmar 0 referencias con búsqueda exhaustiva (grep en todo el proyecto)
- Verificar que no es código que otro desarrollador está trabajando (revisar branches activos)
- Verificar cadena completa de dependencias

### 2. Al eliminar
- Eliminar el archivo o el bloque de código
- Actualizar barrels (index.ts) que lo re-exportaban
- Actualizar módulos (@Module) que lo registraban en providers/imports/exports
- Verificar compilación limpia: `npx tsc --noEmit` (backend), `npx ng build` (frontend)

### 3. Después de eliminar
- Verificar que no aparecen errores de import en ningún archivo
- Verificar compilación de ambos proyectos (backend y frontend)
- No crear documentación markdown sobre lo eliminado

---

## Datos Mock: Caso Especial

Los datos mock (arrays de objetos de prueba usados como fallback cuando fallan peticiones HTTP) son una forma de hardcoding temporal aceptable SOLO si:

1. Son **fallbacks de desarrollo** mientras se implementa el endpoint real
2. Están marcados claramente como temporales
3. Se sincronizan periódicamente con la BD real

**Se convierten en código muerto cuando:**
- El endpoint ya funciona y retorna datos reales
- Los valores del mock no coinciden con los de la BD
- Nadie los mantiene actualizados

**Acción recomendada:** Cuando el endpoint esté funcionando, eliminar el mock y manejar el error mostrando un mensaje al usuario en lugar de datos falsos.

---

## Herramientas de Verificación

### Backend (NestJS)
```bash
# Verificar compilación limpia
npx tsc --noEmit

# Buscar imports de un archivo específico
grep -r "nombre-archivo" backend/src/ --include="*.ts"

# Buscar uso de un export específico
grep -r "NombreExport" backend/src/ --include="*.ts"
```

### Frontend (Angular)
```bash
# Verificar compilación limpia
npx ng build --configuration=development

# Buscar referencias a un componente/servicio
grep -r "NombreComponente\|nombre-componente" frontend/src/ --include="*.ts" --include="*.html"
```

---

## Checklist de Código Limpio

Antes de considerar una tarea de limpieza completada:

- [ ] Todos los archivos sin referencias fueron eliminados
- [ ] Barrels (index.ts) actualizados sin re-exports rotos
- [ ] Módulos actualizados sin providers/imports muertos
- [ ] Compilación backend limpia (`npx tsc --noEmit`)
- [ ] Compilación frontend limpia (`npx ng build`)
- [ ] No hay guards de seguridad definidos pero sin aplicar
- [ ] No hay decoradores definidos pero sin usar
- [ ] No hay imports sin usar en archivos restantes
- [ ] No hay código comentado
- [ ] No hay funciones privadas sin llamadas internas

---

**Este documento es de cumplimiento obligatorio. El código muerto es deuda técnica que se acumula silenciosamente — eliminarlo es tan importante como escribir código nuevo.**

---

*Última actualización: Marzo 2026*
*Versión: 1.0*
*Clasificación: OBLIGATORIO*
