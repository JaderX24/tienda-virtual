// Roles del portal de colaboradores (independientes del sistema admin)
export const COLAB_ROLES = {
    JEFE_BODEGA: 'jefe_bodega',
    SUPERVISOR: 'supervisor',
    INVENTARISTA: 'inventarista',
    RECEPCIONISTA: 'recepcionista',
    DESPACHADOR: 'despachador',
    AUXILIAR: 'auxiliar',
    CONSULTA: 'consulta',
} as const;

export type TipoColabRol = (typeof COLAB_ROLES)[keyof typeof COLAB_ROLES];

// Información completa de roles para uso en UI y lógica de negocio
export const COLAB_ROLES_INFO: Record<TipoColabRol, { nombre: string; descripcion: string; nivelJerarquia: number; esSupervisor: boolean; color: string }> = {
    [COLAB_ROLES.JEFE_BODEGA]:   { nombre: 'Jefe de Bodega',  descripcion: 'Control total del almacén asignado. Aprueba ajustes, conteos y transferencias.',  nivelJerarquia: 100, esSupervisor: true,  color: '#dc3545' },
    [COLAB_ROLES.SUPERVISOR]:    { nombre: 'Supervisor',       descripcion: 'Supervisión de operaciones. Puede aprobar movimientos y ver reportes.',            nivelJerarquia: 80,  esSupervisor: true,  color: '#fd7e14' },
    [COLAB_ROLES.INVENTARISTA]:  { nombre: 'Inventarista',     descripcion: 'Encargado de conteos físicos y verificación de stock.',                             nivelJerarquia: 60,  esSupervisor: false, color: '#0d6efd' },
    [COLAB_ROLES.RECEPCIONISTA]: { nombre: 'Recepcionista',    descripcion: 'Recepción y verificación de mercancía entrante.',                                   nivelJerarquia: 50,  esSupervisor: false, color: '#198754' },
    [COLAB_ROLES.DESPACHADOR]:   { nombre: 'Despachador',      descripcion: 'Preparación y despacho de pedidos y transferencias.',                               nivelJerarquia: 50,  esSupervisor: false, color: '#6f42c1' },
    [COLAB_ROLES.AUXILIAR]:      { nombre: 'Auxiliar',          descripcion: 'Operaciones básicas de movimiento de inventario.',                                  nivelJerarquia: 30,  esSupervisor: false, color: '#6c757d' },
    [COLAB_ROLES.CONSULTA]:      { nombre: 'Solo Consulta',    descripcion: 'Acceso de solo lectura a inventario y productos.',                                  nivelJerarquia: 10,  esSupervisor: false, color: '#adb5bd' },
};

// Módulos del portal de colaboradores
export const COLAB_MODULOS = {
    DASHBOARD: 'colab_dashboard',
    MI_TURNO: 'colab_mi_turno',
    INVENTARIO: 'colab_inventario',
    ENTRADAS: 'colab_entradas',
    SALIDAS: 'colab_salidas',
    TRANSFERENCIAS: 'colab_transferencias',
    CONTEOS: 'colab_conteos',
    PRODUCTOS: 'colab_productos',
    REPORTES: 'colab_reportes',
    MI_ACTIVIDAD: 'colab_mi_actividad',
    NOTIFICACIONES: 'colab_notificaciones',
    MI_PERFIL: 'colab_mi_perfil',
} as const;

export type TipoColabModulo = (typeof COLAB_MODULOS)[keyof typeof COLAB_MODULOS];

