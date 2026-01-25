🧱 STACK TECNOLÓGICO DEL PROYECTO
1️⃣ Front-end (Cliente Web – tienda tipo Amazon)
Tecnologías principales
Tecnología	Uso
Angular	Framework SPA (Single Page Application)
TypeScript	Lenguaje principal (tipado fuerte, escalabilidad)
HTML5	Estructura base (index.html)
SCSS / CSS3	Estilos globales y por componentes
Bootstrap	Diseño responsive y UI rápida
RxJS	Programación reactiva (eventos, async)
Angular Router	Navegación entre páginas
Angular Guards	Protección de rutas
Angular Interceptors	Manejo de tokens, errores
Angular CLI	Build, testing y scaffolding
Qué resuelve el frontend

Catálogo de productos

Búsqueda avanzada

Carrito y checkout

Cuenta de usuario

Pedidos

Panel administrativo

UI escalable tipo Amazon

✅ Correcto
Nivel de confianza: Alto
Fuente: Documentación oficial Angular

2️⃣ Back-end (API REST)
Tecnologías principales
Tecnología	Uso
Node.js	Runtime del servidor
NestJS	Framework backend empresarial
TypeScript	Lenguaje backend
Express / Fastify	Motor HTTP (interno de NestJS)
JWT	Autenticación y autorización
bcrypt	Hash seguro de contraseñas
Prisma ORM (recomendado)	Acceso a MySQL tipado
Swagger (OpenAPI)	Documentación de la API
Helmet	Seguridad HTTP
CORS	Control de acceso
dotenv	Variables de entorno
Qué resuelve el backend

Autenticación y roles

Gestión de usuarios

Productos, categorías, inventario

Pedidos, pagos, envíos

Panel administrativo

API para web y móvil

✅ Correcto
Nivel de confianza: Alto
Fuente: Documentación oficial NestJS, OWASP

3️⃣ Base de datos
Tecnología
Tecnología	Uso
MySQL	Base de datos relacional
Por qué MySQL es correcta aquí

Escala bien para e-commerce

Integración excelente con Node.js

Soporta transacciones (pedidos, pagos)

Compatible con Prisma y TypeORM

Tablas principales esperadas

users

roles

products

categories

inventory

orders

order_items

payments

addresses

reviews

✅ Correcto
Nivel de confianza: Alto
Fuente: MySQL Docs

4️⃣ Herramientas complementarias (profesional)
Herramienta	Uso
Git + GitHub	Control de versiones
Docker (opcional)	Entornos reproducibles
VS Code	Editor
Postman / Insomnia	Pruebas de API
ESLint / Prettier	Calidad de código





5️⃣ Resumen final ultra claro
📌 Front-end
Angular + TypeScript + HTML + SCSS + Bootstrap

📌 Back-end
Node.js + NestJS + TypeScript + JWT + Prisma

📌 Base de datos
MySQL







Conclusión

✅ Tu stack es moderno, escalable y empresarial
✅ Sirve para proyectos grandes y clientes reales
✅ No tendrás que reescribir nada cuando crezca

Nivel de confianza global: ALTO







✅ Instalación del Frontend Completada
Herramientas Instaladas
Herramienta	Versión
Node.js	v25.0.0
npm	11.6.2
Angular CLI	19.2.19
Angular Core	19.2.18
Bootstrap	5.3.8 ✓
Bootstrap Icons	1.13.1
TypeScript	5.7.3
ngx-toastr	18.0.0
SweetAlert2	11.26.17








# Iniciar servidor de desarrollo
cd frontend && npm start

# Compilar para producción  
npm run build

# Ejecutar tests
npm test


🚀 Para iniciar el proyecto:
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name inicial
npx prisma db seed
npm run start:dev

El API estará en http://localhost:3000 con documentación Swagger en /api/docs.

Credenciales admin: admin@tiendavirtual.com / Admin123456!