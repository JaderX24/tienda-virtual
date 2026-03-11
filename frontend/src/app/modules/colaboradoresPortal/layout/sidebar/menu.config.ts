export interface ItemMenuColab {
    id: string;
    titulo: string;
    icono: string;
    ruta?: string;
    permisos?: string[];
    hijos?: ItemMenuColab[];
    badge?: { texto: string; clase: string };
    expandido?: boolean;
    activo?: boolean;
}

export interface SeccionMenuColab {
    titulo: string;
    items: ItemMenuColab[];
}

export const MENU_COLABORADOR: SeccionMenuColab[] = [
    {
        titulo: 'menu.principal',
        items: [
            { id: 'inicio', titulo: 'menu.inicio', icono: 'bi-speedometer2', ruta: '/colaborador/dashboard', permisos: ['colab_dashboard.ver'] },
            { id: 'mi-turno', titulo: 'menu.miTurno', icono: 'bi-clock-history', ruta: '/colaborador/mi-turno', permisos: ['colab_turno.ver'] },
        ],
    },
    {
        titulo: 'menu.operaciones',
        items: [
            {
                id: 'inventario', titulo: 'menu.inventario', icono: 'bi-boxes', permisos: ['colab_inventario.ver'],
                hijos: [
                    { id: 'inventario-general', titulo: 'menu.stockGeneral', icono: 'bi-list-ul', ruta: '/colaborador/inventario', permisos: ['colab_inventario.ver'] },
                    { id: 'entradas', titulo: 'menu.entradas', icono: 'bi-box-arrow-in-down', ruta: '/colaborador/inventario/entradas', permisos: ['colab_entradas.ver'] },
                    { id: 'salidas', titulo: 'menu.salidas', icono: 'bi-box-arrow-up', ruta: '/colaborador/inventario/salidas', permisos: ['colab_salidas.ver'] },
                ],
            },
            { id: 'transferencias', titulo: 'menu.transferencias', icono: 'bi-arrow-left-right', ruta: '/colaborador/transferencias', permisos: ['colab_transferencias.ver'] },
            { id: 'conteos', titulo: 'menu.conteos', icono: 'bi-clipboard-check', ruta: '/colaborador/conteos', permisos: ['colab_conteos.ver'] },
        ],
    },
    {
        titulo: 'menu.consultas',
        items: [
            { id: 'productos', titulo: 'menu.productos', icono: 'bi-grid-3x3-gap', ruta: '/colaborador/productos', permisos: ['colab_productos.ver'] },
            { id: 'reportes', titulo: 'menu.reportes', icono: 'bi-bar-chart-line', ruta: '/colaborador/reportes', permisos: ['colab_reportes.ver'] },
            { id: 'mi-actividad', titulo: 'menu.miActividad', icono: 'bi-journal-text', ruta: '/colaborador/mi-actividad', permisos: ['colab_actividad.ver'] },
        ],
    },
    {
        titulo: 'menu.personal',
        items: [
            { id: 'notificaciones', titulo: 'menu.notificaciones', icono: 'bi-bell', ruta: '/colaborador/notificaciones', permisos: ['colab_notificaciones.ver'] },
            { id: 'mi-perfil', titulo: 'menu.miPerfil', icono: 'bi-person-circle', ruta: '/colaborador/mi-perfil', permisos: ['colab_perfil.ver'] },
        ],
    },
];
