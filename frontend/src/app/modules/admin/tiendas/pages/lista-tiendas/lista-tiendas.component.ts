import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TiendasService } from '../../services';
import { 
    Tienda, 
    FiltrosTienda 
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';
import { OpcionesCatalogoService } from '../../../../../core/services';
import { EstadoVisualizacionService } from '../../../../../core/services/estado-visualizacion.service';

@Component({
    selector: 'app-lista-tiendas',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-tiendas.component.html',
    styleUrl: './lista-tiendas.component.scss'
})
export class ListaTiendasComponent implements OnInit {
    private tiendasService = inject(TiendasService);
    private toastService = inject(ToastService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);
    private estadoVisualizacion = inject(EstadoVisualizacionService);

    // Señales para el estado del componente
    tiendas = signal<Tienda[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    // Señales para filtros
    busqueda = signal('');
    tipoNegocioSeleccionado = signal<string | null>(null);
    tipoTiendaSeleccionado = signal<string | null>(null);
    estadoSeleccionado = signal<string | null>(null);
    planSeleccionado = signal<string | null>(null);
    departamentoSeleccionado = signal<string>('');

    // Señales para paginación
    paginaActual = signal(1);
    limite = signal(10);
    totalTiendas = signal(0);
    totalPaginas = computed(() => Math.ceil(this.totalTiendas() / this.limite()));

    // Señales para modal de estado
    tiendaSeleccionada = signal<Tienda | null>(null);
    mostrarModalEstado = signal(false);
    procesando = signal(false);

    // Opciones dinámicas para selects
    get tiposNegocio() { return this.opcionesCatalogo.obtenerGrupo('tiposNegocio'); }
    get tiposTienda() { return this.opcionesCatalogo.obtenerGrupo('tiposTienda'); }
    get planesSuscripcion() { return this.opcionesCatalogo.obtenerGrupo('planesSuscripcion'); }
    get estadosTienda() { return this.opcionesCatalogo.obtenerGrupo('estadosTienda'); }
    get departamentos() { return this.opcionesCatalogo.obtenerGrupo('departamentos'); }

    ngOnInit(): void {
        this.cargarTiendas();
    }

    cargarTiendas(): void {
        this.cargando.set(true);
        const filtros: FiltrosTienda = {
            pagina: this.paginaActual(),
            limite: this.limite(),
            busqueda: this.busqueda().trim() || undefined,
            tipoNegocio: this.tipoNegocioSeleccionado() || undefined,
            tipoTienda: this.tipoTiendaSeleccionado() || undefined,
            estado: this.estadoSeleccionado() || undefined,
            planSuscripcion: this.planSeleccionado() || undefined,
            departamento: this.departamentoSeleccionado().trim() || undefined,
            soloActivas: undefined
        };

        this.tiendasService.obtenerTiendas(filtros).subscribe({
            next: (respuesta) => {
                this.tiendas.set(respuesta.datos);
                this.totalTiendas.set(respuesta.total);
                this.errorCarga.set(null);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudieron cargar las tiendas';
                this.errorCarga.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.tiendas.set([]);
                this.totalTiendas.set(0);
                this.toastService.error('Error al cargar las tiendas');
            }
        });
    }

    buscar(): void {
        this.paginaActual.set(1);
        this.cargarTiendas();
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.tipoNegocioSeleccionado.set(null);
        this.tipoTiendaSeleccionado.set(null);
        this.estadoSeleccionado.set(null);
        this.planSeleccionado.set(null);
        this.departamentoSeleccionado.set('');
        this.paginaActual.set(1);
        this.cargarTiendas();
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
            this.cargarTiendas();
        }
    }

    abrirModalEstado(tienda: Tienda): void {
        this.tiendaSeleccionada.set(tienda);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.tiendaSeleccionada.set(null);
    }

    confirmarCambioEstado(): void {
        const tienda = this.tiendaSeleccionada();
        if (!tienda) return;

        this.procesando.set(true);
        const nuevoEstado = !tienda.activa;
        
        this.tiendasService.cambiarEstadoTienda(tienda.id, nuevoEstado).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(
                    `Tienda "${tienda.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`
                );
                this.cerrarModalEstado();
                this.cargarTiendas();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar el estado de la tienda';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    obtenerIniciales(nombre: string): string {
        return nombre
            .split(' ')
            .map(palabra => palabra.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    formatearFecha(fecha: Date | string | undefined): string {
        if (!fecha) return 'Sin fecha';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatearDireccion(tienda: Tienda): string {
        return this.tiendasService.formatearDireccionCompleta(tienda);
    }

    obtenerEtiquetaTipoNegocio(tipo: string): string {
        return this.tiendasService.obtenerTipoNegocioTexto(tipo);
    }

    obtenerEtiquetaTipoTienda(tipo?: string): string {
        if (!tipo) return 'No especificado';
        const encontrado = this.tiposTienda.find(t => t.valor === tipo);
        return encontrado ? encontrado.etiqueta : tipo;
    }

    obtenerEtiquetaPlan(plan: string): string {
        return this.tiendasService.obtenerPlanTexto(plan);
    }

    obtenerEtiquetaEstado(estado: string): string {
        return this.tiendasService.obtenerEstadoTexto(estado);
    }

    obtenerClasesEstado(estado: string): string[] {
        return this.estadoVisualizacion.obtenerClase('tienda_badge', estado).split(' ');
    }

    obtenerIconoEstado(estado: string): string {
        return this.estadoVisualizacion.obtenerIcono('tienda_badge', estado);
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