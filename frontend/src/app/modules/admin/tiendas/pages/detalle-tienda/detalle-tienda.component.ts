import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, tap, of, finalize } from 'rxjs';

import { TiendasService } from '../../services/tiendas.service';
import { ToastService } from '../../../../../core/services/toast.service';
import {
    Tienda,
    EstadoTienda,
    TipoTienda,
    TipoNegocioTienda,
    PlanSuscripcionTienda,
    EstadisticasTienda,
    HorarioDia,
    HorarioAtencion
} from '../../interfaces';

interface TabDetalle {
    id: string;
    titulo: string;
    icono: string;
}

@Component({
    selector: 'app-detalle-tienda',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './detalle-tienda.component.html',
    styleUrl: './detalle-tienda.component.scss'
})
export class DetalleTiendaComponent implements OnInit {
    private readonly tiendasService = inject(TiendasService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toastService = inject(ToastService);

    // Parámetro de entrada para el ID
    readonly tiendaId = input<number>();

    // Señales del componente
    private readonly cargando = signal(false);
    private readonly cargandoOperacion = signal(false);
    private readonly tienda = signal<Tienda | null>(null);
    private readonly error = signal<string>('');
    private readonly tabActivo = signal('general');
    private readonly estadisticas = signal<EstadisticasTienda | null>(null);
    private readonly mostrarModalLogo = signal(false);
    private readonly mostrarModalCambiarEstado = signal(false);
    private readonly nuevoEstado = signal<EstadoTienda | null>(null);

    // Señales readonly para el template
    readonly estaCargando = this.cargando.asReadonly();
    readonly estaCargandoOperacion = this.cargandoOperacion.asReadonly();
    readonly datosTienda = this.tienda.asReadonly();
    readonly errorMensaje = this.error.asReadonly();
    readonly tabSeleccionado = this.tabActivo.asReadonly();
    readonly estadisticasTienda = this.estadisticas.asReadonly();
    readonly modalLogoAbierto = this.mostrarModalLogo.asReadonly();
    readonly modalEstadoAbierto = this.mostrarModalCambiarEstado.asReadonly();
    readonly estadoSeleccionado = this.nuevoEstado.asReadonly();

    // Configuración de tabs
    readonly tabs: TabDetalle[] = [
        { id: 'general', titulo: 'General', icono: 'bi-info-circle' },
        { id: 'ubicacion', titulo: 'Ubicación', icono: 'bi-geo-alt' },
        { id: 'contacto', titulo: 'Contacto', icono: 'bi-telephone' },
        { id: 'horarios', titulo: 'Horarios', icono: 'bi-clock' },
        { id: 'configuracion', titulo: 'Configuración', icono: 'bi-gear' },
        { id: 'estadisticas', titulo: 'Estadísticas', icono: 'bi-graph-up' }
    ];

    // Estados para cambio de estado
    readonly estadosDisponibles = [
        { valor: EstadoTienda.ACTIVA, texto: 'Activa', clase: 'success' },
        { valor: EstadoTienda.INACTIVA, texto: 'Inactiva', clase: 'secondary' },
        { valor: EstadoTienda.EN_CONSTRUCCION, texto: 'En Construcción', clase: 'warning' },
        { valor: EstadoTienda.MANTENIMIENTO, texto: 'Mantenimiento', clase: 'info' },
        { valor: EstadoTienda.CERRADA_TEMPORAL, texto: 'Cerrada Temporal', clase: 'danger' }
    ];

    // Días de la semana para horarios
    readonly diasSemana: { clave: Exclude<keyof HorarioAtencion, 'diasEspeciales'>; nombre: string }[] = [
        { clave: 'lunes', nombre: 'Lunes' },
        { clave: 'martes', nombre: 'Martes' },
        { clave: 'miercoles', nombre: 'Miércoles' },
        { clave: 'jueves', nombre: 'Jueves' },
        { clave: 'viernes', nombre: 'Viernes' },
        { clave: 'sabado', nombre: 'Sábado' },
        { clave: 'domingo', nombre: 'Domingo' }
    ];

    ngOnInit(): void {
        this.cargarTienda();
    }

    private cargarTienda(): void {
        const id = this.tiendaId() || Number(this.route.snapshot.paramMap.get('id'));

        if (!id || isNaN(id)) {
            this.error.set('ID de tienda no válido');
            return;
        }

        this.cargando.set(true);
        this.error.set('');

        this.tiendasService.obtenerTiendaPorId(id).pipe(
            tap(tienda => {
                this.tienda.set(tienda);
                this.cargarEstadisticas(id);
            }),
            catchError(error => {
                this.error.set('Error al cargar la información de la tienda');
                this.toastService.error('Error al cargar la tienda');
                return EMPTY;
            }),
            finalize(() => this.cargando.set(false))
        ).subscribe();
    }

    private cargarEstadisticas(tiendaId: number): void {
        this.tiendasService.obtenerEstadisticasTienda(tiendaId).pipe(
            tap(stats => this.estadisticas.set(stats)),
            catchError(() => of(null))
        ).subscribe();
    }

    seleccionarTab(tabId: string): void {
        this.tabActivo.set(tabId);
    }

    irAEditar(): void {
        const tienda = this.tienda();
        if (tienda) {
            this.router.navigate(['/admin/tiendas/editar', tienda.id]);
        }
    }

    irALista(): void {
        this.router.navigate(['/admin/tiendas']);
    }

    // Cambio de estado
    abrirModalCambiarEstado(): void {
        this.mostrarModalCambiarEstado.set(true);
        this.nuevoEstado.set(null);
    }

    cerrarModalCambiarEstado(): void {
        this.mostrarModalCambiarEstado.set(false);
        this.nuevoEstado.set(null);
    }

    seleccionarNuevoEstado(estado: EstadoTienda): void {
        this.nuevoEstado.set(estado);
    }

    confirmarCambioEstado(): void {
        const tienda = this.tienda();
        const estado = this.nuevoEstado();

        if (!tienda || !estado) return;

        this.cargandoOperacion.set(true);

        const activa = estado === EstadoTienda.ACTIVA;

        this.tiendasService.cambiarEstadoTienda(tienda.id, activa).pipe(
            tap(tiendaActualizada => {
                this.tienda.set(tiendaActualizada);
                this.cerrarModalCambiarEstado();
                this.toastService.success(
                    `Estado de tienda actualizado a ${this.tiendasService.obtenerEstadoTexto(estado)}`
                );
            }),
            catchError(() => {
                this.toastService.error('Error al actualizar el estado de la tienda');
                return EMPTY;
            }),
            finalize(() => this.cargandoOperacion.set(false))
        ).subscribe();
    }

    // Gestión de logo
    abrirModalLogo(): void {
        this.mostrarModalLogo.set(true);
    }

    cerrarModalLogo(): void {
        this.mostrarModalLogo.set(false);
    }

    onArchivoLogoSeleccionado(event: Event): void {
        const inputElemento = event.target as HTMLInputElement;
        if (inputElemento.files && inputElemento.files.length > 0) {
            const archivo = inputElemento.files[0];
            this.subirLogo(archivo);
        }
    }

    private subirLogo(archivo: File): void {
        const tienda = this.tienda();
        if (!tienda) return;

        if (!archivo.type.startsWith('image/')) {
            this.toastService.error('El archivo debe ser una imagen');
            return;
        }

        // Validar tamaño (5MB máximo)
        const TAMANO_MAXIMO = 5 * 1024 * 1024;
        if (archivo.size > TAMANO_MAXIMO) {
            this.toastService.error('La imagen no debe superar los 5MB');
            return;
        }

        this.cargandoOperacion.set(true);

        this.tiendasService.subirLogoTienda(tienda.id, archivo).pipe(
            tap(respuesta => {
                const tiendaActualizada = { ...tienda, logo: respuesta.logoUrl };
                this.tienda.set(tiendaActualizada);
                this.cerrarModalLogo();
                this.toastService.success('Logo actualizado correctamente');
            }),
            catchError(() => {
                this.toastService.error('Error al subir el logo');
                return EMPTY;
            }),
            finalize(() => this.cargandoOperacion.set(false))
        ).subscribe();
    }

    // Métodos de utilidad para el template
    obtenerTipoNegocioTexto(tipo: TipoNegocioTienda): string {
        return this.tiendasService.obtenerTipoNegocioTexto(tipo);
    }

    obtenerTipoTiendaTexto(tipo: TipoTienda): string {
        const opcion = this.tiendasService.obtenerOpcionPorValor(
            this.tiendasService.obtenerTiposTienda(), tipo
        );
        return opcion?.etiqueta || tipo;
    }

    obtenerPlanTexto(plan: PlanSuscripcionTienda): string {
        return this.tiendasService.obtenerPlanTexto(plan);
    }

    obtenerEstadoTexto(estado: EstadoTienda): string {
        return this.tiendasService.obtenerEstadoTexto(estado);
    }

    obtenerClaseEstado(estado: EstadoTienda): string {
        const clases: Record<string, string> = {
            [EstadoTienda.ACTIVA]: 'success',
            [EstadoTienda.INACTIVA]: 'secondary',
            [EstadoTienda.EN_CONSTRUCCION]: 'warning',
            [EstadoTienda.MANTENIMIENTO]: 'info',
            [EstadoTienda.CERRADA_TEMPORAL]: 'danger'
        };
        return clases[estado] || 'secondary';
    }

    estaAbiertaAhora(): boolean {
        const tienda = this.tienda();
        if (!tienda?.horarioAtencion) return false;

        const ahora = new Date();
        const diasClave: (keyof HorarioAtencion)[] = [
            'domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'
        ];
        const diaActual = diasClave[ahora.getDay()];
        const horarioHoy = tienda.horarioAtencion[diaActual] as HorarioDia | undefined;

        if (!horarioHoy || !horarioHoy.abierto || !horarioHoy.horaApertura || !horarioHoy.horaCierre) {
            return false;
        }

        const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
        const apertura = this.convertirHoraAMinutos(horarioHoy.horaApertura);
        const cierre = this.convertirHoraAMinutos(horarioHoy.horaCierre);

        return horaActual >= apertura && horaActual <= cierre;
    }

    formatearHorarioDia(dia: HorarioDia | undefined): string {
        if (!dia || !dia.abierto) return 'Cerrado';
        return `${dia.horaApertura || '--:--'} - ${dia.horaCierre || '--:--'}`;
    }

    formatearDireccionCompleta(): string {
        const tienda = this.tienda();
        return tienda ? this.tiendasService.formatearDireccionCompleta(tienda) : '';
    }

    obtenerIniciales(): string {
        const tienda = this.tienda();
        if (!tienda) return '';
        return tienda.nombre
            .split(' ')
            .map(palabra => palabra.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-HN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatearMoneda(valor: number): string {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL'
        }).format(valor);
    }

    obtenerUrlLogo(): string {
        const tienda = this.tienda();
        return tienda?.logo || '/assets/img/tienda-placeholder.png';
    }

    obtenerColorPlan(plan: PlanSuscripcionTienda): string {
        const colores: Record<string, string> = {
            [PlanSuscripcionTienda.BASICO]: '#6c757d',
            [PlanSuscripcionTienda.PROFESIONAL]: '#0d6efd',
            [PlanSuscripcionTienda.EMPRESARIAL]: '#198754',
            [PlanSuscripcionTienda.PREMIUM]: '#dc3545'
        };
        return colores[plan] || '#6c757d';
    }

    obtenerIconoPlan(plan: PlanSuscripcionTienda): string {
        const iconos: Record<string, string> = {
            [PlanSuscripcionTienda.BASICO]: 'bi-star',
            [PlanSuscripcionTienda.PROFESIONAL]: 'bi-star-fill',
            [PlanSuscripcionTienda.EMPRESARIAL]: 'bi-award',
            [PlanSuscripcionTienda.PREMIUM]: 'bi-gem'
        };
        return iconos[plan] || 'bi-star';
    }

    private convertirHoraAMinutos(hora: string): number {
        if (!hora || !hora.includes(':')) return 0;
        const [horas, minutos] = hora.split(':').map(Number);
        return horas * 60 + minutos;
    }
}