import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import {
    MiPerfilService,
    PerfilColaborador,
    ResumenSeguridad,
    SesionActiva,
    Dispositivo,
    Preferencias,
    DatosActualizarPerfil,
    DatosCambiarContrasena,
    DatosActualizarPreferencias,
    DatosActualizarSeguridad,
} from './services/mi-perfil.service';
import { ToastService } from '../../../core/services/toast.service';

type SeccionActiva = 'general' | 'seguridad' | 'preferencias' | 'sesiones' | 'dispositivos';

@Component({
    selector: 'app-mi-perfil',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mi-perfil.component.html',
    styleUrl: './mi-perfil.component.scss',
})
export class MiPerfilComponent implements OnInit, OnDestroy {
    private miPerfilService = inject(MiPerfilService);
    private toastService = inject(ToastService);
    private destruir$ = new Subject<void>();

    cargando = signal(false);
    guardando = signal(false);
    seccionActiva = signal<SeccionActiva>('general');

    // Perfil
    perfil = signal<PerfilColaborador | null>(null);

    // Formulario de edición
    modoEdicion = signal(false);
    formPerfil: DatosActualizarPerfil = {};

    // Cambio de contraseña
    mostrarCambioContrasena = signal(false);
    formContrasena: DatosCambiarContrasena = {
        contrasenaActual: '',
        nuevaContrasena: '',
        confirmarContrasena: '',
    };
    mostrarContrasenaActual = signal(false);
    mostrarContrasenaNueva = signal(false);
    mostrarContrasenaConfirmar = signal(false);

    // Seguridad
    resumenSeguridad = signal<ResumenSeguridad | null>(null);
    formSeguridad: DatosActualizarSeguridad = {};

    // Preferencias
    preferencias = signal<Preferencias | null>(null);
    formPreferencias: DatosActualizarPreferencias = {};

    // Sesiones
    sesiones = signal<SesionActiva[]>([]);

    // Dispositivos
    dispositivos = signal<Dispositivo[]>([]);

    // Temas de color disponibles
    temasDisponibles = [
        { valor: 'teal', nombre: 'Teal', color: '#14b8a6' },
        { valor: 'azul', nombre: 'Azul', color: '#0d6efd' },
        { valor: 'indigo', nombre: 'Índigo', color: '#6610f2' },
        { valor: 'purpura', nombre: 'Púrpura', color: '#6f42c1' },
        { valor: 'verde', nombre: 'Verde', color: '#198754' },
        { valor: 'naranja', nombre: 'Naranja', color: '#fd7e14' },
        { valor: 'rojo', nombre: 'Rojo', color: '#dc3545' },
        { valor: 'rosa', nombre: 'Rosa', color: '#d63384' },
    ];

