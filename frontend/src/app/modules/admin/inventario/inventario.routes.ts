import { Routes } from '@angular/router';

export const rutasInventario: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inventario-contenedor/inventario-contenedor.component')
      .then(m => m.InventarioContenedorComponent)
  }
];
