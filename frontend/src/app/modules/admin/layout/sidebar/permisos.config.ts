export const PERMISOS_ADMIN = {
    // Acceso general al panel administrativo
    ACCESO: 'admin:acceso',
    
    // Empresas
    EMPRESAS_VER: 'empresas:ver',
    EMPRESAS_CREAR: 'empresas:crear',
    EMPRESAS_EDITAR: 'empresas:editar',
    EMPRESAS_ELIMINAR: 'empresas:eliminar',

    // Colaboradores
    COLABORADORES_VER: 'colaboradores:ver',
    COLABORADORES_CREAR: 'colaboradores:crear',
    COLABORADORES_EDITAR: 'colaboradores:editar',
    COLABORADORES_ELIMINAR: 'colaboradores:eliminar',

    // Roles y Permisos de Colaboradores
    COLAB_ROLES_VER: 'colab_roles:ver',
    COLAB_ROLES_CREAR: 'colab_roles:crear',
    COLAB_ROLES_EDITAR: 'colab_roles:editar',

    // Usuarios
    USUARIOS_VER: 'usuarios:ver',
    USUARIOS_CREAR: 'usuarios:crear',
    USUARIOS_EDITAR: 'usuarios:editar',
    
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