// Permisos del portal de colaboradores (formato: modulo.accion)
export const COLAB_PERMISOS = {
    // Dashboard
    DASHBOARD_VER: 'colab_dashboard.ver',

    // Turno
    TURNO_VER: 'colab_turno.ver',
    TURNO_REGISTRAR: 'colab_turno.registrar',

    // Inventario
    INVENTARIO_VER: 'colab_inventario.ver',
    INVENTARIO_AJUSTAR: 'colab_inventario.ajustar',
    INVENTARIO_EXPORTAR: 'colab_inventario.exportar',

    // Entradas
    ENTRADAS_VER: 'colab_entradas.ver',
    ENTRADAS_CREAR: 'colab_entradas.crear',
    ENTRADAS_APROBAR: 'colab_entradas.aprobar',

    // Salidas
    SALIDAS_VER: 'colab_salidas.ver',
    SALIDAS_CREAR: 'colab_salidas.crear',
    SALIDAS_APROBAR: 'colab_salidas.aprobar',

    // Transferencias
    TRANSFERENCIAS_VER: 'colab_transferencias.ver',
    TRANSFERENCIAS_CREAR: 'colab_transferencias.crear',
    TRANSFERENCIAS_APROBAR: 'colab_transferencias.aprobar',

    // Conteos
    CONTEOS_VER: 'colab_conteos.ver',
    CONTEOS_CREAR: 'colab_conteos.crear',
    CONTEOS_EJECUTAR: 'colab_conteos.ejecutar',
    CONTEOS_APROBAR: 'colab_conteos.aprobar',

    // Productos
    PRODUCTOS_VER: 'colab_productos.ver',

    // Reportes
    REPORTES_VER: 'colab_reportes.ver',
    REPORTES_EXPORTAR: 'colab_reportes.exportar',

    // Mi Actividad
    ACTIVIDAD_VER: 'colab_actividad.ver',

    // Notificaciones
    NOTIFICACIONES_VER: 'colab_notificaciones.ver',

    // Perfil
    PERFIL_VER: 'colab_perfil.ver',
    PERFIL_EDITAR: 'colab_perfil.editar',
} as const;

export type TipoColabPermiso = (typeof COLAB_PERMISOS)[keyof typeof COLAB_PERMISOS];

