import { Routes } from '@angular/router';

/**
 * Rutas del módulo de gestión de tiendas
 * 
 * Estructura de rutas:
 * /admin/tiendas - Lista de tiendas
 * /admin/tiendas/crear - Crear nueva tienda  
 * /admin/tiendas/:id - Ver detalle de tienda
 * /admin/tiendas/editar/:id - Editar tienda existente
 */
export const TIENDAS_ROUTES: Routes = [
    {
        path: '',
        data: { 
            titulo: 'Gestión de Tiendas',
            descripcion: 'Administración de tiendas del sistema'
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/lista-tiendas/lista-tiendas.component')
                    .then(c => c.ListaTiendasComponent),
                data: { 
                    titulo: 'Lista de Tiendas',
                    descripcion: 'Visualiza y gestiona todas las tiendas registradas'
                }
            },
            {
                path: 'crear',
                loadComponent: () => import('./pages/formulario-tienda/formulario-tienda.component')
                    .then(c => c.FormularioTiendaComponent),
                data: { 
                    titulo: 'Crear Tienda',
                    descripcion: 'Registra una nueva tienda en el sistema',
                    modo: 'crear'
                }
            },
            {
                path: 'editar/:id',
                loadComponent: () => import('./pages/formulario-tienda/formulario-tienda.component')
                    .then(c => c.FormularioTiendaComponent),
                data: { 
                    titulo: 'Editar Tienda',
                    descripcion: 'Modifica la información de una tienda existente',
                    modo: 'editar'
                }
            },
            {
                path: ':id',
                loadComponent: () => import('./pages/detalle-tienda/detalle-tienda.component')
                    .then(c => c.DetalleTiendaComponent),
                data: { 
                    titulo: 'Detalle de Tienda',
                    descripcion: 'Visualiza la información completa de una tienda'
                }
            },
            // Redirigir cualquier ruta no encontrada a la lista
            {
                path: '**',
                redirectTo: '',
                pathMatch: 'full'
            }
        ]
    }
];

/**
 * Configuración adicional para lazy loading
 * Export por defecto para mejor compatibilidad
 */
export default TIENDAS_ROUTES;