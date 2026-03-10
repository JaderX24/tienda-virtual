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
} from './services/mi-perfil.service';
import { ToastService } from '../../../core/services/toast.service';
import { TemaService, ZONAS_HORARIAS, IDIOMAS_DISPONIBLES } from '../../../core/services/tema.service';
import { IdiomaService } from '../../../core/services/idioma.service';
import { TraducirPipe } from '../../../core/pipes/colaboradoresPortal/traducir.pipe';

type SeccionActiva = 'general' | 'seguridad' | 'preferencias' | 'sesiones' | 'dispositivos';

@Component({
    selector: 'app-mi-perfil',
    standalone: true,
    imports: [CommonModule, FormsModule, TraducirPipe],
    templateUrl: './mi-perfil.component.html',
    styleUrl: './mi-perfil.component.scss',
})
export class MiPerfilComponent implements OnInit, OnDestroy {
    private miPerfilService = inject(MiPerfilService);
    private toastService = inject(ToastService);
    private temaService = inject(TemaService);
    private idiomaService = inject(IdiomaService);
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

    // 2FA
    estado2FA = signal<'inactivo' | 'seleccion' | 'verificando' | 'activo'>('inactivo');
    metodo2FASeleccionado = '';
    qrCodeUrl = '';
    codigo2FA = '';
    contrasenaDesactivar = '';
    mostrarContrasenaDesactivar = signal(false);
    guardando2FA = signal(false);

    // Preferencias
    preferencias = signal<Preferencias | null>(null);
    formPreferencias: DatosActualizarPreferencias = {};

    // Sesiones
    sesiones = signal<SesionActiva[]>([]);

    // Dispositivos
    dispositivos = signal<Dispositivo[]>([]);
    dispositivoEditandoNombre = signal<number | null>(null);
    nombreDispositivoEdicion = '';

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

