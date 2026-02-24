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
        loadChildren: () => import('./productos/productos.routes')
          .then(m => m.rutasProductos),
        title: 'Productos - Panel Administrativo'
      },
      {
        path: 'categorias',
        loadChildren: () => import('./categoria/categorias.routes')
          .then(m => m.rutasCategorias),
        title: 'Categorías - Panel Administrativo'
      },
      {
        path: 'marcas',
        loadChildren: () => import('./marcas/marcas.routes')
          .then(m => m.rutasMarcas),
        title: 'Marcas - Panel Administrativo'
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
        loadChildren: () => import('./inventario/inventario.routes')
          .then(m => m.rutasInventario),
        title: 'Inventario - Panel Administrativo'
      },
      {
        path: 'empresas',
        loadChildren: () => import('./empresas/empresas.routes')
          .then(m => m.rutasEmpresas),
        title: 'Empresas - Panel Administrativo'
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./usuarios/usuarios.routes')
          .then(m => m.rutasUsuarios),
        title: 'Usuarios - Panel Administrativo'
      },
      {
        path: 'roles',
        loadChildren: () => import('./roles/roles.routes')
          .then(m => m.rutasRoles),
        title: 'Roles - Panel Administrativo'
      },
      {
        path: 'roles-permisos',
        loadChildren: () => import('./rolesypermisos/rolesypermisos.routes')
          .then(m => m.ROLES_PERMISOS_ROUTES),
        title: 'Asignar Permisos - Panel Administrativo'
      },
      {
        path: 'colaboradores',
        loadChildren: () => import('./colaboradores/colaboradores.routes')
          .then(m => m.rutasColaboradores),
        title: 'Colaboradores - Panel Administrativo'
      },
      {
        path: 'configuracion',
        children: [
          {
            path: '',
            redirectTo: 'general',
            pathMatch: 'full'
          },
          {
            path: 'general',
            loadChildren: () => import('./general/general.routes')
              .then(m => m.rutasGeneral),
            title: 'Configuración General - Panel Administrativo'
          },
          {
            path: 'tienda',
            loadChildren: () => import('./tiendas/tiendas.routes')
              .then(m => m.TIENDAS_ROUTES),
            title: 'Configuración Tienda - Panel Administrativo'
          },
          {
            path: 'pagos',
            loadChildren: () => import('./metodosPago/metodos-pago.routes')
              .then(m => m.METODOS_PAGO_ROUTES),
            title: 'Métodos de Pago - Panel Administrativo'
          },
          {
            path: 'envios',
            loadChildren: () => import('./enviosProveedores/envios-proveedores.routes')
              .then(m => m.ENVIOS_PROVEEDORES_ROUTES),
            title: 'Proveedores de Envío - Panel Administrativo'
          }
        ]
      }
    ]
  }
];
