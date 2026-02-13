import { Routes } from '@angular/router';

export const METODOS_PAGO_ROUTES: Routes = [
    {
        path: '',
        data: {
            titulo: 'Métodos de Pago',
            descripcion: 'Configuración global de métodos de pago del sistema'
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/lista-metodos-pago/lista-metodos-pago.component')
                    .then(c => c.ListaMetodosPagoComponent),
                data: {
                    titulo: 'Métodos de Pago',
                    descripcion: 'Gestiona las pasarelas y formas de pago aceptadas'
                }
            },
            {
                path: 'crear',
                loadComponent: () => import('./pages/formulario-metodo-pago/formulario-metodo-pago.component')
                    .then(c => c.FormularioMetodoPagoComponent),
                data: {
                    titulo: 'Nuevo Método de Pago',
                    descripcion: 'Registra un nuevo método de pago en el sistema',
                    modo: 'crear'
                }
            },
            {
                path: 'editar/:id',
                loadComponent: () => import('./pages/formulario-metodo-pago/formulario-metodo-pago.component')
                    .then(c => c.FormularioMetodoPagoComponent),
                data: {
                    titulo: 'Editar Método de Pago',
                    descripcion: 'Modifica la configuración de un método de pago existente',
                    modo: 'editar'
                }
            }
        ]
    }
];
