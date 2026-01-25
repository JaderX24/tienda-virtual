import { Routes } from '@angular/router';

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
    title: 'Iniciar Sesión - Panel Administrativo'
  }
];
