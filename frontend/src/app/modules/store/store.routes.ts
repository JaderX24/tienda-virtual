import { Routes } from '@angular/router';

export const rutasTienda: Routes = [
  {
    path: '',
    loadComponent: () => import('./inicio-publico/inicio-publico.component')
      .then(m => m.InicioPublicoComponent),
    title: 'Tienda Virtual - Inicio'
  }
];
