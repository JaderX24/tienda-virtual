import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services';
import {
    ProductoInventario,
    MovimientoInventario,
    FiltrosMovimiento,
    FiltrosProductoInventario,
    RespuestaPaginada
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-admin-inventario',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-inventario.component.html',
    styleUrl: './admin-inventario.component.scss'
})
export class AdminInventarioComponent implements OnInit {
    private inventarioService = inject(InventarioService);
    private toastService = inject(ToastService);

    // Sub-pestañas
    subPestana = signal<'productos' | 'movimientos'>('productos');

    // Productos
    productos = signal<ProductoInventario[]>([]);
    totalProductos = signal(0);
    cargandoProductos = signal(false);
    filtrosProducto = signal<FiltrosProductoInventario>({
        busqueda: '',
        estadoStock: 'todos',
        pagina: 1,
        limite: 15
    });

    // Movimientos
    movimientos = signal<MovimientoInventario[]>([]);
    totalMovimientos = signal(0);
    cargandoMovimientos = signal(false);
    filtrosMovimiento = signal<FiltrosMovimiento>({
        busqueda: '',
        tipoMovimiento: '',
        pagina: 1,
        limite: 15
    });

    // Modal ajuste de stock
    mostrarModalAjuste = signal(false);
    productoSeleccionado = signal<ProductoInventario | null>(null);
    ajusteCantidad = signal<number | null>(null);
    ajusteMotivo = signal('');
    ajusteTipo = signal<'entrada' | 'salida' | 'ajuste'>('entrada');
    guardandoAjuste = signal(false);

    // Paginación
    totalPaginasProductos = computed(() => Math.ceil(this.totalProductos() / this.filtrosProducto().limite));
    totalPaginasMovimientos = computed(() => Math.ceil(this.totalMovimientos() / this.filtrosMovimiento().limite));

    ngOnInit(): void {
        this.cargarProductos();
        this.cargarMovimientos();
    }

    cambiarSubPestana(pestana: 'productos' | 'movimientos'): void {
        this.subPestana.set(pestana);
    }

    // --- Productos ---
    cargarProductos(): void {
        this.cargandoProductos.set(true);
        this.inventarioService.obtenerProductosInventario(this.filtrosProducto()).subscribe({
            next: (res) => {
                this.productos.set(res.datos);
                this.totalProductos.set(res.total);
                this.cargandoProductos.set(false);
            },
            error: () => {
                this.cargandoProductos.set(false);
                this.toastService.error('Error al cargar productos');
            }
        });
    }

    buscarProductos(termino: string): void {
        this.filtrosProducto.update(f => ({ ...f, busqueda: termino, pagina: 1 }));
        this.cargarProductos();
    }

    filtrarEstadoStock(estado: string): void {
        this.filtrosProducto.update(f => ({ ...f, estadoStock: estado as any, pagina: 1 }));
        this.cargarProductos();
    }

    cambiarPaginaProductos(pagina: number): void {
        if (pagina < 1 || pagina > this.totalPaginasProductos()) return;
        this.filtrosProducto.update(f => ({ ...f, pagina }));
        this.cargarProductos();
    }

    // --- Movimientos ---
    cargarMovimientos(): void {
        this.cargandoMovimientos.set(true);
        this.inventarioService.obtenerMovimientos(this.filtrosMovimiento()).subscribe({
            next: (res) => {
                this.movimientos.set(res.datos);
                this.totalMovimientos.set(res.total);
                this.cargandoMovimientos.set(false);
            },
            error: () => {
                this.cargandoMovimientos.set(false);
                this.toastService.error('Error al cargar movimientos');
            }
        });
    }

    buscarMovimientos(termino: string): void {
        this.filtrosMovimiento.update(f => ({ ...f, busqueda: termino, pagina: 1 }));
        this.cargarMovimientos();
    }

    filtrarTipoMovimiento(tipo: string): void {
        this.filtrosMovimiento.update(f => ({ ...f, tipoMovimiento: tipo, pagina: 1 }));
        this.cargarMovimientos();
    }

    cambiarPaginaMovimientos(pagina: number): void {
        if (pagina < 1 || pagina > this.totalPaginasMovimientos()) return;
        this.filtrosMovimiento.update(f => ({ ...f, pagina }));
        this.cargarMovimientos();
    }

    // --- Ajuste de Stock ---
    abrirModalAjuste(producto: ProductoInventario): void {
        this.productoSeleccionado.set(producto);
        this.ajusteCantidad.set(null);
        this.ajusteMotivo.set('');
        this.ajusteTipo.set('entrada');
        this.mostrarModalAjuste.set(true);
    }

    cerrarModalAjuste(): void {
        this.mostrarModalAjuste.set(false);
        this.productoSeleccionado.set(null);
    }

    guardarAjuste(): void {
        const producto = this.productoSeleccionado();
        const cantidad = this.ajusteCantidad();
        const motivo = this.ajusteMotivo().trim();

        if (!producto || !cantidad || cantidad <= 0) {
            this.toastService.warning('Ingresa una cantidad válida');
            return;
        }

        if (!motivo) {
            this.toastService.warning('El motivo es obligatorio');
            return;
        }

        this.guardandoAjuste.set(true);

        const cantidadFinal = this.ajusteTipo() === 'salida' ? -cantidad : cantidad;

        this.inventarioService.registrarMovimiento({
            productoId: producto.id,
            cantidad: cantidadFinal,
            tipoMovimiento: this.ajusteTipo(),
            motivo
        }).subscribe({
            next: () => {
                this.guardandoAjuste.set(false);
                this.toastService.success('Movimiento registrado exitosamente');
                this.cerrarModalAjuste();
                this.cargarProductos();
                this.cargarMovimientos();
            },
            error: (err) => {
                this.guardandoAjuste.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'Error al registrar movimiento';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    // Helpers
    obtenerEstadoStock(stock: number, stockMinimo: number) {
        return this.inventarioService.obtenerEstadoStock(stock, stockMinimo);
    }

    obtenerColorTipo(tipo: string): string {
        return this.inventarioService.obtenerColorTipoMovimiento(tipo);
    }

    obtenerIconoTipo(tipo: string): string {
        return this.inventarioService.obtenerIconoTipoMovimiento(tipo);
    }

    formatearPrecio(monto: number): string {
        return this.inventarioService.formatearPrecio(monto);
    }

    formatearFecha(fecha: string): string {
        return this.inventarioService.formatearFecha(fecha);
    }

    obtenerPaginas(total: number): number[] {
        const paginas: number[] = [];
        for (let i = 1; i <= Math.min(total, 5); i++) {
            paginas.push(i);
        }
        return paginas;
    }
}
