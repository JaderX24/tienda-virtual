import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function crearAdministrador() {
    console.log('🚀 Iniciando creación de usuario administrador...');

    try {
        // Crear rol de administrador si no existe (código en minúsculas según constantes)
        const rolAdmin = await prisma.rol.upsert({
            where: { codigo: 'admin' },
            update: {},
            create: {
                codigo: 'admin',
                nombre: 'Administrador',
                descripcion: 'Rol con acceso total al sistema',
                activo: true,
            },
        });
        console.log('✅ Rol de administrador creado/verificado:', rolAdmin.nombre);

        // Crear permisos básicos si no existen
        const permisosBasicos = [
            { codigo: 'ADMIN_ACCESO', nombre: 'Acceso al Panel Admin', modulo: 'admin' },
            { codigo: 'USUARIOS_VER', nombre: 'Ver Usuarios', modulo: 'usuarios' },
            { codigo: 'USUARIOS_CREAR', nombre: 'Crear Usuarios', modulo: 'usuarios' },
            { codigo: 'USUARIOS_EDITAR', nombre: 'Editar Usuarios', modulo: 'usuarios' },
            { codigo: 'USUARIOS_ELIMINAR', nombre: 'Eliminar Usuarios', modulo: 'usuarios' },
            { codigo: 'PRODUCTOS_VER', nombre: 'Ver Productos', modulo: 'productos' },
            { codigo: 'PRODUCTOS_CREAR', nombre: 'Crear Productos', modulo: 'productos' },
            { codigo: 'PRODUCTOS_EDITAR', nombre: 'Editar Productos', modulo: 'productos' },
            { codigo: 'PRODUCTOS_ELIMINAR', nombre: 'Eliminar Productos', modulo: 'productos' },
            { codigo: 'PEDIDOS_VER', nombre: 'Ver Pedidos', modulo: 'pedidos' },
            { codigo: 'PEDIDOS_GESTIONAR', nombre: 'Gestionar Pedidos', modulo: 'pedidos' },
            { codigo: 'REPORTES_VER', nombre: 'Ver Reportes', modulo: 'reportes' },
        ];

        for (const permiso of permisosBasicos) {
            const permisoCreado = await prisma.permiso.upsert({
                where: { codigo: permiso.codigo },
                update: {},
                create: {
                    codigo: permiso.codigo,
                    nombre: permiso.nombre,
                    descripcion: `Permiso para ${permiso.nombre.toLowerCase()}`,
                    modulo: permiso.modulo,
                },
            });

            // Asignar permiso al rol admin
            await prisma.rolPermiso.upsert({
                where: {
                    rolId_permisoId: {
                        rolId: rolAdmin.id,
                        permisoId: permisoCreado.id,
                    },
                },
                update: {},
                create: {
                    rolId: rolAdmin.id,
                    permisoId: permisoCreado.id,
                },
            });
        }
        console.log('✅ Permisos básicos creados y asignados al rol admin');

        // Crear usuario administrador (contraseña de 12+ caracteres según validación)
        const contrasenaHash = await bcrypt.hash('Admin12345!@#', 12);

        const adminUsuario = await prisma.usuario.upsert({
            where: { correo: 'admin@tiendavirtual.hn' },
            update: {
                contrasenaHash,
                activo: true,
                rolId: rolAdmin.id,
            },
            create: {
                nombre: 'Administrador Sistema',
                correo: 'admin@tiendavirtual.hn',
                contrasenaHash,
                telefono: '+504 9999-9999',
                activo: true,
                rolId: rolAdmin.id,
            },
        });

        console.log('✅ Usuario administrador creado/actualizado:');
        console.log('   📧 Correo: admin@tiendavirtual.hn');
        console.log('   🔑 Contraseña: Admin12345!@#');
        console.log('   👤 Nombre:', adminUsuario.nombre);

        console.log('\n🎉 ¡Configuración completada exitosamente!');
        console.log('   Ahora puede iniciar sesión en: http://localhost:4200/admin/inicio-sesion');

    } catch (error) {
        console.error('❌ Error al crear administrador:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

crearAdministrador();
