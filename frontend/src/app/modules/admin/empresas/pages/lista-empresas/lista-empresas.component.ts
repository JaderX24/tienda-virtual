import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmpresasService } from '../../services';
import { Empresa, FiltrosEmpresa, TipoNegocio, PlanSuscripcion } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';
import { OpcionesCatalogoService } from '../../../../../core/services';

@Component({
    selector: 'app-lista-empresas',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-empresas.component.html',
    styleUrl: './lista-empresas.component.scss'
})
export class ListaEmpresasComponent implements OnInit {
    private empresasService = inject(EmpresasService);
    private toastService = inject(ToastService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);

    empresas = signal<Empresa[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    busqueda = signal('');
    tipoSeleccionado = signal<TipoNegocio | null>(null);
    planSeleccionado = signal<PlanSuscripcion | null>(null);
    estadoSeleccionado = signal<boolean | null>(null);

    paginaActual = signal(1);
    limite = signal(10);
    totalEmpresas = signal(0);
    totalPaginas = computed(() => Math.ceil(this.totalEmpresas() / this.limite()));

    empresaSeleccionada = signal<Empresa | null>(null);
    mostrarModalEstado = signal(false);
    procesando = signal(false);

    get tiposNegocio() { return this.opcionesCatalogo.obtenerGrupo('tiposNegocio'); }
    get planesSuscripcion() { return this.opcionesCatalogo.obtenerGrupo('planesSuscripcion'); }

    ngOnInit(): void {
        this.cargarEmpresas();
    }

    cargarEmpresas(): void {
        this.cargando.set(true);
        const filtros: FiltrosEmpresa = {
            pagina: this.paginaActual(),
            limite: this.limite(),
            busqueda: this.busqueda() || undefined,
            tipoNegocio: this.tipoSeleccionado() || undefined,
            planSuscripcion: this.planSeleccionado() || undefined,
            activa: this.estadoSeleccionado() ?? undefined
        };

        this.empresasService.obtenerEmpresas(filtros).subscribe({
            next: (respuesta) => {
                this.empresas.set(respuesta.datos);
                this.totalEmpresas.set(respuesta.total);
                this.errorCarga.set(null);
                this.cargando.set(false);
            },
            error: (err) => {
                this.cargando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudieron cargar las empresas';
                this.errorCarga.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.empresas.set([]);
                this.totalEmpresas.set(0);
            }
        });
    }

    buscar(): void {
        this.paginaActual.set(1);
        this.cargarEmpresas();
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.tipoSeleccionado.set(null);
        this.planSeleccionado.set(null);
        this.estadoSeleccionado.set(null);
        this.paginaActual.set(1);
        this.cargarEmpresas();
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
            this.cargarEmpresas();
        }
    }

    abrirModalEstado(empresa: Empresa): void {
        this.empresaSeleccionada.set(empresa);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.empresaSeleccionada.set(null);
    }

    confirmarCambioEstado(): void {
        const empresa = this.empresaSeleccionada();
        if (!empresa) return;

        this.procesando.set(true);
        const nuevoEstado = !empresa.activa;
        this.empresasService.cambiarEstado(empresa.id, nuevoEstado).subscribe({
            next: () => {
                this.procesando.set(false);
                this.toastService.success(
                    `Empresa "${empresa.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`
                );
                this.cerrarModalEstado();
                this.cargarEmpresas();
            },
            error: (err) => {
                this.procesando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cambiar el estado de la empresa';
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

    obtenerEtiquetaTipo(tipo: TipoNegocio): string {
        const encontrado = this.tiposNegocio.find(t => t.valor === tipo);
        return encontrado ? encontrado.etiqueta : tipo;
    }

    obtenerEtiquetaPlan(plan?: PlanSuscripcion): string {
        if (!plan) return 'Sin plan';
        const encontrado = this.planesSuscripcion.find(p => p.valor === plan);
        return encontrado ? encontrado.etiqueta : plan;
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
