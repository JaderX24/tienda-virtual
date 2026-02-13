import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de módulos del portal de colaboradores
const MODULOS = [
    { codigo: 'colab_dashboard',      nombre: 'Inicio',           descripcion: 'Panel principal del colaborador',            icono: 'bi-speedometer2',      ruta: '/colaborador/inicio',              orden: 1,  esMenu: true },
    { codigo: 'colab_mi_turno',       nombre: 'Mi Turno',         descripcion: 'Registro de entrada/salida y turno actual',  icono: 'bi-clock-history',     ruta: '/colaborador/mi-turno',            orden: 2,  esMenu: true },
    { codigo: 'colab_inventario',     nombre: 'Inventario',       descripcion: 'Gestión de inventario del almacén',          icono: 'bi-boxes',             ruta: '/colaborador/inventario',           orden: 3,  esMenu: true },
    { codigo: 'colab_entradas',       nombre: 'Entradas',         descripcion: 'Recepción de mercancía',                     icono: 'bi-box-arrow-in-down', ruta: '/colaborador/inventario/entradas',  orden: 4,  esMenu: true },
    { codigo: 'colab_salidas',        nombre: 'Salidas',          descripcion: 'Despacho de mercancía',                      icono: 'bi-box-arrow-up',      ruta: '/colaborador/inventario/salidas',   orden: 5,  esMenu: true },
    { codigo: 'colab_transferencias', nombre: 'Transferencias',   descripcion: 'Transferencias entre almacenes',             icono: 'bi-arrow-left-right',  ruta: '/colaborador/transferencias',       orden: 6,  esMenu: true },
    { codigo: 'colab_conteos',        nombre: 'Conteos',          descripcion: 'Conteo físico de inventario',                icono: 'bi-clipboard-check',   ruta: '/colaborador/conteos',              orden: 7,  esMenu: true },
    { codigo: 'colab_productos',      nombre: 'Productos',        descripcion: 'Consulta de catálogo de productos',          icono: 'bi-grid-3x3-gap',     ruta: '/colaborador/productos',            orden: 8,  esMenu: true },
    { codigo: 'colab_reportes',       nombre: 'Reportes',         descripcion: 'Reportes operativos',                        icono: 'bi-bar-chart-line',    ruta: '/colaborador/reportes',             orden: 9,  esMenu: true },
    { codigo: 'colab_mi_actividad',   nombre: 'Mi Actividad',     descripcion: 'Historial de mis operaciones',               icono: 'bi-journal-text',      ruta: '/colaborador/mi-actividad',         orden: 10, esMenu: true },
    { codigo: 'colab_notificaciones', nombre: 'Notificaciones',   descripcion: 'Centro de notificaciones',                   icono: 'bi-bell',              ruta: '/colaborador/notificaciones',       orden: 11, esMenu: true },
    { codigo: 'colab_mi_perfil',      nombre: 'Mi Perfil',        descripcion: 'Configuración de perfil personal',           icono: 'bi-person-circle',     ruta: '/colaborador/mi-perfil',            orden: 12, esMenu: true },
];

