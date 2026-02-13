import { Routes } from '@angular/router';

export const rutasGeneral: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/configuracion-general/configuracion-general.component')
            .then(m => m.ConfiguracionGeneralComponent),
        title: 'Configuración General - Panel Administrativo'
    }
];
