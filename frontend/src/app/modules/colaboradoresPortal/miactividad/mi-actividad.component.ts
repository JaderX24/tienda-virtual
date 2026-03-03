import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import {
    MiActividadService,
    ResumenMiActividad,
    EventoBitacora,
    OperacionInventario,
    SesionUsuario,
    EventoTimeline,
    FiltrosBase,
    FiltrosBitacora,
    FiltrosOperaciones,
} from './services/mi-actividad.service';
import { ToastService } from '../../../core/services/toast.service';

type TabActiva = 'resumen' | 'bitacora' | 'operaciones' | 'sesiones' | 'timeline';

@Component({
    selector: 'app-mi-actividad',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mi-actividad.component.html',
    styleUrl: './mi-actividad.component.scss',
})
export class MiActividadComponent implements OnInit, OnDestroy {
    private miActividadService = inject(MiActividadService);
    private toastService = inject(ToastService);
    private destruir$ = new Subject<void>();

    cargando = signal(false);
    tabActiva = signal<TabActiva>('resumen');

    // Filtros globales
    fechaDesde = '';
    fechaHasta = '';

    // Resumen
    resumen = signal<ResumenMiActividad>({
        totalEventosBitacora: 0,
        totalOperacionesInventario: 0,
        totalConteosRealizados: 0,
        totalSesiones: 0,
        loginExitosos: 0,
        loginFallidos: 0,
        entradasInventario: 0,
        salidasInventario: 0,
        ajustesInventario: 0,
        transferenciasInventario: 0,
        ultimoLogin: null,
        ultimaOperacion: null,
    });

    // Bitácora
    eventosBitacora = signal<EventoBitacora[]>([]);
    paginaBitacora = signal(1);
    totalPaginasBitacora = signal(0);
    totalBitacora = signal(0);
    tipoEventoFiltro = '';
    severidadFiltro = '';
    busquedaBitacora = '';

    // Operaciones
    operaciones = signal<OperacionInventario[]>([]);
    paginaOperaciones = signal(1);
    totalPaginasOperaciones = signal(0);
    totalOperaciones = signal(0);
    tipoOperacionFiltro = '';
    busquedaOperaciones = '';

    // Sesiones
    sesiones = signal<SesionUsuario[]>([]);
    paginaSesiones = signal(1);
    totalPaginasSesiones = signal(0);
    totalSesiones = signal(0);

