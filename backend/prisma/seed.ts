import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Crear permisos
    const permisos = [
        { codigo: 'usuarios:leer', nombre: 'Leer usuarios', modulo: 'usuarios' },
        { codigo: 'usuarios:crear', nombre: 'Crear usuarios', modulo: 'usuarios' },
        { codigo: 'usuarios:editar', nombre: 'Editar usuarios', modulo: 'usuarios' },
        { codigo: 'usuarios:eliminar', nombre: 'Eliminar usuarios', modulo: 'usuarios' },
        { codigo: 'productos:leer', nombre: 'Leer productos', modulo: 'productos' },
        { codigo: 'productos:crear', nombre: 'Crear productos', modulo: 'productos' },
        { codigo: 'productos:editar', nombre: 'Editar productos', modulo: 'productos' },
        { codigo: 'productos:eliminar', nombre: 'Eliminar productos', modulo: 'productos' },
        { codigo: 'inventario:leer', nombre: 'Leer inventario', modulo: 'inventario' },
        { codigo: 'inventario:gestionar', nombre: 'Gestionar inventario', modulo: 'inventario' },
        { codigo: 'pedidos:leer', nombre: 'Leer pedidos', modulo: 'pedidos' },
        { codigo: 'pedidos:crear', nombre: 'Crear pedidos', modulo: 'pedidos' },
        { codigo: 'pedidos:gestionar', nombre: 'Gestionar pedidos', modulo: 'pedidos' },
        { codigo: 'pedidos:cancelar', nombre: 'Cancelar pedidos', modulo: 'pedidos' },
        { codigo: 'pagos:leer', nombre: 'Leer pagos', modulo: 'pagos' },
        { codigo: 'pagos:procesar', nombre: 'Procesar pagos', modulo: 'pagos' },
        { codigo: 'pagos:reembolsar', nombre: 'Reembolsar pagos', modulo: 'pagos' },
        { codigo: 'reportes:leer', nombre: 'Leer reportes', modulo: 'reportes' },
        { codigo: 'reportes:exportar', nombre: 'Exportar reportes', modulo: 'reportes' },
        { codigo: 'configuracion:leer', nombre: 'Leer configuración', modulo: 'configuracion' },
        { codigo: 'configuracion:editar', nombre: 'Editar configuración', modulo: 'configuracion' },
    ];

    for (const permiso of permisos) {
        await prisma.permiso.upsert({
            where: { codigo: permiso.codigo },
            update: {},
            create: permiso,
        });
    }
    console.log('✅ Permisos creados');

    // Crear roles
    const roles = [
        { codigo: 'super_admin', nombre: 'Super Administrador', descripcion: 'Acceso total al sistema' },
        { codigo: 'admin', nombre: 'Administrador', descripcion: 'Administración general' },
        { codigo: 'gerente', nombre: 'Gerente', descripcion: 'Gestión de operaciones' },
        { codigo: 'vendedor', nombre: 'Vendedor', descripcion: 'Ventas y atención al cliente' },
        { codigo: 'bodeguero', nombre: 'Bodeguero', descripcion: 'Control de inventario' },
        { codigo: 'cliente', nombre: 'Cliente', descripcion: 'Usuario cliente de la tienda' },
    ];

    for (const rol of roles) {
        await prisma.rol.upsert({
            where: { codigo: rol.codigo },
            update: {},
            create: rol,
        });
    }
    console.log('✅ Roles creados');

    // Asignar todos los permisos al super_admin
    const superAdminRol = await prisma.rol.findUnique({ where: { codigo: 'super_admin' } });
    const todosPermisos = await prisma.permiso.findMany();

    if (superAdminRol) {
        for (const permiso of todosPermisos) {
            await prisma.rolPermiso.upsert({
                where: { rolId_permisoId: { rolId: superAdminRol.id, permisoId: permiso.id } },
                update: {},
                create: { rolId: superAdminRol.id, permisoId: permiso.id },
            });
        }
    }
    console.log('✅ Permisos asignados a super_admin');

    // Crear usuario administrador
    const contrasenaHash = await bcrypt.hash('Admin123456!', 12);
    
    await prisma.usuario.upsert({
        where: { correo: 'admin@tiendavirtual.com' },
        update: {},
        create: {
            nombre: 'Administrador',
            correo: 'admin@tiendavirtual.com',
            contrasenaHash,
            rolId: superAdminRol?.id,
            activo: true,
        },
    });
    console.log('✅ Usuario administrador creado');
    console.log('   📧 Correo: admin@tiendavirtual.com');
    console.log('   🔐 Contraseña: Admin123456!');

    // Crear categorías de ejemplo
    const categorias = [
        { nombre: 'Electrónica', slug: 'electronica', descripcion: 'Dispositivos electrónicos' },
        { nombre: 'Ropa', slug: 'ropa', descripcion: 'Prendas de vestir' },
        { nombre: 'Hogar', slug: 'hogar', descripcion: 'Artículos para el hogar' },
        { nombre: 'Deportes', slug: 'deportes', descripcion: 'Artículos deportivos' },
    ];

    for (const categoria of categorias) {
        await prisma.categoria.upsert({
            where: { slug: categoria.slug },
            update: {},
            create: categoria,
        });
    }
    console.log('✅ Categorías de ejemplo creadas');

    console.log('\n🎉 Seed completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
