import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;">
            @for (toast of toastService.listaToasts(); track toast.id) {
                <div 
                    class="toast show mb-2"
                    [class.text-bg-success]="toast.tipo === 'success'"
                    [class.text-bg-danger]="toast.tipo === 'error'"
                    [class.text-bg-warning]="toast.tipo === 'warning'"
                    [class.text-bg-info]="toast.tipo === 'info'"
                    role="alert"
                >
                    <div class="toast-header">
                        <i class="bi me-2" [ngClass]="obtenerIcono(toast.tipo)"></i>
                        <strong class="me-auto">{{ toast.titulo || obtenerTitulo(toast.tipo) }}</strong>
                        <button 
                            type="button" 
                            class="btn-close btn-close-white" 
                            (click)="toastService.eliminar(toast.id)"
                        ></button>
                    </div>
                    <div class="toast-body">
                        {{ toast.mensaje }}
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .toast {
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .toast-header {
            color: white;
            background-color: rgba(0, 0, 0, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
    `]
})
export class ToastContainerComponent {
    readonly toastService = inject(ToastService);

    obtenerIcono(tipo: Toast['tipo']): string {
        const iconos = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        return iconos[tipo];
    }

    obtenerTitulo(tipo: Toast['tipo']): string {
        const titulos = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información'
        };
        return titulos[tipo];
    }
}
