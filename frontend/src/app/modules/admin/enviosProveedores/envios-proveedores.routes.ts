import { Routes } from '@angular/router';

export const ENVIOS_PROVEEDORES_ROUTES: Routes = [
    {
        path: '',
        data: {
            titulo: 'Proveedores de Envío',
            descripcion: 'Gestión de proveedores de logística y envíos'
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/lista-proveedores-envio/lista-proveedores-envio.component')
                    .then(c => c.ListaProveedoresEnvioComponent),
                data: {
                    titulo: 'Proveedores de Envío',
                    descripcion: 'Gestiona los proveedores de logística y envíos del sistema'
                }
            },
            {
                path: 'crear',
                loadComponent: () => import('./pages/formulario-proveedor-envio/formulario-proveedor-envio.component')
                    .then(c => c.FormularioProveedorEnvioComponent),
                data: {
                    titulo: 'Nuevo Proveedor de Envío',
                    descripcion: 'Registra un nuevo proveedor de logística y envíos',
                    modo: 'crear'
                }
            },
            {
                path: 'editar/:id',
                loadComponent: () => import('./pages/formulario-proveedor-envio/formulario-proveedor-envio.component')
                    .then(c => c.FormularioProveedorEnvioComponent),
                data: {
                    titulo: 'Editar Proveedor de Envío',
                    descripcion: 'Modifica la configuración de un proveedor de envío existente',
                    modo: 'editar'
                }
            }
        ]
    }
];
