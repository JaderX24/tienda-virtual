import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProveedoresEnvioService } from '../../services';
import {
    ProveedorEnvio,
    FiltrosProveedorEnvio
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';
import { EstadoVisualizacionService } from '../../../../../core/services/estado-visualizacion.service';

@Component({
    selector: 'app-lista-proveedores-envio',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-proveedores-envio.component.html',
    styleUrl: './lista-proveedores-envio.component.scss'
})
export class ListaProveedoresEnvioComponent implements OnInit {
    private proveedoresService = inject(ProveedoresEnvioService);
    private toastService = inject(ToastService);
    private estadoVisualizacion = inject(EstadoVisualizacionService);

    proveedores = signal<ProveedorEnvio[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    busqueda = signal('');
    tipoSeleccionado = signal<string | null>(null);
    estadoSeleccionado = signal<boolean | null>(null);
    zonaSeleccionada = signal<string | null>(null);

    paginaActual = signal(1);
    limite = signal(10);
    totalProveedores = signal(0);
    totalPaginas = computed(() => Math.ceil(this.totalProveedores() / this.limite()));

    proveedorSeleccionado = signal<ProveedorEnvio | null>(null);
    mostrarModalEstado = signal(false);
    mostrarModalDetalle = signal(false);
    procesando = signal(false);

    tiposProveedor = this.proveedoresService.obtenerTiposProveedor();
    zonasCobertura = this.proveedoresService.obtenerZonasCobertura();

    estadosFiltro = [
        { valor: null, etiqueta: 'Todos' },
        { valor: true, etiqueta: 'Activos' },
        { valor: false, etiqueta: 'Inactivos' }
    ];

    ngOnInit(): void {
        this.cargarProveedores();
    }

    cargarProveedores(): void {
        this.cargando.set(true);
        this.errorCarga.set(null);

        const filtros: FiltrosProveedorEnvio = {
            pagina: this.paginaActual(),
            limite: this.limite(),
            busqueda: this.busqueda().trim() || undefined,
            tipo: this.tipoSeleccionado() || undefined,
            esActivo: this.estadoSeleccionado() ?? undefined,
            zonaCobertura: this.zonaSeleccionada() || undefined
        };

        this.proveedoresService.obtenerProveedores(filtros).subscribe({
            next: (respuesta) => {
                this.proveedores.set(respuesta.datos);
                this.totalProveedores.set(respuesta.total);
                this.errorCarga.set(null);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudieron cargar los proveedores de envío';
                this.errorCarga.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.proveedores.set([]);
                this.totalProveedores.set(0);
                this.toastService.error('Error al cargar los proveedores de envío');
            }
        });
    }

    buscar(): void {
        this.paginaActual.set(1);
        this.cargarProveedores();
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.tipoSeleccionado.set(null);
        this.estadoSeleccionado.set(null);
        this.zonaSeleccionada.set(null);
        this.paginaActual.set(1);
        this.cargarProveedores();
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
            this.cargarProveedores();
        }
    }

    abrirModalEstado(proveedor: ProveedorEnvio): void {
        this.proveedorSeleccionado.set(proveedor);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.proveedorSeleccionado.set(null);
    }

    confirmarCambioEstado(): void {
        const proveedor = this.proveedorSeleccionado();
        if (!proveedor) return;

        this.procesando.set(true);
        const nuevoEstado = !proveedor.esActivo;

        this.proveedoresService.cambiarEstadoProveedor(proveedor.id, nuevoEstado).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(
                    `Proveedor "${proveedor.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`
                );
                this.cerrarModalEstado();
                this.cargarProveedores();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar el estado del proveedor';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    cambiarVisibilidad(proveedor: ProveedorEnvio): void {
        const nuevaVisibilidad = !proveedor.esVisible;

        this.proveedoresService.cambiarVisibilidadProveedor(proveedor.id, nuevaVisibilidad).subscribe({
            next: () => {
                this.toastService.success(
                    `"${proveedor.nombre}" ahora es ${nuevaVisibilidad ? 'visible' : 'no visible'} para clientes`
                );
                this.cargarProveedores();
            },
            error: (err) => {
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar la visibilidad';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    abrirDetalle(proveedor: ProveedorEnvio): void {
        this.proveedorSeleccionado.set(proveedor);
        this.mostrarModalDetalle.set(true);
    }

    cerrarDetalle(): void {
        this.mostrarModalDetalle.set(false);
        this.proveedorSeleccionado.set(null);
    }

    obtenerTipoTexto(tipo: string): string {
        return this.proveedoresService.obtenerTipoTexto(tipo);
    }

    obtenerIconoTipo(tipo: string): string {
        return this.proveedoresService.obtenerIconoTipo(tipo);
    }

    obtenerServicioTexto(servicio: string): string {
        return this.proveedoresService.obtenerServicioTexto(servicio);
    }

    obtenerIconoServicio(servicio: string): string {
        return this.proveedoresService.obtenerIconoServicio(servicio);
    }

    obtenerZonaTexto(zona: string): string {
        return this.proveedoresService.obtenerZonaTexto(zona);
    }

    obtenerClasesEstado(esActivo: boolean): string {
        return this.estadoVisualizacion.obtenerClase('activo_inactivo', String(esActivo));
    }

    obtenerIconoEstado(esActivo: boolean): string {
        return this.estadoVisualizacion.obtenerIcono('activo_inactivo', String(esActivo));
    }

    obtenerTextoEstado(esActivo: boolean): string {
        return this.estadoVisualizacion.obtenerEtiqueta('activo_inactivo', String(esActivo));
    }

    obtenerCapacidades(proveedor: ProveedorEnvio): string[] {
        const capacidades: string[] = [];
        if (proveedor.soportaRastreo) capacidades.push('Rastreo');
        if (proveedor.soportaSeguro) capacidades.push('Seguro');
        if (proveedor.soportaContraEntrega) capacidades.push('Contra Entrega');
        if (proveedor.soportaDevolucion) capacidades.push('Devolución');
        if (proveedor.soportaEntregaProgramada) capacidades.push('Entrega Programada');
        if (proveedor.soportaRecogidaDomicilio) capacidades.push('Recogida a Domicilio');
        return capacidades;
    }

    obtenerEstrellas(calificacion: number): number[] {
        return Array.from({ length: 5 }, (_, i) => i + 1);
    }

    esEstrellaLlena(calificacion: number, posicion: number): boolean {
        return posicion <= Math.floor(calificacion);
    }

    esEstrellaMedia(calificacion: number, posicion: number): boolean {
        return posicion === Math.ceil(calificacion) && calificacion % 1 >= 0.3;
    }

    obtenerContactoPrincipal(proveedor: ProveedorEnvio): string {
        const contacto = proveedor.contactos?.find(c => c.esPrincipal);
        if (contacto) return `${contacto.nombreCompleto} (${contacto.cargo})`;
        return proveedor.contactos?.length > 0 ? proveedor.contactos[0].nombreCompleto : 'Sin contacto';
    }

    formatearMonto(monto: number): string {
        return this.proveedoresService.formatearMonto(monto);
    }

    formatearFecha(fecha: string | undefined): string {
        if (!fecha) return 'Sin fecha';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    obtenerPaginas(): number[] {
        const total = this.totalPaginas();
        const actual = this.paginaActual();
        const paginas: number[] = [];
        let inicio = Math.max(1, actual - 2);
        let fin = Math.min(total, actual + 2);

        if (actual <= 3) fin = Math.min(5, total);
        if (actual >= total - 2) inicio = Math.max(1, total - 4);

        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }
        return paginas;
    }
}
