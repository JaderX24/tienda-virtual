import { Routes } from '@angular/router';

export const rutasRoles: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/lista-roles/lista-roles.component')
            .then(m => m.ListaRolesComponent),
        title: 'Roles - Panel Administrativo'
    },
    {
        path: 'nuevo',
        loadComponent: () => import('./pages/formulario-rol/formulario-rol.component')
            .then(m => m.FormularioRolComponent),
        title: 'Nuevo Rol - Panel Administrativo'
    },
    {
        path: ':id/editar',
        loadComponent: () => import('./pages/formulario-rol/formulario-rol.component')
            .then(m => m.FormularioRolComponent),
        title: 'Editar Rol - Panel Administrativo'
    }
];
