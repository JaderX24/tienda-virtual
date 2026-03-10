import { Component, HostListener, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarColabComponent } from '../sidebar/sidebar.component';
import { HeaderColabComponent } from '../header/header.component';
import { FooterColabComponent } from '../footer/footer.component';
import { AuthColaboradorService } from '../../auth/services/auth-colaborador.service';
import { ToastContainerComponent } from '../../../../core/components/toast';
import { TemaService } from '../../../../core/services/tema.service';

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
    private temaService = inject(TemaService);

    sidebarColapsado = signal(false);
    sidebarMobileMostrar = signal(false);

    usuario = this.authService.usuario;

    private readonly BREAKPOINT_LG = 992;

    constructor() {
        this.verificarTamanioPantalla();

        // Sincronizar sidebar compacto con preferencias
        effect(() => {
            const compacto = this.temaService.sidebarCompacto();
            this.sidebarColapsado.set(compacto);
        });
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
        const nuevoValor = !this.sidebarColapsado();
        this.sidebarColapsado.set(nuevoValor);
        this.temaService.aplicarSidebarCompacto(nuevoValor);
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
