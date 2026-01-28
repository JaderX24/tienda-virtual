import { Routes } from '@angular/router';

export const rutasUsuarios: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/lista-usuarios/lista-usuarios.component')
            .then(m => m.ListaUsuariosComponent),
        title: 'Usuarios - Panel Administrativo'
    },
    {
        path: 'nuevo',
        loadComponent: () => import('./pages/formulario-usuario/formulario-usuario.component')
            .then(m => m.FormularioUsuarioComponent),
        title: 'Nuevo Usuario - Panel Administrativo'
    },
    {
        path: ':id/editar',
        loadComponent: () => import('./pages/formulario-usuario/formulario-usuario.component')
            .then(m => m.FormularioUsuarioComponent),
        title: 'Editar Usuario - Panel Administrativo'
    }
];
