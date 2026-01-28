import { PERMISOS_ADMIN } from './permisos.config';

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
                permisos: [PERMISOS_ADMIN.ACCESO],
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
                permisos: [PERMISOS_ADMIN.PRODUCTOS_VER],
                hijos: [
                    {
                        id: 'productos-lista',
                        titulo: 'Lista de Productos',
                        icono: 'bi-list-ul',
                        ruta: '/admin/productos',
                        permisos: [PERMISOS_ADMIN.PRODUCTOS_VER],
                    },
                    {
                        id: 'productos-crear',
                        titulo: 'Crear Producto',
                        icono: 'bi-plus-circle',
                        ruta: '/admin/productos/crear',
                        permisos: [PERMISOS_ADMIN.PRODUCTOS_CREAR],
                    },
                    {
                        id: 'productos-inventario',
                        titulo: 'Inventario',
                        icono: 'bi-boxes',
                        ruta: '/admin/productos/inventario',
                        permisos: [PERMISOS_ADMIN.INVENTARIO_VER],
                    },
                ],
            },
            {
                id: 'categorias',
                titulo: 'Categorías',
                icono: 'bi-diagram-3',
                ruta: '/admin/categorias',
                permisos: [PERMISOS_ADMIN.CATEGORIAS_VER],
            },
            {
                id: 'marcas',
                titulo: 'Marcas',
                icono: 'bi-bookmark-star',
                ruta: '/admin/marcas',
                permisos: [PERMISOS_ADMIN.MARCAS_VER],
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
                permisos: [PERMISOS_ADMIN.PEDIDOS_VER],
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
                        permisos: [PERMISOS_ADMIN.PEDIDOS_VER],
                    },
                    {
                        id: 'pedidos-pendientes',
                        titulo: 'Pendientes',
                        icono: 'bi-clock-history',
                        ruta: '/admin/pedidos/pendientes',
                        permisos: [PERMISOS_ADMIN.PEDIDOS_VER],
                    },
                    {
                        id: 'pedidos-enviados',
                        titulo: 'Enviados',
                        icono: 'bi-truck',
                        ruta: '/admin/pedidos/enviados',
                        permisos: [PERMISOS_ADMIN.PEDIDOS_VER],
                    },
                ],
            },
            {
                id: 'clientes',
                titulo: 'Clientes',
                icono: 'bi-people',
                ruta: '/admin/clientes',
                permisos: [PERMISOS_ADMIN.CLIENTES_VER],
            },
            {
                id: 'cupones',
                titulo: 'Cupones',
                icono: 'bi-ticket-perforated',
                ruta: '/admin/cupones',
                permisos: [PERMISOS_ADMIN.CUPONES_VER],
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
                permisos: [PERMISOS_ADMIN.REPORTES_VER],
                hijos: [
                    {
                        id: 'reportes-ventas',
                        titulo: 'Ventas',
                        icono: 'bi-cash-stack',
                        ruta: '/admin/reportes/ventas',
                        permisos: [PERMISOS_ADMIN.REPORTES_VER],
                    },
                    {
                        id: 'reportes-productos',
                        titulo: 'Productos',
                        icono: 'bi-bar-chart-line',
                        ruta: '/admin/reportes/productos',
                        permisos: [PERMISOS_ADMIN.REPORTES_VER],
                    },
                    {
                        id: 'reportes-clientes',
                        titulo: 'Clientes',
                        icono: 'bi-person-lines-fill',
                        ruta: '/admin/reportes/clientes',
                        permisos: [PERMISOS_ADMIN.REPORTES_VER],
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
                permisos: [PERMISOS_ADMIN.USUARIOS_VER],
                hijos: [
                    {
                        id: 'usuarios-lista',
                        titulo: 'Lista de Usuarios',
                        icono: 'bi-person-lines-fill',
                        ruta: '/admin/usuarios',
                        permisos: [PERMISOS_ADMIN.USUARIOS_VER],
                    },
                    {
                        id: 'usuarios-roles',
                        titulo: 'Roles y Permisos',
                        icono: 'bi-shield-lock',
                        ruta: '/admin/usuarios/roles',
                        permisos: [PERMISOS_ADMIN.ROLES_VER],
                    },
                ],
            },
            {
                id: 'configuracion',
                titulo: 'Configuración',
                icono: 'bi-gear',
                permisos: [PERMISOS_ADMIN.CONFIGURACION_VER],
                hijos: [
                    {
                        id: 'config-general',
                        titulo: 'General',
                        icono: 'bi-sliders',
                        ruta: '/admin/configuracion/general',
                        permisos: [PERMISOS_ADMIN.CONFIGURACION_VER],
                    },
                    {
                        id: 'config-tienda',
                        titulo: 'Tienda',
                        icono: 'bi-shop',
                        ruta: '/admin/configuracion/tienda',
                        permisos: [PERMISOS_ADMIN.CONFIGURACION_VER],
                    },
                    {
                        id: 'config-pagos',
                        titulo: 'Métodos de Pago',
                        icono: 'bi-credit-card',
                        ruta: '/admin/configuracion/pagos',
                        permisos: [PERMISOS_ADMIN.CONFIGURACION_VER],
                    },
                    {
                        id: 'config-envios',
                        titulo: 'Envíos',
                        icono: 'bi-truck',
                        ruta: '/admin/configuracion/envios',
                        permisos: [PERMISOS_ADMIN.CONFIGURACION_VER],
                    },
                ],
            },
        ],
    },
];
