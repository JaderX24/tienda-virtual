# Guía de Instalación - Tienda Virtual

**Documento de referencia para configurar el entorno de desarrollo desde cero.**

Última actualización: 27 de enero de 2026

---

## Requisitos del Sistema

| Componente | Versión Mínima | Versión Recomendada |
|------------|----------------|---------------------|
| Sistema Operativo | Windows 10 / macOS 10.15 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| RAM | 8 GB | 16 GB |
| Espacio en disco | 10 GB libres | 20 GB libres |
| Procesador | Dual Core 2.0 GHz | Quad Core 2.5 GHz+ |

---

## Paso 1: Instalar Node.js

Node.js es el runtime de JavaScript necesario para ejecutar tanto el backend como el frontend.

### Versión requerida: **18.x LTS o superior**

### Instrucciones:

1. Ir a la página oficial: https://nodejs.org/
2. Descargar la versión **LTS** (Long Term Support)
3. Ejecutar el instalador descargado
4. Seguir el asistente de instalación:
   - Aceptar los términos de licencia
   - Dejar la ruta de instalación por defecto
   - **Importante:** Marcar la opción "Automatically install the necessary tools" si aparece
5. Finalizar la instalación

### Verificar instalación:

Abrir una terminal (CMD o PowerShell) y ejecutar:

```bash
node --version
```
Debe mostrar: `v18.x.x` o superior

```bash
npm --version
```
Debe mostrar: `9.x.x` o superior

---

## Paso 2: Instalar Git

Git es el sistema de control de versiones para gestionar el código fuente.

### Versión requerida: **2.40 o superior**

### Instrucciones:

1. Ir a la página oficial: https://git-scm.com/downloads
2. Descargar la versión para Windows
3. Ejecutar el instalador
4. Durante la instalación:
   - **Select Components:** dejar opciones por defecto
   - **Default editor:** seleccionar Visual Studio Code (recomendado)
   - **PATH environment:** seleccionar "Git from the command line and also from 3rd-party software"
   - **HTTPS transport backend:** seleccionar "Use the OpenSSL library"
   - **Line ending conversions:** seleccionar "Checkout Windows-style, commit Unix-style line endings"
   - Resto de opciones: dejar por defecto
5. Finalizar instalación

### Verificar instalación:

```bash
git --version
```
Debe mostrar: `git version 2.x.x`

### Configuración inicial de Git:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu.correo@ejemplo.com"
```

---

## Paso 3: Instalar MySQL

MySQL es la base de datos relacional del proyecto.

### Versión requerida: **8.0 o superior**

### Instrucciones:

1. Ir a la página oficial: https://dev.mysql.com/downloads/mysql/
2. Seleccionar "MySQL Installer for Windows"
3. Descargar la versión "mysql-installer-community" (la completa, no la web)
4. Ejecutar el instalador
5. Seleccionar tipo de instalación: **Developer Default** o **Custom**
6. Si seleccionas Custom, asegúrate de incluir:
   - MySQL Server 8.0.x
   - MySQL Workbench (recomendado para administración visual)
7. Configuración del servidor:
   - **Config Type:** Development Computer
   - **Port:** 3306 (dejar por defecto)
   - **Authentication Method:** Use Strong Password Encryption (recomendado)
8. Crear contraseña para el usuario **root**:
   - **IMPORTANTE:** Guardar esta contraseña en un lugar seguro
   - Se usará en el archivo `.env` del backend
9. Finalizar instalación

### Verificar instalación:

Abrir MySQL Command Line Client o terminal y ejecutar:

```bash
mysql --version
```
Debe mostrar: `mysql Ver 8.0.x`

### Verificar conexión:

```bash
mysql -u root -p
```
Ingresar la contraseña creada. Si conecta correctamente, escribir `exit` para salir.

---

## Paso 4: Instalar Visual Studio Code

VS Code es el editor de código recomendado para el proyecto.

### Instrucciones:

1. Ir a la página oficial: https://code.visualstudio.com/
2. Descargar la versión para Windows
3. Ejecutar el instalador
4. Durante la instalación:
   - Marcar "Add to PATH"
   - Marcar "Register Code as an editor for supported file types"
   - Marcar "Add Open with Code action to Windows Explorer file context menu"
   - Marcar "Add Open with Code action to Windows Explorer directory context menu"
5. Finalizar instalación

### Extensiones recomendadas:

Abrir VS Code y presionar `Ctrl+Shift+X` para abrir extensiones. Instalar:

| Extensión | ID | Descripción |
|-----------|-----|-------------|
| Angular Language Service | angular.ng-template | Soporte completo para Angular |
| Prisma | prisma.prisma | Soporte para archivos Prisma |
| ESLint | dbaeumer.vscode-eslint | Linting de código |
| Prettier | esbenp.prettier-vscode | Formateo de código |
| Spanish Language Pack | ms-ceintl.vscode-language-pack-es | Interfaz en español |
| MySQL | cweijan.vscode-mysql-client2 | Cliente MySQL integrado |
| Thunder Client | rangav.vscode-thunder-client | Probar API REST |

---

## Paso 5: Instalar CLI Globales

### Angular CLI

Necesario para el frontend Angular.

```bash
npm install -g @angular/cli@19
```

### Verificar:

```bash
ng version
```
Debe mostrar: `Angular CLI: 19.x.x`

### NestJS CLI

Necesario para el backend NestJS.

```bash
npm install -g @nestjs/cli@10
npm install -g @nestjs/cli

