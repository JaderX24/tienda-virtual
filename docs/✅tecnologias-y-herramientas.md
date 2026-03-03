# Tecnologías y Herramientas del Proyecto - Tienda Virtual

Documento que detalla todas las tecnologías, frameworks, bibliotecas y herramientas utilizadas en el desarrollo de la Tienda Virtual.

---

## 1. Frontend

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Angular** | 19.2+ | Framework principal para la interfaz de usuario (standalone components) |
| **TypeScript** | 5.7+ | Lenguaje de programación con tipado estricto |
| **Bootstrap** | 5.3 | Framework CSS para diseño responsivo y componentes de UI |
| **Bootstrap Icons** | 1.13+ | Biblioteca de iconos SVG |
| **SCSS** | - | Preprocesador CSS (un archivo por componente) |
| **RxJS** | 7.8 | Programación reactiva y manejo de flujos asíncronos |
| **Zone.js** | 0.15 | Detección de cambios en Angular |
| **ngx-toastr** | 18.0 | Notificaciones toast globales |
| **SweetAlert2** | 11.26+ | Modales y diálogos de confirmación |
| **Popper.js** | 2.11+ | Posicionamiento de tooltips y popovers (dependencia de Bootstrap) |

### Herramientas de desarrollo frontend

| Herramienta | Versión | Descripción |
|-------------|---------|-------------|
| **Angular CLI** | 19.2+ | Interfaz de línea de comandos para gestión del proyecto Angular |
| **Karma** | 6.4 | Ejecutor de pruebas unitarias |
| **Jasmine** | 5.6 | Framework de pruebas unitarias |
| **karma-chrome-launcher** | 3.2 | Lanzador de Chrome para pruebas |
| **karma-coverage** | 2.2 | Reporte de cobertura de código |

### Configuración destacada del frontend

- **Localización:** es-HN (español Honduras)
- **Interceptores HTTP:** Manejo centralizado de autenticación
- **Arquitectura:** Standalone components con lazy loading
- **Estilos globales:** Bootstrap SCSS + Bootstrap Icons + ngx-toastr CSS

---

## 2. Backend

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Node.js** | 18+ LTS | Runtime de JavaScript en el servidor |
| **NestJS** | 10+ | Framework empresarial modular basado en decoradores |
| **TypeScript** | 5.1+ | Lenguaje con tipado estricto (strict mode obligatorio) |
| **Prisma** | 5.8+ | ORM con tipado fuerte y migraciones versionadas |
| **Passport** | 0.7 | Middleware de autenticación |
| **passport-jwt** | 4.0+ | Estrategia JWT para Passport |
| **@nestjs/jwt** | 10.2 | Módulo JWT integrado para NestJS |
| **bcrypt** | 5.1+ | Hashing de contraseñas (mínimo 12 rounds) |
| **Helmet** | 7.1 | Headers de seguridad HTTP |
| **class-validator** | 0.14 | Validación de DTOs con decoradores |
| **class-transformer** | 0.5 | Transformación y serialización de objetos |
| **sanitize-html** | 2.11 | Sanitización de HTML para prevención de XSS |
| **nodemailer** | 7.0+ | Envío de correos electrónicos vía SMTP |
| **@nestjs/throttler** | 5.1+ | Rate limiting para protección contra abuso |
| **@nestjs/config** | 3.1+ | Gestión de variables de entorno |
| **@nestjs/swagger** | 7.1+ | Documentación automática de API con OpenAPI/Swagger |
| **RxJS** | 7.8+ | Programación reactiva (core de NestJS) |
| **reflect-metadata** | 0.1 | Soporte de metadatos para decoradores |

### Herramientas de desarrollo backend

| Herramienta | Versión | Descripción |
|-------------|---------|-------------|
| **NestJS CLI** | 10+ | Generación de código y gestión del proyecto NestJS |
| **Prisma CLI** | 5.8+ | Migraciones, generación de cliente y Prisma Studio |
| **ESLint** | 8.42+ | Análisis estático de código |
| **Prettier** | 3.0+ | Formateo automático de código |
| **Jest** | 29.5 | Framework de pruebas unitarias y e2e |
| **ts-jest** | 29.1 | Transformador de TypeScript para Jest |
| **ts-node** | 10.9 | Ejecución de TypeScript sin compilación previa |
| **source-map-support** | 0.5 | Mapeo de errores al código fuente original |

### Arquitectura del backend

- **Patrón:** Arquitectura modular empresarial (módulos NestJS)
- **Prefijo API:** `/api/v1`
- **Seguridad global:** ThrottlerGuard, FiltroExcepcionesGlobal, Helmet, CORS
- **Interceptores:** LoggingInterceptor, TransformadorRespuestaInterceptor
- **Middlewares:** CorrelacionIdMiddleware
- **Guards:** JwtAuthGuard, RolesGuard