    zonasHorarias = ZONAS_HORARIAS;
    idiomasDisponibles = IDIOMAS_DISPONIBLES;

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
                    this.toastService.error(this.idiomaService.t('toast.errorCargarPerfil'));
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
                        this.inicializarEstado2FA();
                    }
                    this.cargando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorCargarSeguridad'));
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
                    this.toastService.error(this.idiomaService.t('toast.errorCargarPreferencias'));
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
                    this.toastService.error(this.idiomaService.t('toast.errorCargarSesiones'));
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
                    this.toastService.error(this.idiomaService.t('toast.errorCargarDispositivos'));
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
            this.toastService.warning(this.idiomaService.t('toast.nombreApellidoReq'));
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
                    this.toastService.error(this.idiomaService.t('toast.errorActualizarPerfil'));
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
            this.toastService.warning(this.idiomaService.t('toast.ingreseContrasenaActual'));
            return;
        }
        if (!this.validarFortalezaContrasena(this.formContrasena.nuevaContrasena)) {
            return;
        }
        if (this.formContrasena.nuevaContrasena !== this.formContrasena.confirmarContrasena) {
            this.toastService.warning(this.idiomaService.t('toast.contrasenasNoCoinciden'));
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
                    const mensaje = err?.error?.message || this.idiomaService.t('toast.errorCambiarContrasena');
                    this.toastService.error(mensaje);
                    this.guardando.set(false);
                },
            });
    }

    validarFortalezaContrasena(contrasena: string): boolean {
        if (!contrasena || contrasena.length < 12) {
            this.toastService.warning(this.idiomaService.t('contrasena.min12'));
            return false;
        }
        if (!/[A-Z]/.test(contrasena)) {
            this.toastService.warning(this.idiomaService.t('contrasena.mayuscula'));
            return false;
        }
        if (!/[a-z]/.test(contrasena)) {
            this.toastService.warning(this.idiomaService.t('contrasena.minuscula'));
            return false;
        }
        if (!/[0-9]/.test(contrasena)) {
            this.toastService.warning(this.idiomaService.t('contrasena.numero'));
            return false;
        }
        if (!/[!@#$%^&*()_+\-=]/.test(contrasena)) {
            this.toastService.warning(this.idiomaService.t('contrasena.especial'));
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

        if (puntos <= 2) return { nivel: 1, texto: this.idiomaService.t('contrasena.debil'), clase: 'bg-danger' };
        if (puntos <= 4) return { nivel: 2, texto: this.idiomaService.t('contrasena.media'), clase: 'bg-warning' };
        if (puntos <= 5) return { nivel: 3, texto: this.idiomaService.t('contrasena.fuerte'), clase: 'bg-info' };
        return { nivel: 4, texto: this.idiomaService.t('contrasena.muyFuerte'), clase: 'bg-success' };
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

    // --- Seguridad / 2FA ---

    private inicializarEstado2FA(): void {
        const p = this.perfil();
        if (!p) return;
        this.estado2FA.set(p.requiere2fa ? 'activo' : 'inactivo');
        this.metodo2FASeleccionado = p.metodo2fa || '';
        this.qrCodeUrl = '';
        this.codigo2FA = '';
        this.contrasenaDesactivar = '';
    }

    iniciarActivacion2FA(metodo: string): void {
        this.guardando2FA.set(true);
        this.miPerfilService.iniciar2FA(metodo)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.metodo2FASeleccionado = resp.metodo;
                        this.qrCodeUrl = resp.qrCodeUrl || '';
                        this.codigo2FA = '';
                        this.estado2FA.set('verificando');
                        this.toastService.info(resp.mensaje);
                    }
                    this.guardando2FA.set(false);
                },
                error: (err) => {
                    const mensaje = err?.error?.message || this.idiomaService.t('toast.errorActualizarSeguridad');
                    this.toastService.error(mensaje);
                    this.guardando2FA.set(false);
                },
            });
    }

    confirmarActivacion2FA(): void {
        if (!this.codigo2FA || this.codigo2FA.length !== 6) {
            this.toastService.warning(this.idiomaService.t('seguridad.codigo6Digitos'));
            return;
        }

        this.guardando2FA.set(true);
        this.miPerfilService.confirmar2FA(this.codigo2FA)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.estado2FA.set('activo');
                        this.cargarPerfil();
                    }
                    this.guardando2FA.set(false);
                },
                error: (err) => {
                    const mensaje = err?.error?.message || this.idiomaService.t('seguridad.codigoIncorrecto');
                    this.toastService.error(mensaje);
                    this.guardando2FA.set(false);
                },
            });
    }

    desactivar2FA(): void {
        if (!this.contrasenaDesactivar) {
            this.toastService.warning(this.idiomaService.t('seguridad.contrasenaRequerida'));
            return;
        }

        this.guardando2FA.set(true);
        this.miPerfilService.desactivar2FA(this.contrasenaDesactivar)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.estado2FA.set('inactivo');
                        this.contrasenaDesactivar = '';
                        this.cargarPerfil();
                    }
                    this.guardando2FA.set(false);
                },
                error: (err) => {
                    const mensaje = err?.error?.message || this.idiomaService.t('toast.errorActualizarSeguridad');
                    this.toastService.error(mensaje);
                    this.guardando2FA.set(false);
                },
            });
    }

    cancelar2FA(): void {
        this.inicializarEstado2FA();
    }

    alIngresarCodigo2FA(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        input.value = input.value.replace(/\D/g, '').slice(0, 6);
        this.codigo2FA = input.value;
    }

    // --- Preferencias ---

    private inicializarFormPreferencias(): void {
        const pref = this.preferencias();
        if (!pref) return;
        this.formPreferencias = { ...pref };

        // Sincronizar con el estado actual local (tiene prioridad sobre el backend)
        this.formPreferencias.sidebarCompacto = this.temaService.sidebarCompacto();
        this.formPreferencias.temaColor = this.temaService.obtenerTemaActual();
        this.formPreferencias.idioma = this.temaService.idiomaActual();
        this.formPreferencias.zonaHoraria = this.temaService.zonaHorariaActual();
    }

    seleccionarTema(tema: string): void {
        this.formPreferencias.temaColor = tema;
        this.temaService.aplicarTema(tema);
    }

    toggleSidebarCompacto(compacto: boolean): void {
        this.temaService.aplicarSidebarCompacto(compacto);
    }

    cambiarIdioma(idioma: string): void {
        this.temaService.aplicarIdioma(idioma);
    }

    cambiarZonaHoraria(zona: string): void {
        this.temaService.aplicarZonaHoraria(zona);
    }

    guardarPreferencias(): void {
        this.guardando.set(true);
        this.miPerfilService.actualizarPreferencias(this.formPreferencias)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        if (this.formPreferencias.temaColor) {
                            this.temaService.aplicarTema(this.formPreferencias.temaColor);
                        }
                        if (this.formPreferencias.sidebarCompacto !== undefined) {
                            this.temaService.aplicarSidebarCompacto(this.formPreferencias.sidebarCompacto);
                        }
                        if (this.formPreferencias.idioma) {
                            this.temaService.aplicarIdioma(this.formPreferencias.idioma);
                        }
                        if (this.formPreferencias.zonaHoraria) {
                            this.temaService.aplicarZonaHoraria(this.formPreferencias.zonaHoraria);
                        }
                    }
                    this.guardando.set(false);
                },
                error: () => {
                    this.toastService.error(this.idiomaService.t('toast.errorGuardarPreferencias'));
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
                error: () => this.toastService.error(this.idiomaService.t('toast.errorCerrarSesion')),
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
                error: () => this.toastService.error(this.idiomaService.t('toast.errorCerrarSesiones')),
            });
    }

    // --- Dispositivos ---

    alternarConfianza(dispositivo: Dispositivo): void {
        this.miPerfilService.alternarConfianza(dispositivo.id)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.cargarDispositivos();
                    }
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorActualizarDisp')),
            });
    }

    iniciarEdicionNombre(dispositivo: Dispositivo): void {
        this.dispositivoEditandoNombre.set(dispositivo.id);
        this.nombreDispositivoEdicion = dispositivo.nombre;
    }

    cancelarEdicionNombre(): void {
        this.dispositivoEditandoNombre.set(null);
        this.nombreDispositivoEdicion = '';
    }

    guardarNombreDispositivo(dispositivo: Dispositivo): void {
        const nombre = this.nombreDispositivoEdicion.trim();
        if (!nombre || nombre.length < 2) {
            this.toastService.warning(this.idiomaService.t('dispositivos.nombreMinimo'));
            return;
        }

        this.miPerfilService.renombrarDispositivo(dispositivo.id, nombre)
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.toastService.success(resp.mensaje);
                        this.dispositivoEditandoNombre.set(null);
                        this.cargarDispositivos();
                    }
                },
                error: () => this.toastService.error(this.idiomaService.t('toast.errorRenombrarDisp')),
            });
    }

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
                error: () => this.toastService.error(this.idiomaService.t('toast.errorEliminarDisp')),
            });
    }

    // --- Utilidades ---

    formatearFecha(fechaStr: string | null): string {
        if (!fechaStr) return this.idiomaService.t('misc.noDisponible');
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    formatearFechaHora(fechaStr: string | null): string {
        if (!fechaStr) return this.idiomaService.t('misc.noDisponible');
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
        if (!fechaStr) return this.idiomaService.t('misc.nunca');
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diff = ahora.getTime() - fecha.getTime();
        const min = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (min < 1) return this.idiomaService.t('tiempo.ahoraMismo');
        if (min < 60) return this.idiomaService.t('tiempo.haceMin').replace('{n}', String(min));
        if (hrs < 24) return this.idiomaService.t('tiempo.haceHoras').replace('{n}', String(hrs));
        if (dias < 30) return this.idiomaService.t('tiempo.haceDias').replace('{n}', String(dias));
        return this.formatearFecha(fechaStr);
    }

    traducirGenero(genero: string): string {
        const mapaClave: Record<string, string> = {
            masculino: 'perfil.masculino',
            femenino: 'perfil.femenino',
            no_especificado: 'perfil.noEspecificado',
        };
        const clave = mapaClave[genero];
        return clave ? this.idiomaService.t(clave) : genero;
    }

    traducirContrato(tipo: string): string {
        const mapaClave: Record<string, string> = {
            permanente: 'contrato.permanente',
            temporal: 'contrato.temporal',
            medio_tiempo: 'contrato.medioTiempo',
            pasantia: 'contrato.pasantia',
            contrato: 'contrato.porContrato',
        };
        const clave = mapaClave[tipo];
        return clave ? this.idiomaService.t(clave) : tipo;
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
