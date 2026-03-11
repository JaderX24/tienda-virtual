import { Routes } from '@angular/router';

export const rutasParametrosMantenimiento: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/parametros-mantenimiento/parametros-mantenimiento.component')
            .then(m => m.ParametrosMantenimientoComponent),
        title: 'Parámetros del Sistema - Panel Administrativo'
    }
];
