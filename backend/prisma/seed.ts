import { Prisma, PrismaClient } from '@prisma/client';
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
        { codigo: 'empresas:leer', nombre: 'Leer empresas', modulo: 'empresas' },
        { codigo: 'empresas:crear', nombre: 'Crear empresas', modulo: 'empresas' },
        { codigo: 'empresas:editar', nombre: 'Editar empresas', modulo: 'empresas' },
        { codigo: 'empresas:eliminar', nombre: 'Eliminar empresas', modulo: 'empresas' },
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

    // Crear parámetros del sistema
    const parametrosSistema = [
        { clave: 'TIEMPO_EXPIRACION_TOKEN', valor: '15', tipo: 'numero', categoria: 'seguridad', descripcion: 'Tiempo de expiración del token de acceso en minutos', editable: true },
        { clave: 'TIEMPO_EXPIRACION_REFRESH_TOKEN', valor: '7', tipo: 'numero', categoria: 'seguridad', descripcion: 'Tiempo de expiración del refresh token en días', editable: true },
        { clave: 'MAXIMO_SESIONES_USUARIO', valor: '3', tipo: 'numero', categoria: 'seguridad', descripcion: 'Número máximo de sesiones simultáneas por usuario', editable: true },
        { clave: 'INTENTOS_MAXIMOS_LOGIN', valor: '5', tipo: 'numero', categoria: 'seguridad', descripcion: 'Intentos máximos de inicio de sesión antes de bloqueo', editable: true },
        { clave: 'TIEMPO_BLOQUEO_MINUTOS', valor: '15', tipo: 'numero', categoria: 'seguridad', descripcion: 'Tiempo de bloqueo de cuenta en minutos', editable: true },
        { clave: 'LONGITUD_MINIMA_CONTRASENA', valor: '12', tipo: 'numero', categoria: 'seguridad', descripcion: 'Longitud mínima requerida para contraseñas', editable: true },
        { clave: 'REQUIERE_CARACTER_ESPECIAL', valor: 'true', tipo: 'booleano', categoria: 'seguridad', descripcion: 'Requiere carácter especial en contraseñas', editable: true },
        { clave: 'REQUIERE_MAYUSCULA', valor: 'true', tipo: 'booleano', categoria: 'seguridad', descripcion: 'Requiere mayúscula en contraseñas', editable: true },
        { clave: 'REQUIERE_NUMERO', valor: 'true', tipo: 'booleano', categoria: 'seguridad', descripcion: 'Requiere número en contraseñas', editable: true },
        { clave: 'TAMANO_MAXIMO_ARCHIVO_MB', valor: '5', tipo: 'numero', categoria: 'archivos', descripcion: 'Tamaño máximo de archivo permitido en MB', editable: true },
        { clave: 'EXTENSIONES_PERMITIDAS', valor: 'jpg,jpeg,png,webp,pdf', tipo: 'texto', categoria: 'archivos', descripcion: 'Extensiones de archivo permitidas (separadas por coma)', editable: true },
        { clave: 'RUTA_ALMACENAMIENTO', valor: './uploads', tipo: 'texto', categoria: 'archivos', descripcion: 'Ruta de almacenamiento de archivos', editable: false },
        { clave: 'NIVEL_LOG', valor: 'info', tipo: 'texto', categoria: 'sistema', descripcion: 'Nivel de detalle de los logs del sistema', editable: true },
        { clave: 'DIAS_RETENCION_LOGS', valor: '30', tipo: 'numero', categoria: 'sistema', descripcion: 'Días de retención de logs antes de eliminarlos', editable: true },
        { clave: 'MODO_MANTENIMIENTO', valor: 'false', tipo: 'booleano', categoria: 'sistema', descripcion: 'Activa o desactiva el modo mantenimiento', editable: true },
        { clave: 'MENSAJE_MANTENIMIENTO', valor: 'El sistema está en mantenimiento. Por favor, intente más tarde.', tipo: 'texto', categoria: 'sistema', descripcion: 'Mensaje mostrado en modo mantenimiento', editable: true },
        { clave: 'SMTP_ACTIVO', valor: 'false', tipo: 'booleano', categoria: 'correo', descripcion: 'Indica si el envío de correos está activo', editable: false },
        { clave: 'CORREO_REMITENTE', valor: 'sistema@tiendavirtual.hn', tipo: 'texto', categoria: 'correo', descripcion: 'Correo electrónico remitente del sistema', editable: true },
        { clave: 'NOMBRE_SISTEMA', valor: 'TiendaVirtual', tipo: 'texto', categoria: 'sistema', descripcion: 'Nombre del sistema', editable: true },
        { clave: 'VERSION_SISTEMA', valor: '1.0.0', tipo: 'texto', categoria: 'sistema', descripcion: 'Versión actual del sistema', editable: false },
    ];

    for (const parametro of parametrosSistema) {
        await prisma.parametroSistema.upsert({
            where: { clave: parametro.clave },
            update: {},
            create: parametro,
        });
    }
    console.log('✅ Parámetros del sistema creados');

    // Crear empresas de ejemplo
    const empresas: Prisma.EmpresaCreateInput[] = [
        {
            nombre: 'Supermercados La Colonia',
            rtn: '0801-1990-000001',
            correo: 'admin@lacolonia.hn',
            telefono: '+50422334455',
            celular: '+50499887766',
            tipoNegocio: 'supermercado',
            descripcion: 'Cadena de supermercados líder en Honduras',
            pais: 'HN',
            departamento: 'Francisco Morazán',
            ciudad: 'Tegucigalpa',
            direccion: 'Boulevard Morazán, Torre 1, Piso 5',
            codigoPostal: '11101',
            planSuscripcion: 'empresarial',
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            cantidadEmpleados: '101-500',
            representanteLegal: 'Carlos Eduardo Mendoza',
            sitioWeb: 'https://www.lacolonia.hn',
            redesSociales: { facebook: 'LaColoniaHN', instagram: '@lacolonia_hn', whatsapp: '+50499887766' },
        },
        {
            nombre: 'Farmacia Simán',
            rtn: '0801-1985-000002',
            correo: 'info@farmaciasiman.hn',
            telefono: '+50422445566',
            tipoNegocio: 'farmacia',
            descripcion: 'Red de farmacias con cobertura nacional',
            pais: 'HN',
            departamento: 'Cortés',
            ciudad: 'San Pedro Sula',
            planSuscripcion: 'profesional',
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            cantidadEmpleados: '51-100',
            representanteLegal: 'María Elena Simán',
        },
        {
            nombre: 'TechHN Solutions',
            rtn: '0501-2010-000003',
            correo: 'contacto@techhn.com',
            telefono: '+50422556677',
            tipoNegocio: 'tecnologia',
            descripcion: 'Soluciones tecnológicas empresariales',
            pais: 'HN',
            departamento: 'Francisco Morazán',
            ciudad: 'Tegucigalpa',
            planSuscripcion: 'premium',
            moneda: 'USD',
            zonaHoraria: 'America/Tegucigalpa',
            cantidadEmpleados: '21-50',
            sitioWeb: 'https://www.techhn.com',
            redesSociales: { instagram: '@techhn_solutions' },
        },
        {
            nombre: 'Restaurante El Patio',
            rtn: '0801-2005-000004',
            correo: 'reservas@elpatio.hn',
            telefono: '+50422667788',
            tipoNegocio: 'restaurante',
            descripcion: 'Restaurante de comida típica hondureña',
            pais: 'HN',
            departamento: 'Atlántida',
            ciudad: 'La Ceiba',
            planSuscripcion: 'basico',
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            cantidadEmpleados: '6-20',
            redesSociales: { facebook: 'ElPatioHN', whatsapp: '+50499667788' },
        },
        {
            nombre: 'Ferretería Honduras',
            rtn: '0501-1998-000005',
            correo: 'ventas@ferreteriahonduras.hn',
            telefono: '+50422778899',
            tipoNegocio: 'ferreteria',
            descripcion: 'Materiales de construcción y ferretería en general',
            pais: 'HN',
            departamento: 'Comayagua',
            ciudad: 'Comayagua',
            planSuscripcion: 'profesional',
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            cantidadEmpleados: '6-20',
        },
        {
            nombre: 'Librería Cultura',
            rtn: '0801-2015-000006',
            correo: 'info@librericultura.hn',
            telefono: '+50422889900',
            tipoNegocio: 'libreria',
            descripcion: 'Libros, material educativo y artículos de oficina',
            pais: 'HN',
            departamento: 'Cortés',
            ciudad: 'San Pedro Sula',
            planSuscripcion: 'basico',
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            cantidadEmpleados: '1-5',
            activa: false,
        },
    ];

    for (const empresa of empresas) {
        await prisma.empresa.upsert({
            where: { rtn: empresa.rtn },
            update: {},
            create: empresa,
        });
    }
    console.log('✅ Empresas de ejemplo creadas');

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
