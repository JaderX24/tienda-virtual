import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { TraducirPipe } from '../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { ClaseEstadoPipe, IconoEstadoPipe } from '../../../core/pipes/global';
import {
    TransferenciaService,
    Transferencia,
    AlmacenInfo,
    ProductoStock,
    DatosTransferencia,
} from './services/transferencia.service';
import { ToastService } from '../../../core/services/toast.service';
import { IdiomaService } from '../../../core/services/idioma.service';

@Component({
    selector: 'app-transferencias',
    standalone: true,
    imports: [CommonModule, FormsModule, TraducirPipe, ClaseEstadoPipe, IconoEstadoPipe],
    templateUrl: './transferencias.component.html',
    styleUrl: './transferencias.component.scss',
})
export class TransferenciasComponent implements OnInit, OnDestroy {
    private transferenciaService = inject(TransferenciaService);
    private toastService = inject(ToastService);
    private idiomaService = inject(IdiomaService);
    private destruir$ = new Subject<void>();

    transferencias = signal<Transferencia[]>([]);
    almacenesAsignados = signal<AlmacenInfo[]>([]);
    todosAlmacenes = signal<AlmacenInfo[]>([]);
    cargando = signal(true);
    procesando = this.transferenciaService.procesando;

    // Filtros
    busqueda = '';
    almacenOrigenFiltro = 0;
    almacenDestinoFiltro = 0;
    estadoFiltro = '';
    fechaDesde = '';
    fechaHasta = '';
    paginaActual = signal(1);
    totalPaginas = signal(0);
    totalRegistros = signal(0);

    // Formulario nueva transferencia
    mostrarFormulario = signal(false);
    formulario: DatosTransferencia = {
        productoId: 0,
        almacenOrigenId: 0,
        almacenDestinoId: 0,
        cantidad: 1,
        motivo: '',
    };
    notasTransferencia = '';
    documentoTipo = '';
    documentoNumero = '';

    // Búsqueda de productos
    busquedaProducto = '';
    productosFiltrados = signal<ProductoStock[]>([]);
    productoSeleccionado = signal<ProductoStock | null>(null);
    mostrarListaProductos = signal(false);
    buscandoProductos = signal(false);
    private busquedaProducto$ = new Subject<string>();

    // Detalle / acciones
    mostrarDetalle = signal(false);
    transferenciaDetalle = signal<Transferencia | null>(null);
    mostrarModalEstado = signal(false);
    nuevoEstado = '';
    notasEstado = '';

