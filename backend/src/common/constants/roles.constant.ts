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
    // Usuarios
    USUARIOS_LEER: 'usuarios:leer',
    USUARIOS_CREAR: 'usuarios:crear',
    USUARIOS_EDITAR: 'usuarios:editar',
    USUARIOS_ELIMINAR: 'usuarios:eliminar',

    // Productos
    PRODUCTOS_LEER: 'productos:leer',
    PRODUCTOS_CREAR: 'productos:crear',
    PRODUCTOS_EDITAR: 'productos:editar',
    PRODUCTOS_ELIMINAR: 'productos:eliminar',

    // Inventario
    INVENTARIO_LEER: 'inventario:leer',
    INVENTARIO_GESTIONAR: 'inventario:gestionar',

    // Pedidos
    PEDIDOS_LEER: 'pedidos:leer',
    PEDIDOS_CREAR: 'pedidos:crear',
    PEDIDOS_GESTIONAR: 'pedidos:gestionar',
    PEDIDOS_CANCELAR: 'pedidos:cancelar',

    // Pagos
    PAGOS_LEER: 'pagos:leer',
    PAGOS_PROCESAR: 'pagos:procesar',
    PAGOS_REEMBOLSAR: 'pagos:reembolsar',

    // Reportes
    REPORTES_LEER: 'reportes:leer',
    REPORTES_EXPORTAR: 'reportes:exportar',

    // Configuración
    CONFIGURACION_LEER: 'configuracion:leer',
    CONFIGURACION_EDITAR: 'configuracion:editar',
} as const;

export type TipoPermiso = (typeof PERMISOS)[keyof typeof PERMISOS];
