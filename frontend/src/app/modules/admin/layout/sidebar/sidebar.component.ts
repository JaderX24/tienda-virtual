import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthAdminService } from '../../auth/services/auth-admin.service';
import { ItemMenu } from './menu.config';
import { MenuAdminService } from './menu-admin.service';

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
    private menuService = inject(MenuAdminService);
    private router = inject(Router);
    
    @Input() colapsado = false;
    @Input() mostrarMobile = false;
    @Input() usuario: UsuarioSidebar | null = null;
    
    @Output() toggleColapsado = new EventEmitter<void>();
    @Output() cerrarMobile = new EventEmitter<void>();

    menuCompleto = this.menuService.menu;
    rutaActual = signal<string>('');

    readonly anioActual = new Date().getFullYear();

    constructor() {
        this.escucharCambiosRuta();
    }

    private escucharCambiosRuta(): void {
        this.rutaActual.set(this.router.url);
        
        this.router.events
            .pipe(filter((evento) => evento instanceof NavigationEnd))
            .subscribe((evento) => {
                this.rutaActual.set((evento as NavigationEnd).urlAfterRedirects);
            });
    }

    toggleSubmenu(item: ItemMenu): void {
        if (item.hijos && item.hijos.length > 0) {
            this.menuService.toggleExpandido(item.id);
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