    ngOnInit(): void {
        this.cargarDatosIniciales();
        this.inicializarBusquedaProductos();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    cargarDatosIniciales(): void {
        this.transferenciaService.obtenerAlmacenes()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.almacenesAsignados.set(resp.datos.asignados);
                        this.todosAlmacenes.set(resp.datos.todos);
                    }
                    this.cargarTransferencias();
                },
                error: () => this.cargarTransferencias(),
            });
    }

    cargarTransferencias(pagina: number = 1): void {
        this.cargando.set(true);
        this.transferenciaService.obtenerTransferencias({
            almacenOrigenId: this.almacenOrigenFiltro || undefined,
            almacenDestinoId: this.almacenDestinoFiltro || undefined,
            estado: this.estadoFiltro || undefined,
            fechaDesde: this.fechaDesde || undefined,
            fechaHasta: this.fechaHasta || undefined,
            busqueda: this.busqueda || undefined,
            pagina,
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: (resp) => {
                if (resp.exito) {
                    this.transferencias.set(resp.datos);
                    this.paginaActual.set(resp.paginacion.pagina);
                    this.totalPaginas.set(resp.paginacion.totalPaginas);
                    this.totalRegistros.set(resp.paginacion.total);
                }
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false),
        });
    }

    buscar(): void {
        this.cargarTransferencias(1);
    }

    limpiarFiltros(): void {
        this.busqueda = '';
        this.almacenOrigenFiltro = 0;
        this.almacenDestinoFiltro = 0;
        this.estadoFiltro = '';
        this.fechaDesde = '';
        this.fechaHasta = '';
        this.cargarTransferencias(1);
    }

    // Formulario
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
        this.transferenciaService.buscarProductos('', 15)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.productosFiltrados.set(resp.datos);
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
                    return this.transferenciaService.buscarProductos(termino, 15)
                        .pipe(takeUntil(this.destruir$));
                }),
                takeUntil(this.destruir$),
            )
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.productosFiltrados.set(resp.datos);
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

    registrarTransferencia(): void {
        if (!this.formulario.productoId) {
            this.toastService.warning(this.idiomaService.t('toast.seleccioneProducto'), this.idiomaService.t('toast.campoRequerido'));
            return;
        }

        if (!this.formulario.almacenOrigenId) {
            this.toastService.warning(this.idiomaService.t('toast.seleccioneOrigen'), this.idiomaService.t('toast.campoRequerido'));
            return;
        }

        if (!this.formulario.almacenDestinoId) {
            this.toastService.warning(this.idiomaService.t('toast.seleccioneDestino'), this.idiomaService.t('toast.campoRequerido'));
            return;
        }

        if (this.formulario.almacenOrigenId === this.formulario.almacenDestinoId) {
            this.toastService.warning(this.idiomaService.t('toast.almacenesIgualesMsg'), this.idiomaService.t('toast.almacenesIguales'));
            return;
        }

        if (!this.formulario.motivo || this.formulario.motivo.trim().length < 3) {
            this.toastService.warning(this.idiomaService.t('toast.motivoInvalido'), this.idiomaService.t('toast.campoRequerido'));
            return;
        }

        const productoSel = this.productoSeleccionado();
        if (productoSel && this.formulario.cantidad > productoSel.stock) {
            this.toastService.warning(
                this.idiomaService.t('toast.stockInsufMsg').replace('{disponible}', String(productoSel.stock)).replace('{solicitado}', String(this.formulario.cantidad)),
                this.idiomaService.t('toast.stockInsuficiente'),
            );
            return;
        }

        const datos: DatosTransferencia = {
            ...this.formulario,
            notas: this.notasTransferencia || undefined,
            documentoTipo: this.documentoTipo || undefined,
            documentoNumero: this.documentoNumero || undefined,
        };

        this.transferenciaService.crearTransferencia(datos)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje, this.idiomaService.t('toast.transferenciaCreada'));
                        this.cerrarFormulario();
                        this.cargarTransferencias();
                    } else {
                        this.toastService.error(resp.mensaje);
                    }
                },
                error: (err) => {
                    this.toastService.error(
                        err.error?.message || this.idiomaService.t('toast.errorCrearTransferencia'),
                    );
                },
            });
    }

    // Detalle
    verDetalle(transferencia: Transferencia): void {
        this.transferenciaDetalle.set(transferencia);
        this.mostrarDetalle.set(true);
    }

    cerrarDetalle(): void {
        this.mostrarDetalle.set(false);
        this.transferenciaDetalle.set(null);
    }

    // Cambio de estado
    abrirCambioEstado(transferencia: Transferencia, estado: string): void {
        this.transferenciaDetalle.set(transferencia);
        this.nuevoEstado = estado;
        this.notasEstado = '';
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.nuevoEstado = '';
        this.notasEstado = '';
    }

    confirmarCambioEstado(): void {
        const transferencia = this.transferenciaDetalle();
        if (!transferencia) return;

        this.transferenciaService.actualizarEstado(transferencia.id, {
            estado: this.nuevoEstado,
            notas: this.notasEstado || undefined,
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: (resp) => {
                if (resp.exito) {
                    this.toastService.success(resp.mensaje, this.idiomaService.t('toast.estadoActualizado'));
                    this.cerrarModalEstado();
                    this.cerrarDetalle();
                    this.cargarTransferencias(this.paginaActual());
                } else {
                    this.toastService.error(resp.mensaje);
                }
            },
            error: (err) => {
                this.toastService.error(
                    err.error?.message || this.idiomaService.t('toast.errorActualizarEstado'),
                );
            },
        });
    }

    // Utilidades
    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    obtenerEtiquetaEstado(estado: string): string {
        const etiquetas: Record<string, string> = {
            pendiente: this.idiomaService.t('comun.pendiente'),
            en_transito: this.idiomaService.t('etiqueta.enTransito'),
            completada: this.idiomaService.t('comun.completada'),
            cancelada: this.idiomaService.t('comun.cancelada'),
        };
        return etiquetas[estado] || estado;
    }

    obtenerEtiquetaNuevoEstado(): string {
        return this.obtenerEtiquetaEstado(this.nuevoEstado);
    }

    puedeTransitar(transferencia: Transferencia): boolean {
        return transferencia.estado === 'pendiente';
    }

    puedeCompletar(transferencia: Transferencia): boolean {
        return transferencia.estado === 'en_transito';
    }

    puedeCancelar(transferencia: Transferencia): boolean {
        return transferencia.estado === 'pendiente' || transferencia.estado === 'en_transito';
    }

    almacenesDestinoDisponibles(): AlmacenInfo[] {
        const origenId = this.formulario.almacenOrigenId;
        return this.todosAlmacenes().filter(a => a.id !== origenId);
    }

    private limpiarFormulario(): void {
        this.formulario = {
            productoId: 0,
            almacenOrigenId: 0,
            almacenDestinoId: 0,
            cantidad: 1,
            motivo: '',
        };
        this.notasTransferencia = '';
        this.documentoTipo = '';
        this.documentoNumero = '';
        this.busquedaProducto = '';
        this.productoSeleccionado.set(null);
        this.mostrarListaProductos.set(false);
    }
}
