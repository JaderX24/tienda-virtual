import { DocumentBuilder } from '@nestjs/swagger';

export const configuracionSwagger = new DocumentBuilder()
    .setTitle('Tienda Virtual API')
    .setDescription('API REST empresarial para gestión de tienda virtual')
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
    .addTag('Autenticación', 'Endpoints de autenticación y sesiones')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag('Productos', 'Catálogo de productos')
    .addTag('Categorías', 'Categorías de productos')
    .addTag('Inventario', 'Control de inventario')
    .addTag('Pedidos', 'Gestión de pedidos')
    .addTag('Pagos', 'Procesamiento de pagos')
    .addTag('Envíos', 'Logística y envíos')
    .addTag('Notificaciones', 'Sistema de notificaciones')
    .addTag('Administración', 'Panel administrativo')
    .build();
