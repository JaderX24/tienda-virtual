---
applyTo: '**'
---

# Requisitos Obligatorios del Proyecto

Documento normativo que establece los estándares de desarrollo. El incumplimiento de estas directrices puede generar inconsistencias, vulnerabilidades de seguridad y problemas legales para la empresa.

## 1. Idioma y Localización

### 1.1 Idioma Oficial: Español
Todo el código, documentación e interfaz de usuario debe estar en español. 

**Aplica a:**
- Nombres de variables, funciones, métodos y clases
- Comentarios en el código
- Mensajes de error y validación
- Textos de interfaz: labels, placeholders, tooltips, botones, títulos, modales, toasts
- Documentación técnica y de usuario
- Commits y descripciones de PR

**Excepciones permitidas:**
- Identificadores de bibliotecas externas (Angular, Bootstrap, etc.)
- Palabras técnicas sin traducción clara (API, HTTP, token, hash)
- Convenciones del framework que requieren inglés (ngIf, ngFor, etc.)

### 1.2 Configuración Regional
- Zona horaria: America/Tegucigalpa (UTC-6)
- Formato de fecha: dd/MM/yyyy
- Formato de hora: HH:mm:ss (24 horas)
- Moneda: Lempira (HNL) con símbolo L
- Separador decimal: punto (.)
- Separador de miles: coma (,)
- Codificación de archivos: UTF-8 sin BOM

## 2. Stack Tecnológico Obligatorio

### 2.1 Frontend
- **Framework:** Angular 17+ (standalone components preferido)
- **UI Framework:** Bootstrap 5.3+ (obligatorio, sin excepciones)
- **Iconos:** Bootstrap Icons
- **Estilos:** SCSS separado por componente
- **HTTP Client:** HttpClient de Angular con interceptores

### 2.2 Backend
- **Runtime:** Node.js 18+ LTS
- **Framework:** NestJS (arquitectura modular empresarial)
- **Lenguaje:** TypeScript estricto (strict mode obligatorio)
- **ORM:** Prisma (tipado fuerte, migraciones versionadas)
- **Autenticación:** JWT con refresh tokens
- **Hash contraseñas:** bcrypt (mínimo 12 rounds)
- **Documentación API:** Swagger/OpenAPI
- **Seguridad HTTP:** Helmet, CORS configurado
- **Variables de entorno:** dotenv (.env nunca en repositorio)

### 2.3 Base de Datos
- **Motor:** MySQL 8.0+
- **ORM:** Prisma con migraciones versionadas
- **Transacciones:** Obligatorias para operaciones críticas (pedidos, pagos)
- **Índices:** Obligatorios en campos de búsqueda frecuente
- **Backups:** Configuración de respaldos automáticos

### 2.4 Componentes Globales del Proyecto
Utilizar siempre los componentes existentes:
- Modal global para confirmaciones y formularios
- Toast global para notificaciones
- Loader global para estados de carga
- Interceptores HTTP para manejo de errores

**Prohibido:** Crear modales, toasts o loaders individuales por componente.

## 3. Estándares de Código

### 3.1 Estructura y Organización
- Archivos SCSS separados del componente TypeScript
- Archivos de lógica JS/TS separados del HTML
- Un componente por archivo
- Máximo 300 líneas por archivo (refactorizar si se excede)
- Funciones con máximo 50 líneas (dividir si se excede)

### 3.2 Nomenclatura

**Variables y funciones:** camelCase en español
```typescript
const usuarioActivo = true;
function obtenerProductos() {}
```

**Clases y componentes:** PascalCase en español
```typescript
class ServicioUsuarios {}
@Component() class ListaProductosComponent {}
```

**Constantes:** SCREAMING_SNAKE_CASE en español
```typescript
const TIEMPO_SESION_MINUTOS = 30;
```

**Archivos:** kebab-case en español
```
lista-productos.component.ts
servicio-usuarios.service.ts
```

### 3.3 Condicionales y Control de Flujo
- Preferir `if/else if/else` sobre `switch` cuando sea posible
- Evitar anidación excesiva (máximo 3 niveles)
- Usar early return para reducir anidación
- Condiciones complejas extraerlas a variables con nombre descriptivo

### 3.4 Comentarios

**Permitido:**
- Comentarios breves que expliquen lógica compleja
- TODO con ticket o razón específica

**Prohibido:**
- Comentarios en inglés
- Comentarios obvios o redundantes
- Bloques de asteriscos, guiones o símbolos decorativos
- Comentarios tipo JSDoc extensos con @param, @return
- Código comentado (eliminar, no comentar)
- Comentarios como "tu me pediste esto" o similares
- Comentarios que expliquen lo que el código ya dice claramente

