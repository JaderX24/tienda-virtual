import { Component, Input, Output, EventEmitter, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthColaboradorService } from '../../auth/services/auth-colaborador.service';
import { MENU_COLABORADOR, ItemMenuColab, SeccionMenuColab } from './menu.config';
import { IdiomaService } from '../../../../core/services/idioma.service';
import { TraducirPipe } from '../../../../core/pipes/colaboradoresPortal/traducir.pipe';
import { OpcionesCatalogoService } from '../../../../core/services';

@Component({
    selector: 'app-sidebar-colab',
    standalone: true,
    imports: [CommonModule, RouterModule, TraducirPipe],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
})
export class SidebarColabComponent {
    private authService = inject(AuthColaboradorService);
    private router = inject(Router);
    private idiomaService = inject(IdiomaService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);

    @Input() colapsado = false;
    @Input() mostrarMobile = false;
    @Input() usuario: { nombre: string; correo: string; rol?: { nombre: string; codigo: string } } | null = null;

    @Output() toggleColapsado = new EventEmitter<void>();
    @Output() cerrarMobile = new EventEmitter<void>();

    menuCompleto = signal<SeccionMenuColab[]>([]);
    rutaActual = signal<string>('');
    readonly anioActual = new Date().getFullYear();

    constructor() {
        this.escucharCambiosRuta();

        // Reaccionar a cambios en permisos/rol del usuario
        effect(() => {
            const rol = this.authService.rol();
            const permisos = this.authService.permisos();
            this.construirMenu(rol, permisos);
        });
    }

    private construirMenu(rolUsuario: string, permisos: string[]): void {
        const rolesAccesoTotal = this.opcionesCatalogo.obtenerGrupo('rolesColabAccesoTotal').map(o => o.valor);
        const tienePermisosColab = permisos.some(p => p.startsWith('colab_'));

        if (rolesAccesoTotal.includes(rolUsuario) || !tienePermisosColab) {
            this.menuCompleto.set(structuredClone(MENU_COLABORADOR));
        } else {
            const menuFiltrado = this.filtrarMenuPorPermisos(structuredClone(MENU_COLABORADOR));
            this.menuCompleto.set(menuFiltrado);
        }
    }

    private escucharCambiosRuta(): void {
        this.rutaActual.set(this.router.url);
        this.router.events.pipe(filter((evento) => evento instanceof NavigationEnd))
            .subscribe((evento) => { this.rutaActual.set((evento as NavigationEnd).urlAfterRedirects); });
    }

    private filtrarMenuPorPermisos(secciones: SeccionMenuColab[]): SeccionMenuColab[] {
        return secciones.map((seccion) => ({ ...seccion, items: this.filtrarItemsPorPermisos(seccion.items) }))
            .filter((seccion) => seccion.items.length > 0);
    }

    private filtrarItemsPorPermisos(items: ItemMenuColab[]): ItemMenuColab[] {
        return items.filter((item) => this.tienePermisoParaItem(item))
            .map((item) => ({ ...item, hijos: item.hijos ? this.filtrarItemsPorPermisos(item.hijos) : undefined }))
            .filter((item) => !item.hijos || item.hijos.length > 0 || item.ruta);
    }

    private tienePermisoParaItem(item: ItemMenuColab): boolean {
        if (!item.permisos || item.permisos.length === 0) return true;
        return this.authService.tieneAlgunPermiso(item.permisos);
    }

    toggleSubmenu(item: ItemMenuColab): void {
        if (item.hijos && item.hijos.length > 0) item.expandido = !item.expandido;
    }

    estaActivo(item: ItemMenuColab): boolean {
        const rutaActual = this.rutaActual();
        const rutaSinParams = rutaActual.split('?')[0];
        if (item.ruta) return rutaSinParams === item.ruta || rutaSinParams.startsWith(item.ruta + '/');
        if (item.hijos) return item.hijos.some((hijo) => this.estaActivo(hijo));
        return false;
    }

    tieneHijosActivos(item: ItemMenuColab): boolean {
        if (!item.hijos) return false;
        return item.hijos.some((hijo) => this.estaActivo(hijo));
    }

    toggleSidebar(): void { this.toggleColapsado.emit(); }
    navegarYCerrar(ruta: string): void { this.router.navigate([ruta]); this.cerrarMobile.emit(); }

    get nombreUsuario(): string { return this.usuario?.nombre || 'Colaborador'; }
    get rolUsuario(): string {
        const codigo = this.usuario?.rol?.codigo || '';
        if (!codigo) return this.usuario?.rol?.nombre || this.idiomaService.t('rol.colaborador');
        const clave = 'rol.' + codigo.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
        const traduccion = this.idiomaService.t(clave);
        return traduccion !== clave ? traduccion : (this.usuario?.rol?.nombre || this.idiomaService.t('rol.colaborador'));
    }

    cerrarSesion(): void {
        this.authService.cerrarSesion().subscribe({
            next: () => { this.router.navigate(['/colaborador/inicio-sesion']); },
            error: () => { this.router.navigate(['/colaborador/inicio-sesion']); }
        });
    }
}
