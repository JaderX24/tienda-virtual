import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TraducirPipe } from '../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { ClaseEstadoPipe } from '../../../core/pipes/global';
import { EstadoVisualizacionService } from '../../../core/services/estado-visualizacion.service';
import {
    NotificacionesService,
    Notificacion,
    FiltrosNotificaciones,
} from './services/notificaciones.service';
import { ToastService } from '../../../core/services/toast.service';
import { IdiomaService } from '../../../core/services/idioma.service';

type TabActiva = 'todas' | 'sin-leer' | 'archivadas';

@Component({
    selector: 'app-notificaciones',
    standalone: true,
    imports: [CommonModule, FormsModule, TraducirPipe, ClaseEstadoPipe],
    templateUrl: './notificaciones.component.html',
    styleUrl: './notificaciones.component.scss',
})
export class NotificacionesComponent implements OnInit, OnDestroy {
    private notificacionesService = inject(NotificacionesService);
    private toastService = inject(ToastService);
    private idiomaService = inject(IdiomaService);
    private estadoVisualizacion = inject(EstadoVisualizacionService);
    private destruir$ = new Subject<void>();

    cargando = signal(false);
    tabActiva = signal<TabActiva>('todas');

    // Listado
    notificaciones = signal<Notificacion[]>([]);
    pagina = signal(1);
    totalPaginas = signal(0);
    totalNotificaciones = signal(0);
    limite = 15;

    // Filtros
    tipoFiltro = '';
    busqueda = '';

    // Selección múltiple
    seleccionadas = signal<Set<string>>(new Set());
    seleccionarTodas = signal(false);