**Ejemplo correcto:**
```typescript
// Validar stock antes de agregar al carrito
if (producto.stock < cantidad) {
    return this.mostrarError('Stock insuficiente');
}
```

## 4. Bootstrap 5 - Uso Obligatorio

### 4.1 Componentes que DEBEN usar Bootstrap
- Botones: `btn btn-primary`, `btn btn-secondary`, etc.
- Formularios: `form-control`, `form-label`, `form-select`
- Tablas: `table table-striped table-hover`
- Cards: `card`, `card-header`, `card-body`
- Modales: Usar el modal global del proyecto
- Alertas y toasts: Usar el toast global del proyecto
- Grid: `container`, `row`, `col-*`
- Navegación: `navbar`, `nav`, `nav-item`

### 4.2 Clases de Utilidad Obligatorias
- Espaciado: `m-*`, `p-*`, `mt-*`, `mb-*`, `mx-*`, `my-*`
- Flexbox: `d-flex`, `justify-content-*`, `align-items-*`
- Display: `d-none`, `d-block`, `d-*-none`
- Texto: `text-center`, `text-start`, `text-end`, `fw-bold`
- Colores: `text-primary`, `text-danger`, `bg-light`

### 4.3 Diseño Responsivo
Breakpoints obligatorios a considerar:
- `xs`: < 576px (móvil)
- `sm`: ≥ 576px
- `md`: ≥ 768px (tablet)
- `lg`: ≥ 992px (desktop)
- `xl`: ≥ 1200px
- `xxl`: ≥ 1400px

**Toda vista debe ser funcional en móvil y desktop.**

### 4.4 Prohibiciones de Estilo
- No usar CSS inline en HTML
- No sobrescribir variables de Bootstrap sin justificación
- No crear clases CSS que dupliquen utilidades de Bootstrap
- No usar `!important` excepto casos extremos documentados

## 5. Seguridad (Sin Excepciones)

### 5.1 Entrada de Datos
- Validar TODA entrada del usuario en frontend Y backend
- Sanitizar datos antes de mostrar (prevenir XSS)
- Usar prepared statements para TODA consulta SQL
- Validar tipos de datos, longitud y formato
- Escapar caracteres especiales en HTML

### 5.2 Autenticación y Sesiones
- Tokens con expiración obligatoria
- CSRF token en formularios
- Rate limiting en endpoints sensibles
- Mensajes de error genéricos (no revelar información)

### 5.3 Manejo de Errores
- Capturar todas las excepciones
- Mostrar mensajes amigables al usuario
- Registrar errores técnicos en logs (sin datos sensibles)
- Nunca mostrar stack traces en producción

## 6. Calidad y Mantenibilidad

### 6.1 Antes de Cada Commit
- Código compila sin errores
- Lint sin warnings críticos
- Funcionalidad probada manualmente
- Sin console.log de debug
- Sin código comentado

### 6.2 Reutilización
- Crear servicios para lógica compartida
- Usar pipes para transformaciones repetitivas
- Centralizar constantes y configuraciones
- Usar los helpers existentes del proyecto

### 6.3 Performance
- Lazy loading para módulos grandes
- Paginación en listados (+20 items)
- Optimizar imágenes antes de subir
- Evitar llamadas HTTP innecesarias

## 7. Comunicación y Contexto

### 7.1 Rol del Asistente IA
El código generado debe parecer escrito por un desarrollador senior de la empresa:
- Sin referencias a "como me pediste" o "según tu solicitud"
- Código profesional y auto-explicativo
- Decisiones técnicas justificadas implícitamente
- Estilo consistente con el resto del proyecto

### 7.2 Documentación de Cambios
- Commits descriptivos en español
- PR con descripción del cambio y razón
- Actualizar README si aplica

## 8. Checklist de Validación

Antes de considerar una tarea completada:

- [ ] Código en español (variables, funciones, comentarios)
- [ ] Bootstrap 5 usado correctamente
- [ ] Vista responsiva (móvil y desktop)
- [ ] Validaciones de entrada implementadas
- [ ] Errores manejados apropiadamente
- [ ] Modal/Toast global usado (no crear nuevos)
- [ ] Sin console.log de debug
- [ ] Sin código comentado
- [ ] Sin comentarios innecesarios
- [ ] Funcionalidad probada

---

**Este documento es de cumplimiento obligatorio. Las desviaciones requieren aprobación documentada.**