// Permisos con su módulo asociado (por código de módulo)
const PERMISOS = [
    { codigo: 'colab_dashboard.ver',           nombre: 'Ver panel de inicio',                modulo: 'colab_dashboard',      accion: 'ver' },
    { codigo: 'colab_turno.ver',               nombre: 'Ver información de turno',           modulo: 'colab_mi_turno',       accion: 'ver' },
    { codigo: 'colab_turno.registrar',         nombre: 'Registrar entrada/salida',           modulo: 'colab_mi_turno',       accion: 'ejecutar' },
    { codigo: 'colab_inventario.ver',          nombre: 'Ver inventario del almacén',         modulo: 'colab_inventario',     accion: 'ver' },
    { codigo: 'colab_inventario.ajustar',      nombre: 'Ajustar cantidades de stock',        modulo: 'colab_inventario',     accion: 'editar' },
    { codigo: 'colab_inventario.exportar',     nombre: 'Exportar datos de inventario',       modulo: 'colab_inventario',     accion: 'exportar' },
    { codigo: 'colab_entradas.ver',            nombre: 'Ver entradas de mercancía',          modulo: 'colab_entradas',       accion: 'ver' },
    { codigo: 'colab_entradas.crear',          nombre: 'Registrar entrada de mercancía',     modulo: 'colab_entradas',       accion: 'crear' },
    { codigo: 'colab_entradas.aprobar',        nombre: 'Aprobar entradas de mercancía',      modulo: 'colab_entradas',       accion: 'aprobar' },
    { codigo: 'colab_salidas.ver',             nombre: 'Ver salidas de mercancía',           modulo: 'colab_salidas',        accion: 'ver' },
    { codigo: 'colab_salidas.crear',           nombre: 'Registrar salida de mercancía',      modulo: 'colab_salidas',        accion: 'crear' },
    { codigo: 'colab_salidas.aprobar',         nombre: 'Aprobar salidas de mercancía',       modulo: 'colab_salidas',        accion: 'aprobar' },
    { codigo: 'colab_transferencias.ver',      nombre: 'Ver transferencias',                 modulo: 'colab_transferencias', accion: 'ver' },
    { codigo: 'colab_transferencias.crear',    nombre: 'Crear solicitud de transferencia',   modulo: 'colab_transferencias', accion: 'crear' },
    { codigo: 'colab_transferencias.aprobar',  nombre: 'Aprobar transferencias',             modulo: 'colab_transferencias', accion: 'aprobar' },
    { codigo: 'colab_conteos.ver',             nombre: 'Ver conteos de inventario',          modulo: 'colab_conteos',        accion: 'ver' },
    { codigo: 'colab_conteos.crear',           nombre: 'Iniciar conteo de inventario',       modulo: 'colab_conteos',        accion: 'crear' },
    { codigo: 'colab_conteos.ejecutar',        nombre: 'Ejecutar conteo físico',             modulo: 'colab_conteos',        accion: 'ejecutar' },
    { codigo: 'colab_conteos.aprobar',         nombre: 'Aprobar y cerrar conteos',           modulo: 'colab_conteos',        accion: 'aprobar' },
    { codigo: 'colab_productos.ver',           nombre: 'Ver catálogo de productos',          modulo: 'colab_productos',      accion: 'ver' },
    { codigo: 'colab_reportes.ver',            nombre: 'Ver reportes operativos',            modulo: 'colab_reportes',       accion: 'ver' },
    { codigo: 'colab_reportes.exportar',       nombre: 'Exportar reportes',                  modulo: 'colab_reportes',       accion: 'exportar' },
    { codigo: 'colab_actividad.ver',           nombre: 'Ver mi historial de actividad',      modulo: 'colab_mi_actividad',   accion: 'ver' },
    { codigo: 'colab_notificaciones.ver',      nombre: 'Ver notificaciones',                 modulo: 'colab_notificaciones', accion: 'ver' },
    { codigo: 'colab_perfil.ver',              nombre: 'Ver mi perfil',                      modulo: 'colab_mi_perfil',      accion: 'ver' },
    { codigo: 'colab_perfil.editar',           nombre: 'Editar mi perfil',                   modulo: 'colab_mi_perfil',      accion: 'editar' },
];

