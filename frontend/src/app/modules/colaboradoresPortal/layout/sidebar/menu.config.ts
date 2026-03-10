import { PERMISOS_COLAB } from './permisos.config';

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
            { id: 'inicio', titulo: 'menu.inicio', icono: 'bi-speedometer2', ruta: '/colaborador/dashboard', permisos: [PERMISOS_COLAB.ACCESO] },
            { id: 'mi-turno', titulo: 'menu.miTurno', icono: 'bi-clock-history', ruta: '/colaborador/mi-turno', permisos: [PERMISOS_COLAB.TURNO_VER] },
        ],
    },
    {
        titulo: 'menu.operaciones',
        items: [
            {
                id: 'inventario', titulo: 'menu.inventario', icono: 'bi-boxes', permisos: [PERMISOS_COLAB.INVENTARIO_VER],
                hijos: [
                    { id: 'inventario-general', titulo: 'menu.stockGeneral', icono: 'bi-list-ul', ruta: '/colaborador/inventario', permisos: [PERMISOS_COLAB.INVENTARIO_VER] },
                    { id: 'entradas', titulo: 'menu.entradas', icono: 'bi-box-arrow-in-down', ruta: '/colaborador/inventario/entradas', permisos: [PERMISOS_COLAB.ENTRADAS_VER] },
                    { id: 'salidas', titulo: 'menu.salidas', icono: 'bi-box-arrow-up', ruta: '/colaborador/inventario/salidas', permisos: [PERMISOS_COLAB.SALIDAS_VER] },
                ],
            },
            { id: 'transferencias', titulo: 'menu.transferencias', icono: 'bi-arrow-left-right', ruta: '/colaborador/transferencias', permisos: [PERMISOS_COLAB.TRANSFERENCIAS_VER] },
            { id: 'conteos', titulo: 'menu.conteos', icono: 'bi-clipboard-check', ruta: '/colaborador/conteos', permisos: [PERMISOS_COLAB.CONTEOS_VER] },
        ],
    },
    {
        titulo: 'menu.consultas',
        items: [
            { id: 'productos', titulo: 'menu.productos', icono: 'bi-grid-3x3-gap', ruta: '/colaborador/productos', permisos: [PERMISOS_COLAB.PRODUCTOS_VER] },
            { id: 'reportes', titulo: 'menu.reportes', icono: 'bi-bar-chart-line', ruta: '/colaborador/reportes', permisos: [PERMISOS_COLAB.REPORTES_VER] },
            { id: 'mi-actividad', titulo: 'menu.miActividad', icono: 'bi-journal-text', ruta: '/colaborador/mi-actividad', permisos: [PERMISOS_COLAB.ACTIVIDAD_VER] },
        ],
    },
    {
        titulo: 'menu.personal',
        items: [
            { id: 'notificaciones', titulo: 'menu.notificaciones', icono: 'bi-bell', ruta: '/colaborador/notificaciones', permisos: [PERMISOS_COLAB.NOTIFICACIONES_VER] },
            { id: 'mi-perfil', titulo: 'menu.miPerfil', icono: 'bi-person-circle', ruta: '/colaborador/mi-perfil', permisos: [PERMISOS_COLAB.PERFIL_VER] },
        ],
    },
];
