import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetodosPagoService } from '../../services';
import {
    PasarelaPago,
    FiltrosPasarela,
    TipoPasarela,
    ModoIntegracion
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-lista-metodos-pago',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-metodos-pago.component.html',
    styleUrl: './lista-metodos-pago.component.scss'
})
export class ListaMetodosPagoComponent implements OnInit {
    private metodosPagoService = inject(MetodosPagoService);
    private toastService = inject(ToastService);

    pasarelas = signal<PasarelaPago[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    busqueda = signal('');
    tipoSeleccionado = signal<TipoPasarela | null>(null);
    modoSeleccionado = signal<ModoIntegracion | null>(null);
    estadoSeleccionado = signal<boolean | null>(null);

    paginaActual = signal(1);
    limite = signal(10);
    totalPasarelas = signal(0);
    totalPaginas = computed(() => Math.ceil(this.totalPasarelas() / this.limite()));

    pasarelaSeleccionada = signal<PasarelaPago | null>(null);
    mostrarModalEstado = signal(false);
    mostrarModalEliminar = signal(false);
    procesando = signal(false);

    tiposPasarela = this.metodosPagoService.obtenerTiposPasarela();
    modosIntegracion = this.metodosPagoService.obtenerModosIntegracion();

    estadosFiltro = [
        { valor: null, etiqueta: 'Todos' },
        { valor: true, etiqueta: 'Activos' },
        { valor: false, etiqueta: 'Inactivos' }
    ];

    ngOnInit(): void {
        this.cargarPasarelas();
    }

    cargarPasarelas(): void {
        this.cargando.set(true);
        this.errorCarga.set(null);

        const filtros: FiltrosPasarela = {
            pagina: this.paginaActual(),
            limite: this.limite(),
            busqueda: this.busqueda().trim() || undefined,
            tipo: this.tipoSeleccionado() || undefined,
            modoIntegracion: this.modoSeleccionado() || undefined,
            esActivo: this.estadoSeleccionado() ?? undefined
        };

        this.metodosPagoService.obtenerPasarelas(filtros).subscribe({
            next: (respuesta) => {
                this.pasarelas.set(respuesta.datos);
                this.totalPasarelas.set(respuesta.total);
                this.errorCarga.set(null);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudieron cargar los métodos de pago';
                this.errorCarga.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.pasarelas.set([]);
                this.totalPasarelas.set(0);
                this.toastService.error('Error al cargar los métodos de pago');
            }
        });
    }

    buscar(): void {
        this.paginaActual.set(1);
        this.cargarPasarelas();
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.tipoSeleccionado.set(null);
        this.modoSeleccionado.set(null);
        this.estadoSeleccionado.set(null);
        this.paginaActual.set(1);
        this.cargarPasarelas();
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
            this.cargarPasarelas();
        }
    }

    abrirModalEstado(pasarela: PasarelaPago): void {
        this.pasarelaSeleccionada.set(pasarela);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.pasarelaSeleccionada.set(null);
    }

    confirmarCambioEstado(): void {
        const pasarela = this.pasarelaSeleccionada();
        if (!pasarela) return;

        this.procesando.set(true);
        const nuevoEstado = !pasarela.esActivo;

        this.metodosPagoService.cambiarEstadoPasarela(pasarela.id, nuevoEstado).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(
                    `Método de pago "${pasarela.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`
                );
                this.cerrarModalEstado();
                this.cargarPasarelas();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar el estado del método de pago';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    cambiarVisibilidad(pasarela: PasarelaPago): void {
        const nuevaVisibilidad = !pasarela.esVisibleCliente;

        this.metodosPagoService.cambiarVisibilidadPasarela(pasarela.id, nuevaVisibilidad).subscribe({
            next: () => {
                this.toastService.success(
                    `"${pasarela.nombre}" ahora es ${nuevaVisibilidad ? 'visible' : 'no visible'} para clientes`
                );
                this.cargarPasarelas();
            },
            error: (err) => {
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar la visibilidad';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    obtenerTipoTexto(tipo: TipoPasarela): string {
        return this.metodosPagoService.obtenerTipoTexto(tipo);
    }

    obtenerModoTexto(modo: ModoIntegracion): string {
        return this.metodosPagoService.obtenerModoTexto(modo);
    }

    obtenerIconoTipo(tipo: TipoPasarela): string {
        return this.metodosPagoService.obtenerIconoTipo(tipo);
    }

    obtenerClasesEstado(esActivo: boolean): string {
        return esActivo ? 'badge-estado activo' : 'badge-estado inactivo';
    }

    obtenerIconoEstado(esActivo: boolean): string {
        return esActivo ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
    }

    obtenerTextoEstado(esActivo: boolean): string {
        return esActivo ? 'Activo' : 'Inactivo';
    }

    obtenerCaracteristicas(pasarela: PasarelaPago): string[] {
        const caracteristicas: string[] = [];
        if (pasarela.soportaTokenizacion) caracteristicas.push('Tokenización');
        if (pasarela.soporta3ds) caracteristicas.push('3D Secure');
        if (pasarela.soportaReembolsos) caracteristicas.push('Reembolsos');
        if (pasarela.soportaReembolsosParciales) caracteristicas.push('Reembolsos Parciales');
        if (pasarela.soportaSuscripciones) caracteristicas.push('Suscripciones');
        if (pasarela.soportaSplitPayment) caracteristicas.push('Split Payment');
        if (pasarela.soportaPreautorizacion) caracteristicas.push('Preautorización');
        if (pasarela.soportaCapturaDiferida) caracteristicas.push('Captura Diferida');
        return caracteristicas;
    }

    formatearMonto(monto: number): string {
        return this.metodosPagoService.formatearMonto(monto);
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
