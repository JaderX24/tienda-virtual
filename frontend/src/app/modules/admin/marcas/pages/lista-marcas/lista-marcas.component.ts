import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarcasService } from '../../services';
import { Marca } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-lista-marcas',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-marcas.component.html',
    styleUrl: './lista-marcas.component.scss'
})
export class ListaMarcasComponent implements OnInit {
    private marcasService = inject(MarcasService);
    private toastService = inject(ToastService);

    marcas = signal<Marca[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    busqueda = signal('');
    estadoSeleccionado = signal<boolean | null>(null);

    marcaSeleccionada = signal<Marca | null>(null);
    mostrarModalEstado = signal(false);
    mostrarModalEliminar = signal(false);
    procesando = signal(false);

    marcasFiltradas = computed(() => {
        let lista = this.marcas();
        const termino = this.busqueda().toLowerCase().trim();
        const estado = this.estadoSeleccionado();

        if (termino) {
            lista = lista.filter(m =>
                m.nombre.toLowerCase().includes(termino) ||
                m.slug.toLowerCase().includes(termino) ||
                (m.descripcion && m.descripcion.toLowerCase().includes(termino))
            );
        }

        if (estado !== null) {
            lista = lista.filter(m => m.activa === estado);
        }

        return lista;
    });

    totalMarcas = computed(() => this.marcasFiltradas().length);

    ngOnInit(): void {
        this.cargarMarcas();
    }

    cargarMarcas(): void {
        this.cargando.set(true);
        this.marcasService.obtenerTodas().subscribe({
            next: (datos) => {
                this.marcas.set(datos);
                this.errorCarga.set(null);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudieron cargar las marcas';
                this.errorCarga.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.marcas.set([]);
            }
        });
    }

    buscar(): void {
        this.busqueda.update(v => v);
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.estadoSeleccionado.set(null);
    }

    obtenerIniciales(nombre: string): string {
        return nombre
            .split(' ')
            .map(p => p.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    contarProductos(marca: Marca): number {
        return marca._count?.productos ?? 0;
    }

    formatearFecha(fecha: Date | string | undefined): string {
        if (!fecha) return 'Sin fecha';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    abrirModalEstado(marca: Marca): void {
        this.marcaSeleccionada.set(marca);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.marcaSeleccionada.set(null);
    }

    confirmarCambioEstado(): void {
        const marca = this.marcaSeleccionada();
        if (!marca) return;

        this.procesando.set(true);
        const nuevoEstado = !marca.activa;

        this.marcasService.cambiarEstado(marca.id, nuevoEstado).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(
                    `Marca "${marca.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`
                );
                this.cerrarModalEstado();
                this.cargarMarcas();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar el estado';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    abrirModalEliminar(marca: Marca): void {
        this.marcaSeleccionada.set(marca);
        this.mostrarModalEliminar.set(true);
    }

    cerrarModalEliminar(): void {
        this.mostrarModalEliminar.set(false);
        this.marcaSeleccionada.set(null);
    }

    confirmarEliminar(): void {
        const marca = this.marcaSeleccionada();
        if (!marca) return;

        this.procesando.set(true);
        this.marcasService.eliminar(marca.id).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(`Marca "${marca.nombre}" eliminada exitosamente`);
                this.cerrarModalEliminar();
                this.cargarMarcas();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo eliminar la marca';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }
}
