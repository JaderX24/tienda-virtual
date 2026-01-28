import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderAdminComponent } from '../header/header.component';
import { FooterAdminComponent } from '../footer/footer.component';
import { AuthAdminService } from '../../auth/services/auth-admin.service';

@Component({
    selector: 'app-layout-admin',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        SidebarComponent,
        HeaderAdminComponent,
        FooterAdminComponent
    ],
    templateUrl: './layout-admin.component.html',
    styleUrl: './layout-admin.component.scss'
})
export class LayoutAdminComponent {
    private authService = inject(AuthAdminService);
    
    sidebarColapsado = signal(false);
    sidebarMobileMostrar = signal(false);
    
    usuario = this.authService.usuario;
    
    // Detectar ancho de pantalla inicial
    private readonly BREAKPOINT_LG = 992;
    
    constructor() {
        this.verificarTamanioPantalla();
    }
    
    @HostListener('window:resize')
    onResize(): void {
        this.verificarTamanioPantalla();
    }
    
    private verificarTamanioPantalla(): void {
        if (window.innerWidth < this.BREAKPOINT_LG) {
            this.sidebarMobileMostrar.set(false);
        }
    }
    
    toggleSidebar(): void {
        this.sidebarColapsado.update(valor => !valor);
    }
    
    toggleSidebarMobile(): void {
        this.sidebarMobileMostrar.update(valor => !valor);
    }
    
    cerrarSidebarMobile(): void {
        if (window.innerWidth < this.BREAKPOINT_LG) {
            this.sidebarMobileMostrar.set(false);
        }
    }
    
    // Atajos de teclado
    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        // Ctrl + B para toggle sidebar
        if (event.ctrlKey && event.key === 'b') {
            event.preventDefault();
            this.toggleSidebar();
        }
        
        // Escape para cerrar sidebar móvil
        if (event.key === 'Escape' && this.sidebarMobileMostrar()) {
            this.cerrarSidebarMobile();
        }
    }
}
