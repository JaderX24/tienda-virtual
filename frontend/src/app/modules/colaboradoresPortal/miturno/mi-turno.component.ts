import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import {
    MiTurnoService,
    Turno,
    ResumenSemanal,
    ActividadTurno,
} from './services/mi-turno.service';

@Component({
    selector: 'app-mi-turno',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mi-turno.component.html',
    styleUrl: './mi-turno.component.scss',
})
export class MiTurnoComponent implements OnInit, OnDestroy {
    private miTurnoService = inject(MiTurnoService);
    private destruir$ = new Subject<void>();

    turnoHoy = signal<Turno | null>(null);
    resumenSemanal = signal<ResumenSemanal | null>(null);
    turnosSemana = signal<Turno[]>([]);
    actividades = signal<ActividadTurno[]>([]);
    historial = signal<Turno[]>([]);

    cargando = signal(true);
    procesando = this.miTurnoService.procesando;
    mensajeExito = signal('');
    mensajeError = signal('');
    notasEntrada = '';
    notasSalida = '';
    mostrarNotas = signal(false);
    tipoNota = signal<'entrada' | 'salida'>('entrada');

    horaActual = signal('');
    tiempoTranscurrido = signal('');
    private intervalId: any;
    private intervalTiempoId: any;

    // Paginación historial
    paginaActual = signal(1);
    totalPaginas = signal(0);
    tabActivo = signal<'hoy' | 'semana' | 'historial'>('hoy');

    ngOnInit(): void {
        this.actualizarHora();
        this.intervalId = setInterval(() => this.actualizarHora(), 1000);
        this.cargarDatos();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
        if (this.intervalId) clearInterval(this.intervalId);
        if (this.intervalTiempoId) clearInterval(this.intervalTiempoId);
    }

    cargarDatos(): void {
        this.cargando.set(true);

        forkJoin({
            turno: this.miTurnoService.obtenerTurnoHoy(),
            resumen: this.miTurnoService.obtenerResumenSemanal(),
            actividad: this.miTurnoService.obtenerActividadTurno(),
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: ({ turno, resumen, actividad }) => {
                if (turno.exito) {
                    this.turnoHoy.set(turno.datos);
                    if (turno.datos?.estado === 'en_curso') {
                        this.iniciarContadorTiempo();
                    }
                }
                if (resumen.exito) {
                    this.resumenSemanal.set(resumen.datos.resumen);
                    this.turnosSemana.set(resumen.datos.semana);
                }
                if (actividad.exito) {
                    this.actividades.set(actividad.datos);
                }
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false),
        });
    }

