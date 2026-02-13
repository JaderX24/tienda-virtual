import { Routes } from '@angular/router';

export const rutasEmpresas: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/lista-empresas/lista-empresas.component')
            .then(m => m.ListaEmpresasComponent),
        title: 'Empresas - Panel Administrativo'
    },
    {
        path: 'nueva',
        loadComponent: () => import('./pages/formulario-empresa/formulario-empresa.component')
            .then(m => m.FormularioEmpresaComponent),
        title: 'Nueva Empresa - Panel Administrativo'
    },
    {
        path: ':id',
        loadComponent: () => import('./pages/detalle-empresa/detalle-empresa.component')
            .then(m => m.DetalleEmpresaComponent),
        title: 'Detalle Empresa - Panel Administrativo'
    },
    {
        path: ':id/editar',
        loadComponent: () => import('./pages/formulario-empresa/formulario-empresa.component')
            .then(m => m.FormularioEmpresaComponent),
        title: 'Editar Empresa - Panel Administrativo'
    }
];
