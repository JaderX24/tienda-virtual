export const PERMISOS_ADMIN = {
    // Acceso general al panel administrativo
    ACCESO: 'admin:acceso',
    
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
    
    // Reportes
    REPORTES_VER: 'reportes:ver',
    REPORTES_EXPORTAR: 'reportes:exportar',
    
    // Configuración
    CONFIGURACION_VER: 'configuracion:ver',
    CONFIGURACION_EDITAR: 'configuracion:editar',
} as const;

export type TipoPermisoAdmin = typeof PERMISOS_ADMIN[keyof typeof PERMISOS_ADMIN];
