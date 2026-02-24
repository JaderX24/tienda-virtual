# Tienda Virtual - Documentación del Proyecto

Plataforma de comercio electrónico empresarial tipo Amazon, desarrollada con Angular 19, NestJS 10 y MySQL 8. Incluye panel administrativo completo, portal de colaboradores, gestión de inventario, pedidos, pagos, envíos y sistema RBAC granular.

**Última actualización:** 24 de febrero de 2026

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Backend - API REST](#backend---api-rest)
- [Frontend - SPA Angular](#frontend---spa-angular)
- [Base de Datos](#base-de-datos)
- [Seguridad](#seguridad)
- [Instalación y Configuración](#instalación-y-configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Variables de Entorno](#variables-de-entorno)
- [Documentación API](#documentación-api)
- [Convenciones del Proyecto](#convenciones-del-proyecto)

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 19.2 | Framework SPA (standalone components) |
| TypeScript | 5.7 | Lenguaje principal con tipado estricto |
| Bootstrap | 5.3 | Framework UI responsivo |
| Bootstrap Icons | 1.13 | Iconografía del sistema |
| SCSS | - | Estilos por componente |
| RxJS | 7.8 | Programación reactiva |
| ngx-toastr | 18.0 | Notificaciones toast globales |
| SweetAlert2 | 11.26 | Modales y confirmaciones |

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18+ LTS | Runtime del servidor |
| NestJS | 10.x | Framework empresarial modular |
| TypeScript | 5.1+ | Lenguaje con strict mode |
| Prisma | 5.8 | ORM con tipado fuerte y migraciones |
| Passport + JWT | 10.x / 4.x | Autenticación con access + refresh tokens |
| bcrypt | 5.1 | Hash de contraseñas (12 rounds) |
| Helmet | 7.1 | Headers de seguridad HTTP |
| Swagger/OpenAPI | 7.1 | Documentación interactiva de la API |
| class-validator | 0.14 | Validación de DTOs |
| class-transformer | 0.5 | Transformación de datos |
| @nestjs/throttler | 5.1 | Rate limiting |
| Nodemailer | 7.x | Envío de correos electrónicos |
| sanitize-html | 2.11 | Sanitización contra XSS |

### Base de Datos

| Tecnología | Versión | Uso |
|---|---|---|
| MySQL | 8.0+ | Motor relacional principal |
| Prisma | 5.8 | ORM, migraciones versionadas, seed |

### Herramientas de Desarrollo

| Herramienta | Uso |
|---|---|
| Git + GitHub | Control de versiones |
| ESLint | Linting de código TypeScript |
| Prettier | Formateo automático |
| Jest | Testing unitario (backend) |
| Karma + Jasmine | Testing unitario (frontend) |
| VS Code | Editor recomendado |

---

## Arquitectura del Proyecto

```
tienda-virtual/
├── backend/          → API REST con NestJS
├── frontend/         → SPA con Angular 19
├── database/         → Scripts SQL por fases
├── docs/             → Documentación técnica
└── .github/          → Instrucciones y estándares
```

El proyecto sigue una **arquitectura modular** en ambas capas:

- **Backend:** Módulos NestJS independientes con Controller + Service + DTOs por dominio
- **Frontend:** Standalone components con lazy loading por ruta
- **Base de datos:** Prisma como ORM con esquema centralizado y migraciones versionadas
- **Comunicación:** API REST con prefijo `/api/v1`, respuestas transformadas globalmente

---

## Estructura de Carpetas

### Backend (`backend/src/`)

```
src/
├── main.ts                         → Bootstrap de la aplicación
├── app.module.ts                   → Módulo raíz con imports globales
├── config/                         → Configuraciones por dominio
│   ├── app.config.ts               → Configuración general de la app
│   ├── database.config.ts          → Conexión a MySQL
│   ├── jwt.config.ts               → Tokens JWT
│   ├── seguridad.config.ts         → CORS, rate limiting, cookies
│   ├── correo.config.ts            → SMTP y notificaciones por correo
│   ├── archivos.config.ts          → Upload de archivos
│   └── swagger.config.ts           → Documentación OpenAPI
├── common/                         → Componentes transversales
│   ├── constants/                  → Constantes del sistema (roles, mensajes, validaciones)
│   ├── decorators/                 → @Roles, @Permisos, @Publico, @UsuarioActual, @Api
│   ├── filters/                    → FiltroExcepcionesGlobal
│   ├── guards/                     → JwtAuthGuard, RolesGuard, PermisosGuard
│   ├── interceptors/               → Logging, Timeout, TransformadorRespuesta
│   ├── middlewares/                → CorrelacionIdMiddleware
│   ├── pipes/                      → ParsearIdPipe, SanitizarHtmlPipe
│   ├── services/                   → Servicios compartidos
│   └── utils/                      → Utilidades generales
├── prisma/                         → Módulo de conexión Prisma
└── modules/                        → Módulos de negocio
    ├── auth/                       → Autenticación (login, registro, JWT, refresh)
    ├── productos/                  → CRUD de productos
    ├── categorias/                 → CRUD de categorías (jerárquicas)
    ├── inventario/                 → Gestión de stock y movimientos
    ├── pedidos/                    → Ciclo de vida de pedidos
    ├── pagos/                      → Procesamiento de pagos
    ├── envios/                     → Logística y transportistas
    ├── notificaciones/             → Sistema de notificaciones
    ├── colaboradoresPortal/        → Portal de colaboradores (pendiente)
    └── admin/                      → Submódulos administrativos
        ├── auth/                   → Autenticación administrativa
        ├── usuarios/               → Gestión de usuarios
        ├── roles/                  → CRUD de roles
        ├── rolesypermisos/         → Asignación de permisos a roles
        ├── permisos/               → Gestión de permisos
        ├── productos/              → Admin de productos
        ├── inventario/             → Admin de inventario
        ├── empresas/               → Gestión de empresas (multitenancy)
        ├── colaboradores/          → Gestión de colaboradores
        ├── colaboradoresRolesPermisos/ → RBAC de colaboradores
        ├── enviosProveedores/      → Gestión de transportistas
        ├── metodosPago/            → Configuración de pasarelas
        ├── tiendas/                → Configuración de tiendas
        └── general/                → Parámetros del sistema
```

### Frontend (`frontend/src/app/`)

```
app/
├── app.component.ts                → Componente raíz
├── app.config.ts                   → Configuración de la aplicación
├── app.routes.ts                   → Rutas principales (lazy loading)
├── inicio/                         → Página de inicio pública
├── core/                           → Servicios e infraestructura global
│   ├── components/                 → Toast global
│   ├── interceptors/               → AuthInterceptor (JWT automático)
│   ├── models/                     → Modelos de autenticación
│   └── services/                   → ToastService
└── modules/
    ├── store/                      → Tienda pública (catálogo, carrito)
    │   ├── store.routes.ts
    │   └── inicio-publico/
    ├── admin/                      → Panel administrativo completo
    │   ├── admin.routes.ts         → Rutas protegidas con guards
    │   ├── auth/                   → Login admin + guards
    │   ├── layout/                 → Header, Sidebar, Footer, LayoutAdmin
    │   ├── dashboard/              → Dashboard principal
    │   ├── productos/              → CRUD de productos
    │   ├── usuarios/               → Gestión de usuarios
    │   ├── roles/                  → Gestión de roles
    │   ├── rolesypermisos/         → Asignación de permisos
    │   ├── colaboradores/          → Gestión de colaboradores
    │   ├── inventario/             → Gestión de inventario
    │   ├── empresas/               → Gestión de empresas
    │   ├── enviosProveedores/      → Gestión de transportistas
    │   ├── metodosPago/            → Configuración de pagos
    │   ├── tiendas/                → Configuración de tiendas
    │   └── general/                → Configuración general
    └── colaboradoresPortal/        → Portal de colaboradores (pendiente)
```

---

## Backend - API REST

### Configuración Global

El backend aplica las siguientes capas globales en `main.ts` y `app.module.ts`:

| Capa | Implementación | Descripción |
|---|---|---|
| Prefijo API | `/api/v1` | Todas las rutas bajo este prefijo |
| Validación | `ValidationPipe` global | Whitelist, forbidNonWhitelisted, transform |
| Rate Limiting | `ThrottlerGuard` global | 100 peticiones / 60 segundos |
| Seguridad HTTP | Helmet | CSP, HSTS, X-Frame-Options, etc. |
| CORS | Configurado por entorno | Orígenes permitidos desde `.env` |
| Filtro de errores | `FiltroExcepcionesGlobal` | Mensajes genéricos al cliente |
| Logging | `LoggingInterceptor` | Registro de peticiones |
| Respuestas | `TransformadorRespuestaInterceptor` | Formato estándar de respuesta |
| Correlación | `CorrelacionIdMiddleware` | ID único por petición para rastreo |
| Timeout | `TimeoutInterceptor` | Control de tiempo máximo por petición |

### Módulos de Negocio

| Módulo | Endpoint Base | Descripción |
|---|---|---|
| Auth | `/api/v1/auth` | Login, registro, refresh token, logout |
| Productos | `/api/v1/productos` | CRUD público y admin de productos |
| Categorías | `/api/v1/categorias` | Gestión de categorías jerárquicas |
| Inventario | `/api/v1/inventario` | Movimientos de stock, alertas de mínimos |
| Pedidos | `/api/v1/pedidos` | Ciclo de vida completo de pedidos |
| Pagos | `/api/v1/pagos` | Procesamiento y reembolsos |
| Envíos | `/api/v1/envios` | Logística, guías, seguimiento |
| Notificaciones | `/api/v1/notificaciones` | Notificaciones en tiempo real |
| Admin | `/api/v1/admin/*` | Todos los submódulos administrativos |

### Guards y Decoradores

| Componente | Tipo | Uso |
|---|---|---|
| `JwtAuthGuard` | Guard | Protección por token JWT |
| `RolesGuard` | Guard | Autorización por rol |
| `PermisosGuard` | Guard | Autorización granular por permiso |
| `@Publico()` | Decorador | Marca un endpoint como público |
| `@Roles()` | Decorador | Requiere roles específicos |
| `@Permisos()` | Decorador | Requiere permisos específicos |
| `@UsuarioActual()` | Decorador | Inyecta el usuario autenticado |

### Pipes Personalizados

| Pipe | Uso |
|---|---|
| `ParsearIdPipe` | Valida y transforma IDs numéricos |
| `SanitizarHtmlPipe` | Sanitiza entrada HTML contra XSS |

---

## Frontend - SPA Angular

### Rutas Principales

| Ruta | Módulo | Descripción |
|---|---|---|
| `/` | Inicio | Página de inicio pública |
| `/tienda/**` | Store | Catálogo público, carrito, checkout |
| `/admin/inicio-sesion` | Admin Auth | Login del panel administrativo |
| `/admin/dashboard` | Admin | Dashboard con estadísticas |
| `/admin/productos` | Admin | CRUD completo de productos |
| `/admin/usuarios` | Admin | Gestión de usuarios del sistema |
| `/admin/roles` | Admin | Gestión de roles |
| `/admin/roles-permisos` | Admin | Asignación de permisos a roles |
| `/admin/colaboradores` | Admin | Gestión de colaboradores |
| `/admin/inventario` | Admin | Control de inventario |
| `/admin/empresas` | Admin | Gestión empresarial (multitenancy) |
| `/admin/configuracion/general` | Admin | Parámetros del sistema |
| `/admin/configuracion/tienda` | Admin | Configuración de tiendas |
| `/admin/configuracion/pagos` | Admin | Métodos de pago |
| `/admin/configuracion/envios` | Admin | Proveedores de envío |

Todas las rutas del panel admin están protegidas con `authAdminGuard`. El login tiene `noAuthAdminGuard` para redirigir usuarios ya autenticados.

### Componentes Globales

| Componente | Uso |
|---|---|
| Toast (ngx-toastr) | Notificaciones tipo toast en toda la app |
| SweetAlert2 | Modales de confirmación y alertas |
| AuthInterceptor | Inyección automática del token JWT en peticiones HTTP |
| Layout Admin | Header + Sidebar + Footer para el panel admin |

---

## Base de Datos

### Esquema de Datos (Prisma)

El esquema se define en `backend/prisma/schema.prisma` con **1122 líneas** y los siguientes módulos:

#### Usuarios y Autenticación
| Tabla | Descripción |
|---|---|
| `usuarios` | Usuarios del sistema (clientes y admins) |
| `roles` | Roles del sistema (admin, cliente, etc.) |
| `permisos` | Permisos granulares por módulo |
| `roles_permisos` | Asignación de permisos a roles (N:M) |
| `sesiones` | Sesiones activas con tokens, IP, user-agent |

#### Catálogo de Productos
| Tabla | Descripción |
|---|---|
| `categorias` | Categorías jerárquicas (padre/hija) con slug |
| `marcas` | Marcas de productos |
| `productos` | Productos con SKU, precio, stock, slug |
| `imagenes_productos` | Galería de imágenes por producto |

#### Inventario
| Tabla | Descripción |
|---|---|
| `movimientos_inventario` | Historial de entradas/salidas de stock |
| `inventario_almacenes` | Almacenes físicos con ubicación |

#### Clientes y Direcciones
| Tabla | Descripción |
|---|---|
| `direcciones` | Direcciones de envío por usuario |

#### Pedidos y Pagos
| Tabla | Descripción |
|---|---|
| `pedidos` | Pedidos con subtotal, impuestos, envío, descuento, total |
| `items_pedido` | Detalle de productos por pedido |
| `pagos` | Registro de pagos con referencia y estado |
| `pagos_pasarelas` | Configuración de pasarelas de pago |

#### Envíos y Logística
| Tabla | Descripción |
|---|---|
| `transportistas` | Proveedores de envío con cobertura y capacidades |
| `contactos_transportista` | Contactos por transportista |
| `envios` | Envíos con guía y estado |
| `seguimiento_envios` | Tracking de paquetes |

#### Notificaciones y Sistema
| Tabla | Descripción |
|---|---|
| `notificaciones` | Notificaciones por usuario |
| `parametros_sistema` | Configuración dinámica del sistema |

#### Empresas (Multitenancy)
| Tabla | Descripción |
|---|---|
| `empresas` | Empresas con RTN, dirección, plan de suscripción |

#### Portal de Colaboradores (Sistema RBAC independiente)
| Tabla | Descripción |
|---|---|
| `colab_usuarios` | Colaboradores con datos laborales completos |
| `colab_modulos` | Módulos del portal (menú jerárquico) |
| `colab_permisos` | Permisos específicos del portal |
| `colab_roles` | Roles de colaboradores |
| `colab_roles_permisos` | Permisos asignados a roles |
| `colab_usuarios_roles` | Roles asignados a colaboradores |
| `colab_usuarios_permisos` | Permisos directos por colaborador |
| `colab_asignaciones_almacen` | Asignación a almacenes |
| `colab_configuracion` | Parámetros del portal |
| `colab_usuarios_historial_contrasenas` | Historial de contraseñas |
| `colab_tokens` | Tokens de verificación/recuperación |
| `colab_dispositivos` | Dispositivos registrados |
| `colab_sesiones` | Sesiones activas con geolocalización |
| `colab_bitacora_seguridad` | Auditoría de eventos de seguridad |
| `colab_turnos` | Control de turnos laborales |
| `colab_actividad_inventario` | Actividad de inventario por colaborador |
| `colab_conteos_inventario` | Conteos de inventario programados |
| `colab_conteos_inventario_detalle` | Detalle de conteos con evidencia |
| `colab_notificaciones` | Notificaciones del portal |

### Scripts SQL por Fases

El directorio `database/` contiene 13 fases de evolución de la base de datos, cada una con su script SQL y script de verificación:

| Fase | Descripción |
|---|---|
| Fase 1 | RBAC - Usuarios, roles y permisos |
| Fase 2 | Empresas y multitenancy |
| Fase 3 | Seguridad y notificaciones |
| Fase 4 | Catálogo de productos |
| Fase 5 | Clientes públicos |
| Fase 6 | Carrito y pedidos |
| Fase 7 | Reseñas y valoraciones |
| Fase 8 | Notificaciones y analytics |
| Fase 9 | Promociones y ofertas |
| Fase 10 | Búsqueda avanzada |
| Fase 11 | Pagos avanzados |
| Fase 12 | Logística avanzada |
| Fase 13 | Portal de colaboradores |

---

## Seguridad

### Capas de Protección Implementadas

| Capa | Tecnología | Detalle |
|---|---|---|
| Autenticación | JWT | Access token (15min) + Refresh token (7d) |
| Hash contraseñas | bcrypt | Mínimo 12 rounds |
| Validación entrada | class-validator | DTOs con whitelist y forbidNonWhitelisted |
| Sanitización | sanitize-html | Prevención XSS en entradas HTML |
| SQL Injection | Prisma | Consultas parametrizadas por defecto |
| Rate Limiting | @nestjs/throttler | 100 req/60s global, límites estrictos en login |
| Headers HTTP | Helmet | CSP, HSTS, X-Frame-Options, noSniff, etc. |
| CORS | NestJS | Orígenes configurables por entorno |
| Errores | FiltroExcepcionesGlobal | Mensajes genéricos, sin stack traces |
| Auditoría | Bitácora | Registro de eventos de seguridad |

### Política de Contraseñas

- Mínimo 12 caracteres
- Al menos 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
- Historial de últimas 5 contraseñas (portal colaboradores)

---

## Instalación y Configuración

### Requisitos Previos

| Software | Versión Mínima |
|---|---|
| Node.js | 18.x LTS |
| npm | 9.x+ |
| MySQL | 8.0+ |
| Angular CLI | 19.x |
| Git | 2.40+ |

### Instalación del Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example` y configurar:
- Conexión a MySQL (`DATABASE_URL`)
- Claves JWT (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- Configuración SMTP, uploads, etc.

```bash
npx prisma generate
npx prisma migrate dev --name inicial
npx prisma db seed
npm run start:dev
```

La API estará disponible en `http://localhost:3000` con Swagger en `http://localhost:3000/api/docs`.

### Instalación del Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

### Credenciales de Desarrollo

| Tipo | Correo | Contraseña |
|---|---|---|
| Admin | admin@tiendavirtual.com | Admin123456! |

---

## Scripts Disponibles

### Backend

| Script | Comando | Descripción |
|---|---|---|
| Desarrollo | `npm run start:dev` | Servidor con hot-reload |
| Debug | `npm run start:debug` | Servidor con debug |
| Producción | `npm run start:prod` | Servidor compilado |
| Build | `npm run build` | Compilar TypeScript |
| Lint | `npm run lint` | Ejecutar ESLint |
| Tests | `npm test` | Ejecutar Jest |
| Tests watch | `npm run test:watch` | Tests en modo watch |
| Prisma generate | `npm run prisma:generate` | Generar cliente Prisma |
| Prisma migrate | `npm run prisma:migrate` | Ejecutar migraciones |
| Prisma studio | `npm run prisma:studio` | UI visual de la BD |
| Seed | `npm run prisma:seed` | Sembrar datos iniciales |

### Frontend

| Script | Comando | Descripción |
|---|---|---|
| Desarrollo | `npm start` | Servidor en `localhost:4200` |
| Build | `npm run build` | Compilación para producción |
| Tests | `npm test` | Ejecutar Karma + Jasmine |
| Watch build | `npm run watch` | Build en modo watch |

---

## Variables de Entorno

Todas las variables se configuran en `backend/.env`. Ver `backend/.env.example` como referencia.

| Grupo | Variables Clave |
|---|---|
| Aplicación | `NOMBRE_APP`, `ENTORNO`, `PUERTO`, `URL_FRONTEND`, `URL_BACKEND`, `ZONA_HORARIA` |
| Base de datos | `DATABASE_URL`, `DB_HOST`, `DB_PUERTO`, `DB_USUARIO`, `DB_CONTRASENA`, `DB_NOMBRE` |
| JWT | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRACION`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRACION` |
| Seguridad | `BCRYPT_ROUNDS`, `RATE_LIMIT_TTL`, `RATE_LIMIT_MAX`, `CORS_ORIGEN` |
| Correo | `SMTP_HOST`, `SMTP_PUERTO`, `SMTP_USUARIO`, `SMTP_CONTRASENA` |
| Archivos | `UPLOAD_DIRECTORIO`, `UPLOAD_TAMANO_MAXIMO`, `UPLOAD_TIPOS_PERMITIDOS` |
| Logs | `LOG_NIVEL`, `LOG_FORMATO`, `LOG_ARCHIVO` |

---

## Documentación API

La documentación Swagger/OpenAPI se genera automáticamente y está disponible en entornos de desarrollo y staging:

```
http://localhost:3000/api/docs
```

Incluye todos los endpoints organizados por módulo, esquemas de DTOs, autenticación JWT y ejemplos de respuesta.

---

## Convenciones del Proyecto

### Idioma

Todo el código, variables, funciones, comentarios, mensajes y documentación están en **español**, con excepciones para identificadores de bibliotecas externas y términos técnicos sin traducción.

### Nomenclatura

| Tipo | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | camelCase (español) | `usuarioActivo`, `obtenerProductos()` |
| Clases y componentes | PascalCase (español) | `ServicioUsuarios`, `ListaProductosComponent` |
| Constantes | SCREAMING_SNAKE_CASE | `TIEMPO_SESION_MINUTOS` |
| Archivos | kebab-case (español) | `lista-productos.component.ts` |
| Tablas BD | snake_case (español) | `movimientos_inventario` |

### Configuración Regional

| Parámetro | Valor |
|---|---|
| Zona horaria | America/Tegucigalpa (UTC-6) |
| Formato de fecha | dd/MM/yyyy |
| Formato de hora | HH:mm:ss (24h) |
| Moneda | Lempira (HNL) - Símbolo: L |
| Separador decimal | Punto (.) |
| Separador de miles | Coma (,) |
| Codificación | UTF-8 sin BOM |

### Reglas de Código

- Máximo 300 líneas por archivo
- Máximo 50 líneas por función
- Máximo 3 niveles de anidación
- Preferir `if/else` sobre `switch`
- Usar early return para reducir anidación
- Bootstrap 5 obligatorio para toda la UI
- Vista responsiva obligatoria (móvil y desktop)
- Usar componentes globales (toast, modal, loader)

---

## Documentación Adicional

La carpeta `docs/` contiene guías detalladas:

| Archivo | Contenido |
|---|---|
| `RequisitosdeInstalacion.md` | Guía paso a paso de instalación |
| `ver-app-en-telefono.md` | Acceso desde dispositivos móviles |
| `arquitectura-basedatos/` | 13 guías por fase del esquema de BD |
| `fases-futuras-pendientes.md` | Roadmap de funcionalidades pendientes |

Las instrucciones del proyecto en `.github/instructions/` contienen:

| Archivo | Contenido |
|---|---|
| `1-Requisitos.instructions.md` | Estándares obligatorios de desarrollo |
| `2-Seguridad.instructions.md` | Guía de seguridad completa |
| `3-VariablesEntorno.instructions.md` | Gestión de variables de entorno |