// Roles del portal de colaboradores
const ROLES = [
    { codigo: 'jefe_bodega',   nombre: 'Jefe de Bodega',  descripcion: 'Control total del almacén asignado. Aprueba ajustes, conteos y transferencias.',  nivelJerarquia: 100, esSupervisor: true,  color: '#dc3545' },
    { codigo: 'supervisor',    nombre: 'Supervisor',       descripcion: 'Supervisión de operaciones. Puede aprobar movimientos y ver reportes.',            nivelJerarquia: 80,  esSupervisor: true,  color: '#fd7e14' },
    { codigo: 'inventarista',  nombre: 'Inventarista',     descripcion: 'Encargado de conteos físicos y verificación de stock.',                             nivelJerarquia: 60,  esSupervisor: false, color: '#0d6efd' },
    { codigo: 'recepcionista', nombre: 'Recepcionista',    descripcion: 'Recepción y verificación de mercancía entrante.',                                   nivelJerarquia: 50,  esSupervisor: false, color: '#198754' },
    { codigo: 'despachador',   nombre: 'Despachador',      descripcion: 'Preparación y despacho de pedidos y transferencias.',                               nivelJerarquia: 50,  esSupervisor: false, color: '#6f42c1' },
    { codigo: 'auxiliar',      nombre: 'Auxiliar',          descripcion: 'Operaciones básicas de movimiento de inventario.',                                  nivelJerarquia: 30,  esSupervisor: false, color: '#6c757d' },
    { codigo: 'consulta',      nombre: 'Solo Consulta',    descripcion: 'Acceso de solo lectura a inventario y productos.',                                  nivelJerarquia: 10,  esSupervisor: false, color: '#adb5bd' },
];

// Permisos asignados a cada rol (por código de permiso)
const PERMISOS_POR_ROL: Record<string, string[]> = {
    jefe_bodega: 'TODOS',
    supervisor: [
        'colab_dashboard.ver',
        'colab_turno.ver', 'colab_turno.registrar',
        'colab_inventario.ver', 'colab_inventario.ajustar', 'colab_inventario.exportar',
        'colab_entradas.ver', 'colab_entradas.crear', 'colab_entradas.aprobar',
        'colab_salidas.ver', 'colab_salidas.crear', 'colab_salidas.aprobar',
        'colab_transferencias.ver', 'colab_transferencias.crear', 'colab_transferencias.aprobar',
        'colab_conteos.ver', 'colab_conteos.ejecutar', 'colab_conteos.aprobar',
        'colab_productos.ver',
        'colab_reportes.ver', 'colab_reportes.exportar',
        'colab_actividad.ver',
        'colab_notificaciones.ver',
        'colab_perfil.ver', 'colab_perfil.editar',
    ],
    inventarista: [
        'colab_dashboard.ver',
        'colab_turno.ver', 'colab_turno.registrar',
        'colab_inventario.ver', 'colab_inventario.exportar',
        'colab_conteos.ver', 'colab_conteos.crear', 'colab_conteos.ejecutar',
        'colab_productos.ver',
        'colab_actividad.ver',
        'colab_notificaciones.ver',
        'colab_perfil.ver', 'colab_perfil.editar',
    ],
    recepcionista: [
        'colab_dashboard.ver',
        'colab_turno.ver', 'colab_turno.registrar',
        'colab_inventario.ver',
        'colab_entradas.ver', 'colab_entradas.crear',
        'colab_productos.ver',
        'colab_actividad.ver',
        'colab_notificaciones.ver',
        'colab_perfil.ver', 'colab_perfil.editar',
    ],
    despachador: [
        'colab_dashboard.ver',
        'colab_turno.ver', 'colab_turno.registrar',
        'colab_inventario.ver',
        'colab_salidas.ver', 'colab_salidas.crear',
        'colab_transferencias.ver', 'colab_transferencias.crear',
        'colab_productos.ver',
        'colab_actividad.ver',
        'colab_notificaciones.ver',
        'colab_perfil.ver', 'colab_perfil.editar',
    ],
    auxiliar: [
        'colab_dashboard.ver',
        'colab_turno.ver', 'colab_turno.registrar',
        'colab_inventario.ver',
        'colab_entradas.ver', 'colab_entradas.crear',
        'colab_salidas.ver', 'colab_salidas.crear',
        'colab_conteos.ver', 'colab_conteos.ejecutar',
        'colab_productos.ver',
        'colab_actividad.ver',
        'colab_notificaciones.ver',
        'colab_perfil.ver', 'colab_perfil.editar',
    ],
    consulta: [
        'colab_dashboard.ver',
        'colab_inventario.ver',
        'colab_entradas.ver',
        'colab_salidas.ver',
        'colab_transferencias.ver',
        'colab_conteos.ver',
        'colab_productos.ver',
        'colab_reportes.ver',
        'colab_notificaciones.ver',
        'colab_perfil.ver',
    ],
} as any;

