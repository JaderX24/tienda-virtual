import { Routes } from '@angular/router';
import { noAuthColaboradorGuard, authColaboradorGuard } from './auth/guards';

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
                title: 'Dashboard - Portal Colaboradores'
            },
            {
                path: 'mi-turno',
                loadComponent: () => import('./miturno/mi-turno.component')
                    .then(m => m.MiTurnoComponent),
                title: 'Mi Turno - Portal Colaboradores'
            },
            {
                path: 'inventario',
                loadComponent: () => import('./inventario/stock-general/stock-general.component')
                    .then(m => m.StockGeneralComponent),
                title: 'Stock General - Portal Colaboradores'
            },
            {
                path: 'inventario/entradas',
                loadComponent: () => import('./inventario/entradas/entradas.component')
                    .then(m => m.EntradasComponent),
                title: 'Entradas - Portal Colaboradores'
            },
            {
                path: 'inventario/salidas',
                loadComponent: () => import('./inventario/salidas/salidas.component')
                    .then(m => m.SalidasComponent),
                title: 'Salidas - Portal Colaboradores'
            },
            {
                path: 'transferencias',
                loadComponent: () => import('./transferencia/transferencias.component')
                    .then(m => m.TransferenciasComponent),
                title: 'Transferencias - Portal Colaboradores'
            },
            {
                path: 'conteos',
                loadComponent: () => import('./conteos/conteos.component')
                    .then(m => m.ConteosComponent),
                title: 'Conteos - Portal Colaboradores'
            },
            {
                path: 'productos',
                loadComponent: () => import('./productos/productos.component')
                    .then(m => m.ProductosComponent),
                title: 'Productos - Portal Colaboradores'
            },
            {
                path: 'reportes',
                loadComponent: () => import('./reportes/reportes.component')
                    .then(m => m.ReportesComponent),
                title: 'Reportes - Portal Colaboradores'
            },
            {
                path: 'mi-actividad',
                loadComponent: () => import('./miactividad/mi-actividad.component')
                    .then(m => m.MiActividadComponent),
                title: 'Mi Actividad - Portal Colaboradores'
            },
            {
                path: 'notificaciones',
                loadComponent: () => import('./notificaciones/notificaciones.component')
                    .then(m => m.NotificacionesComponent),
                title: 'Notificaciones - Portal Colaboradores'
            },
            {
                path: 'mi-perfil',
                loadComponent: () => import('./miperfilcolab/mi-perfil.component')
                    .then(m => m.MiPerfilComponent),
                title: 'Mi Perfil - Portal Colaboradores'
            }
        ]
    }
];