    registrarEntrada(): void {
        this.limpiarMensajes();
        this.miTurnoService.registrarEntrada(this.notasEntrada || undefined)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.turnoHoy.set(resp.datos);
                        this.mensajeExito.set(resp.mensaje);
                        this.notasEntrada = '';
                        this.mostrarNotas.set(false);
                        this.iniciarContadorTiempo();
                    } else {
                        this.mensajeError.set(resp.mensaje);
                    }
                },
                error: () => this.mensajeError.set('Error al registrar entrada'),
            });
    }

    registrarSalida(): void {
        this.limpiarMensajes();
        this.miTurnoService.registrarSalida(this.notasSalida || undefined)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.turnoHoy.set(resp.datos);
                        this.mensajeExito.set(resp.mensaje);
                        this.notasSalida = '';
                        this.mostrarNotas.set(false);
                        this.detenerContadorTiempo();
                        this.cargarDatos();
                    } else {
                        this.mensajeError.set(resp.mensaje);
                    }
                },
                error: () => this.mensajeError.set('Error al registrar salida'),
            });
    }

    cambiarTab(tab: 'hoy' | 'semana' | 'historial'): void {
        this.tabActivo.set(tab);
        if (tab === 'historial' && this.historial().length === 0) {
            this.cargarHistorial();
        }
    }

    cargarHistorial(pagina: number = 1): void {
        this.miTurnoService.obtenerHistorial(pagina)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.historial.set(resp.datos);
                        this.paginaActual.set(resp.paginacion.pagina);
                        this.totalPaginas.set(resp.paginacion.totalPaginas);
                    }
                },
            });
    }

    abrirNotas(tipo: 'entrada' | 'salida'): void {
        this.tipoNota.set(tipo);
        this.mostrarNotas.set(true);
    }

    cerrarNotas(): void {
        this.mostrarNotas.set(false);
    }

    confirmarAccion(): void {
        if (this.tipoNota() === 'entrada') {
            this.registrarEntrada();
        } else {
            this.registrarSalida();
        }
    }

    // Helpers de formato

    formatearHora(fecha: string | null): string {
        if (!fecha) return '--:--';
        return new Date(fecha).toLocaleTimeString('es-HN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
        });
    }

    formatearFechaCompleta(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    obtenerEtiquetaEstado(estado: string): string {
        const mapa: Record<string, string> = {
            programado: 'Programado',
            en_curso: 'En Curso',
            finalizado: 'Finalizado',
        };
        return mapa[estado] || estado;
    }

    obtenerClaseEstado(estado: string): string {
        const mapa: Record<string, string> = {
            programado: 'bg-info-subtle text-info',
            en_curso: 'bg-success-subtle text-success',
            finalizado: 'bg-secondary-subtle text-secondary',
        };
        return mapa[estado] || 'bg-light text-dark';
    }

    obtenerEtiquetaPuntualidad(puntualidad: string): string {
        const mapa: Record<string, string> = {
            anticipado: 'Anticipado',
            puntual: 'Puntual',
            leve_retraso: 'Leve retraso',
            retraso: 'Retraso',
            pendiente: 'Pendiente',
        };
        return mapa[puntualidad] || puntualidad;
    }

    obtenerClasePuntualidad(puntualidad: string): string {
        const mapa: Record<string, string> = {
            anticipado: 'text-primary',
            puntual: 'text-success',
            leve_retraso: 'text-warning',
            retraso: 'text-danger',
            pendiente: 'text-muted',
        };
        return mapa[puntualidad] || 'text-muted';
    }

    obtenerIconoOperacion(tipo: string): string {
        const iconos: Record<string, string> = {
            entrada: 'bi-box-arrow-in-down',
            salida: 'bi-box-arrow-up',
            ajuste_positivo: 'bi-plus-circle',
            ajuste_negativo: 'bi-dash-circle',
            transferencia_salida: 'bi-arrow-left-right',
            transferencia_entrada: 'bi-arrow-left-right',
            conteo: 'bi-clipboard-data',
            recepcion: 'bi-box-arrow-in-down',
            despacho: 'bi-truck',
        };
        return iconos[tipo] || 'bi-circle';
    }

    obtenerEtiquetaOperacion(tipo: string): string {
        const map: Record<string, string> = {
            entrada: 'Entrada',
            salida: 'Salida',
            ajuste_positivo: 'Ajuste (+)',
            ajuste_negativo: 'Ajuste (-)',
            transferencia_salida: 'Transferencia (S)',
            transferencia_entrada: 'Transferencia (E)',
            conteo: 'Conteo',
            recepcion: 'Recepción',
            despacho: 'Despacho',
        };
        return map[tipo] || tipo;
    }

    private actualizarHora(): void {
        this.horaActual.set(
            new Date().toLocaleTimeString('es-HN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }),
        );
    }

    private iniciarContadorTiempo(): void {
        this.actualizarTiempoTranscurrido();
        this.intervalTiempoId = setInterval(() => this.actualizarTiempoTranscurrido(), 60000);
    }

    private detenerContadorTiempo(): void {
        if (this.intervalTiempoId) {
            clearInterval(this.intervalTiempoId);
            this.intervalTiempoId = null;
        }
    }

    private actualizarTiempoTranscurrido(): void {
        const turno = this.turnoHoy();
        if (!turno?.horaEntrada) return;

        const entrada = new Date(turno.horaEntrada).getTime();
        const ahora = Date.now();
        const diff = ahora - entrada;

        const horas = Math.floor(diff / 3600000);
        const minutos = Math.floor((diff % 3600000) / 60000);

        this.tiempoTranscurrido.set(
            `${horas}h ${minutos.toString().padStart(2, '0')}m`,
        );
    }

    private limpiarMensajes(): void {
        this.mensajeExito.set('');
        this.mensajeError.set('');
    }
}
