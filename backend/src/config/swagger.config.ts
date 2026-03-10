import { DocumentBuilder } from '@nestjs/swagger';

export const configuracionSwagger = new DocumentBuilder()
    .setTitle('Tienda Virtual API')
    .setDescription('API REST empresarial para gestión de tienda virtual multi-portal')
    .setVersion('1.0')
    .addBearerAuth(
        {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Ingrese el token JWT',
            in: 'header',
        },
        'JWT-auth',
    )

    // Portal Administrativo
    .addTag('Auth Admin', 'Autenticación del panel administrativo')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag('Roles', 'Gestión de roles y permisos')
    .addTag('Empresas', 'Gestión de empresas')
    .addTag('Tiendas', 'Gestión de sucursales y tiendas')
    .addTag('Productos Admin', 'Gestión de catálogo de productos')
    .addTag('Categorías', 'Categorías de productos')
    .addTag('Marcas', 'Marcas de productos')
    .addTag('Inventario Admin', 'Control de inventario administrativo')
    .addTag('Pedidos', 'Gestión de pedidos')
    .addTag('Pagos', 'Procesamiento de pagos')
    .addTag('Envíos', 'Logística y proveedores de envío')
    .addTag('Colaboradores Admin', 'Gestión de colaboradores desde admin')
    .addTag('Configuración', 'Parámetros generales del sistema')

    // Portal Colaboradores
    .addTag('Auth Colaborador', 'Autenticación del portal de colaboradores')
    .addTag('Dashboard Colab', 'Panel principal del colaborador')
    .addTag('Mi Turno', 'Registro y gestión de turnos')
    .addTag('Inventario Colab', 'Operaciones de inventario del colaborador')
    .addTag('Transferencias', 'Transferencias entre almacenes')
    .addTag('Conteos', 'Conteos físicos de inventario')
    .addTag('Productos Colab', 'Consulta de productos del colaborador')
    .addTag('Reportes Colab', 'Reportes del portal de colaboradores')
    .addTag('Mi Actividad', 'Historial de actividad del colaborador')
    .addTag('Notificaciones Colab', 'Notificaciones del colaborador')
    .addTag('Mi Perfil Colab', 'Perfil y seguridad del colaborador')
    .build();
