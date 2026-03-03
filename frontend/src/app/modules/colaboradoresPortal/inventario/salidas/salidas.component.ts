import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
    InventarioService,
    OperacionInventario,
    AlmacenAsignado,
    ProductoStock,
    DatosSalida,
} from '../services/inventario.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
    selector: 'app-salidas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './salidas.component.html',
    styleUrl: './salidas.component.scss',
})
export class SalidasComponent implements OnInit, OnDestroy {
    private inventarioService = inject(InventarioService);
    private toastService = inject(ToastService);
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
    formulario: DatosSalida = {
        productoId: 0,
        almacenId: 0,
        cantidad: 1,
        motivo: '',
    };
    notasSalida = '';
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
                    this.cargarSalidas();
                },
                error: () => this.cargarSalidas(),
            });
    }

    cargarSalidas(pagina: number = 1): void {
        this.cargando.set(true);
        this.inventarioService.obtenerSalidas({
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
        this.cargarSalidas(1);
    }

    limpiarFiltros(): void {
        this.busqueda = '';
        this.almacenFiltro = 0;
        this.fechaDesde = '';
        this.fechaHasta = '';
        this.cargarSalidas(1);
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

    registrarSalida(): void {
        if (!this.formulario.productoId || !this.formulario.motivo) {
            this.toastService.warning('Complete todos los campos obligatorios', 'Campos requeridos');
            return;
        }

        const productoSel = this.productoSeleccionado();
        if (productoSel && this.formulario.cantidad > productoSel.stock) {
            this.toastService.warning(
                `Stock insuficiente. Disponible: ${productoSel.stock}, Solicitado: ${this.formulario.cantidad}`,
                'Stock insuficiente',
            );
            return;
        }

        const datos: DatosSalida = {
            ...this.formulario,
            almacenId: this.formulario.almacenId || undefined,
            notas: this.notasSalida || undefined,
            documentoTipo: this.documentoTipo || undefined,
            documentoNumero: this.documentoNumero || undefined,
        };

        this.inventarioService.crearSalida(datos)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje, 'Salida registrada');
                        this.cerrarFormulario();
                        this.cargarSalidas();
                    } else {
                        this.toastService.error(resp.mensaje);
                    }
                },
                error: (err) => {
                    this.toastService.error(
                        err.error?.message || 'Error al registrar la salida',
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
            salida: 'Salida',
            despacho: 'Despacho',
            ajuste_negativo: 'Ajuste (-)',
        };
        return mapa[tipo] || tipo;
    }

    private limpiarFormulario(): void {
        this.formulario = { productoId: 0, almacenId: 0, cantidad: 1, motivo: '' };
        this.notasSalida = '';
        this.documentoTipo = '';
        this.documentoNumero = '';
        this.busquedaProducto = '';
        this.productoSeleccionado.set(null);
        this.mostrarListaProductos.set(false);
    }
}