// Permisos asignados por defecto a cada rol (coincide con datos de fase 13 SQL)
export const COLAB_PERMISOS_POR_ROL: Record<TipoColabRol, TipoColabPermiso[]> = {
    [COLAB_ROLES.JEFE_BODEGA]: Object.values(COLAB_PERMISOS) as TipoColabPermiso[],

    [COLAB_ROLES.SUPERVISOR]: [
        COLAB_PERMISOS.DASHBOARD_VER,
        COLAB_PERMISOS.TURNO_VER,
        COLAB_PERMISOS.TURNO_REGISTRAR,
        COLAB_PERMISOS.INVENTARIO_VER,
        COLAB_PERMISOS.INVENTARIO_AJUSTAR,
        COLAB_PERMISOS.INVENTARIO_EXPORTAR,
        COLAB_PERMISOS.ENTRADAS_VER,
        COLAB_PERMISOS.ENTRADAS_CREAR,
        COLAB_PERMISOS.ENTRADAS_APROBAR,
        COLAB_PERMISOS.SALIDAS_VER,
        COLAB_PERMISOS.SALIDAS_CREAR,
        COLAB_PERMISOS.SALIDAS_APROBAR,
        COLAB_PERMISOS.TRANSFERENCIAS_VER,
        COLAB_PERMISOS.TRANSFERENCIAS_CREAR,
        COLAB_PERMISOS.TRANSFERENCIAS_APROBAR,
        COLAB_PERMISOS.CONTEOS_VER,
        COLAB_PERMISOS.CONTEOS_EJECUTAR,
        COLAB_PERMISOS.CONTEOS_APROBAR,
        COLAB_PERMISOS.PRODUCTOS_VER,
        COLAB_PERMISOS.REPORTES_VER,
        COLAB_PERMISOS.REPORTES_EXPORTAR,
        COLAB_PERMISOS.ACTIVIDAD_VER,
        COLAB_PERMISOS.NOTIFICACIONES_VER,
        COLAB_PERMISOS.PERFIL_VER,
        COLAB_PERMISOS.PERFIL_EDITAR,
    ],

    [COLAB_ROLES.INVENTARISTA]: [
        COLAB_PERMISOS.DASHBOARD_VER,
        COLAB_PERMISOS.TURNO_VER,
        COLAB_PERMISOS.TURNO_REGISTRAR,
        COLAB_PERMISOS.INVENTARIO_VER,
        COLAB_PERMISOS.INVENTARIO_EXPORTAR,
        COLAB_PERMISOS.CONTEOS_VER,
        COLAB_PERMISOS.CONTEOS_CREAR,
        COLAB_PERMISOS.CONTEOS_EJECUTAR,
        COLAB_PERMISOS.PRODUCTOS_VER,
        COLAB_PERMISOS.ACTIVIDAD_VER,
        COLAB_PERMISOS.NOTIFICACIONES_VER,
        COLAB_PERMISOS.PERFIL_VER,
        COLAB_PERMISOS.PERFIL_EDITAR,
    ],

    [COLAB_ROLES.RECEPCIONISTA]: [
        COLAB_PERMISOS.DASHBOARD_VER,
        COLAB_PERMISOS.TURNO_VER,
        COLAB_PERMISOS.TURNO_REGISTRAR,
        COLAB_PERMISOS.INVENTARIO_VER,
        COLAB_PERMISOS.ENTRADAS_VER,
        COLAB_PERMISOS.ENTRADAS_CREAR,
        COLAB_PERMISOS.PRODUCTOS_VER,
        COLAB_PERMISOS.ACTIVIDAD_VER,
        COLAB_PERMISOS.NOTIFICACIONES_VER,
        COLAB_PERMISOS.PERFIL_VER,
        COLAB_PERMISOS.PERFIL_EDITAR,
    ],

    [COLAB_ROLES.DESPACHADOR]: [
        COLAB_PERMISOS.DASHBOARD_VER,
        COLAB_PERMISOS.TURNO_VER,
        COLAB_PERMISOS.TURNO_REGISTRAR,
        COLAB_PERMISOS.INVENTARIO_VER,
        COLAB_PERMISOS.SALIDAS_VER,
        COLAB_PERMISOS.SALIDAS_CREAR,
        COLAB_PERMISOS.TRANSFERENCIAS_VER,
        COLAB_PERMISOS.TRANSFERENCIAS_CREAR,
        COLAB_PERMISOS.PRODUCTOS_VER,
        COLAB_PERMISOS.ACTIVIDAD_VER,
        COLAB_PERMISOS.NOTIFICACIONES_VER,
        COLAB_PERMISOS.PERFIL_VER,
        COLAB_PERMISOS.PERFIL_EDITAR,
    ],

    [COLAB_ROLES.AUXILIAR]: [
        COLAB_PERMISOS.DASHBOARD_VER,
        COLAB_PERMISOS.TURNO_VER,
        COLAB_PERMISOS.TURNO_REGISTRAR,
        COLAB_PERMISOS.INVENTARIO_VER,
        COLAB_PERMISOS.ENTRADAS_VER,
        COLAB_PERMISOS.ENTRADAS_CREAR,
        COLAB_PERMISOS.SALIDAS_VER,
        COLAB_PERMISOS.SALIDAS_CREAR,
        COLAB_PERMISOS.CONTEOS_VER,
        COLAB_PERMISOS.CONTEOS_EJECUTAR,
        COLAB_PERMISOS.PRODUCTOS_VER,
        COLAB_PERMISOS.ACTIVIDAD_VER,
        COLAB_PERMISOS.NOTIFICACIONES_VER,
        COLAB_PERMISOS.PERFIL_VER,
        COLAB_PERMISOS.PERFIL_EDITAR,
    ],

    [COLAB_ROLES.CONSULTA]: [
        COLAB_PERMISOS.DASHBOARD_VER,
        COLAB_PERMISOS.INVENTARIO_VER,
        COLAB_PERMISOS.ENTRADAS_VER,
        COLAB_PERMISOS.SALIDAS_VER,
        COLAB_PERMISOS.TRANSFERENCIAS_VER,
        COLAB_PERMISOS.CONTEOS_VER,
        COLAB_PERMISOS.PRODUCTOS_VER,
        COLAB_PERMISOS.REPORTES_VER,
        COLAB_PERMISOS.NOTIFICACIONES_VER,
        COLAB_PERMISOS.PERFIL_VER,
    ],
};

// Permisos del panel admin para gestión de colaboradores
export const PERMISOS_ADMIN_COLABORADORES = {
    VER: 'colaboradores.ver',
    CREAR: 'colaboradores.crear',
    EDITAR: 'colaboradores.editar',
    ELIMINAR: 'colaboradores.eliminar',
    ASIGNAR: 'colaboradores.asignar',
} as const;
