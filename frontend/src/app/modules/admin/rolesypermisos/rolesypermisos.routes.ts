import { Routes } from '@angular/router';

export const ROLES_PERMISOS_ROUTES: Routes = [
    {
        path: ':id',
        loadComponent: () => import('./pages/asignar-permisos/asignar-permisos.component')
            .then(m => m.AsignarPermisosComponent),
        title: 'Asignar Permisos'
    },
    {
        path: '',
        redirectTo: '/admin/roles',
        pathMatch: 'full'
    }
];
