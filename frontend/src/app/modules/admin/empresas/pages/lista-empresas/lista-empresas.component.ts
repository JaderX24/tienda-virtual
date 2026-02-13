import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmpresasService } from '../../services';
import { Empresa, FiltrosEmpresa, TipoNegocio, PlanSuscripcion } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

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

    tiposNegocio = [
        { valor: TipoNegocio.TIENDA_ROPA, etiqueta: 'Tienda de Ropa' },
        { valor: TipoNegocio.RESTAURANTE, etiqueta: 'Restaurante' },
        { valor: TipoNegocio.SUPERMERCADO, etiqueta: 'Supermercado' },
        { valor: TipoNegocio.FARMACIA, etiqueta: 'Farmacia' },
        { valor: TipoNegocio.TECNOLOGIA, etiqueta: 'Tecnologia' },
        { valor: TipoNegocio.FERRETERIA, etiqueta: 'Ferreteria' },
        { valor: TipoNegocio.LIBRERIA, etiqueta: 'Libreria' },
        { valor: TipoNegocio.SERVICIOS, etiqueta: 'Servicios' },
        { valor: TipoNegocio.MAYORISTA, etiqueta: 'Mayorista' },
        { valor: TipoNegocio.OTRO, etiqueta: 'Otro' }
    ];

    planesSuscripcion = [
        { valor: PlanSuscripcion.BASICO, etiqueta: 'Basico' },
        { valor: PlanSuscripcion.PROFESIONAL, etiqueta: 'Profesional' },
        { valor: PlanSuscripcion.EMPRESARIAL, etiqueta: 'Empresarial' },
        { valor: PlanSuscripcion.PREMIUM, etiqueta: 'Premium' }
    ];

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

    private empresasMock: Empresa[] = [
        {
            id: 1, nombre: 'Supermercados La Colonia', rtn: '0801-1990-000001',
            correo: 'admin@lacolonia.hn', telefono: '+504 2233-4455',
            tipoNegocio: TipoNegocio.SUPERMERCADO, planSuscripcion: PlanSuscripcion.EMPRESARIAL,
            representanteLegal: 'Carlos Eduardo Mendoza', activa: true,
            departamento: 'Francisco Morazan', ciudad: 'Tegucigalpa', pais: 'HN',
            creadoEn: new Date('2024-01-15'), actualizadoEn: new Date()
        },
        {
            id: 2, nombre: 'Boutique Eleganza', rtn: '0801-2000-000002',
            correo: 'info@eleganza.hn', telefono: '+504 9988-7766',
            tipoNegocio: TipoNegocio.TIENDA_ROPA, planSuscripcion: PlanSuscripcion.PROFESIONAL,
            representanteLegal: 'Maria Fernanda Lopez', activa: true,
            departamento: 'Cortes', ciudad: 'San Pedro Sula', pais: 'HN',
            creadoEn: new Date('2024-03-20'), actualizadoEn: new Date()
        },
        {
            id: 3, nombre: 'TecnoShop Honduras', rtn: '0501-1995-000003',
            correo: 'ventas@tecnoshop.hn', telefono: '+504 2255-6677',
            tipoNegocio: TipoNegocio.TECNOLOGIA, planSuscripcion: PlanSuscripcion.PREMIUM,
            representanteLegal: 'Roberto Andres Martinez', activa: true,
            departamento: 'Francisco Morazan', ciudad: 'Tegucigalpa', pais: 'HN',
            creadoEn: new Date('2024-06-10'), actualizadoEn: new Date()
        },
        {
            id: 4, nombre: 'Farmacia San Rafael', rtn: '0801-1988-000004',
            correo: 'farmacia@sanrafael.hn', telefono: '+504 2244-5566',
            tipoNegocio: TipoNegocio.FARMACIA, planSuscripcion: PlanSuscripcion.BASICO,
            representanteLegal: 'Ana Patricia Hernandez', activa: false,
            departamento: 'Atlantida', ciudad: 'La Ceiba', pais: 'HN',
            creadoEn: new Date('2024-08-05'), actualizadoEn: new Date()
        },
        {
            id: 5, nombre: 'Restaurante El Patio', rtn: '0801-2010-000005',
            correo: 'contacto@elpatio.hn', telefono: '+504 9977-8899',
            tipoNegocio: TipoNegocio.RESTAURANTE, planSuscripcion: PlanSuscripcion.PROFESIONAL,
            representanteLegal: 'Jorge Luis Pineda', activa: true,
            departamento: 'Comayagua', ciudad: 'Comayagua', pais: 'HN',
            creadoEn: new Date('2025-01-12'), actualizadoEn: new Date()
        },
        {
            id: 6, nombre: 'Ferreteria El Constructor', rtn: '0501-2005-000006',
            correo: 'ventas@elconstructor.hn', telefono: '+504 2266-7788',
            tipoNegocio: TipoNegocio.FERRETERIA, planSuscripcion: PlanSuscripcion.EMPRESARIAL,
            representanteLegal: 'Laura Cristina Ramos', activa: true,
            departamento: 'Cortes', ciudad: 'San Pedro Sula', pais: 'HN',
            creadoEn: new Date('2025-02-18'), actualizadoEn: new Date()
        }
    ];
}
