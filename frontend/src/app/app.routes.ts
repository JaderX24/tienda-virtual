import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./inicio/inicio.component').then(m => m.InicioComponent),
    title: 'Inicio - Tienda Virtual'
  },
  {
    path: 'tienda',
    loadChildren: () => import('./modules/store/store.routes').then(m => m.rutasTienda)
  },
  {
    path: 'colaborador',
    loadChildren: () => import('./modules/colaboradoresPortal/colaborador.routes').then(m => m.rutasColaborador)
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.routes').then(m => m.rutasAdmin)
  }
];
