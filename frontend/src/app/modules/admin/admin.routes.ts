import { Routes } from '@angular/router';
import { authAdminGuard, noAuthAdminGuard } from './auth/guards';

export const rutasAdmin: Routes = [
  {
    path: '',
    redirectTo: 'inicio-sesion',
    pathMatch: 'full'
  },
  {
    path: 'inicio-sesion',
    loadComponent: () => import('./auth/inicio-sesion-administrativo/inicio-sesion-administrativo.component')
      .then(m => m.InicioSesionAdministrativoComponent),
    title: 'Iniciar Sesión - Panel Administrativo',
    canActivate: [noAuthAdminGuard]
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout-admin/layout-admin.component')
      .then(m => m.LayoutAdminComponent),
    canActivate: [authAdminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent),
        title: 'Dashboard - Panel Administrativo'
      },
      {
        path: 'productos',
        loadComponent: () => import('./dashboard/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent),
        title: 'Productos - Panel Administrativo'
      },
      {
        path: 'categorias',
        loadComponent: () => import('./dashboard/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent),
        title: 'Categorías - Panel Administrativo'
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./dashboard/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent),
        title: 'Pedidos - Panel Administrativo'
      },
      {
        path: 'clientes',
        loadComponent: () => import('./dashboard/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent),
        title: 'Clientes - Panel Administrativo'
      },
      {
        path: 'inventario',
        loadComponent: () => import('./dashboard/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent),
        title: 'Inventario - Panel Administrativo'
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./usuarios/usuarios.routes')
          .then(m => m.rutasUsuarios),
        title: 'Usuarios - Panel Administrativo'
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./dashboard/dashboard-admin.component')
          .then(m => m.DashboardAdminComponent),
        title: 'Configuración - Panel Administrativo'
      }
    ]
  }
];
