import { Routes } from '@angular/router';

export const rutasColaboradores: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/lista-colaboradores/lista-colaboradores.component')
            .then(m => m.ListaColaboradoresComponent),
        title: 'Colaboradores - Panel Administrativo'
    },
    {
        path: 'nuevo',
        loadComponent: () => import('./pages/formulario-colaborador/formulario-colaborador.component')
            .then(m => m.FormularioColaboradorComponent),
        title: 'Nuevo Colaborador - Panel Administrativo'
    },
    {
        path: ':id/editar',
        loadComponent: () => import('./pages/formulario-colaborador/formulario-colaborador.component')
            .then(m => m.FormularioColaboradorComponent),
        title: 'Editar Colaborador - Panel Administrativo'
    },
    {
        path: 'roles-permisos',
        loadComponent: () => import('./pages/roles-permisos-colaborador/roles-permisos-colaborador.component')
            .then(m => m.RolesPermisosColaboradorComponent),
        title: 'Roles y Permisos de Colaboradores - Panel Administrativo'
    }
];
