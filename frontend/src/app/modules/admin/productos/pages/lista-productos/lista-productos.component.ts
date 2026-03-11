import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../services';
import {
    Producto,
    CategoriaResumen,
    MarcaResumen,
    FiltrosProducto
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';
import { EstadoVisualizacionService } from '../../../../../core/services/estado-visualizacion.service';

@Component({
    selector: 'app-lista-productos',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-productos.component.html',
    styleUrl: './lista-productos.component.scss'
})
export class ListaProductosComponent implements OnInit {
    private productosService = inject(ProductosService);
    private toastService = inject(ToastService);
    private estadoVisualizacion = inject(EstadoVisualizacionService);

    productos = signal<Producto[]>([]);
    categorias = signal<CategoriaResumen[]>([]);
    marcas = signal<MarcaResumen[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    busqueda = signal('');
    categoriaSeleccionada = signal<number | null>(null);
    marcaSeleccionada = signal<number | null>(null);
    estadoSeleccionado = signal<boolean | null>(null);

    paginaActual = signal(1);
    limite = signal(10);
    totalProductos = signal(0);
    totalPaginas = computed(() => Math.ceil(this.totalProductos() / this.limite()));

    productoSeleccionado = signal<Producto | null>(null);
    mostrarModalEliminar = signal(false);
    procesando = signal(false);

    estadosFiltro = [
        { valor: null, etiqueta: 'Todos' },
        { valor: true, etiqueta: 'Activos' },
        { valor: false, etiqueta: 'Inactivos' }
    ];

    ngOnInit(): void {
        this.cargarDatosIniciales();
    }

    cargarDatosIniciales(): void {
        this.cargarProductos();
        this.cargarCategorias();
        this.cargarMarcas();
    }

    cargarProductos(): void {
        this.cargando.set(true);
        this.errorCarga.set(null);

        const filtros: FiltrosProducto = {
            pagina: this.paginaActual(),
            limite: this.limite(),
            busqueda: this.busqueda().trim() || undefined,
            categoriaId: this.categoriaSeleccionada() || undefined,
            marcaId: this.marcaSeleccionada() || undefined,
            activo: this.estadoSeleccionado() ?? undefined
        };

        this.productosService.obtenerProductos(filtros).subscribe({
            next: (respuesta) => {
                this.productos.set(respuesta.datos);
                this.totalProductos.set(respuesta.total);
                this.errorCarga.set(null);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudieron cargar los productos';
                this.errorCarga.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.productos.set([]);
                this.totalProductos.set(0);
                this.toastService.error('Error al cargar los productos');
            }
        });
    }

    cargarCategorias(): void {
        this.productosService.obtenerCategorias().subscribe({
            next: (categorias) => this.categorias.set(categorias),
            error: () => this.categorias.set([])
        });
    }

    cargarMarcas(): void {
        this.productosService.obtenerMarcas().subscribe({
            next: (marcas) => this.marcas.set(marcas),
            error: () => this.marcas.set([])
        });
    }

    buscar(): void {
        this.paginaActual.set(1);
        this.cargarProductos();
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.categoriaSeleccionada.set(null);
        this.marcaSeleccionada.set(null);
        this.estadoSeleccionado.set(null);
        this.paginaActual.set(1);
        this.cargarProductos();
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
            this.cargarProductos();
        }
    }

    abrirModalEliminar(producto: Producto): void {
        this.productoSeleccionado.set(producto);
        this.mostrarModalEliminar.set(true);
    }

    cerrarModalEliminar(): void {
        this.mostrarModalEliminar.set(false);
        this.productoSeleccionado.set(null);
    }

    confirmarEliminar(): void {
        const producto = this.productoSeleccionado();
        if (!producto) return;

        this.procesando.set(true);

        this.productosService.eliminarProducto(producto.id).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(`Producto "${producto.nombre}" desactivado exitosamente`);
                this.cerrarModalEliminar();
                this.cargarProductos();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo desactivar el producto';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    formatearPrecio(monto: number): string {
        return this.productosService.formatearPrecio(monto);
    }

    obtenerEstadoStock(producto: Producto): { clase: string; texto: string; icono: string } {
        return this.productosService.obtenerEstadoStock(producto.stock, producto.stockMinimo);
    }

    obtenerClasesEstado(activo: boolean): string {
        return this.estadoVisualizacion.obtenerClase('activo_inactivo', String(activo));
    }

    obtenerTextoEstado(activo: boolean): string {
        return this.estadoVisualizacion.obtenerEtiqueta('activo_inactivo', String(activo));
    }

    obtenerIconoEstado(activo: boolean): string {
        return this.estadoVisualizacion.obtenerIcono('activo_inactivo', String(activo));
    }

    formatearFecha(fecha: string): string {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    calcularDescuento(precio: number, precioComparacion: number | null): number | null {
        if (!precioComparacion || precioComparacion <= precio) return null;
        return Math.round(((precioComparacion - precio) / precioComparacion) * 100);
    }

    obtenerPaginas(): number[] {
        const total = this.totalPaginas();
        const actual = this.paginaActual();
        const paginas: number[] = [];
        let inicio = Math.max(1, actual - 2);
        let fin = Math.min(total, actual + 2);

        if (actual <= 3) fin = Math.min(5, total);
        if (actual >= total - 2) inicio = Math.max(1, total - 4);

        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }
        return paginas;
    }
}
