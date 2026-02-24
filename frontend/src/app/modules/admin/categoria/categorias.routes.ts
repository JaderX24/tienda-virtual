import { Routes } from '@angular/router';

export const rutasCategorias: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/lista-categorias/lista-categorias.component')
            .then(m => m.ListaCategoriasComponent),
        title: 'Categorías - Panel Administrativo'
    },
    {
        path: 'nueva',
        loadComponent: () => import('./pages/formulario-categoria/formulario-categoria.component')
            .then(m => m.FormularioCategoriaComponent),
        title: 'Nueva Categoría - Panel Administrativo'
    },
    {
        path: ':id/editar',
        loadComponent: () => import('./pages/formulario-categoria/formulario-categoria.component')
            .then(m => m.FormularioCategoriaComponent),
        title: 'Editar Categoría - Panel Administrativo'
    }
];
