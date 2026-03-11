import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ColaboradoresService } from '../../services';
import { Colaborador, FiltrosColaborador } from '../../interfaces';
import { OpcionesCatalogoService, ToastService } from '../../../../../core/services';

@Component({
    selector: 'app-lista-colaboradores',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-colaboradores.component.html',
    styleUrl: './lista-colaboradores.component.scss'
})
export class ListaColaboradoresComponent implements OnInit {
    private colaboradoresService = inject(ColaboradoresService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);
    private toastService = inject(ToastService);

    colaboradores = signal<Colaborador[]>([]);
    cargando = signal(true);

    busqueda = signal('');
    tipoContratoSeleccionado = signal<string | null>(null);
    estadoSeleccionado = signal<boolean | null>(null);

    paginaActual = signal(1);
    limite = signal(10);
    totalColaboradores = signal(0);

    totalPaginas = computed(() => Math.ceil(this.totalColaboradores() / this.limite()));

    colaboradorSeleccionado = signal<Colaborador | null>(null);
    mostrarModalEstado = signal(false);
    procesando = signal(false);

    get tiposContrato() { return this.opcionesCatalogo.obtenerGrupo('tiposContrato'); }

    ngOnInit(): void {
        this.cargarColaboradores();
    }

    cargarColaboradores(): void {
        this.cargando.set(true);

        const filtros: FiltrosColaborador = {
            pagina: this.paginaActual(),
            limite: this.limite(),
            busqueda: this.busqueda() || undefined,
            tipoContrato: this.tipoContratoSeleccionado() || undefined,
            activo: this.estadoSeleccionado() ?? undefined
        };

        this.colaboradoresService.obtenerColaboradores(filtros).subscribe({
            next: (respuesta) => {
                this.colaboradores.set(respuesta.datos);
                this.totalColaboradores.set(respuesta.total);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.colaboradores.set([]);
                this.totalColaboradores.set(0);
                this.toastService.error('Error al cargar los colaboradores');
            }
        });
    }

    buscar(): void {
        this.paginaActual.set(1);
        this.cargarColaboradores();
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.tipoContratoSeleccionado.set(null);
        this.estadoSeleccionado.set(null);
        this.paginaActual.set(1);
        this.cargarColaboradores();
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
            this.cargarColaboradores();
        }
    }

    abrirModalEstado(colaborador: Colaborador): void {
        this.colaboradorSeleccionado.set(colaborador);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.colaboradorSeleccionado.set(null);
    }

    confirmarCambioEstado(): void {
        const colaborador = this.colaboradorSeleccionado();
        if (!colaborador) return;

        this.procesando.set(true);
        this.colaboradoresService.cambiarEstado(colaborador.id, !colaborador.esActivo).subscribe({
            next: () => {
                this.cerrarModalEstado();
                this.cargarColaboradores();
                this.procesando.set(false);
            },
            error: () => {
                this.procesando.set(false);
            }
        });
    }

    obtenerIniciales(nombre: string, apellido?: string): string {
        let iniciales = nombre.charAt(0);
        if (apellido) {
            iniciales += apellido.charAt(0);
        }
        return iniciales.toUpperCase();
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

    obtenerEtiquetaContrato(tipo: string): string {
        const encontrado = this.tiposContrato.find(t => t.valor === tipo);
        return encontrado ? encontrado.etiqueta : tipo;
    }

    obtenerPaginas(): number[] {
        const total = this.totalPaginas();
        const actual = this.paginaActual();
        const paginas: number[] = [];

        let inicio = Math.max(1, actual - 2);
        let fin = Math.min(total, actual + 2);

        if (actual <= 3) {
            fin = Math.min(5, total);
        }
        if (actual >= total - 2) {
            inicio = Math.max(1, total - 4);
        }

        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }

        return paginas;
    }
}