// Configuración del portal de colaboradores
const CONFIGURACION = [
    { clave: 'sesion_duracion_minutos',          valor: '480',                   tipoDato: 'numero',   descripcion: 'Duración máxima de sesión en minutos (8 horas)',                categoria: 'sesiones' },
    { clave: 'sesion_inactividad_minutos',       valor: '30',                    tipoDato: 'numero',   descripcion: 'Tiempo de inactividad antes de cerrar sesión',                  categoria: 'sesiones' },
    { clave: 'max_sesiones_simultaneas',         valor: '1',                     tipoDato: 'numero',   descripcion: 'Máximo de sesiones simultáneas por colaborador',                categoria: 'sesiones' },
    { clave: 'max_intentos_login',               valor: '5',                     tipoDato: 'numero',   descripcion: 'Intentos de login antes de bloqueo',                            categoria: 'sesiones' },
    { clave: 'minutos_bloqueo_login',            valor: '15',                    tipoDato: 'numero',   descripcion: 'Minutos de bloqueo tras exceder intentos',                      categoria: 'sesiones' },
    { clave: 'contrasena_longitud_minima',       valor: '12',                    tipoDato: 'numero',   descripcion: 'Longitud mínima de contraseña',                                 categoria: 'seguridad' },
    { clave: 'contrasena_requiere_mayuscula',    valor: 'true',                  tipoDato: 'booleano', descripcion: 'Requiere al menos una letra mayúscula',                         categoria: 'seguridad' },
    { clave: 'contrasena_requiere_numero',       valor: 'true',                  tipoDato: 'booleano', descripcion: 'Requiere al menos un número',                                   categoria: 'seguridad' },
    { clave: 'contrasena_requiere_especial',     valor: 'true',                  tipoDato: 'booleano', descripcion: 'Requiere al menos un carácter especial',                        categoria: 'seguridad' },
    { clave: 'contrasena_historial_cantidad',    valor: '5',                     tipoDato: 'numero',   descripcion: 'Cantidad de contraseñas anteriores que no se pueden reutilizar', categoria: 'seguridad' },
    { clave: 'contrasena_dias_expiracion',       valor: '90',                    tipoDato: 'numero',   descripcion: 'Días antes de expirar la contraseña',                           categoria: 'seguridad' },
    { clave: 'turno_registro_obligatorio',       valor: 'true',                  tipoDato: 'booleano', descripcion: 'El colaborador debe registrar entrada antes de operar',         categoria: 'turnos' },
    { clave: 'turno_tolerancia_minutos',         valor: '15',                    tipoDato: 'numero',   descripcion: 'Minutos de tolerancia para registrar entrada',                  categoria: 'turnos' },
    { clave: 'turno_cierre_automatico_horas',    valor: '12',                    tipoDato: 'numero',   descripcion: 'Horas después de las cuales se cierra turno automáticamente',   categoria: 'turnos' },
    { clave: 'ajuste_requiere_aprobacion',       valor: 'true',                  tipoDato: 'booleano', descripcion: 'Los ajustes de inventario requieren aprobación de supervisor',  categoria: 'inventario' },
    { clave: 'ajuste_umbral_aprobacion',         valor: '10',                    tipoDato: 'numero',   descripcion: 'Cantidad mínima de ajuste que requiere aprobación',             categoria: 'inventario' },
    { clave: 'transferencia_requiere_aprobacion', valor: 'true',                 tipoDato: 'booleano', descripcion: 'Las transferencias requieren aprobación',                       categoria: 'inventario' },
    { clave: 'conteo_diferencia_alerta',         valor: '5',                     tipoDato: 'numero',   descripcion: 'Diferencia en conteo que genera alerta automática',             categoria: 'inventario' },
    { clave: 'foto_evidencia_obligatoria',       valor: 'false',                 tipoDato: 'booleano', descripcion: 'Requiere foto de evidencia en movimientos',                     categoria: 'inventario' },
    { clave: 'nombre_portal',                    valor: 'Portal de Operaciones', tipoDato: 'texto',    descripcion: 'Nombre mostrado en el portal de colaboradores',                 categoria: 'general' },
    { clave: 'logo_url',                         valor: '',                      tipoDato: 'texto',    descripcion: 'URL del logo del portal',                                       categoria: 'general' },
    { clave: 'color_primario',                   valor: '#0d6efd',               tipoDato: 'texto',    descripcion: 'Color primario del portal',                                     categoria: 'general' },
    { clave: 'soporte_correo',                   valor: '',                      tipoDato: 'texto',    descripcion: 'Correo de soporte para colaboradores',                          categoria: 'general' },
    { clave: 'soporte_telefono',                 valor: '',                      tipoDato: 'texto',    descripcion: 'Teléfono de soporte para colaboradores',                        categoria: 'general' },
];