```

### Verificar:

```bash
nest --version
```
Debe mostrar: `10.x.x`

---

## Paso 6: Clonar o Abrir el Proyecto

Si el proyecto ya está descargado, abrirlo en VS Code:

```bash
cd c:\Users\SPE\Proyects\tienda-virtual
code .
```

Si necesitas clonarlo desde un repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd tienda-virtual
code .
```

---

## Paso 7: Instalar Dependencias del Proyecto

### Backend (NestJS + Prisma)

Abrir una terminal en VS Code (`Ctrl+ñ` o `Ctrl+``) y ejecutar:

```bash
cd backend
npm install
```

Esperar a que se instalen todas las dependencias. Esto puede tardar varios minutos.

### Frontend (Angular)

Abrir otra terminal o usar la misma:

```bash
cd frontend
npm install
```

Esperar a que se instalen todas las dependencias.

---

## Paso 8: Configurar Base de Datos

### Crear la base de datos:

1. Abrir MySQL Workbench o terminal MySQL
2. Conectar con usuario root
3. Ejecutar:

```sql
CREATE DATABASE tienda_virtual CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Crear usuario específico (recomendado):

```sql
CREATE USER 'tienda_usuario'@'localhost' IDENTIFIED BY 'TuContrasenaSegura123!';
GRANT ALL PRIVILEGES ON tienda_virtual.* TO 'tienda_usuario'@'localhost';
FLUSH PRIVILEGES;
```

---

## Paso 9: Configurar Variables de Entorno

### Crear archivo .env en backend:

1. Navegar a la carpeta `backend/`
2. Crear un archivo llamado `.env`
3. Agregar el siguiente contenido (ajustar valores según tu configuración):

```env
# Aplicación
NOMBRE_APP=TiendaVirtual
ENTORNO=desarrollo
PUERTO=3000
URL_FRONTEND=http://localhost:4200
URL_BACKEND=http://localhost:3000
ZONA_HORARIA=America/Tegucigalpa

# Base de Datos
DATABASE_URL=mysql://tienda_usuario:TuContrasenaSegura123!@localhost:3306/tienda_virtual
DB_HOST=localhost
DB_PUERTO=3306
DB_USUARIO=tienda_usuario
DB_CONTRASENA=TuContrasenaSegura123!
DB_NOMBRE=tienda_virtual
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT (cambiar estas claves por valores únicos y seguros)
JWT_ACCESS_SECRET=clave_secreta_muy_larga_minimo_64_caracteres_cambiar_en_produccion_1234567890
JWT_ACCESS_EXPIRACION=15m
JWT_REFRESH_SECRET=otra_clave_secreta_diferente_minimo_64_caracteres_cambiar_produccion_0987654321
JWT_REFRESH_EXPIRACION=7d

# Seguridad
BCRYPT_ROUNDS=12
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
CORS_ORIGEN=http://localhost:4200
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# Archivos
UPLOAD_DIRECTORIO=./uploads
UPLOAD_TAMANO_MAXIMO=5242880
UPLOAD_TIPOS_PERMITIDOS=image/jpeg,image/png,image/webp

# Logs
LOG_NIVEL=debug
LOG_FORMATO=simple
LOG_ARCHIVO=./logs/app.log
```

**IMPORTANTE:** Nunca subir el archivo `.env` al repositorio.

---

## Paso 10: Configurar Prisma y Migraciones

### Generar cliente Prisma:

```bash
cd backend
npx prisma generate
```

### Ejecutar migraciones (si existen):

```bash
npx prisma migrate dev
```

### Ejecutar seeds (datos iniciales):

```bash
npm run prisma:seed
```

### Ver base de datos con Prisma Studio:

```bash
npm run prisma:studio
```

Esto abrirá una interfaz web en http://localhost:5555 para ver y editar datos.

---

## Paso 11: Ejecutar el Proyecto  ✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
### Iniciar Backend:

```bash
cd backend
npx prisma generate   ### para detener prisma (taskkill /F /IM "node.exe" 2>$null; Start-Sleep -Seconds 3; Set-Location)
npm run start:dev
```

El servidor estará disponible en: http://localhost:3000

Documentación Swagger API: http://localhost:3000/api

### Iniciar Frontend (en otra terminal):

```bash
cd frontend
npm start
```

La aplicación estará disponible en: http://localhost:4200


### Reiniciar el servidor TypeScript
Presiona Ctrl + Shift + P
Escribe: TypeScript: Restart TS Server
Presiona Enter

o esde la terminal (alternativa)
# Cerrar todas las instancias de Node.js que ejecutan TypeScript
taskkill /f /im node.exe
# Luego reabrir VS Code o el archivo TypeScript
npx nest start --watch 2>&1 | Select-Object -First 30
npx nest start 2>&1 | Select-Object -First 30
(
   PS C:\Users\SPE\Proyects\tienda-virtual> cd c:\Users\SPE\Proyects\tienda-virtual\backend; npx nest start 2>&1 | Select-Object -First 30
)
---

## Verificación Final

### Checklist de instalación:

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm 9+ instalado (`npm --version`)
- [ ] Git instalado (`git --version`)
- [ ] MySQL 8.0+ instalado y corriendo
- [ ] VS Code instalado con extensiones
- [ ] Angular CLI 19+ instalado (`ng version`)
- [ ] NestJS CLI 10+ instalado (`nest --version`)
- [ ] Dependencias del backend instaladas (`npm install` en backend/)
- [ ] Dependencias del frontend instaladas (`npm install` en frontend/)
- [ ] Archivo `.env` configurado en backend/
- [ ] Base de datos creada
- [ ] Prisma cliente generado
- [ ] Backend ejecutándose en http://localhost:3000
- [ ] Frontend ejecutándose en http://localhost:4200

---

## Solución de Problemas Comunes

### Error: "npm command not found"

**Causa:** Node.js no está en el PATH del sistema.

**Solución:** Reiniciar la terminal o el equipo después de instalar Node.js.

---

### Error: "Cannot connect to MySQL"

**Causa:** MySQL no está corriendo o las credenciales son incorrectas.

**Solución:**
1. Verificar que el servicio MySQL esté corriendo:
   - Windows: Buscar "Servicios" → MySQL80 → Iniciar
2. Verificar credenciales en el archivo `.env`

---

### Error: "Prisma Client not generated"

**Causa:** No se ha generado el cliente Prisma.

**Solución:**
```bash
cd backend
npx prisma generate
```

---

### Error: "Port 3000 already in use"

**Causa:** Otro proceso está usando el puerto.

**Solución:**
1. Cerrar el proceso que usa el puerto, o
2. Cambiar el puerto en el archivo `.env`:
```env
PUERTO=3001
```

---

### Error: "ng is not recognized"

**Causa:** Angular CLI no está instalado globalmente.

**Solución:**
```bash
npm install -g @angular/cli@19
```

---

### Error al instalar dependencias (node-gyp, bcrypt)

**Causa:** Faltan herramientas de compilación.

**Solución para Windows:**
```bash
npm install -g windows-build-tools
```
O instalar Visual Studio Build Tools manualmente.

---

## Herramientas Opcionales

| Herramienta | Uso | Descarga |
|-------------|-----|----------|
| MySQL Workbench | Administrar base de datos visualmente | Incluido con MySQL |
| Postman | Probar endpoints de la API | https://www.postman.com/downloads/ |
| DBeaver | Cliente de base de datos universal | https://dbeaver.io/download/ |
| Docker Desktop | Contenedores (para despliegue) | https://www.docker.com/products/docker-desktop |

---

## Contacto y Soporte

Si tienes problemas con la instalación, verifica:

1. Que todas las versiones sean las correctas
2. Que los servicios (MySQL) estén corriendo
3. Que el archivo `.env` esté correctamente configurado
4. Los logs de error en la terminal

---

*Este documento es parte de la documentación oficial del proyecto Tienda Virtual.*
