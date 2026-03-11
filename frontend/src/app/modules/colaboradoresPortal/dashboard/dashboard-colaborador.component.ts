import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TraducirPipe } from '../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { IdiomaService } from '../../../core/services/idioma.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AuthColaboradorService } from '../auth/services/auth-colaborador.service';
import {
    DashboardColaboradorService,
    TarjetaResumen,
    ActividadReciente,
    TareaDia,
} from './services/dashboard-colaborador.service';

@Component({
    selector: 'app-dashboard-colaborador',
    standalone: true,
    imports: [CommonModule, RouterLink, TraducirPipe],
    templateUrl: './dashboard-colaborador.component.html',
    styleUrl: './dashboard-colaborador.component.scss'
})
export class DashboardColaboradorComponent implements OnInit, OnDestroy {
    private authService = inject(AuthColaboradorService);
    private dashboardService = inject(DashboardColaboradorService);
    private idiomaService = inject(IdiomaService);
    private destruir$ = new Subject<void>();

    nombreUsuario = this.authService.nombreUsuario;
    rolUsuario = signal('');

    fechaActual = new Date();
    horaActual = signal('');

    cargando = signal(true);

    get fechaFormateada(): string {
        const locale = this.idiomaService.idiomaActual() === 'en' ? 'en-US' : 'es-HN';
        return this.fechaActual.toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    tarjetas = signal<TarjetaResumen[]>([]);
    actividadesRecientes = signal<ActividadReciente[]>([]);
    tareasDelDia = signal<TareaDia[]>([]);

    ngOnInit(): void {
        this.actualizarHora();
        setInterval(() => this.actualizarHora(), 60000);
        this.establecerRol();
        this.cargarDatosDashboard();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    cargarDatosDashboard(): void {
        this.cargando.set(true);

        forkJoin({
            resumen: this.dashboardService.obtenerResumen(),
            actividad: this.dashboardService.obtenerActividadReciente(5),
            tareas: this.dashboardService.obtenerTareasDia(),
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: ({ resumen, actividad, tareas }) => {
                if (resumen.exito) {
                    this.tarjetas.set(resumen.datos.tarjetas);
                }
                if (actividad.exito) {
                    this.actividadesRecientes.set(actividad.datos);
                }
                if (tareas.exito) {
                    this.tareasDelDia.set(tareas.datos);
                }
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
            },
        });
    }

    private actualizarHora(): void {
        const ahora = new Date();
        this.horaActual.set(ahora.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }

    private establecerRol(): void {
        const codigo = this.authService.rol();
        const clave = codigo ? 'rol.' + codigo.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()) : 'rol.colaborador';
        this.rolUsuario.set(this.idiomaService.t(clave));
    }

    get saludo(): string {
        const hora = new Date().getHours();
        if (hora < 12) return this.idiomaService.t('dashboard.buenosDias');
        if (hora < 18) return this.idiomaService.t('dashboard.buenasTardes');
        return this.idiomaService.t('dashboard.buenasNoches');
    }

    get tareasCompletadas(): number {
        return this.tareasDelDia().filter(t => t.completada).length;
    }

    get totalTareas(): number {
        return this.tareasDelDia().length;
    }

    get progresoTareas(): number {
        if (this.totalTareas === 0) return 0;
        return Math.round((this.tareasCompletadas / this.totalTareas) * 100);
    }
}