// Permisos admin para gestión de colaboradores
const PERMISOS_ADMIN = [
    { codigo: 'colaboradores.ver',      nombre: 'Ver colaboradores',          descripcion: 'Permite ver listado de colaboradores',                modulo: 'colaboradores' },
    { codigo: 'colaboradores.crear',    nombre: 'Crear colaboradores',        descripcion: 'Permite crear nuevos colaboradores',                  modulo: 'colaboradores' },
    { codigo: 'colaboradores.editar',   nombre: 'Editar colaboradores',       descripcion: 'Permite editar datos de colaboradores',               modulo: 'colaboradores' },
    { codigo: 'colaboradores.eliminar', nombre: 'Eliminar colaboradores',     descripcion: 'Permite eliminar colaboradores',                      modulo: 'colaboradores' },
    { codigo: 'colaboradores.asignar',  nombre: 'Asignar roles y almacenes',  descripcion: 'Permite asignar roles y almacenes a colaboradores',   modulo: 'colaboradores' },
];

async function main() {
    console.log('🌱 Iniciando seed de RBAC para portal de colaboradores...\n');

    // 1. Almacén principal (solo si no existe)
    const almacenExistente = await prisma.inventarioAlmacen.findFirst();
    if (!almacenExistente) {
        await prisma.inventarioAlmacen.create({
            data: {
                codigo: 'ALM-PRINCIPAL',
                nombre: 'Almacén Principal',
                tipo: 'principal',
                ciudad: 'Tegucigalpa',
                departamento: 'Francisco Morazán',
            },
        });
        console.log('✅ Almacén principal creado');
    } else {
        console.log('ℹ️  Ya existe al menos un almacén, se omite creación');
    }

    // 2. Módulos del portal
    const modulosCreados: Record<string, number> = {};

    for (const modulo of MODULOS) {
        const resultado = await prisma.colabModulo.upsert({
            where: { codigo: modulo.codigo },
            update: {
                nombre: modulo.nombre,
                descripcion: modulo.descripcion,
                icono: modulo.icono,
                ruta: modulo.ruta,
                orden: modulo.orden,
                esMenu: modulo.esMenu,
            },
            create: {
                codigo: modulo.codigo,
                nombre: modulo.nombre,
                descripcion: modulo.descripcion,
                icono: modulo.icono,
                ruta: modulo.ruta,
                orden: modulo.orden,
                esMenu: modulo.esMenu,
            },
        });
        modulosCreados[modulo.codigo] = resultado.id;
    }
    console.log(`✅ ${MODULOS.length} módulos procesados`);

    // 3. Permisos del portal
    const permisosCreados: Record<string, number> = {};

    for (const permiso of PERMISOS) {
        const moduloId = modulosCreados[permiso.modulo];
        if (!moduloId) {
            console.error(`❌ Módulo no encontrado para permiso: ${permiso.codigo} (módulo: ${permiso.modulo})`);
            continue;
        }

        const resultado = await prisma.colabPermiso.upsert({
            where: { codigo: permiso.codigo },
            update: {
                nombre: permiso.nombre,
                moduloId,
                accion: permiso.accion,
            },
            create: {
                codigo: permiso.codigo,
                nombre: permiso.nombre,
                moduloId,
                accion: permiso.accion,
            },
        });
        permisosCreados[permiso.codigo] = resultado.id;
    }
    console.log(`✅ ${PERMISOS.length} permisos procesados`);

    // 4. Roles del portal
    const rolesCreados: Record<string, number> = {};

    for (const rol of ROLES) {
        const resultado = await prisma.colabRol.upsert({
            where: { codigo: rol.codigo },
            update: {
                nombre: rol.nombre,
                descripcion: rol.descripcion,
                nivelJerarquia: rol.nivelJerarquia,
                esSupervisor: rol.esSupervisor,
                color: rol.color,
            },
            create: {
                codigo: rol.codigo,
                nombre: rol.nombre,
                descripcion: rol.descripcion,
                nivelJerarquia: rol.nivelJerarquia,
                esSupervisor: rol.esSupervisor,
                color: rol.color,
            },
        });
        rolesCreados[rol.codigo] = resultado.id;
    }
    console.log(`✅ ${ROLES.length} roles procesados`);

    // 5. Asignar permisos a roles
    let totalAsignaciones = 0;

    for (const [codigoRol, codigosPermisos] of Object.entries(PERMISOS_POR_ROL)) {
        const rolId = rolesCreados[codigoRol];
        if (!rolId) {
            console.error(`❌ Rol no encontrado: ${codigoRol}`);
            continue;
        }

        // Jefe de bodega recibe todos los permisos
        const listaPermisos = codigosPermisos === 'TODOS'
            ? Object.keys(permisosCreados)
            : codigosPermisos as string[];

        for (const codigoPermiso of listaPermisos) {
            const permisoId = permisosCreados[codigoPermiso];
            if (!permisoId) {
                console.error(`❌ Permiso no encontrado: ${codigoPermiso} (rol: ${codigoRol})`);
                continue;
            }

            await prisma.colabRolPermiso.upsert({
                where: {
                    rolId_permisoId: { rolId, permisoId },
                },
                update: {},
                create: { rolId, permisoId },
            });
            totalAsignaciones++;
        }
    }
    console.log(`✅ ${totalAsignaciones} asignaciones rol-permiso procesadas`);

    // 6. Configuración del portal
    for (const config of CONFIGURACION) {
        await prisma.colabConfiguracion.upsert({
            where: { clave: config.clave },
            update: {
                valor: config.valor,
                tipoDato: config.tipoDato,
                descripcion: config.descripcion,
                categoria: config.categoria,
            },
            create: {
                clave: config.clave,
                valor: config.valor,
                tipoDato: config.tipoDato,
                descripcion: config.descripcion,
                categoria: config.categoria,
            },
        });
    }
    console.log(`✅ ${CONFIGURACION.length} configuraciones procesadas`);

    // 7. Permisos admin para gestión de colaboradores
    for (const permiso of PERMISOS_ADMIN) {
        const permisoCreado = await prisma.permiso.upsert({
            where: { codigo: permiso.codigo },
            update: { nombre: permiso.nombre },
            create: {
                codigo: permiso.codigo,
                nombre: permiso.nombre,
                descripcion: permiso.descripcion,
                modulo: permiso.modulo,
            },
        });

        // Asignar al rol super_admin (id=1)
        const rolAdmin = await prisma.rol.findFirst({ where: { codigo: 'super_admin' } });
        if (rolAdmin) {
            await prisma.rolPermiso.upsert({
                where: {
                    rolId_permisoId: { rolId: rolAdmin.id, permisoId: permisoCreado.id },
                },
                update: {},
                create: { rolId: rolAdmin.id, permisoId: permisoCreado.id },
            });
        }
    }
    console.log(`✅ ${PERMISOS_ADMIN.length} permisos admin de colaboradores procesados`);

    console.log('\n🎉 Seed de RBAC para portal de colaboradores completado');
}

main()
    .catch((error) => {
        console.error('❌ Error durante el seed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
