import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../services';
import { Categoria } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-lista-categorias',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-categorias.component.html',
    styleUrl: './lista-categorias.component.scss'
})
export class ListaCategoriasComponent implements OnInit {
    private categoriasService = inject(CategoriasService);
    private toastService = inject(ToastService);

    categorias = signal<Categoria[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    busqueda = signal('');
    estadoSeleccionado = signal<boolean | null>(null);

    categoriaSeleccionada = signal<Categoria | null>(null);
    mostrarModalEstado = signal(false);
    mostrarModalEliminar = signal(false);
    procesando = signal(false);

    categoriasFiltradas = computed(() => {
        let lista = this.categorias();
        const termino = this.busqueda().toLowerCase().trim();
        const estado = this.estadoSeleccionado();

        if (termino) {
            lista = lista.filter(c =>
                c.nombre.toLowerCase().includes(termino) ||
                c.slug.toLowerCase().includes(termino) ||
                (c.descripcion && c.descripcion.toLowerCase().includes(termino))
            );
        }

        if (estado !== null) {
            lista = lista.filter(c => c.activa === estado);
        }

        return lista;
    });

    categoriasRaiz = computed(() => this.categoriasFiltradas().filter(c => !c.categoriaPadreId));
    totalCategorias = computed(() => this.categoriasFiltradas().length);

    ngOnInit(): void {
        this.cargarCategorias();
    }

    cargarCategorias(): void {
        this.cargando.set(true);
        this.categoriasService.obtenerTodas().subscribe({
            next: (datos) => {
                this.categorias.set(datos);
                this.errorCarga.set(null);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudieron cargar las categorías';
                this.errorCarga.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.categorias.set([]);
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

    obtenerNombrePadre(categoriaPadreId?: number): string {
        if (!categoriaPadreId) return '';
        const padre = this.categorias().find(c => c.id === categoriaPadreId);
        return padre ? padre.nombre : '';
    }

    contarSubcategorias(categoriaId: number): number {
        return this.categorias().filter(c => c.categoriaPadreId === categoriaId).length;
    }

    obtenerIniciales(nombre: string): string {
        return nombre
            .split(' ')
            .map(p => p.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
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

    abrirModalEstado(categoria: Categoria): void {
        this.categoriaSeleccionada.set(categoria);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.categoriaSeleccionada.set(null);
    }

    confirmarCambioEstado(): void {
        const categoria = this.categoriaSeleccionada();
        if (!categoria) return;

        this.procesando.set(true);
        const nuevoEstado = !categoria.activa;

        this.categoriasService.actualizar(categoria.id, { activa: nuevoEstado }).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(
                    `Categoría "${categoria.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`
                );
                this.cerrarModalEstado();
                this.cargarCategorias();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar el estado';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    abrirModalEliminar(categoria: Categoria): void {
        this.categoriaSeleccionada.set(categoria);
        this.mostrarModalEliminar.set(true);
    }

    cerrarModalEliminar(): void {
        this.mostrarModalEliminar.set(false);
        this.categoriaSeleccionada.set(null);
    }

    confirmarEliminar(): void {
        const categoria = this.categoriaSeleccionada();
        if (!categoria) return;

        this.procesando.set(true);
        this.categoriasService.eliminar(categoria.id).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(`Categoría "${categoria.nombre}" eliminada exitosamente`);
                this.cerrarModalEliminar();
                this.cargarCategorias();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo eliminar la categoría';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }
}
