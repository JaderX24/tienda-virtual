import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthAdminService } from '../../auth/services/auth-admin.service';
import { MENU_ADMIN, ItemMenu, SeccionMenu } from './menu.config';
import { OpcionesCatalogoService } from '../../../../core/services';

interface UsuarioSidebar {
    nombre: string;
    correo: string;
    rol?: {
        nombre: string;
        codigo: string;
    };
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
    private authService = inject(AuthAdminService);
    private router = inject(Router);
    private opcionesCatalogo = inject(OpcionesCatalogoService);
    
    @Input() colapsado = false;
    @Input() mostrarMobile = false;
    @Input() usuario: UsuarioSidebar | null = null;
    
    @Output() toggleColapsado = new EventEmitter<void>();
    @Output() cerrarMobile = new EventEmitter<void>();

    menuCompleto = signal<SeccionMenu[]>([]);
    rutaActual = signal<string>('');

    readonly anioActual = new Date().getFullYear();

    constructor() {
        this.inicializarMenu();
        this.escucharCambiosRuta();
    }

    private inicializarMenu(): void {
        const rolUsuario = this.authService.rol();
        const rolesAccesoTotal = this.opcionesCatalogo.obtenerGrupo('rolesAdminAccesoTotal').map(o => o.valor);
        
        if (rolesAccesoTotal.includes(rolUsuario)) {
            this.menuCompleto.set(MENU_ADMIN);
        } else {
            const menuFiltrado = this.filtrarMenuPorPermisos(MENU_ADMIN);
            this.menuCompleto.set(menuFiltrado);
        }
    }

    private escucharCambiosRuta(): void {
        this.rutaActual.set(this.router.url);
        
        this.router.events
            .pipe(filter((evento) => evento instanceof NavigationEnd))
            .subscribe((evento) => {
                this.rutaActual.set((evento as NavigationEnd).urlAfterRedirects);
            });
    }

    private filtrarMenuPorPermisos(secciones: SeccionMenu[]): SeccionMenu[] {
        return secciones
            .map((seccion) => ({
                ...seccion,
                items: this.filtrarItemsPorPermisos(seccion.items),
            }))
            .filter((seccion) => seccion.items.length > 0);
    }

    private filtrarItemsPorPermisos(items: ItemMenu[]): ItemMenu[] {
        return items
            .filter((item) => this.tienePermisoParaItem(item))
            .map((item) => ({
                ...item,
                hijos: item.hijos ? this.filtrarItemsPorPermisos(item.hijos) : undefined,
            }))
            .filter((item) => !item.hijos || item.hijos.length > 0 || item.ruta);
    }

    private tienePermisoParaItem(item: ItemMenu): boolean {
        if (!item.permisos || item.permisos.length === 0) {
            return true;
        }
        return this.authService.tieneAlgunPermiso(item.permisos);
    }

    toggleSubmenu(item: ItemMenu): void {
        if (item.hijos && item.hijos.length > 0) {
            item.expandido = !item.expandido;
        }
    }

    estaActivo(item: ItemMenu): boolean {
        const rutaActual = this.rutaActual();
        const rutaSinParams = rutaActual.split('?')[0];
        
        if (item.ruta) {
            return rutaSinParams === item.ruta || rutaSinParams.startsWith(item.ruta + '/');
        }
        
        if (item.hijos) {
            return item.hijos.some((hijo) => this.estaActivo(hijo));
        }
        
        return false;
    }

    tieneHijosActivos(item: ItemMenu): boolean {
        if (!item.hijos) return false;
        return item.hijos.some((hijo) => this.estaActivo(hijo));
    }

    toggleSidebar(): void {
        this.toggleColapsado.emit();
    }
    
    navegarYCerrar(ruta: string): void {
        this.router.navigate([ruta]);
        this.cerrarMobile.emit();
    }

    get nombreUsuario(): string {
        return this.usuario?.nombre || 'Usuario';
    }

    get rolUsuario(): string {
        return this.usuario?.rol?.nombre || 'Sin rol';
    }

    cerrarSesion(): void {
        this.authService.cerrarSesion().subscribe({
            next: () => {
                this.router.navigate(['/admin/inicio-sesion']);
            },
            error: () => {
                this.router.navigate(['/admin/inicio-sesion']);
            }
        });
    }
}