    ngOnInit(): void {
        this.cargarPerfil();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    // --- Navegación ---

    cambiarSeccion(seccion: SeccionActiva): void {
        this.seccionActiva.set(seccion);
        this.modoEdicion.set(false);
        this.mostrarCambioContrasena.set(false);

        if (seccion === 'seguridad') this.cargarResumenSeguridad();
        if (seccion === 'preferencias') this.cargarPreferencias();
        if (seccion === 'sesiones') this.cargarSesiones();
        if (seccion === 'dispositivos') this.cargarDispositivos();
    }

    // --- Carga de datos ---

    cargarPerfil(): void {
        this.cargando.set(true);
        this.miPerfilService.obtenerPerfil()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.perfil.set(resp.datos);
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudo cargar el perfil');
                    this.cargando.set(false);
                },
            });
    }

    cargarResumenSeguridad(): void {
        this.cargando.set(true);
        this.miPerfilService.obtenerResumenSeguridad()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.resumenSeguridad.set(resp.datos);
                        this.inicializarFormSeguridad();
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudo cargar la información de seguridad');
                    this.cargando.set(false);
                },
            });
    }

    cargarPreferencias(): void {
        this.cargando.set(true);
        this.miPerfilService.obtenerPreferencias()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.preferencias.set(resp.datos);
                        this.inicializarFormPreferencias();
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudieron cargar las preferencias');
                    this.cargando.set(false);
                },
            });
    }

    cargarSesiones(): void {
        this.cargando.set(true);
        this.miPerfilService.obtenerSesionesActivas()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.sesiones.set(resp.datos);
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudieron cargar las sesiones');
                    this.cargando.set(false);
                },
            });
    }

    cargarDispositivos(): void {
        this.cargando.set(true);
        this.miPerfilService.obtenerDispositivos()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) this.dispositivos.set(resp.datos);
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudieron cargar los dispositivos');
                    this.cargando.set(false);
                },
            });
    }

    // --- Edición de perfil ---

    activarEdicion(): void {
        const p = this.perfil();
        if (!p) return;

        this.formPerfil = {
            nombre: p.nombre,
            apellido: p.apellido,
            telefono: p.telefono || '',
            telefonoEmergencia: p.telefonoEmergencia || '',
            contactoEmergenciaNombre: p.contactoEmergenciaNombre || '',
            genero: p.genero,
        };
        this.modoEdicion.set(true);
    }

    cancelarEdicion(): void {
        this.modoEdicion.set(false);
    }

    guardarPerfil(): void {
        if (!this.formPerfil.nombre?.trim() || !this.formPerfil.apellido?.trim()) {
            this.toastService.warning('Nombre y apellido son requeridos');
            return;
        }

        this.guardando.set(true);
        this.miPerfilService.actualizarPerfil(this.formPerfil)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.modoEdicion.set(false);
                        this.cargarPerfil();
                    }
                    this.guardando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudo actualizar el perfil');
                    this.guardando.set(false);
                },
            });
    }

    // --- Cambio de contraseña ---

    abrirCambioContrasena(): void {
        this.formContrasena = {
            contrasenaActual: '',
            nuevaContrasena: '',
            confirmarContrasena: '',
        };
        this.mostrarContrasenaActual.set(false);
        this.mostrarContrasenaNueva.set(false);
        this.mostrarContrasenaConfirmar.set(false);
        this.mostrarCambioContrasena.set(true);
    }

    cancelarCambioContrasena(): void {
        this.mostrarCambioContrasena.set(false);
    }

    guardarContrasena(): void {
        if (!this.formContrasena.contrasenaActual) {
            this.toastService.warning('Ingrese su contraseña actual');
            return;
        }
        if (!this.validarFortalezaContrasena(this.formContrasena.nuevaContrasena)) {
            return;
        }
        if (this.formContrasena.nuevaContrasena !== this.formContrasena.confirmarContrasena) {
            this.toastService.warning('Las contraseñas no coinciden');
            return;
        }

        this.guardando.set(true);
        this.miPerfilService.cambiarContrasena(this.formContrasena)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.mostrarCambioContrasena.set(false);
                    }
                    this.guardando.set(false);
                },
                error: (err) => {
                    const mensaje = err?.error?.message || 'No se pudo cambiar la contraseña';
                    this.toastService.error(mensaje);
                    this.guardando.set(false);
                },
            });
    }

    validarFortalezaContrasena(contrasena: string): boolean {
        if (!contrasena || contrasena.length < 12) {
            this.toastService.warning('La contraseña debe tener al menos 12 caracteres');
            return false;
        }
        if (!/[A-Z]/.test(contrasena)) {
            this.toastService.warning('Debe contener al menos una mayúscula');
            return false;
        }
        if (!/[a-z]/.test(contrasena)) {
            this.toastService.warning('Debe contener al menos una minúscula');
            return false;
        }
        if (!/[0-9]/.test(contrasena)) {
            this.toastService.warning('Debe contener al menos un número');
            return false;
        }
        if (!/[!@#$%^&*()_+\-=]/.test(contrasena)) {
            this.toastService.warning('Debe contener al menos un carácter especial');
            return false;
        }
        return true;
    }

    obtenerFortalezaContrasena(): { nivel: number; texto: string; clase: string } {
        const c = this.formContrasena.nuevaContrasena;
        if (!c) return { nivel: 0, texto: '', clase: '' };

        let puntos = 0;
        if (c.length >= 12) puntos++;
        if (c.length >= 16) puntos++;
        if (/[A-Z]/.test(c)) puntos++;
        if (/[a-z]/.test(c)) puntos++;
        if (/[0-9]/.test(c)) puntos++;
        if (/[!@#$%^&*()_+\-=]/.test(c)) puntos++;

        if (puntos <= 2) return { nivel: 1, texto: 'Débil', clase: 'bg-danger' };
        if (puntos <= 4) return { nivel: 2, texto: 'Media', clase: 'bg-warning' };
        if (puntos <= 5) return { nivel: 3, texto: 'Fuerte', clase: 'bg-info' };
        return { nivel: 4, texto: 'Muy fuerte', clase: 'bg-success' };
    }

    tieneMayuscula(): boolean {
        return /[A-Z]/.test(this.formContrasena.nuevaContrasena);
    }

    tieneMinuscula(): boolean {
        return /[a-z]/.test(this.formContrasena.nuevaContrasena);
    }

    tieneNumero(): boolean {
        return /[0-9]/.test(this.formContrasena.nuevaContrasena);
    }

    tieneEspecial(): boolean {
        return /[!@#$%^&*()_+\-=]/.test(this.formContrasena.nuevaContrasena);
    }

    // --- Seguridad ---

    private inicializarFormSeguridad(): void {
        const p = this.perfil();
        if (!p) return;
        this.formSeguridad = {
            requiere2fa: p.requiere2fa,
            metodo2fa: p.metodo2fa,
            maxSesionesSimultaneas: p.maxSesionesSimultaneas,
        };
    }

    guardarSeguridad(): void {
        this.guardando.set(true);
        this.miPerfilService.actualizarSeguridad(this.formSeguridad)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.cargarPerfil();
                    }
                    this.guardando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudo actualizar la seguridad');
                    this.guardando.set(false);
                },
            });
    }

    // --- Preferencias ---

    private inicializarFormPreferencias(): void {
        const pref = this.preferencias();
        if (!pref) return;
        this.formPreferencias = { ...pref };
    }

    seleccionarTema(tema: string): void {
        this.formPreferencias.temaColor = tema;
    }

    guardarPreferencias(): void {
        this.guardando.set(true);
        this.miPerfilService.actualizarPreferencias(this.formPreferencias)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                    }
                    this.guardando.set(false);
                },
                error: () => {
                    this.toastService.error('No se pudieron guardar las preferencias');
                    this.guardando.set(false);
                },
            });
    }

    // --- Sesiones ---

    cerrarSesion(sesion: SesionActiva): void {
        this.miPerfilService.cerrarSesion(sesion.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.cargarSesiones();
                    }
                },
                error: () => this.toastService.error('No se pudo cerrar la sesión'),
            });
    }

    cerrarTodasLasSesiones(): void {
        this.miPerfilService.cerrarTodasLasSesiones()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.cargarSesiones();
                    }
                },
                error: () => this.toastService.error('No se pudieron cerrar las sesiones'),
            });
    }

    // --- Dispositivos ---

    eliminarDispositivo(dispositivo: Dispositivo): void {
        this.miPerfilService.eliminarDispositivo(dispositivo.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.cargarDispositivos();
                    }
                },
                error: () => this.toastService.error('No se pudo eliminar el dispositivo'),
            });
    }

    // --- Utilidades ---

    formatearFecha(fechaStr: string | null): string {
        if (!fechaStr) return 'No disponible';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    formatearFechaHora(fechaStr: string | null): string {
        if (!fechaStr) return 'No disponible';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    tiempoRelativo(fechaStr: string | null): string {
        if (!fechaStr) return 'Nunca';
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diff = ahora.getTime() - fecha.getTime();
        const min = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (min < 1) return 'Ahora mismo';
        if (min < 60) return `Hace ${min} min`;
        if (hrs < 24) return `Hace ${hrs} h`;
        if (dias < 30) return `Hace ${dias} d`;
        return this.formatearFecha(fechaStr);
    }

    traducirGenero(genero: string): string {
        const mapa: Record<string, string> = {
            masculino: 'Masculino',
            femenino: 'Femenino',
            no_especificado: 'No especificado',
        };
        return mapa[genero] || genero;
    }

    traducirContrato(tipo: string): string {
        const mapa: Record<string, string> = {
            permanente: 'Permanente',
            temporal: 'Temporal',
            medio_tiempo: 'Medio tiempo',
            pasantia: 'Pasantía',
            contrato: 'Por contrato',
        };
        return mapa[tipo] || tipo;
    }

    obtenerIconoDispositivo(tipo: string): string {
        const iconos: Record<string, string> = {
            escritorio: 'bi-pc-display',
            laptop: 'bi-laptop',
            movil: 'bi-phone',
            tablet: 'bi-tablet',
            otro: 'bi-device-hdd',
        };
        return iconos[tipo] || 'bi-device-hdd';
    }

    obtenerIconoSeveridad(severidad: string): string {
        const iconos: Record<string, string> = {
            info: 'bi-info-circle text-info',
            warn: 'bi-exclamation-triangle text-warning',
            error: 'bi-x-circle text-danger',
            critical: 'bi-shield-exclamation text-danger',
        };
        return iconos[severidad] || 'bi-info-circle text-muted';
    }

    obtenerDiasDesdeUltimoCambio(): number | null {
        const p = this.perfil();
        if (!p?.ultimoCambioContrasena) return null;
        const diff = new Date().getTime() - new Date(p.ultimoCambioContrasena).getTime();
        return Math.floor(diff / 86400000);
    }

    get inicialAvatar(): string {
        const p = this.perfil();
        if (!p) return '?';
        return (p.nombre.charAt(0) + p.apellido.charAt(0)).toUpperCase();
    }
}
