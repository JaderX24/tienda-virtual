import { Component, EventEmitter, HostListener, inject, Input, Output, ElementRef, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthColaboradorService } from '../../auth/services/auth-colaborador.service';
import { NotificacionesService, Notificacion } from '../../notificaciones/services/notificaciones.service';
import { IdiomaService } from '../../../../core/services/idioma.service';
import { TraducirPipe } from '../../../../core/pipes/colaboradoresPortal/traducir.pipe';

@Component({
    selector: 'app-header-colab',
    standalone: true,
    imports: [CommonModule, RouterLink, TraducirPipe],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderColabComponent implements OnInit, OnDestroy {
    private authService = inject(AuthColaboradorService);
    private elementRef = inject(ElementRef);
    private notificacionesService = inject(NotificacionesService);
    private idiomaService = inject(IdiomaService);
    private destruir$ = new Subject<void>();

    @Input() sidebarColapsado = false;
    @Output() toggleSidebar = new EventEmitter<void>();
    @Output() toggleSidebarMobile = new EventEmitter<void>();

    usuario = this.authService.usuario;

    mostrarNotificaciones = false;
    mostrarPerfil = false;

    notificaciones = signal<Notificacion[]>([]);
    contadorSinLeer = signal(0);

    private intervaloActualizacion: any;

    ngOnInit(): void {
        this.cargarNotificacionesRecientes();

        // Actualizar cada 60 segundos
        this.intervaloActualizacion = setInterval(() => {
            this.notificacionesService.actualizarContador();
        }, 60000);

        // Suscribirse al contador global
        this.notificacionesService.contador$
            .pipe(takeUntil(this.destruir$))
            .subscribe(valor => this.contadorSinLeer.set(valor));
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
        if (this.intervaloActualizacion) clearInterval(this.intervaloActualizacion);
    }

    private cargarNotificacionesRecientes(): void {
        this.notificacionesService.obtenerRecientes()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.notificaciones.set(resp.datos.notificaciones);
                        this.contadorSinLeer.set(resp.datos.totalSinLeer);
                    }
                },
            });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(evento: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(evento.target)) {
            this.cerrarDropdowns();
        }
    }

    alternarNotificaciones(): void {
        this.mostrarNotificaciones = !this.mostrarNotificaciones;
        this.mostrarPerfil = false;
        if (this.mostrarNotificaciones) {
            this.cargarNotificacionesRecientes();
        }
    }

    alternarPerfil(): void {
        this.mostrarPerfil = !this.mostrarPerfil;
        this.mostrarNotificaciones = false;
    }

    cerrarDropdowns(): void {
        this.mostrarNotificaciones = false;
        this.mostrarPerfil = false;
    }

    marcarComoLeida(notificacion: Notificacion): void {
        if (notificacion.leida) return;
        this.notificacionesService.marcarComoLeida(notificacion.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    notificacion.leida = true;
                },
            });
    }

    marcarTodasComoLeidas(): void {
        this.notificacionesService.marcarTodasComoLeidas()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: () => {
                    this.notificaciones.update(lista => lista.map(n => ({ ...n, leida: true })));
                },
            });
    }

    cerrarSesion(): void {
        this.cerrarDropdowns();
        this.authService.cerrarSesion().subscribe();
    }

    obtenerTiempoRelativo(fecha: string | Date): string {
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        const ahora = new Date();
        const diferencia = ahora.getTime() - fechaObj.getTime();
        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        const dias = Math.floor(diferencia / 86400000);

        if (minutos < 1) return this.idiomaService.t('tiempo.ahoraMismo');
        if (minutos < 60) return this.idiomaService.t('tiempo.haceMin').replace('{n}', String(minutos));
        if (horas < 24) return this.idiomaService.t('tiempo.haceHoras').replace('{n}', String(horas));
        return this.idiomaService.t('tiempo.haceDias').replace('{n}', String(dias));
    }

    get rolUsuario(): string {
        const codigo = this.usuario()?.rol?.codigo || '';
        const mapeoClaves: Record<string, string> = {
            'jefe_bodega': 'rol.jefeBodega',
            'supervisor': 'rol.supervisor',
            'inventarista': 'rol.inventarista',
            'recepcionista': 'rol.recepcionista',
            'despachador': 'rol.despachador',
            'auxiliar': 'rol.auxiliar',
            'consulta': 'rol.consulta',
        };
        const clave = mapeoClaves[codigo];
        return clave ? this.idiomaService.t(clave) : this.usuario()?.rol?.nombre || this.idiomaService.t('rol.colaborador');
    }
}
