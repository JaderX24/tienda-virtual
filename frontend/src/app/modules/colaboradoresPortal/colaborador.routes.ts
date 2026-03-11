import { Routes } from '@angular/router';
import { noAuthColaboradorGuard, authColaboradorGuard, permisoColabGuard } from './auth/guards';

export const rutasColaborador: Routes = [
    {
        path: '',
        redirectTo: 'inicio-sesion',
        pathMatch: 'full'
    },
    {
        path: 'inicio-sesion',
        loadComponent: () => import('./auth/inicio-sesion-colaborador/inicio-sesion-colaborador.component')
            .then(m => m.InicioSesionColaboradorComponent),
        title: 'Iniciar Sesión - Portal Colaboradores',
        canActivate: [noAuthColaboradorGuard]
    },
    {
        path: '',
        loadComponent: () => import('./layout/layout-colaborador/layout-colaborador.component')
            .then(m => m.LayoutColaboradorComponent),
        canActivate: [authColaboradorGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard-colaborador.component')
                    .then(m => m.DashboardColaboradorComponent),
                title: 'Dashboard - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_dashboard.ver'] }
            },
            {
                path: 'mi-turno',
                loadComponent: () => import('./miturno/mi-turno.component')
                    .then(m => m.MiTurnoComponent),
                title: 'Mi Turno - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_turno.ver'] }
            },
            {
                path: 'inventario',
                loadComponent: () => import('./inventario/stock-general/stock-general.component')
                    .then(m => m.StockGeneralComponent),
                title: 'Stock General - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_inventario.ver'] }
            },
            {
                path: 'inventario/entradas',
                loadComponent: () => import('./inventario/entradas/entradas.component')
                    .then(m => m.EntradasComponent),
                title: 'Entradas - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_entradas.ver'] }
            },
            {
                path: 'inventario/salidas',
                loadComponent: () => import('./inventario/salidas/salidas.component')
                    .then(m => m.SalidasComponent),
                title: 'Salidas - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_salidas.ver'] }
            },
            {
                path: 'transferencias',
                loadComponent: () => import('./transferencia/transferencias.component')
                    .then(m => m.TransferenciasComponent),
                title: 'Transferencias - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_transferencias.ver'] }
            },
            {
                path: 'conteos',
                loadComponent: () => import('./conteos/conteos.component')
                    .then(m => m.ConteosComponent),
                title: 'Conteos - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_conteos.ver'] }
            },
            {
                path: 'productos',
                loadComponent: () => import('./productos/productos.component')
                    .then(m => m.ProductosComponent),
                title: 'Productos - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_productos.ver'] }
            },
            {
                path: 'reportes',
                loadComponent: () => import('./reportes/reportes.component')
                    .then(m => m.ReportesComponent),
                title: 'Reportes - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_reportes.ver'] }
            },
            {
                path: 'mi-actividad',
                loadComponent: () => import('./miactividad/mi-actividad.component')
                    .then(m => m.MiActividadComponent),
                title: 'Mi Actividad - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_actividad.ver'] }
            },
            {
                path: 'notificaciones',
                loadComponent: () => import('./notificaciones/notificaciones.component')
                    .then(m => m.NotificacionesComponent),
                title: 'Notificaciones - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_notificaciones.ver'] }
            },
            {
                path: 'mi-perfil',
                loadComponent: () => import('./miperfilcolab/mi-perfil.component')
                    .then(m => m.MiPerfilComponent),
                title: 'Mi Perfil - Portal Colaboradores',
                canActivate: [permisoColabGuard],
                data: { permisos: ['colab_perfil.ver'] }
            }
        ]
    }
];
