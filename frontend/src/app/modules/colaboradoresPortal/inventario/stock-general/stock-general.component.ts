import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import {
    InventarioService,
    ProductoStock,
    AlmacenAsignado,
} from '../services/inventario.service';

@Component({
    selector: 'app-stock-general',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stock-general.component.html',
    styleUrl: './stock-general.component.scss',
})
export class StockGeneralComponent implements OnInit, OnDestroy {
    private inventarioService = inject(InventarioService);
    private destruir$ = new Subject<void>();

    productos = signal<ProductoStock[]>([]);
    almacenes = signal<AlmacenAsignado[]>([]);
    cargando = signal(true);

    busqueda = '';
    almacenSeleccionado = 0;
    paginaActual = signal(1);
    totalPaginas = signal(0);
    totalProductos = signal(0);

    ngOnInit(): void {
        this.cargarAlmacenes();
    }

    ngOnDestroy(): void {
        this.destruir$.next();
        this.destruir$.complete();
    }

    cargarAlmacenes(): void {
        this.inventarioService.obtenerAlmacenes()
            .pipe(takeUntil(this.destruir$))
            .subscribe({
                next: (resp) => {
                    if (resp.exito) {
                        this.almacenes.set(resp.datos);
                    }
                    this.cargarStock();
                },
                error: () => this.cargarStock(),
            });
    }

    cargarStock(pagina: number = 1): void {
        this.cargando.set(true);
        this.inventarioService.obtenerStock({
            busqueda: this.busqueda || undefined,
            almacenId: this.almacenSeleccionado || undefined,
            pagina,
            limite: 15,
        })
        .pipe(takeUntil(this.destruir$))
        .subscribe({
            next: (resp) => {
                if (resp.exito) {
                    this.productos.set(resp.datos);
                    this.paginaActual.set(resp.paginacion.pagina);
                    this.totalPaginas.set(resp.paginacion.totalPaginas);
                    this.totalProductos.set(resp.paginacion.total);
                }
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false),
        });
    }

    buscar(): void {
        this.cargarStock(1);
    }

    limpiarFiltros(): void {
        this.busqueda = '';
        this.almacenSeleccionado = 0;
        this.cargarStock(1);
    }

    obtenerClaseEstado(estado: string): string {
        const mapa: Record<string, string> = {
            disponible: 'text-bg-success',
            bajo: 'text-bg-warning',
            agotado: 'text-bg-danger',
        };
        return mapa[estado] || 'text-bg-secondary';
    }

    obtenerEtiquetaEstado(estado: string): string {
        const mapa: Record<string, string> = {
            disponible: 'Disponible',
            bajo: 'Stock Bajo',
            agotado: 'Agotado',
        };
        return mapa[estado] || estado;
    }

    formatearPrecio(precio: number): string {
        return `L ${precio.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