---

## 3. Base de Datos

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **MySQL** | 8.0+ | Motor de base de datos relacional |
| **mysql2** | 3.16+ | Driver nativo de MySQL para Node.js |
| **Prisma ORM** | 5.8+ | ORM con migraciones versionadas y tipado fuerte |

### Características de la base de datos

- **Transacciones:** Obligatorias para operaciones críticas (pedidos, pagos, inventario)
- **Índices:** En campos de búsqueda frecuente
- **Modelos principales:** Usuario, Rol, Permiso, Sesión, Categoría, Producto, Pedido, entre otros
- **Convención de mapeo:** snake_case en tablas y columnas de MySQL, camelCase en Prisma

---

## 4. Seguridad

| Componente | Tecnología | Descripción |
|------------|------------|-------------|
| **Autenticación** | JWT (Access + Refresh tokens) | Tokens con expiración y rotación |
| **Hash de contraseñas** | bcrypt (12 rounds) | Hashing seguro de contraseñas |
| **Validación de entrada** | class-validator + ValidationPipe | Validación global en todos los DTOs |
| **Sanitización** | sanitize-html | Prevención de XSS |
| **Headers HTTP** | Helmet | CSP, HSTS, X-Frame-Options, etc. |
| **Rate limiting** | @nestjs/throttler | Protección contra fuerza bruta y abuso |
| **CORS** | NestJS enableCors | Origen configurado por variable de entorno |
| **Consultas SQL** | Prisma (parametrizadas) | Prevención de SQL Injection |

---

## 5. Documentación

| Herramienta | Descripción |
|-------------|-------------|
| **Swagger / OpenAPI** | Documentación interactiva de la API (disponible en `/api/docs`) |
| **Markdown** | Documentación técnica del proyecto en `/docs` |
| **Prisma Studio** | Explorador visual de la base de datos |

---

## 6. Gestión de Configuración

| Herramienta | Descripción |
|-------------|-------------|
| **dotenv** (.env) | Variables de entorno para credenciales y configuración |
| **@nestjs/config** | Carga y validación de variables de entorno en NestJS |
| **environments/** (Angular) | Configuración por ambiente en el frontend |

---

## 7. Control de Versiones y Repositorio

| Herramienta | Descripción |
|-------------|-------------|
| **Git** | Control de versiones |
| **GitHub** | Repositorio remoto y gestión de código |

---

## 8. Estructura General del Proyecto

```
tienda-virtual/
├── backend/                  # API REST con NestJS
│   ├── prisma/               # Esquema, migraciones y seeds
│   └── src/
│       ├── common/           # Guards, filtros, interceptores, pipes, middlewares
│       ├── config/           # Configuraciones (app, db, jwt, seguridad, correo, archivos, swagger)
│       ├── modules/          # Módulos de negocio (admin, colaboradores)
│       └── prisma/           # Módulo Prisma
├── frontend/                 # SPA con Angular
│   └── src/
│       ├── app/
│       │   ├── core/         # Servicios, interceptores, componentes y modelos globales
│       │   ├── modules/      # Módulos de negocio (admin, colaboradores, tienda pública)
│       │   └── inicio/       # Página de inicio
│       ├── assets/           # Recursos estáticos
│       └── environments/     # Configuración por ambiente
├── database/                 # Scripts SQL de fases de implementación
└── docs/                     # Documentación del proyecto
```

---

## 9. Convenciones Técnicas

| Aspecto | Convención |
|---------|-----------|
| **Idioma del código** | Español (variables, funciones, clases, comentarios) |
| **Zona horaria** | America/Tegucigalpa (UTC-6) |
| **Moneda** | Lempira (HNL) - Símbolo: L |
| **Formato de fecha** | dd/MM/yyyy |
| **Formato de hora** | HH:mm:ss (24 horas) |
| **Nomenclatura variables** | camelCase en español |
| **Nomenclatura clases** | PascalCase en español |
| **Nomenclatura constantes** | SCREAMING_SNAKE_CASE en español |
| **Nomenclatura archivos** | kebab-case en español |
| **Codificación** | UTF-8 sin BOM |

---

## 10. Resumen de Versiones Clave

| Tecnología | Versión |
|------------|---------|
| Angular | 19.2+ |
| NestJS | 10+ |
| TypeScript | 5.1+ / 5.7+ |
| Prisma | 5.8+ |
| Bootstrap | 5.3 |
| MySQL | 8.0+ |
| Node.js | 18+ LTS |
| RxJS | 7.8 |

---

*Última actualización: Marzo 2026*
