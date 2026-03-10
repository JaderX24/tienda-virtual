import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { TraducirPipe } from '../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { IdiomaService } from '../../../core/services/idioma.service';
import {
    ReportesService,
    ResumenInventario,
    MovimientoReporte,
    ProductoCritico,
    ResumenStockCritico,
    ResumenMiActividad,
    CategoriaMovimiento,
    FiltrosReporte,
} from './services/reportes.service';
import { ToastService } from '../../../core/services/toast.service';

type TabActiva = 'resumen' | 'movimientos' | 'stock-critico' | 'mi-actividad';

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule, TraducirPipe],
    templateUrl: './reportes.component.html',
    styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit, OnDestroy {
    private reportesService = inject(ReportesService);
    private toastService = inject(ToastService);
    private idiomaService = inject(IdiomaService);
    private destruir$ = new Subject<void>();

    // Estado general
    tabActiva = signal<TabActiva>('resumen');
    cargando = signal(true);

    // Filtros globales
    fechaDesde = '';
    fechaHasta = '';
    busqueda = '';
    tipoOperacionFiltro = '';

    // Resumen
    resumen = signal<ResumenInventario>({
        totalProductos: 0,
        productosActivos: 0,
        agotados: 0,
        stockBajo: 0,
        inactivos: 0,
        totalEntradas: 0,
        totalSalidas: 0,
        valorInventario: 0,
        topProductos: [],
    });
    categorias = signal<CategoriaMovimiento[]>([]);

    // Movimientos
    movimientos = signal<MovimientoReporte[]>([]);
    paginaMovimientos = signal(1);
    totalPaginasMovimientos = signal(0);
    totalMovimientos = signal(0);

    // Stock crítico
    productosCriticos = signal<ProductoCritico[]>([]);
    resumenCritico = signal<ResumenStockCritico>({ totalAgotados: 0, totalStockBajo: 0 });
    paginaCriticos = signal(1);
    totalPaginasCriticos = signal(0);
    totalCriticos = signal(0);
    busquedaCritico = '';

    // Mi actividad
    resumenActividad = signal<ResumenMiActividad>({
        totalOperaciones: 0,
        entradas: 0,
        salidas: 0,
        ajustes: 0,
        conteosRealizados: 0,
    });
    operacionesPersonales = signal<MovimientoReporte[]>([]);
    paginaActividad = signal(1);
    totalPaginasActividad = signal(0);
    totalActividad = signal(0);

    ngOnInit(): void {
        this.establecerRangoFechaDefecto();
        this.cargarResumen();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    cambiarTab(tab: TabActiva): void {
        this.tabActiva.set(tab);
        if (tab === 'resumen') this.cargarResumen();
        if (tab === 'movimientos') this.cargarMovimientos(1);
        if (tab === 'stock-critico') this.cargarStockCritico(1);
        if (tab === 'mi-actividad') this.cargarMiActividad(1);
    }

    // Resumen
    cargarResumen(): void {
        this.cargando.set(true);
        const filtros = this.obtenerFiltrosBase();

        forkJoin({
            resumen: this.reportesService.obtenerResumen(filtros),
            categorias: this.reportesService.obtenerMovimientosPorCategoria(filtros),
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: ({ resumen, categorias }) => {
                if (resumen.exito) this.resumen.set(resumen.datos);
                if (categorias.exito) this.categorias.set(categorias.datos);
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error(this.idiomaService.t('toast.errorCargarResumenRep'));
                this.cargando.set(false);
            },
        });
    }

    // Movimientos
    cargarMovimientos(pagina: number = 1): void {
        this.cargando.set(true);
        const filtros: FiltrosReporte = {
            ...this.obtenerFiltrosBase(),
            busqueda: this.busqueda || undefined,
            tipoOperacion: this.tipoOperacionFiltro || undefined,
            pagina,
            limite: 20,
        };

        this.reportesService.obtenerMovimientos(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.movimientos.set(resp.datos);
                        this.paginaMovimientos.set(resp.paginacion.pagina);
                        this.totalPaginasMovimientos.set(resp.paginacion.totalPaginas);
                        this.totalMovimientos.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarMovimientos'));
                    this.cargando.set(false);
                },
            });
    }

    // Stock crítico
    cargarStockCritico(pagina: number = 1): void {
        this.cargando.set(true);
        const filtros: FiltrosReporte = {
            busqueda: this.busquedaCritico || undefined,
            pagina,
            limite: 20,
        };

        this.reportesService.obtenerStockCritico(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.productosCriticos.set(resp.datos);
                        this.resumenCritico.set(resp.resumen);
                        this.paginaCriticos.set(resp.paginacion.pagina);
                        this.totalPaginasCriticos.set(resp.paginacion.totalPaginas);
                        this.totalCriticos.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarStockCritico'));
                    this.cargando.set(false);
                },
            });
    }

    // Mi actividad
    cargarMiActividad(pagina: number = 1): void {
        this.cargando.set(true);
        const filtros: FiltrosReporte = {
            ...this.obtenerFiltrosBase(),
            pagina,
            limite: 20,
        };

        this.reportesService.obtenerMiActividad(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.resumenActividad.set(resp.datos.resumen);
                        this.operacionesPersonales.set(resp.datos.operaciones);
                        this.paginaActividad.set(resp.paginacion.pagina);
                        this.totalPaginasActividad.set(resp.paginacion.totalPaginas);
                        this.totalActividad.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarActividadRep'));
                    this.cargando.set(false);
                },
            });
    }

    // Acciones de filtro
    aplicarFiltros(): void {
        const tab = this.tabActiva();
        if (tab === 'resumen') this.cargarResumen();
        if (tab === 'movimientos') this.cargarMovimientos(1);
        if (tab === 'stock-critico') this.cargarStockCritico(1);
        if (tab === 'mi-actividad') this.cargarMiActividad(1);
    }

    limpiarFiltros(): void {
        this.establecerRangoFechaDefecto();
        this.busqueda = '';
        this.tipoOperacionFiltro = '';
        this.busquedaCritico = '';
        this.aplicarFiltros();
    }

    // Exportar
    exportarMovimientos(): void {
        const filtros = this.obtenerFiltrosBase();
        if (this.tipoOperacionFiltro) filtros.tipoOperacion = this.tipoOperacionFiltro;
        this.reportesService.exportarMovimientosCsv(filtros);
        this.toastService.success(this.idiomaService.t('toast.exportIniciada'));
    }

    exportarStockCritico(): void {
        this.reportesService.exportarStockCriticoCsv();
        this.toastService.success(this.idiomaService.t('toast.exportIniciada'));
    }

    // Paginación
    paginaAnteriorMovimientos(): void {
        if (this.paginaMovimientos() > 1) {
            this.cargarMovimientos(this.paginaMovimientos() - 1);
        }
    }

    paginaSiguienteMovimientos(): void {
        if (this.paginaMovimientos() < this.totalPaginasMovimientos()) {
            this.cargarMovimientos(this.paginaMovimientos() + 1);
        }
    }

    paginaAnteriorCriticos(): void {
        if (this.paginaCriticos() > 1) {
            this.cargarStockCritico(this.paginaCriticos() - 1);
        }
    }

    paginaSiguienteCriticos(): void {
        if (this.paginaCriticos() < this.totalPaginasCriticos()) {
            this.cargarStockCritico(this.paginaCriticos() + 1);
        }
    }

    paginaAnteriorActividad(): void {
        if (this.paginaActividad() > 1) {
            this.cargarMiActividad(this.paginaActividad() - 1);
        }
    }

    paginaSiguienteActividad(): void {
        if (this.paginaActividad() < this.totalPaginasActividad()) {
            this.cargarMiActividad(this.paginaActividad() + 1);
        }
    }

    // Utilidades de presentación
    obtenerClaseTipoOperacion(tipo: string): string {
        const clases: Record<string, string> = {
            entrada: 'bg-success',
            recepcion: 'bg-success',
            ajuste_positivo: 'bg-info',
            salida: 'bg-danger',
            despacho: 'bg-danger',
            ajuste_negativo: 'bg-warning',
            transferencia: 'bg-primary',
        };
        return clases[tipo] || 'bg-secondary';
    }

    obtenerClaseEstadoStock(estado: string): string {
        return estado === 'agotado' ? 'badge bg-danger' : 'badge bg-warning text-dark';
    }

    formatearMoneda(valor: number): string {
        return `L ${valor.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return '';
        const d = new Date(fecha);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${anio} ${hora}:${min}`;
    }

    obtenerPorcentajeBarra(valor: number, maximo: number): number {
        if (maximo <= 0) return 0;
        return Math.min(Math.round((valor / maximo) * 100), 100);
    }

    // Privados
    private obtenerFiltrosBase(): FiltrosReporte {
        const filtros: FiltrosReporte = {};
        if (this.fechaDesde) filtros.fechaDesde = this.fechaDesde;
        if (this.fechaHasta) filtros.fechaHasta = this.fechaHasta;
        return filtros;
    }

    private establecerRangoFechaDefecto(): void {
        const hoy = new Date();
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        this.fechaHasta = hoy.toISOString().split('T')[0];
        this.fechaDesde = hace30Dias.toISOString().split('T')[0];
    }
}
