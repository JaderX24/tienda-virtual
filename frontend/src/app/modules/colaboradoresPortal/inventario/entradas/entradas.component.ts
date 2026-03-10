import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { TraducirPipe } from '../../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { IdiomaService } from '../../../../core/services/idioma.service';
import {
    InventarioService,
    OperacionInventario,
    AlmacenAsignado,
    ProductoStock,
    DatosEntrada,
} from '../services/inventario.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
    selector: 'app-entradas',
    standalone: true,
    imports: [CommonModule, FormsModule, TraducirPipe],
    templateUrl: './entradas.component.html',
    styleUrl: './entradas.component.scss',
})
export class EntradasComponent implements OnInit, OnDestroy {
    private inventarioService = inject(InventarioService);
    private toastService = inject(ToastService);
    private idiomaService = inject(IdiomaService);
    private destruir$ = new Subject<void>();

    operaciones = signal<OperacionInventario[]>([]);
    almacenes = signal<AlmacenAsignado[]>([]);
    cargando = signal(true);
    procesando = this.inventarioService.procesando;

    busqueda = '';
    almacenFiltro = 0;
    fechaDesde = '';
    fechaHasta = '';
    paginaActual = signal(1);
    totalPaginas = signal(0);

    mostrarFormulario = signal(false);
    formulario: DatosEntrada = {
        productoId: 0,
        almacenId: 0,
        cantidad: 1,
        motivo: '',
    };
    notasEntrada = '';
    documentoTipo = '';
    documentoNumero = '';

    busquedaProducto = '';
    productosFiltrados = signal<ProductoStock[]>([]);
    productoSeleccionado = signal<ProductoStock | null>(null);
    mostrarListaProductos = signal(false);
    buscandoProductos = signal(false);
    private busquedaProducto$ = new Subject<string>();

    ngOnInit(): void {
        this.cargarDatosIniciales();
        this.inicializarBusquedaProductos();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    cargarDatosIniciales(): void {
        this.inventarioService.obtenerAlmacenes()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.almacenes.set(resp.datos);
                    this.cargarEntradas();
                },
                error: () => this.cargarEntradas(),
            });
    }

    cargarEntradas(pagina: number = 1): void {
        this.cargando.set(true);
        this.inventarioService.obtenerEntradas({
            almacenId: this.almacenFiltro || undefined,
            fechaDesde: this.fechaDesde || undefined,
            fechaHasta: this.fechaHasta || undefined,
            busqueda: this.busqueda || undefined,
            pagina,
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: (resp) => {
                if (resp.exito) {
                    this.operaciones.set(resp.datos);
                    this.paginaActual.set(resp.paginacion.pagina);
                    this.totalPaginas.set(resp.paginacion.totalPaginas);
                }
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false),
        });
    }

    buscar(): void {
        this.cargarEntradas(1);
    }

    limpiarFiltros(): void {
        this.busqueda = '';
        this.almacenFiltro = 0;
        this.fechaDesde = '';
        this.fechaHasta = '';
        this.cargarEntradas(1);
    }

    abrirFormulario(): void {
        this.limpiarFormulario();
        this.mostrarFormulario.set(true);
        this.cargarProductosParaSeleccion();
    }

    cerrarFormulario(): void {
        this.mostrarFormulario.set(false);
        this.limpiarFormulario();
    }

    cargarProductosParaSeleccion(): void {
        this.buscandoProductos.set(true);
        this.inventarioService.buscarProductos('', 15)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.productosFiltrados.set(resp.datos);
                    }
                    this.buscandoProductos.set(false);
                },
                error: () => this.buscandoProductos.set(false),
            });
    }

    buscarProducto(): void {
        this.mostrarListaProductos.set(true);
        this.busquedaProducto$.next(this.busquedaProducto);
    }

    private inicializarBusquedaProductos(): void {
        this.busquedaProducto$
            .pipe(
                debounceTime(350),
                distinctUntilChanged(),
                switchMap((termino) => {
                    this.buscandoProductos.set(true);
                    return this.inventarioService.buscarProductos(termino, 15)
                        .pipe(takeUntil(this.destruir$));
                }),
                takeUntil(this.destruir$),
            )
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.productosFiltrados.set(resp.datos);
                    }
                    this.buscandoProductos.set(false);
                },
                error: () => this.buscandoProductos.set(false),
            });
    }

    seleccionarProducto(producto: ProductoStock): void {
        this.productoSeleccionado.set(producto);
        this.formulario.productoId = producto.id;
        this.busquedaProducto = `${producto.nombre} (${producto.sku})`;
        this.mostrarListaProductos.set(false);
    }

    registrarEntrada(): void {
        if (!this.formulario.productoId || !this.formulario.motivo) {
            this.toastService.warning(this.idiomaService.t('toast.completeCampos'), this.idiomaService.t('toast.camposRequeridos'));
            return;
        }

        const datos: DatosEntrada = {
            ...this.formulario,
            almacenId: this.formulario.almacenId || undefined,
            notas: this.notasEntrada || undefined,
            documentoTipo: this.documentoTipo || undefined,
            documentoNumero: this.documentoNumero || undefined,
        };

        this.inventarioService.crearEntrada(datos)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje, this.idiomaService.t('toast.entradaRegistrada'));
                        this.cerrarFormulario();
                        this.cargarEntradas();
                    } else {
                        this.toastService.error(resp.mensaje);
                    }
                },
                error: (err) => {
                    this.toastService.error(
                        err.error?.message || this.idiomaService.t('toast.errorRegistrarEntrada'),
                    );
                },
            });
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    obtenerEtiquetaOperacion(tipo: string): string {
        const mapa: Record<string, string> = {
            entrada: this.idiomaService.t('reportes.entrada'),
            recepcion: this.idiomaService.t('reportes.recepcion'),
            ajuste_positivo: this.idiomaService.t('reportes.ajusteMas'),
        };
        return mapa[tipo] || tipo;
    }

    private limpiarFormulario(): void {
        this.formulario = { productoId: 0, almacenId: 0, cantidad: 1, motivo: '' };
        this.notasEntrada = '';
        this.documentoTipo = '';
        this.documentoNumero = '';
        this.busquedaProducto = '';
        this.productoSeleccionado.set(null);
        this.mostrarListaProductos.set(false);
    }
}
