import { Routes } from '@angular/router';

export const rutasProductos: Routes = [
    {
        path: '',
        data: {
            titulo: 'Productos',
            descripcion: 'Gestión del catálogo de productos'
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/lista-productos/lista-productos.component')
                    .then(c => c.ListaProductosComponent),
                data: {
                    titulo: 'Productos',
                    descripcion: 'Lista de productos del catálogo'
                }
            },
            {
                path: 'crear',
                loadComponent: () => import('./pages/formulario-producto/formulario-producto.component')
                    .then(c => c.FormularioProductoComponent),
                data: {
                    titulo: 'Nuevo Producto',
                    descripcion: 'Registrar un nuevo producto en el catálogo',
                    modo: 'crear'
                }
            },
            {
                path: ':id/editar',
                loadComponent: () => import('./pages/formulario-producto/formulario-producto.component')
                    .then(c => c.FormularioProductoComponent),
                data: {
                    titulo: 'Editar Producto',
                    descripcion: 'Modificar los datos de un producto existente',
                    modo: 'editar'
                }
            }
        ]
    }
];
