import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarColabComponent } from '../sidebar/sidebar.component';
import { HeaderColabComponent } from '../header/header.component';
import { FooterColabComponent } from '../footer/footer.component';
import { AuthColaboradorService } from '../../auth/services/auth-colaborador.service';
import { ToastContainerComponent } from '../../../../core/components/toast';

@Component({
    selector: 'app-layout-colaborador',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        SidebarColabComponent,
        HeaderColabComponent,
        FooterColabComponent,
        ToastContainerComponent
    ],
    templateUrl: './layout-colaborador.component.html',
    styleUrl: './layout-colaborador.component.scss'
})
export class LayoutColaboradorComponent {
    private authService = inject(AuthColaboradorService);

    sidebarColapsado = signal(false);
    sidebarMobileMostrar = signal(false);

    usuario = this.authService.usuario;

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

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'b') {
            event.preventDefault();
            this.toggleSidebar();
        }

        if (event.key === 'Escape' && this.sidebarMobileMostrar()) {
            this.cerrarSidebarMobile();
        }
    }
}
