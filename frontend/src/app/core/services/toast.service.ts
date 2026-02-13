import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
    id: number;
    tipo: 'success' | 'error' | 'warning' | 'info';
    mensaje: string;
    titulo?: string;
    duracion?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private readonly toasts = signal<Toast[]>([]);
    private contadorId = 0;

    readonly listaToasts = this.toasts.asReadonly();
    readonly hayToasts = computed(() => this.toasts().length > 0);

    success(mensaje: string, titulo?: string, duracion = 5000): void {
        this.agregar('success', mensaje, titulo, duracion);
    }

    error(mensaje: string, titulo?: string, duracion = 8000): void {
        this.agregar('error', mensaje, titulo, duracion);
    }

    warning(mensaje: string, titulo?: string, duracion = 6000): void {
        this.agregar('warning', mensaje, titulo, duracion);
    }

    info(mensaje: string, titulo?: string, duracion = 5000): void {
        this.agregar('info', mensaje, titulo, duracion);
    }

    private agregar(tipo: Toast['tipo'], mensaje: string, titulo?: string, duracion = 5000): void {
        const id = ++this.contadorId;
        const toast: Toast = { id, tipo, mensaje, titulo, duracion };
        
        this.toasts.update(lista => [...lista, toast]);

        if (duracion > 0) {
            setTimeout(() => this.eliminar(id), duracion);
        }
    }

    eliminar(id: number): void {
        this.toasts.update(lista => lista.filter(t => t.id !== id));
    }

    limpiar(): void {
        this.toasts.set([]);
    }
}
