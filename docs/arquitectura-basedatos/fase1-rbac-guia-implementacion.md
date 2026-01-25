# Guía de Implementación - Fase 1: RBAC y Multi-Tenancy

**Versión:** 1.0.0  
**Fecha:** 24/01/2026  
**Autor:** Equipo de Arquitectura  

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema RBAC](#arquitectura-del-sistema-rbac)
3. [Modelo de Datos](#modelo-de-datos)
4. [Casos de Uso y Validaciones](#casos-de-uso-y-validaciones)
5. [Instrucciones de Implementación](#instrucciones-de-implementación)
6. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
7. [Escalabilidad y Futuro](#escalabilidad-y-futuro)

---

## 1. Resumen Ejecutivo

### Objetivo
Implementar un sistema de control de acceso basado en roles (RBAC) con soporte multi-empresa (multi-tenancy) para la tienda virtual.

### Alcance Fase 1
- ✅ Gestión de usuarios administrativos
- ✅ Sistema de roles y permisos
- ✅ Gestión de módulos del sistema
- ✅ Multi-tenancy (empresas)
- ✅ Auditoría y seguridad
- ❌ Productos (Fase 2)
- ❌ Inventarios (Fase 2)
- ❌ Clientes públicos (Fase 3)

### Stack Tecnológico
| Componente | Tecnología |
|------------|------------|
| Base de datos | MySQL 8.0+ |
| ORM | Prisma |
| Backend | NestJS + TypeScript |
| Frontend | Angular 17+ |
| Autenticación | JWT |

---

## 2. Arquitectura del Sistema RBAC

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE ACCESO                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Usuario   │  │    Rol      │  │   Empresa   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MOTOR DE AUTORIZACIÓN                       │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  1. ¿Es Super Admin? → Acceso Total             │    │   │
│  │  │  2. ¿Permiso denegado explícito? → Bloquear     │    │   │
│  │  │  3. ¿Tiene permiso directo? → Permitir          │    │   │
│  │  │  4. ¿Tiene permiso por rol? → Permitir          │    │   │
│  │  │  5. Por defecto → Denegar                       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MÓDULOS                               │   │
│  │  Dashboard │ Usuarios │ Roles │ Empresas │ Productos    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Autorización

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│ Petición │────▶│ Middleware   │────▶│ Guard de        │
│ HTTP     │     │ JWT          │     │ Permisos        │
└──────────┘     └──────────────┘     └────────┬────────┘
                                               │
                      ┌────────────────────────┼────────────────────────┐
                      │                        │                        │
                      ▼                        ▼                        ▼
              ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
              │ Verificar     │       │ Verificar     │       │ Verificar     │
              │ Super Admin   │       │ Permisos      │       │ Empresa       │
              └───────────────┘       │ Directos      │       │ Contexto      │
                      │               └───────────────┘       └───────────────┘
                      │                        │                        │
                      └────────────────────────┼────────────────────────┘
                                               │
                                               ▼
                                      ┌───────────────┐
                                      │ Respuesta     │
                                      │ Permitir/     │
                                      │ Denegar       │
                                      └───────────────┘
```

### 2.3 Prioridad de Permisos

| Orden | Tipo | Efecto |
|-------|------|--------|
| 1 | Super Admin | Acceso total a todo |
| 2 | Denegación explícita | Bloquea aunque tenga permiso por rol |
| 3 | Permiso directo otorgado | Acceso específico al usuario |
| 4 | Permiso por rol | Acceso heredado del rol asignado |
| 5 | Sin permiso | Acceso denegado por defecto |

---

## 3. Modelo de Datos

### 3.1 Diagrama Entidad-Relación

```
                              ┌─────────────────┐
                              │ admin_modulos   │
                              │─────────────────│
                              │ PK id           │
                              │ codigo          │◄──────────────┐
                              │ nombre          │               │
                              │ ruta            │               │
                              │ FK modulo_padre │───────────────┘
                              └────────┬────────┘
                                       │
                                       │ 1:N
                                       ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ admin_roles     │           │ admin_permisos  │           │ admin_empresas  │
│─────────────────│           │─────────────────│           │─────────────────│
│ PK id           │           │ PK id           │           │ PK id           │
│ codigo          │           │ codigo          │           │ codigo          │
│ nombre          │           │ nombre          │           │ nombre          │
│ nivel_jerarquia │           │ FK modulo_id    │           │ tipo            │
│ es_super_admin  │           │ accion          │           │ FK empresa_padre│
└────────┬────────┘           └────────┬────────┘           └────────┬────────┘
         │                             │                             │
         │ N:M                         │ N:M                         │ N:M
         ▼                             ▼                             ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ admin_roles_    │           │ admin_usuarios_ │           │ admin_usuarios_ │
│ permisos        │           │ permisos        │           │ empresas        │
│─────────────────│           │─────────────────│           │─────────────────│
│ PK id           │           │ PK id           │           │ PK id           │
│ FK rol_id       │           │ FK usuario_id   │           │ FK usuario_id   │
│ FK permiso_id   │           │ FK permiso_id   │           │ FK empresa_id   │
└────────┬────────┘           │ tipo (otorgado/ │           │ rol_empresa     │
         │                    │       denegado) │           │ es_principal    │
         │                    └────────┬────────┘           └────────┬────────┘
         │                             │                             │
         │ N:M                         │                             │
         ▼                             │                             │
┌─────────────────┐                    │                             │
│ admin_usuarios_ │                    │                             │
│ roles           │                    │                             │
│─────────────────│                    │                             │
│ PK id           │                    │                             │
│ FK usuario_id   │────────────────────┴─────────────────────────────┘
│ FK rol_id       │                             │
│ es_principal    │                             │
└────────┬────────┘                             │
         │                                      │
         │                                      │
         ▼                                      ▼
         ┌──────────────────────────────────────┐
         │          admin_usuarios              │
         │──────────────────────────────────────│
         │ PK id                                │
         │ nombre, apellido, correo             │
         │ contrasena_hash                      │
         │ es_activo                            │
         │ FK empresa_actual_id                 │
         └──────────────────────────────────────┘
```

### 3.2 Tablas Principales

#### admin_usuarios
Almacena los usuarios administrativos del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT UNSIGNED | Identificador único |
| nombre | VARCHAR(100) | Nombre del usuario |
| apellido | VARCHAR(100) | Apellido del usuario |
| correo | VARCHAR(255) | Correo único para login |
| contrasena_hash | VARCHAR(255) | Hash bcrypt de contraseña |
| es_activo | BOOLEAN | Estado del usuario |
| empresa_actual_id | INT UNSIGNED | Empresa en contexto actual |

#### admin_roles
Define los roles disponibles en el sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT UNSIGNED | Identificador único |
| codigo | VARCHAR(50) | Código único del rol |
| nombre | VARCHAR(100) | Nombre legible |
| nivel_jerarquia | INT UNSIGNED | Nivel para comparaciones |
| es_super_admin | BOOLEAN | Indica si tiene acceso total |

#### admin_permisos
Define las acciones permitidas sobre módulos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT UNSIGNED | Identificador único |
| codigo | VARCHAR(100) | Código único (ej: productos.crear) |
| modulo_id | INT UNSIGNED | Módulo al que pertenece |
| accion | ENUM | ver, crear, editar, eliminar, etc. |

#### admin_empresas
Gestiona el multi-tenancy.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT UNSIGNED | Identificador único |
| codigo | VARCHAR(20) | Código único de empresa |
| nombre | VARCHAR(200) | Nombre legal |
| tipo | ENUM | matriz, sucursal, franquicia |
| empresa_padre_id | INT UNSIGNED | Para jerarquía de empresas |

---

## 4. Casos de Uso y Validaciones

### 4.1 Caso: Usuario EMPRESARIO

**Perfil:**
- Rol: `empresario`
- Permisos: Solo lectura
- Módulos accesibles: Dashboard, Mi Empresa, Productos (solo sus productos)

**Validación de acceso:**
```sql
-- Verificar si el usuario puede ver productos
SELECT fn_usuario_tiene_permiso(1, 'productos.ver'); -- TRUE

-- Verificar si puede crear productos
SELECT fn_usuario_tiene_permiso(1, 'productos.crear'); -- FALSE

-- Verificar si pertenece a una empresa
SELECT fn_usuario_pertenece_empresa(1, 1); -- TRUE/FALSE
```

**Restricción adicional en backend:**
```typescript
// Al listar productos, filtrar por empresa del usuario
async obtenerProductos(usuarioId: number) {
    const empresaId = await this.obtenerEmpresaUsuario(usuarioId);
    return this.prisma.producto.findMany({
        where: { empresaId }
    });
}
```

### 4.2 Caso: Usuario BODEGA

**Perfil:**
- Rol: `bodega`
- Permisos: Solo lectura de productos e inventarios
- Restricciones: No ve dashboard, no ve empresas

**Menú generado:**
```sql
CALL sp_obtener_menu_usuario(2);
-- Resultado: Solo módulo de Productos (cuando exista inventarios, también)
```

### 4.3 Matriz de Permisos por Rol

| Módulo | Super Admin | Administrador | Gerente | Empresario | Bodega |
|--------|:-----------:|:-------------:|:-------:|:----------:|:------:|
| Dashboard | ✅ CRUD | ✅ CRUD | ✅ R | ✅ R | ❌ |
| Usuarios | ✅ CRUD | ✅ CRUD | ✅ R | ❌ | ❌ |
| Roles | ✅ CRUD | ✅ CRUD | ✅ R | ❌ | ❌ |
| Empresas | ✅ CRUD | ✅ CRUD | ✅ R | ❌ | ❌ |
| Mi Empresa | ✅ CRUD | ✅ CRUD | ✅ RU | ✅ RU | ❌ |
| Productos | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ R* | ✅ R |
| Inventarios | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ✅ R |
| Reportes | ✅ CRUD | ✅ CRUD | ✅ R | ✅ R* | ❌ |

**Leyenda:** C=Crear, R=Leer, U=Actualizar, D=Eliminar, *=Solo de su empresa

---

## 5. Instrucciones de Implementación

### 5.1 Paso 1: Ejecutar Scripts SQL

```bash
# 1. Conectar a MySQL
mysql -u root -p

# 2. Ejecutar script principal de Fase 1
source /ruta/database/1-fase-(24-01-2026)-v1-5648.sql

# 3. Ejecutar script de empresas (complemento)
source /ruta/database/2-fase1-empresas-v1.sql

# 4. Verificar la instalación
USE tienda_virtual;
SHOW TABLES;
```

### 5.2 Paso 2: Generar Schema de Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model AdminUsuario {
  id                    Int       @id @default(autoincrement()) @db.UnsignedInt
  nombre                String    @db.VarChar(100)
  apellido              String    @db.VarChar(100)
  correo                String    @unique @db.VarChar(255)
  contrasenaHash        String    @map("contrasena_hash") @db.VarChar(255)
  esActivo              Boolean   @default(true) @map("es_activo")
  empresaActualId       Int?      @map("empresa_actual_id") @db.UnsignedInt
  creadoEn              DateTime  @default(now()) @map("creado_en")
  actualizadoEn         DateTime  @updatedAt @map("actualizado_en")
  
  empresaActual         AdminEmpresa?           @relation(fields: [empresaActualId], references: [id])
  roles                 AdminUsuarioRol[]
  permisos              AdminUsuarioPermiso[]
  empresas              AdminUsuarioEmpresa[]
  sesiones              SeguridadSesion[]
  
  @@map("admin_usuarios")
}

model AdminRol {
  id              Int       @id @default(autoincrement()) @db.UnsignedInt
  codigo          String    @unique @db.VarChar(50)
  nombre          String    @db.VarChar(100)
  descripcion     String?   @db.Text
  nivelJerarquia  Int       @default(0) @map("nivel_jerarquia") @db.UnsignedInt
  esSuperAdmin    Boolean   @default(false) @map("es_super_admin")
  esActivo        Boolean   @default(true) @map("es_activo")
  
  usuarios        AdminUsuarioRol[]
  permisos        AdminRolPermiso[]
  
  @@map("admin_roles")
}

model AdminPermiso {
  id          Int       @id @default(autoincrement()) @db.UnsignedInt
  codigo      String    @unique @db.VarChar(100)
  nombre      String    @db.VarChar(150)
  moduloId    Int       @map("modulo_id") @db.UnsignedInt
  accion      String    @db.VarChar(20)
  esActivo    Boolean   @default(true) @map("es_activo")
  
  modulo      AdminModulo           @relation(fields: [moduloId], references: [id])
  roles       AdminRolPermiso[]
  usuarios    AdminUsuarioPermiso[]
  
  @@map("admin_permisos")
}

model AdminModulo {
  id            Int       @id @default(autoincrement()) @db.UnsignedInt
  codigo        String    @unique @db.VarChar(50)
  nombre        String    @db.VarChar(100)
  icono         String?   @db.VarChar(100)
  ruta          String?   @db.VarChar(200)
  moduloPadreId Int?      @map("modulo_padre_id") @db.UnsignedInt
  orden         Int       @default(0) @db.UnsignedInt
  esMenu        Boolean   @default(true) @map("es_menu")
  esActivo      Boolean   @default(true) @map("es_activo")
  
  moduloPadre   AdminModulo?    @relation("ModuloHijos", fields: [moduloPadreId], references: [id])
  hijos         AdminModulo[]   @relation("ModuloHijos")
  permisos      AdminPermiso[]
  
  @@map("admin_modulos")
}

model AdminEmpresa {
  id              Int       @id @default(autoincrement()) @db.UnsignedInt
  codigo          String    @unique @db.VarChar(20)
  nombre          String    @db.VarChar(200)
  tipo            String    @default("matriz") @db.VarChar(20)
  empresaPadreId  Int?      @map("empresa_padre_id") @db.UnsignedInt
  correo          String    @db.VarChar(255)
  esActiva        Boolean   @default(true) @map("es_activa")
  planActual      String    @default("basico") @map("plan_actual") @db.VarChar(20)
  
  empresaPadre    AdminEmpresa?           @relation("EmpresaHijos", fields: [empresaPadreId], references: [id])
  hijos           AdminEmpresa[]          @relation("EmpresaHijos")
  usuarios        AdminUsuarioEmpresa[]
  usuariosActuales AdminUsuario[]
  
  @@map("admin_empresas")
}

// Tablas intermedias...
model AdminUsuarioRol {
  id          Int       @id @default(autoincrement()) @db.UnsignedInt
  usuarioId   Int       @map("usuario_id") @db.UnsignedInt
  rolId       Int       @map("rol_id") @db.UnsignedInt
  esPrincipal Boolean   @default(false) @map("es_principal")
  fechaInicio DateTime  @default(now()) @map("fecha_inicio") @db.Date
  fechaFin    DateTime? @map("fecha_fin") @db.Date
  
  usuario     AdminUsuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  rol         AdminRol      @relation(fields: [rolId], references: [id], onDelete: Cascade)
  
  @@unique([usuarioId, rolId])
  @@map("admin_usuarios_roles")
}
```

### 5.3 Paso 3: Implementar Servicio de Permisos (NestJS)

```typescript
// src/modulos/autorizacion/servicios/permisos.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PermisosService {
    constructor(private prisma: PrismaService) {}

    async usuarioTienePermiso(usuarioId: number, codigoPermiso: string): Promise<boolean> {
        // 1. Verificar si es super admin
        const esSuperAdmin = await this.esSuperAdmin(usuarioId);
        if (esSuperAdmin) return true;

        // 2. Verificar denegación explícita
        const denegado = await this.prisma.adminUsuarioPermiso.findFirst({
            where: {
                usuarioId,
                permiso: { codigo: codigoPermiso },
                tipo: 'denegado',
                OR: [
                    { fechaFin: null },
                    { fechaFin: { gte: new Date() } }
                ]
            }
        });
        if (denegado) return false;

        // 3. Verificar permiso directo
        const permisoDirecto = await this.prisma.adminUsuarioPermiso.findFirst({
            where: {
                usuarioId,
                permiso: { codigo: codigoPermiso, esActivo: true },
                tipo: 'otorgado',
                OR: [
                    { fechaFin: null },
                    { fechaFin: { gte: new Date() } }
                ]
            }
        });
        if (permisoDirecto) return true;

        // 4. Verificar permiso por rol
        const permisoPorRol = await this.prisma.adminUsuarioRol.findFirst({
            where: {
                usuarioId,
                rol: {
                    esActivo: true,
                    permisos: {
                        some: {
                            permiso: { codigo: codigoPermiso, esActivo: true }
                        }
                    }
                },
                OR: [
                    { fechaFin: null },
                    { fechaFin: { gte: new Date() } }
                ]
            }
        });

        return !!permisoPorRol;
    }

    async esSuperAdmin(usuarioId: number): Promise<boolean> {
        const rol = await this.prisma.adminUsuarioRol.findFirst({
            where: {
                usuarioId,
                rol: { esSuperAdmin: true, esActivo: true },
                OR: [
                    { fechaFin: null },
                    { fechaFin: { gte: new Date() } }
                ]
            }
        });
        return !!rol;
    }

    async obtenerPermisosUsuario(usuarioId: number): Promise<string[]> {
        const esSuperAdmin = await this.esSuperAdmin(usuarioId);
        
        if (esSuperAdmin) {
            const todosPermisos = await this.prisma.adminPermiso.findMany({
                where: { esActivo: true },
                select: { codigo: true }
            });
            return todosPermisos.map(p => p.codigo);
        }

        // Obtener permisos por rol
        const permisosPorRol = await this.prisma.adminRolPermiso.findMany({
            where: {
                rol: {
                    esActivo: true,
                    usuarios: {
                        some: {
                            usuarioId,
                            OR: [
                                { fechaFin: null },
                                { fechaFin: { gte: new Date() } }
                            ]
                        }
                    }
                }
            },
            include: { permiso: true }
        });

        // Obtener permisos directos
        const permisosDirectos = await this.prisma.adminUsuarioPermiso.findMany({
            where: {
                usuarioId,
                tipo: 'otorgado',
                permiso: { esActivo: true },
                OR: [
                    { fechaFin: null },
                    { fechaFin: { gte: new Date() } }
                ]
            },
            include: { permiso: true }
        });

        // Obtener denegaciones
        const denegaciones = await this.prisma.adminUsuarioPermiso.findMany({
            where: {
                usuarioId,
                tipo: 'denegado',
                OR: [
                    { fechaFin: null },
                    { fechaFin: { gte: new Date() } }
                ]
            },
            select: { permiso: { select: { codigo: true } } }
        });

        const codigosDenegados = new Set(denegaciones.map(d => d.permiso.codigo));
        
        const permisosSet = new Set<string>();
        
        permisosPorRol.forEach(rp => {
            if (!codigosDenegados.has(rp.permiso.codigo)) {
                permisosSet.add(rp.permiso.codigo);
            }
        });
        
        permisosDirectos.forEach(pd => {
            if (!codigosDenegados.has(pd.permiso.codigo)) {
                permisosSet.add(pd.permiso.codigo);
            }
        });

        return Array.from(permisosSet);
    }

    async obtenerMenuUsuario(usuarioId: number) {
        const permisos = await this.obtenerPermisosUsuario(usuarioId);
        const permisosVer = permisos.filter(p => p.endsWith('.ver'));
        const modulosCodigos = permisosVer.map(p => p.split('.')[0]);

        return this.prisma.adminModulo.findMany({
            where: {
                codigo: { in: modulosCodigos },
                esActivo: true,
                esMenu: true
            },
            orderBy: { orden: 'asc' }
        });
    }
}
```

### 5.4 Paso 4: Implementar Guard de Permisos

```typescript
// src/modulos/autorizacion/guards/permisos.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisosService } from '../servicios/permisos.service';

export const PERMISOS_KEY = 'permisos';
export const Permisos = (...permisos: string[]) => SetMetadata(PERMISOS_KEY, permisos);

@Injectable()
export class PermisosGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permisosService: PermisosService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const permisosRequeridos = this.reflector.getAllAndOverride<string[]>(
            PERMISOS_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!permisosRequeridos || permisosRequeridos.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const usuario = request.user;

        if (!usuario) {
            throw new ForbiddenException('Usuario no autenticado');
        }

        for (const permiso of permisosRequeridos) {
            const tienePermiso = await this.permisosService.usuarioTienePermiso(
                usuario.id,
                permiso
            );
            
            if (!tienePermiso) {
                throw new ForbiddenException(`Sin permiso: ${permiso}`);
            }
        }

        return true;
    }
}
```

### 5.5 Paso 5: Uso en Controladores

```typescript
// src/modulos/productos/controladores/productos.controller.ts

@Controller('admin/productos')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProductosController {
    
    @Get()
    @Permisos('productos.ver')
    async listar(@Usuario() usuario: UsuarioActual) {
        // El guard ya validó el permiso
        // Filtrar por empresa del usuario si no es super admin
    }

    @Post()
    @Permisos('productos.crear')
    async crear(@Body() dto: CrearProductoDto) {
        // Solo usuarios con permiso productos.crear
    }

    @Put(':id')
    @Permisos('productos.editar')
    async actualizar(@Param('id') id: number, @Body() dto: ActualizarProductoDto) {
        // Solo usuarios con permiso productos.editar
    }

    @Delete(':id')
    @Permisos('productos.eliminar')
    async eliminar(@Param('id') id: number) {
        // Solo usuarios con permiso productos.eliminar
    }
}
```

---

## 6. Consideraciones de Seguridad

### 6.1 Principios Aplicados

| Principio | Implementación |
|-----------|----------------|
| **Menor privilegio** | Usuarios inician sin permisos, se agregan según necesidad |
| **Denegación por defecto** | Si no hay permiso explícito, se deniega |
| **Separación de funciones** | Roles específicos para cada área |
| **Auditoría completa** | Toda acción queda registrada en bitácora |

### 6.2 Validaciones Obligatorias

1. **Siempre validar en backend** - Nunca confiar solo en frontend
2. **Filtrar por empresa** - Datos de una empresa no accesibles por otra
3. **Verificar vigencia** - Roles y permisos pueden tener fecha de expiración
4. **Registrar accesos denegados** - Para detección de intrusiones

### 6.3 Datos Sensibles

- `contrasena_hash` → NUNCA enviar al frontend
- `secreto_2fa` → NUNCA exponer
- Tokens → Solo en cookies HttpOnly o headers seguros

---

## 7. Escalabilidad y Futuro

### 7.1 Capacidades Actuales

✅ **Soportado desde Fase 1:**
- Múltiples empresas (multi-tenancy)
- Jerarquía de empresas (matriz → sucursales)
- Usuarios con múltiples roles
- Permisos específicos por usuario
- Denegaciones explícitas
- Vigencia de roles y permisos
- Auditoría completa

### 7.2 Extensiones Futuras (Sin Rediseño)

| Fase | Extensión | Impacto en RBAC |
|------|-----------|-----------------|
| 2 | Productos | Agregar módulo y permisos |
| 2 | Inventarios | Agregar módulo y permisos |
| 3 | Clientes públicos | Nuevo dominio (PUBLIC) separado |
| 4 | Multi-país | Agregar campo país a empresas |
| 5 | API pública | Permisos de API como nuevo tipo |

### 7.3 Agregar Nuevo Módulo (Ejemplo)

```sql
-- 1. Crear módulo
INSERT INTO admin_modulos (codigo, nombre, icono, ruta, orden) 
VALUES ('inventarios', 'Inventarios', 'bi-boxes', '/admin/inventarios', 6);

-- 2. Crear permisos
INSERT INTO admin_permisos (codigo, nombre, modulo_id, accion) VALUES
('inventarios.ver', 'Ver inventarios', LAST_INSERT_ID(), 'ver'),
('inventarios.crear', 'Crear movimientos', LAST_INSERT_ID(), 'crear'),
('inventarios.editar', 'Editar inventarios', LAST_INSERT_ID(), 'editar');

-- 3. Asignar a roles existentes
INSERT INTO admin_roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM admin_roles r, admin_permisos p
WHERE r.codigo = 'bodega' AND p.codigo = 'inventarios.ver';
```

---

## 8. Checklist de Validación

### ✅ Seguridad
- [x] Hash bcrypt para contraseñas (12+ rounds)
- [x] Tokens con expiración
- [x] Auditoría de acciones
- [x] Bloqueo por intentos fallidos
- [x] Datos sensibles no expuestos

### ✅ Escalabilidad
- [x] Multi-tenancy listo
- [x] Jerarquía de empresas
- [x] Módulos dinámicos
- [x] Permisos granulares
- [x] Índices optimizados

### ✅ Desacoplamiento
- [x] Dominios separados (ADMIN, SYSTEM, SECURITY)
- [x] Roles independientes de usuarios
- [x] Permisos independientes de roles
- [x] Configuración por empresa

### ✅ Mantenibilidad
- [x] Nomenclatura consistente en español
- [x] Procedimientos almacenados documentados
- [x] Vistas para consultas comunes
- [x] Triggers para auditoría automática

---

**Documento validado y listo para producción.**

*Última actualización: 24/01/2026*
