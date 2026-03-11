import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { TraducirPipe } from '../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { ClaseEstadoPipe, IconoEstadoPipe } from '../../../core/pipes/global';
import {
    ProductoConsultaService,
    ProductoLista,
    DetalleProducto,
    CategoriaProducto,
    MarcaProducto,
    ResumenProductos,
    MovimientoProducto,
    FiltrosProductos,
} from './services/producto-consulta.service';
import { ToastService } from '../../../core/services/toast.service';
import { IdiomaService } from '../../../core/services/idioma.service';

type VistaActiva = 'lista' | 'detalle';

@Component({
    selector: 'app-productos',
    standalone: true,
    imports: [CommonModule, FormsModule, TraducirPipe, ClaseEstadoPipe, IconoEstadoPipe],
    templateUrl: './productos.component.html',
    styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit, OnDestroy {
    private productoService = inject(ProductoConsultaService);
    private toastService = inject(ToastService);
    private idiomaService = inject(IdiomaService);
    private destruir$ = new Subject<void>();

    // Estado general
    vista = signal<VistaActiva>('lista');
    cargando = signal(true);
    cargandoDetalle = signal(false);
    cargandoMovimientos = signal(false);

    // Datos lista
    productos = signal<ProductoLista[]>([]);
    categorias = signal<CategoriaProducto[]>([]);
    marcas = signal<MarcaProducto[]>([]);
    resumen = signal<ResumenProductos>({
        totalProductos: 0,
        productosActivos: 0,
        agotados: 0,
        stockBajo: 0,
        inactivos: 0,
    });

    // Paginación
    paginaActual = signal(1);
    totalPaginas = signal(0);
    totalProductos = signal(0);

    // Filtros
    filtros: FiltrosProductos = {
        busqueda: '',
        categoriaId: undefined,
        marcaId: undefined,
        estado: 'todos',
        ordenarPor: 'nombre',
        ordenDireccion: 'asc',
    };

    mostrarFiltrosAvanzados = false;
    precioDesde = '';
    precioHasta = '';

    // Detalle
    productoDetalle = signal<DetalleProducto | null>(null);
    movimientos = signal<MovimientoProducto[]>([]);
    tabActiva = signal<'info' | 'movimientos'>('info');
    paginaMovimientos = signal(1);
    totalPaginasMovimientos = signal(0);
    filtroTipoMovimiento = '';
    imagenSeleccionada = signal(0);

    ngOnInit(): void {
        this.cargarDatosIniciales();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    cargarDatosIniciales(): void {
        forkJoin({
            categorias: this.productoService.obtenerCategorias(),
            marcas: this.productoService.obtenerMarcas(),
            resumen: this.productoService.obtenerResumen(),
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: ({ categorias, marcas, resumen }) => {
                if (categorias.exito) this.categorias.set(categorias.datos);
                if (marcas.exito) this.marcas.set(marcas.datos);
                if (resumen.exito) this.resumen.set(resumen.datos);
                this.cargarProductos();
            },
            error: () => {
                this.toastService.error(this.idiomaService.t('toast.errorCargarDatos'));
                this.cargarProductos();
            },
        });
    }

    cargarProductos(pagina: number = 1): void {
        this.cargando.set(true);

        const filtrosEnviar: FiltrosProductos = {
            pagina,
            limite: 15,
            ordenarPor: this.filtros.ordenarPor,
            ordenDireccion: this.filtros.ordenDireccion,
        };

        if (this.filtros.busqueda) filtrosEnviar.busqueda = this.filtros.busqueda;
        if (this.filtros.categoriaId) filtrosEnviar.categoriaId = this.filtros.categoriaId;
        if (this.filtros.marcaId) filtrosEnviar.marcaId = this.filtros.marcaId;
        if (this.filtros.estado && this.filtros.estado !== 'todos') filtrosEnviar.estado = this.filtros.estado;
        if (this.precioDesde) filtrosEnviar.precioDesde = parseFloat(this.precioDesde);
        if (this.precioHasta) filtrosEnviar.precioHasta = parseFloat(this.precioHasta);

        this.productoService.obtenerProductos(filtrosEnviar)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.productos.set(resp.datos);
                        this.paginaActual.set(resp.paginacion.pagina);
                        this.totalPaginas.set(resp.paginacion.totalPaginas);
                        this.totalProductos.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarProductos'));
                    this.cargando.set(false);
                },
            });
    }

    buscar(): void {
        this.cargarProductos(1);
    }

    limpiarFiltros(): void {
        this.filtros = {
            busqueda: '',
            categoriaId: undefined,
            marcaId: undefined,
            estado: 'todos',
            ordenarPor: 'nombre',
            ordenDireccion: 'asc',
        };
        this.precioDesde = '';
        this.precioHasta = '';
        this.mostrarFiltrosAvanzados = false;
        this.cargarProductos(1);
    }

    cambiarOrden(campo: string): void {
        if (this.filtros.ordenarPor === campo) {
            this.filtros.ordenDireccion = this.filtros.ordenDireccion === 'asc' ? 'desc' : 'asc';
        } else {
            this.filtros.ordenarPor = campo;
            this.filtros.ordenDireccion = 'asc';
        }
        this.cargarProductos(1);
    }

    obtenerIconoOrden(campo: string): string {
        if (this.filtros.ordenarPor !== campo) return 'bi-arrow-down-up';
        return this.filtros.ordenDireccion === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
    }

    // Detalle del producto
    verDetalle(producto: ProductoLista): void {
        this.vista.set('detalle');
        this.cargandoDetalle.set(true);
        this.tabActiva.set('info');
        this.imagenSeleccionada.set(0);

        this.productoService.obtenerDetalle(producto.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.productoDetalle.set(resp.datos);
                        this.movimientos.set(resp.datos.ultimosMovimientos || []);
                    }
                    this.cargandoDetalle.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarDetalle'));
                    this.cargandoDetalle.set(false);
                    this.volverALista();
                },
            });
    }

    volverALista(): void {
        this.vista.set('lista');
        this.productoDetalle.set(null);
        this.movimientos.set([]);
    }

    cambiarTab(tab: 'info' | 'movimientos'): void {
        this.tabActiva.set(tab);
        if (tab === 'movimientos' && this.movimientos().length === 0) {
            this.cargarMovimientos(1);
        }
    }

    cargarMovimientos(pagina: number = 1): void {
        const detalle = this.productoDetalle();
        if (!detalle) return;

        this.cargandoMovimientos.set(true);

        this.productoService.obtenerMovimientos(detalle.id, {
            pagina,
            limite: 15,
            tipoMovimiento: this.filtroTipoMovimiento || undefined,
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: (resp) => {
                if (resp.exito) {
                    this.movimientos.set(resp.datos);
                    this.paginaMovimientos.set(resp.paginacion.pagina);
                    this.totalPaginasMovimientos.set(resp.paginacion.totalPaginas);
                }
                this.cargandoMovimientos.set(false);
            },
            error: () => {
                this.cargandoMovimientos.set(false);
            },
        });
    }

    filtrarMovimientos(): void {
        this.cargarMovimientos(1);
    }

    seleccionarImagen(indice: number): void {
        this.imagenSeleccionada.set(indice);
    }

    // Formateo y utilidades
    formatearPrecio(precio: number): string {
        return `L ${precio.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-HN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    obtenerEtiquetaEstadoStock(estado: string): string {
        const mapa: Record<string, string> = {
            disponible: this.idiomaService.t('etiqueta.disponible'),
            bajo: this.idiomaService.t('productos.stockBajo'),
            agotado: this.idiomaService.t('reportes.agotado'),
        };
        return mapa[estado] || estado;
    }

    obtenerDiferenciaMovimiento(mov: MovimientoProducto): number {
        return mov.stockNuevo - mov.stockAnterior;
    }

    tieneDescuento(producto: ProductoLista): boolean {
        return producto.precioComparacion !== null && producto.precioComparacion > producto.precio;
    }

    calcularDescuento(producto: ProductoLista): number {
        if (!producto.precioComparacion || producto.precioComparacion <= producto.precio) return 0;
        return Math.round(((producto.precioComparacion - producto.precio) / producto.precioComparacion) * 100);
    }
}
