export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    GERENTE: 'gerente',
    VENDEDOR: 'vendedor',
    BODEGUERO: 'bodeguero',
    CLIENTE: 'cliente',
} as const;

export type TipoRol = (typeof ROLES)[keyof typeof ROLES];

export const PERMISOS = {
    // Acceso general al panel administrativo
    ADMIN_ACCESO: 'admin:acceso',

    // Usuarios
    USUARIOS_VER: 'usuarios:ver',
    USUARIOS_CREAR: 'usuarios:crear',
    USUARIOS_EDITAR: 'usuarios:editar',
    USUARIOS_ELIMINAR: 'usuarios:eliminar',

    // Roles
    ROLES_VER: 'roles:ver',
    ROLES_CREAR: 'roles:crear',
    ROLES_EDITAR: 'roles:editar',
    ROLES_ELIMINAR: 'roles:eliminar',

    // Productos
    PRODUCTOS_VER: 'productos:ver',
    PRODUCTOS_CREAR: 'productos:crear',
    PRODUCTOS_EDITAR: 'productos:editar',
    PRODUCTOS_ELIMINAR: 'productos:eliminar',

    // Categorías
    CATEGORIAS_VER: 'categorias:ver',
    CATEGORIAS_CREAR: 'categorias:crear',
    CATEGORIAS_EDITAR: 'categorias:editar',
    CATEGORIAS_ELIMINAR: 'categorias:eliminar',

    // Marcas
    MARCAS_VER: 'marcas:ver',
    MARCAS_CREAR: 'marcas:crear',
    MARCAS_EDITAR: 'marcas:editar',
    MARCAS_ELIMINAR: 'marcas:eliminar',

    // Inventario
    INVENTARIO_VER: 'inventario:ver',
    INVENTARIO_GESTIONAR: 'inventario:gestionar',

    // Pedidos
    PEDIDOS_VER: 'pedidos:ver',
    PEDIDOS_CREAR: 'pedidos:crear',
    PEDIDOS_GESTIONAR: 'pedidos:gestionar',
    PEDIDOS_CANCELAR: 'pedidos:cancelar',

    // Clientes
    CLIENTES_VER: 'clientes:ver',
    CLIENTES_EDITAR: 'clientes:editar',

    // Cupones
    CUPONES_VER: 'cupones:ver',
    CUPONES_CREAR: 'cupones:crear',
    CUPONES_EDITAR: 'cupones:editar',
    CUPONES_ELIMINAR: 'cupones:eliminar',

    // Pagos
    PAGOS_VER: 'pagos:ver',
    PAGOS_PROCESAR: 'pagos:procesar',
    PAGOS_REEMBOLSAR: 'pagos:reembolsar',

    // Reportes
    REPORTES_VER: 'reportes:ver',
    REPORTES_EXPORTAR: 'reportes:exportar',

    // Configuración
    CONFIGURACION_VER: 'configuracion:ver',
    CONFIGURACION_EDITAR: 'configuracion:editar',

    // Empresas
    EMPRESAS_VER: 'empresas:ver',
    EMPRESAS_CREAR: 'empresas:crear',
    EMPRESAS_EDITAR: 'empresas:editar',
    EMPRESAS_ELIMINAR: 'empresas:eliminar',
} as const;

export type TipoPermiso = (typeof PERMISOS)[keyof typeof PERMISOS];

// Permisos por rol (para asignación automática)
export const PERMISOS_POR_ROL: Record<TipoRol, TipoPermiso[]> = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISOS) as TipoPermiso[],
    [ROLES.ADMIN]: Object.values(PERMISOS) as TipoPermiso[],
    [ROLES.GERENTE]: [
        PERMISOS.ADMIN_ACCESO,
        PERMISOS.PRODUCTOS_VER,
        PERMISOS.PRODUCTOS_CREAR,
        PERMISOS.PRODUCTOS_EDITAR,
        PERMISOS.CATEGORIAS_VER,
        PERMISOS.MARCAS_VER,
        PERMISOS.INVENTARIO_VER,
        PERMISOS.INVENTARIO_GESTIONAR,
        PERMISOS.PEDIDOS_VER,
        PERMISOS.PEDIDOS_GESTIONAR,
        PERMISOS.CLIENTES_VER,
        PERMISOS.REPORTES_VER,
        PERMISOS.REPORTES_EXPORTAR,
        PERMISOS.EMPRESAS_VER,
    ],
    [ROLES.VENDEDOR]: [
        PERMISOS.ADMIN_ACCESO,
        PERMISOS.PRODUCTOS_VER,
        PERMISOS.PEDIDOS_VER,
        PERMISOS.PEDIDOS_CREAR,
        PERMISOS.CLIENTES_VER,
    ],
    [ROLES.BODEGUERO]: [
        PERMISOS.ADMIN_ACCESO,
        PERMISOS.PRODUCTOS_VER,
        PERMISOS.INVENTARIO_VER,
        PERMISOS.INVENTARIO_GESTIONAR,
        PERMISOS.PEDIDOS_VER,
    ],
    [ROLES.CLIENTE]: [],
};

export const PERMISOS_ADMIN_COLABORADORES = {
    VER: 'colaboradores.ver',
    CREAR: 'colaboradores.crear',
    EDITAR: 'colaboradores.editar',
    ELIMINAR: 'colaboradores.eliminar',
    ASIGNAR: 'colaboradores.asignar',
} as const;
