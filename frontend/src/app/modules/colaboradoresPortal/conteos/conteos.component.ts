import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TraducirPipe } from '../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { IdiomaService } from '../../../core/services/idioma.service';
import {
    ConteoService,
    Conteo,
    DetalleConteo,
    DetalleProductoConteo,
    AlmacenConteo,
    CategoriaConteo,
    ProductoParaConteo,
    ResumenConteos,
    DatosCrearConteo,
    DatosRegistrarDetalle,
} from './services/conteo.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-conteos',
    standalone: true,
    imports: [CommonModule, FormsModule, TraducirPipe],
    templateUrl: './conteos.component.html',
    styleUrl: './conteos.component.scss',
})
export class ConteosComponent implements OnInit, OnDestroy {
    private conteoService = inject(ConteoService);
    private toastService = inject(ToastService);
    private idiomaService = inject(IdiomaService);
    private destruir$ = new Subject<void>();

    conteos = signal<Conteo[]>([]);
    almacenes = signal<AlmacenConteo[]>([]);
    categorias = signal<CategoriaConteo[]>([]);
    resumen = signal<ResumenConteos>({ programados: 0, enProgreso: 0, completados: 0, totalMes: 0 });
    cargando = signal(true);
    procesando = this.conteoService.procesando;

    // Filtros
    busqueda = '';
    almacenFiltro = 0;
    estadoFiltro = '';
    tipoFiltro = '';
    fechaDesde = '';
    fechaHasta = '';
    paginaActual = signal(1);
    totalPaginas = signal(0);
    totalRegistros = signal(0);

    // Vista actual: 'lista' | 'detalle' | 'contando'
    vistaActual = signal<'lista' | 'detalle' | 'contando'>('lista');

    // Formulario nuevo conteo
    mostrarFormulario = signal(false);
    formulario: DatosCrearConteo = {
        almacenId: 0,
        tipo: 'parcial',
        fechaProgramada: '',
        zonaConteo: '',
        categoriaId: undefined,
        notas: '',
    };

    // Detalle de conteo
    conteoDetalle = signal<DetalleConteo | null>(null);

    // Modo conteo (registrar productos)
    productosParaContar = signal<ProductoParaConteo[]>([]);
    productosContadosFiltrados = computed(() => {
        const termino = this.busquedaProductoConteo.toLowerCase();
        const productos = this.productosParaContar();
        if (!termino) return productos;
        return productos.filter(p =>
            p.nombre.toLowerCase().includes(termino) ||
            p.sku.toLowerCase().includes(termino),
        );
    });
    busquedaProductoConteo = '';
    conteoActualId = '';
    cantidadesRegistrar: Record<number, number | null> = {};

    // Modal cambio estado
    mostrarModalEstado = signal(false);
    conteoParaEstado = signal<Conteo | null>(null);
    nuevoEstado = '';
    notasEstado = '';
    ajustarStock = false;

