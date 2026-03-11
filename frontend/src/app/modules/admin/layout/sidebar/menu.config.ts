export interface ItemMenu {
    id: string;
    titulo: string;
    icono: string;
    ruta?: string;
    permisos?: string[];
    hijos?: ItemMenu[];
    badge?: {
        texto: string;
        clase: string;
    };
    expandido?: boolean;
    activo?: boolean;
}

export interface SeccionMenu {
    titulo: string;
    items: ItemMenu[];
}

export const MENU_ADMIN: SeccionMenu[] = [
    {
        titulo: 'Principal',
        items: [
            {
                id: 'dashboard',
                titulo: 'Dashboard',
                icono: 'bi-speedometer2',
                ruta: '/admin/dashboard',
                permisos: ['admin:acceso'],
            },
        ],
    },
    {
        titulo: 'Empresas',
        items: [
            {
                id: 'empresas',
                titulo: 'Empresas',
                icono: 'bi-building',
                permisos: ['empresas:ver'],
                hijos: [
                    {
                        id: 'empresas-lista',
                        titulo: 'Lista de Empresas',
                        icono: 'bi-list-ul',
                        ruta: '/admin/empresas',
                        permisos: ['empresas:ver'],
                    },
                    {
                        id: 'empresas-crear',
                        titulo: 'Nueva Empresa',
                        icono: 'bi-plus-circle',
                        ruta: '/admin/empresas/nueva',
                        permisos: ['empresas:crear'],
                    },
                ],
            },
        ],
    },
    {
        titulo: 'Equipo',
        items: [
            {
                id: 'colaboradores',
                titulo: 'Colaboradores',
                icono: 'bi-person-badge',
                permisos: ['colaboradores:ver'],
                hijos: [
                    {
                        id: 'colaboradores-lista',
                        titulo: 'Lista de Colaboradores',
                        icono: 'bi-list-ul',
                        ruta: '/admin/colaboradores',
                        permisos: ['colaboradores:ver'],
                    },
                    {
                        id: 'colaboradores-crear',
                        titulo: 'Nuevo Colaborador',
                        icono: 'bi-person-plus',
                        ruta: '/admin/colaboradores/nuevo',
                        permisos: ['colaboradores:crear'],
                    },
                    {
                        id: 'colab-roles-permisos',
                        titulo: 'Roles y Permisos',
                        icono: 'bi-shield-lock',
                        ruta: '/admin/colaboradores/roles-permisos',
                        permisos: ['colab_roles:ver'],
                    },
                ],
            },
        ],
    },
    {
        titulo: 'Catálogo',
        items: [
            {
                id: 'productos',
                titulo: 'Productos',
                icono: 'bi-box-seam',
                permisos: ['productos:ver'],
                hijos: [
                    {
                        id: 'productos-lista',
                        titulo: 'Lista de Productos',
                        icono: 'bi-list-ul',
                        ruta: '/admin/productos',
                        permisos: ['productos:ver'],
                    },
                    {
                        id: 'productos-crear',
                        titulo: 'Crear Producto',
                        icono: 'bi-plus-circle',
                        ruta: '/admin/productos/crear',
                        permisos: ['productos:crear'],
                    },
                ],
            },
            {
                id: 'inventario',
                titulo: 'Inventario',
                icono: 'bi-boxes',
                ruta: '/admin/inventario',
                permisos: ['inventario:ver'],
            },
            {
                id: 'categorias',
                titulo: 'Categorías',
                icono: 'bi-diagram-3',
                ruta: '/admin/categorias',
                permisos: ['categorias:ver'],
            },
            {
                id: 'marcas',
                titulo: 'Marcas',
                icono: 'bi-bookmark-star',
                ruta: '/admin/marcas',
                permisos: ['marcas:ver'],
            },
        ],
    },
    {
        titulo: 'Ventas',
        items: [
            {
                id: 'pedidos',
                titulo: 'Pedidos',
                icono: 'bi-cart-check',
                permisos: ['pedidos:ver'],
                badge: {
                    texto: 'Nuevo',
                    clase: 'bg-danger',
                },
                hijos: [
                    {
                        id: 'pedidos-lista',
                        titulo: 'Todos los Pedidos',
                        icono: 'bi-list-check',
                        ruta: '/admin/pedidos',
                        permisos: ['pedidos:ver'],
                    },
                    {
                        id: 'pedidos-pendientes',
                        titulo: 'Pendientes',
                        icono: 'bi-clock-history',
                        ruta: '/admin/pedidos/pendientes',
                        permisos: ['pedidos:ver'],
                    },
                    {
                        id: 'pedidos-enviados',
                        titulo: 'Enviados',
                        icono: 'bi-truck',
                        ruta: '/admin/pedidos/enviados',
                        permisos: ['pedidos:ver'],
                    },
                ],
            },
            {
                id: 'clientes',
                titulo: 'Clientes',
                icono: 'bi-people',
                ruta: '/admin/clientes',
                permisos: ['clientes:ver'],
            },
            {
                id: 'cupones',
                titulo: 'Cupones',
                icono: 'bi-ticket-perforated',
                ruta: '/admin/cupones',
                permisos: ['cupones:ver'],
            },
        ],
    },
    {
        titulo: 'Reportes',
        items: [
            {
                id: 'reportes',
                titulo: 'Reportes',
                icono: 'bi-graph-up-arrow',
                permisos: ['reportes:ver'],
                hijos: [
                    {
                        id: 'reportes-ventas',
                        titulo: 'Ventas',
                        icono: 'bi-cash-stack',
                        ruta: '/admin/reportes/ventas',
                        permisos: ['reportes:ver'],
                    },
                    {
                        id: 'reportes-productos',
                        titulo: 'Productos',
                        icono: 'bi-bar-chart-line',
                        ruta: '/admin/reportes/productos',
                        permisos: ['reportes:ver'],
                    },
                    {
                        id: 'reportes-clientes',
                        titulo: 'Clientes',
                        icono: 'bi-person-lines-fill',
                        ruta: '/admin/reportes/clientes',
                        permisos: ['reportes:ver'],
                    },
                ],
            },
        ],
    },
    {
        titulo: 'Configuración',
        items: [
            {
                id: 'usuarios',
                titulo: 'Usuarios',
                icono: 'bi-person-gear',
                permisos: ['usuarios:ver'],
                hijos: [
                    {
                        id: 'usuarios-lista',
                        titulo: 'Lista de Usuarios',
                        icono: 'bi-person-lines-fill',
                        ruta: '/admin/usuarios',
                        permisos: ['usuarios:ver'],
                    },
                    {
                        id: 'usuarios-roles',
                        titulo: 'Roles y Permisos',
                        icono: 'bi-shield-lock',
                        ruta: '/admin/roles',
                        permisos: ['roles:ver'],
                    },
                ],
            },
            {
                id: 'configuracion',
                titulo: 'Configuración',
                icono: 'bi-gear',
                permisos: ['configuracion:ver'],
                hijos: [
                    {
                        id: 'config-general',
                        titulo: 'General',
                        icono: 'bi-sliders',
                        ruta: '/admin/configuracion/general',
                        permisos: ['configuracion:ver'],
                    },
                    {
                        id: 'config-tienda',
                        titulo: 'Tienda',
                        icono: 'bi-shop',
                        ruta: '/admin/configuracion/tienda',
                        permisos: ['configuracion:ver'],
                    },
                    {
                        id: 'config-pagos',
                        titulo: 'Métodos de Pago',
                        icono: 'bi-credit-card',
                        ruta: '/admin/configuracion/pagos',
                        permisos: ['configuracion:ver'],
                    },
                    {
                        id: 'config-envios',
                        titulo: 'Envíos',
                        icono: 'bi-truck',
                        ruta: '/admin/configuracion/envios',
                        permisos: ['configuracion:ver'],
                    },
                ],
            },
        ],
    },
];