    ngOnInit(): void {
        this.cargarNotificaciones();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    // --- Navegación de tabs ---

    cambiarTab(tab: TabActiva): void {
        this.tabActiva.set(tab);
        this.pagina.set(1);
        this.limpiarSeleccion();
        this.cargarNotificaciones();
    }

    // --- Carga de datos ---

    cargarNotificaciones(): void {
        this.cargando.set(true);

        const filtros: FiltrosNotificaciones = {
            pagina: this.pagina(),
            limite: this.limite,
        };

        if (this.tipoFiltro) filtros.tipo = this.tipoFiltro;
        if (this.busqueda.trim()) filtros.busqueda = this.busqueda.trim();

        if (this.tabActiva() === 'sin-leer') {
            filtros.leida = false;
            filtros.archivada = false;
        } else if (this.tabActiva() === 'archivadas') {
            filtros.archivada = true;
        } else {
            filtros.archivada = false;
        }

        this.notificacionesService.obtenerNotificaciones(filtros)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.notificaciones.set(resp.datos);
                        this.totalPaginas.set(resp.paginacion.totalPaginas);
                        this.totalNotificaciones.set(resp.paginacion.total);
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarNotif'));
                    this.cargando.set(false);
                },
            });
    }

    buscar(): void {
        this.pagina.set(1);
        this.cargarNotificaciones();
    }

    limpiarFiltros(): void {
        this.tipoFiltro = '';
        this.busqueda = '';
        this.pagina.set(1);
        this.cargarNotificaciones();
    }

    // --- Acciones individuales ---

    marcarComoLeida(notificacion: Notificacion): void {
        if (notificacion.leida) return;

        this.notificacionesService.marcarComoLeida(notificacion.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    notificacion.leida = true;
                    this.toastService.success(this.idiomaService.t('toast.notifLeida'));
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorMarcarNotif')),
            });
    }

    archivarNotificacion(notificacion: Notificacion): void {
        this.notificacionesService.archivarNotificacion(notificacion.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    this.toastService.success(this.idiomaService.t('toast.notifArchivada'));
                    this.cargarNotificaciones();
                    this.notificacionesService.actualizarContador();
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorArchivarNotif')),
            });
    }

    eliminarNotificacion(notificacion: Notificacion): void {
        this.notificacionesService.eliminarNotificacion(notificacion.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    this.toastService.success(this.idiomaService.t('toast.notifEliminada'));
                    this.cargarNotificaciones();
                    this.notificacionesService.actualizarContador();
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorEliminarNotif')),
            });
    }

    // --- Acciones masivas ---

    marcarTodasComoLeidas(): void {
        this.notificacionesService.marcarTodasComoLeidas()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    this.toastService.success(this.idiomaService.t('toast.todasLeidas'));
                    this.cargarNotificaciones();
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorMarcarTodas')),
            });
    }

    marcarSeleccionadasComoLeidas(): void {
        const ids = Array.from(this.seleccionadas());
        if (ids.length === 0) return;

        this.notificacionesService.marcarSeleccionadasComoLeidas(ids)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    this.toastService.success(this.idiomaService.t('toast.notifsSelLeidas').replace('{n}', String(ids.length)));
                    this.limpiarSeleccion();
                    this.cargarNotificaciones();
                    this.notificacionesService.actualizarContador();
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorMarcarTodas')),
            });
    }

    archivarTodasLeidas(): void {
        this.notificacionesService.archivarTodasLeidas()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    this.toastService.success(this.idiomaService.t('toast.leidasArchivadas'));
                    this.cargarNotificaciones();
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorArchivarTodas')),
            });
    }

    // --- Selección ---

    alternarSeleccion(id: string): void {
        const actual = new Set(this.seleccionadas());
        if (actual.has(id)) {
            actual.delete(id);
        } else {
            actual.add(id);
        }
        this.seleccionadas.set(actual);
        this.verificarSeleccionTodas();
    }

    alternarSeleccionTodas(): void {
        if (this.seleccionarTodas()) {
            this.seleccionadas.set(new Set());
            this.seleccionarTodas.set(false);
        } else {
            const todosIds = new Set(this.notificaciones().map(n => n.id));
            this.seleccionadas.set(todosIds);
            this.seleccionarTodas.set(true);
        }
    }

    estaSeleccionada(id: string): boolean {
        return this.seleccionadas().has(id);
    }

    private verificarSeleccionTodas(): void {
        const total = this.notificaciones().length;
        this.seleccionarTodas.set(total > 0 && this.seleccionadas().size === total);
    }

    limpiarSeleccion(): void {
        this.seleccionadas.set(new Set());
        this.seleccionarTodas.set(false);
    }

    // --- Paginación ---

    irAPagina(pagina: number): void {
        if (pagina < 1 || pagina > this.totalPaginas()) return;
        this.pagina.set(pagina);
        this.limpiarSeleccion();
        this.cargarNotificaciones();
    }

    get paginasVisibles(): number[] {
        const total = this.totalPaginas();
        const actual = this.pagina();
        const paginas: number[] = [];
        const inicio = Math.max(1, actual - 2);
        const fin = Math.min(total, actual + 2);

        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }
        return paginas;
    }

    // --- Utilidades de presentación ---

    obtenerTiempoRelativo(fechaStr: string): string {
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diferencia = ahora.getTime() - fecha.getTime();
        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        const dias = Math.floor(diferencia / 86400000);

        if (minutos < 1) return this.idiomaService.t('tiempo.ahoraMismo');
        if (minutos < 60) return this.idiomaService.t('tiempo.haceMin').replace('{n}', String(minutos));
        if (horas < 24) return this.idiomaService.t('tiempo.haceHoras').replace('{n}', String(horas));
        if (dias < 7) return this.idiomaService.t('tiempo.haceDias').replace('{n}', String(dias));
        return fecha.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    formatearFecha(fechaStr: string): string {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    obtenerEtiquetaTipo(tipo: string): string {
        const etiquetas: Record<string, string> = {
            info: this.idiomaService.t('notif.informacion'),
            success: this.idiomaService.t('notif.exito'),
            warning: this.idiomaService.t('notif.advertencia'),
            danger: this.idiomaService.t('notif.importante'),
            sistema: this.idiomaService.t('notif.sistema'),
        };
        return etiquetas[tipo] || tipo;
    }

    obtenerClaseIcono(tipo: string): string {
        return this.estadoVisualizacion.obtenerClase('tipo_notificacion', tipo);
    }

    get hayNotificacionesSinLeer(): boolean {
        return this.notificaciones().some(n => !n.leida);
    }

    get cantidadSeleccionadas(): number {
        return this.seleccionadas().size;
    }
}