    // Timeline
    timeline = signal<EventoTimeline[]>([]);
    paginaTimeline = signal(1);
    totalPaginasTimeline = signal(0);
    totalTimeline = signal(0);

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
        if (tab === 'bitacora') this.cargarBitacora(1);
        if (tab === 'operaciones') this.cargarOperaciones(1);
        if (tab === 'sesiones') this.cargarSesiones(1);
        if (tab === 'timeline') this.cargarTimeline(1);
    }

    // --- Carga de datos ---

    cargarResumen(): void {
        this.cargando.set(true);
        const filtros = this.obtenerFiltrosBase();

        this.miActividadService.obtenerResumen(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.resumen.set(resp.datos);
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('Error al cargar resumen de actividad');
                    this.cargando.set(false);
                },
            });
    }

    cargarBitacora(pagina: number = 1): void {
        this.cargando.set(true);
        const filtros: FiltrosBitacora = {
            ...this.obtenerFiltrosBase(),
            busqueda: this.busquedaBitacora || undefined,
            tipoEvento: this.tipoEventoFiltro || undefined,
            severidad: this.severidadFiltro || undefined,
            pagina,
            limite: 20,
        };

        this.miActividadService.obtenerBitacora(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.eventosBitacora.set(resp.datos);
                        this.paginaBitacora.set(resp.paginacion.pagina);
                        this.totalPaginasBitacora.set(resp.paginacion.totalPaginas);
                        this.totalBitacora.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('Error al cargar bitácora');
                    this.cargando.set(false);
                },
            });
    }

    cargarOperaciones(pagina: number = 1): void {
        this.cargando.set(true);
        const filtros: FiltrosOperaciones = {
            ...this.obtenerFiltrosBase(),
            busqueda: this.busquedaOperaciones || undefined,
            tipoOperacion: this.tipoOperacionFiltro || undefined,
            pagina,
            limite: 20,
        };

        this.miActividadService.obtenerOperaciones(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.operaciones.set(resp.datos);
                        this.paginaOperaciones.set(resp.paginacion.pagina);
                        this.totalPaginasOperaciones.set(resp.paginacion.totalPaginas);
                        this.totalOperaciones.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('Error al cargar operaciones');
                    this.cargando.set(false);
                },
            });
    }

    cargarSesiones(pagina: number = 1): void {
        this.cargando.set(true);
        const filtros: FiltrosBase = {
            ...this.obtenerFiltrosBase(),
            pagina,
            limite: 20,
        };

        this.miActividadService.obtenerSesiones(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.sesiones.set(resp.datos);
                        this.paginaSesiones.set(resp.paginacion.pagina);
                        this.totalPaginasSesiones.set(resp.paginacion.totalPaginas);
                        this.totalSesiones.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('Error al cargar sesiones');
                    this.cargando.set(false);
                },
            });
    }

    cargarTimeline(pagina: number = 1): void {
        this.cargando.set(true);
        const filtros: FiltrosBase = {
            ...this.obtenerFiltrosBase(),
            pagina,
            limite: 30,
        };

        this.miActividadService.obtenerTimeline(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.timeline.set(resp.datos);
                        this.paginaTimeline.set(resp.paginacion.pagina);
                        this.totalPaginasTimeline.set(resp.paginacion.totalPaginas);
                        this.totalTimeline.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('Error al cargar timeline');
                    this.cargando.set(false);
                },
            });
    }

    // --- Acciones de filtro ---

    aplicarFiltros(): void {
        const tab = this.tabActiva();
        if (tab === 'resumen') this.cargarResumen();
        if (tab === 'bitacora') this.cargarBitacora(1);
        if (tab === 'operaciones') this.cargarOperaciones(1);
        if (tab === 'sesiones') this.cargarSesiones(1);
        if (tab === 'timeline') this.cargarTimeline(1);
    }

    limpiarFiltros(): void {
        this.establecerRangoFechaDefecto();
        this.tipoEventoFiltro = '';
        this.severidadFiltro = '';
        this.busquedaBitacora = '';
        this.tipoOperacionFiltro = '';
        this.busquedaOperaciones = '';
        this.aplicarFiltros();
    }

    // --- Exportar ---

    exportarBitacora(): void {
        const filtros: FiltrosBitacora = {
            ...this.obtenerFiltrosBase(),
            tipoEvento: this.tipoEventoFiltro || undefined,
            severidad: this.severidadFiltro || undefined,
        };
        this.miActividadService.exportarBitacoraCsv(filtros);
        this.toastService.success('Exportación de bitácora iniciada');
    }

    exportarOperaciones(): void {
        const filtros: FiltrosOperaciones = {
            ...this.obtenerFiltrosBase(),
            tipoOperacion: this.tipoOperacionFiltro || undefined,
        };
        this.miActividadService.exportarOperacionesCsv(filtros);
        this.toastService.success('Exportación de operaciones iniciada');
    }

    // --- Paginación ---

    cambiarPaginaBitacora(direccion: 'anterior' | 'siguiente'): void {
        const actual = this.paginaBitacora();
        if (direccion === 'anterior' && actual > 1) this.cargarBitacora(actual - 1);
        if (direccion === 'siguiente' && actual < this.totalPaginasBitacora()) this.cargarBitacora(actual + 1);
    }

    cambiarPaginaOperaciones(direccion: 'anterior' | 'siguiente'): void {
        const actual = this.paginaOperaciones();
        if (direccion === 'anterior' && actual > 1) this.cargarOperaciones(actual - 1);
        if (direccion === 'siguiente' && actual < this.totalPaginasOperaciones()) this.cargarOperaciones(actual + 1);
    }

    cambiarPaginaSesiones(direccion: 'anterior' | 'siguiente'): void {
        const actual = this.paginaSesiones();
        if (direccion === 'anterior' && actual > 1) this.cargarSesiones(actual - 1);
        if (direccion === 'siguiente' && actual < this.totalPaginasSesiones()) this.cargarSesiones(actual + 1);
    }

    cambiarPaginaTimeline(direccion: 'anterior' | 'siguiente'): void {
        const actual = this.paginaTimeline();
        if (direccion === 'anterior' && actual > 1) this.cargarTimeline(actual - 1);
        if (direccion === 'siguiente' && actual < this.totalPaginasTimeline()) this.cargarTimeline(actual + 1);
    }

    // --- Utilidades de presentación ---

    obtenerClaseSeveridad(severidad: string): string {
        const clases: Record<string, string> = {
            info: 'bg-success',
            warn: 'bg-warning text-dark',
            error: 'bg-danger',
            critical: 'bg-danger',
        };
        return clases[severidad] || 'bg-secondary';
    }

    obtenerIconoSeveridad(severidad: string): string {
        const iconos: Record<string, string> = {
            info: 'bi-info-circle',
            warn: 'bi-exclamation-triangle',
            error: 'bi-x-octagon',
            critical: 'bi-radioactive',
        };
        return iconos[severidad] || 'bi-circle';
    }

    obtenerClaseTipoOperacion(tipo: string): string {
        const clases: Record<string, string> = {
            entrada: 'bg-success',
            recepcion: 'bg-success',
            ajuste_positivo: 'bg-info',
            salida: 'bg-danger',
            despacho: 'bg-danger',
            ajuste_negativo: 'bg-warning text-dark',
            transferencia: 'bg-primary',
        };
        return clases[tipo] || 'bg-secondary';
    }

    obtenerClaseOrigenTimeline(origen: string): string {
        const clases: Record<string, string> = {
            bitacora: 'timeline-bitacora',
            inventario: 'timeline-inventario',
            conteo: 'timeline-conteo',
        };
        return clases[origen] || '';
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

    formatearFechaSolo(fecha: string): string {
        if (!fecha) return '';
        const d = new Date(fecha);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    formatearHora(fecha: string): string {
        if (!fecha) return '';
        const d = new Date(fecha);
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${hora}:${min}`;
    }

    tiempoRelativo(fecha: string): string {
        if (!fecha) return '';
        const ahora = new Date().getTime();
        const tiempo = new Date(fecha).getTime();
        const diff = ahora - tiempo;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (minutos < 1) return 'Justo ahora';
        if (minutos < 60) return `Hace ${minutos} min`;
        if (horas < 24) return `Hace ${horas}h`;
        if (dias < 7) return `Hace ${dias}d`;
        return this.formatearFechaSolo(fecha);
    }

    // --- Privados ---

    private obtenerFiltrosBase(): FiltrosBase {
        const filtros: FiltrosBase = {};
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
