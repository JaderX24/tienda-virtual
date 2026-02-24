import { Routes } from '@angular/router';

export const rutasMarcas: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/lista-marcas/lista-marcas.component')
            .then(m => m.ListaMarcasComponent),
        title: 'Marcas - Panel Administrativo'
    },
    {
        path: 'nueva',
        loadComponent: () => import('./pages/formulario-marca/formulario-marca.component')
            .then(m => m.FormularioMarcaComponent),
        title: 'Nueva Marca - Panel Administrativo'
    },
    {
        path: ':id/editar',
        loadComponent: () => import('./pages/formulario-marca/formulario-marca.component')
            .then(m => m.FormularioMarcaComponent),
        title: 'Editar Marca - Panel Administrativo'
    }
];