    ngOnInit(): void {
        this.cargarDatosIniciales();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    cargarDatosIniciales(): void {
        this.conteoService.obtenerAlmacenes()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.almacenes.set(resp.datos);
                },
            });

        this.conteoService.obtenerCategorias()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.categorias.set(resp.datos);
                },
            });

        this.conteoService.obtenerResumen()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.resumen.set(resp.datos);
                },
            });

        this.cargarConteos();
    }

    cargarConteos(pagina: number = 1): void {
        this.cargando.set(true);
        this.conteoService.obtenerConteos({
            almacenId: this.almacenFiltro || undefined,
            estado: this.estadoFiltro || undefined,
            tipo: this.tipoFiltro || undefined,
            fechaDesde: this.fechaDesde || undefined,
            fechaHasta: this.fechaHasta || undefined,
            busqueda: this.busqueda || undefined,
            pagina,
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: (resp) => {
                if (resp.exito) {
                    this.conteos.set(resp.datos);
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
        this.cargarConteos(1);
    }

    limpiarFiltros(): void {
        this.busqueda = '';
        this.almacenFiltro = 0;
        this.estadoFiltro = '';
        this.tipoFiltro = '';
        this.fechaDesde = '';
        this.fechaHasta = '';
        this.cargarConteos(1);
    }

    // Formulario nuevo conteo
    abrirFormulario(): void {
        this.limpiarFormulario();
        const hoy = new Date();
        this.formulario.fechaProgramada = hoy.toISOString().split('T')[0];
        this.mostrarFormulario.set(true);
    }

    cerrarFormulario(): void {
        this.mostrarFormulario.set(false);
        this.limpiarFormulario();
    }

    registrarConteo(): void {
        if (!this.formulario.almacenId) {
            this.toastService.warning(this.idiomaService.t('toast.seleccioneAlmacen'), this.idiomaService.t('toast.campoRequerido'));
            return;
        }
        if (!this.formulario.fechaProgramada) {
            this.toastService.warning(this.idiomaService.t('toast.seleccioneFecha'), this.idiomaService.t('toast.campoRequerido'));
            return;
        }

        const datos: DatosCrearConteo = {
            almacenId: this.formulario.almacenId,
            tipo: this.formulario.tipo,
            fechaProgramada: this.formulario.fechaProgramada,
            zonaConteo: this.formulario.zonaConteo || undefined,
            categoriaId: this.formulario.categoriaId || undefined,
            notas: this.formulario.notas || undefined,
        };

        this.conteoService.crearConteo(datos)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje || this.idiomaService.t('toast.conteoProgramadoMsg'), this.idiomaService.t('toast.conteoProgramado'));
                        this.cerrarFormulario();
                        this.cargarConteos();
                        this.actualizarResumen();
                    } else {
                        this.toastService.error(resp.mensaje || this.idiomaService.t('toast.errorCrearConteo'));
                    }
                },
                error: (err) => {
                    this.toastService.error(err.error?.message || this.idiomaService.t('toast.errorCrearConteo'));
                },
            });
    }

    // Ver detalle
    verDetalle(conteo: Conteo): void {
        this.cargando.set(true);
        this.conteoService.obtenerDetalle(conteo.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.conteoDetalle.set(resp.datos);
                        this.vistaActual.set('detalle');
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarDetConteo'));
                    this.cargando.set(false);
                },
            });
    }

    cerrarDetalle(): void {
        this.vistaActual.set('lista');
        this.conteoDetalle.set(null);
    }

    // Modo conteo
    iniciarConteo(conteo: Conteo): void {
        if (conteo.estado === 'programado') {
            this.conteoService.actualizarEstado(conteo.id, { estado: 'en_progreso' })
                .pipe(takeUntil(this.destruir$))
                .subscribe({
                    next: (resp) => {
                        if (resp.exito) {
                            this.toastService.success(this.idiomaService.t('toast.conteoIniciado'), this.idiomaService.t('toast.enProgreso'));
                            this.abrirModoConteo(conteo.id);
                            this.actualizarResumen();
                        }
                    },
                    error: (err) => {
                        this.toastService.error(err.error?.message || this.idiomaService.t('toast.errorIniciarConteo'));
                    },
                });
        } else if (conteo.estado === 'en_progreso') {
            this.abrirModoConteo(conteo.id);
        }
    }

    private abrirModoConteo(conteoId: string): void {
        this.conteoActualId = conteoId;
        this.cantidadesRegistrar = {};
        this.busquedaProductoConteo = '';

        this.conteoService.obtenerProductosParaConteo(conteoId)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.productosParaContar.set(resp.datos);
                        for (const prod of resp.datos) {
                            this.cantidadesRegistrar[prod.id] = prod.yaContado ? prod.cantidadRegistrada : null;
                        }
                        this.vistaActual.set('contando');
                    }
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorCargarProductos')),
            });
    }

    cerrarModoConteo(): void {
        this.vistaActual.set('lista');
        this.cargarConteos(this.paginaActual());
    }

    guardarConteoProducto(producto: ProductoParaConteo): void {
        const cantidad = this.cantidadesRegistrar[producto.id];
        if (cantidad === null || cantidad === undefined || cantidad < 0) {
            this.toastService.warning(this.idiomaService.t('toast.cantidadInvalidaMsg'), this.idiomaService.t('toast.cantidadInvalida'));
            return;
        }

        const datos: DatosRegistrarDetalle = {
            productoId: producto.id,
            cantidadFisica: cantidad,
        };

        this.conteoService.registrarDetalle(this.conteoActualId, datos)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje || this.idiomaService.t('toast.productoRegistrado'), this.idiomaService.t('toast.registrado'));
                        const productos = this.productosParaContar();
                        const actualizado = productos.map(p =>
                            p.id === producto.id
                                ? { ...p, yaContado: true, cantidadRegistrada: cantidad }
                                : p,
                        );
                        this.productosParaContar.set(actualizado);
                    }
                },
                error: (err) => {
                    this.toastService.error(err.error?.message || this.idiomaService.t('toast.errorRegistrar'));
                },
            });
    }

    guardarTodosLosConteos(): void {
        const detalles: DatosRegistrarDetalle[] = [];

        for (const prod of this.productosParaContar()) {
            const cantidad = this.cantidadesRegistrar[prod.id];
            if (cantidad !== null && cantidad !== undefined && cantidad >= 0) {
                detalles.push({ productoId: prod.id, cantidadFisica: cantidad });
            }
        }

        if (detalles.length === 0) {
            this.toastService.warning(this.idiomaService.t('toast.sinProductosCantidad'), this.idiomaService.t('toast.sinCambios'));
            return;
        }

        this.conteoService.registrarDetallesLote(this.conteoActualId, detalles)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje || this.idiomaService.t('toast.loteRegistrado'), this.idiomaService.t('toast.loteGuardado'));
                        this.abrirModoConteo(this.conteoActualId);
                    }
                },
                error: (err) => {
                    this.toastService.error(err.error?.message || this.idiomaService.t('toast.errorGuardarLote'));
                },
            });
    }

    contadosCount(): number {
        return this.productosParaContar().filter(p => p.yaContado).length;
    }

    totalProductosConteo(): number {
        return this.productosParaContar().length;
    }

    progresoConteo(): number {
        const total = this.totalProductosConteo();
        if (total === 0) return 0;
        return Math.round((this.contadosCount() / total) * 100);
    }

    // Estado
    abrirCambioEstado(conteo: Conteo, estado: string): void {
        this.conteoParaEstado.set(conteo);
        this.nuevoEstado = estado;
        this.notasEstado = '';
        this.ajustarStock = estado === 'aprobado';
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.conteoParaEstado.set(null);
        this.nuevoEstado = '';
        this.notasEstado = '';
        this.ajustarStock = false;
    }

    confirmarCambioEstado(): void {
        const conteo = this.conteoParaEstado();
        if (!conteo) return;

        this.conteoService.actualizarEstado(conteo.id, {
            estado: this.nuevoEstado,
            notas: this.notasEstado || undefined,
            ajustarStock: this.nuevoEstado === 'aprobado' ? this.ajustarStock : undefined,
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: (resp) => {
                if (resp.exito) {
                    this.toastService.success(resp.mensaje || this.idiomaService.t('toast.estadoActualizado'), this.idiomaService.t('toast.estadoActualizado'));
                    this.cerrarModalEstado();

                    if (this.vistaActual() === 'detalle') {
                        this.cerrarDetalle();
                    }

                    this.cargarConteos(this.paginaActual());
                    this.actualizarResumen();
                } else {
                    this.toastService.error(resp.mensaje || this.idiomaService.t('toast.errorActualizarEstado'));
                }
            },
            error: (err) => {
                this.toastService.error(err.error?.message || this.idiomaService.t('toast.errorActualizarEstado'));
            },
        });
    }

    // Utilidades
    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    formatearFechaHora(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    obtenerClaseEstado(estado: string): string {
        const clases: Record<string, string> = {
            programado: 'bg-secondary-subtle text-secondary',
            en_progreso: 'bg-info-subtle text-info',
            completado: 'bg-primary-subtle text-primary',
            aprobado: 'bg-success-subtle text-success',
            rechazado: 'bg-danger-subtle text-danger',
            cancelado: 'bg-warning-subtle text-warning',
        };
        return clases[estado] || 'bg-secondary-subtle text-secondary';
    }

    obtenerEtiquetaEstado(estado: string): string {
        const etiquetas: Record<string, string> = {
            programado: this.idiomaService.t('etiqueta.programado'),
            en_progreso: this.idiomaService.t('etiqueta.enProgresoLabel'),
            completado: this.idiomaService.t('etiqueta.completado'),
            aprobado: this.idiomaService.t('etiqueta.aprobado'),
            rechazado: this.idiomaService.t('etiqueta.rechazado'),
            cancelado: this.idiomaService.t('etiqueta.cancelado'),
        };
        return etiquetas[estado] || estado;
    }

    obtenerIconoEstado(estado: string): string {
        const iconos: Record<string, string> = {
            programado: 'bi-calendar-event',
            en_progreso: 'bi-play-circle',
            completado: 'bi-check2-circle',
            aprobado: 'bi-check-circle-fill',
            rechazado: 'bi-x-circle',
            cancelado: 'bi-slash-circle',
        };
        return iconos[estado] || 'bi-question-circle';
    }

    puedeIniciar(conteo: Conteo): boolean {
        return conteo.estado === 'programado';
    }

    puedeContinuar(conteo: Conteo): boolean {
        return conteo.estado === 'en_progreso';
    }

    puedeCompletar(conteo: Conteo): boolean {
        return conteo.estado === 'en_progreso' && conteo.productosRegistrados > 0;
    }

    puedeAprobar(conteo: Conteo): boolean {
        return conteo.estado === 'completado';
    }

    puedeRechazar(conteo: Conteo): boolean {
        return conteo.estado === 'completado';
    }

    puedeCancelar(conteo: Conteo): boolean {
        return conteo.estado === 'programado' || conteo.estado === 'en_progreso';
    }

    puedeReanudar(conteo: Conteo): boolean {
        return conteo.estado === 'rechazado';
    }

    obtenerClaseDiferencia(diferencia: number): string {
        if (diferencia < 0) return 'text-danger';
        if (diferencia > 0) return 'text-success';
        return 'text-muted';
    }

    private limpiarFormulario(): void {
        this.formulario = {
            almacenId: 0,
            tipo: 'parcial',
            fechaProgramada: '',
            zonaConteo: '',
            categoriaId: undefined,
            notas: '',
        };
    }

    private actualizarResumen(): void {
        this.conteoService.obtenerResumen()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.resumen.set(resp.datos);
                },
            });
    }
}
