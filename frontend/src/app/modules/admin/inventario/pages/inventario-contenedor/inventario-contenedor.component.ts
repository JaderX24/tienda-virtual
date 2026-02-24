import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardInventarioComponent } from '../dashboard-inventario/dashboard-inventario.component';
import { AdminInventarioComponent } from '../admin-inventario/admin-inventario.component';

@Component({
    selector: 'app-inventario-contenedor',
    standalone: true,
    imports: [CommonModule, RouterLink, DashboardInventarioComponent, AdminInventarioComponent],
    templateUrl: './inventario-contenedor.component.html',
    styleUrl: './inventario-contenedor.component.scss'
})
export class InventarioContenedorComponent {
    pestanaActiva = signal<'dashboard' | 'administracion'>('dashboard');

    cambiarPestana(pestana: 'dashboard' | 'administracion'): void {
        this.pestanaActiva.set(pestana);
    }
}
