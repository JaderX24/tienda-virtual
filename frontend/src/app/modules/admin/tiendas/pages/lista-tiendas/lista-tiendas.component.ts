import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TiendasService } from '../../services';
import { 
    Tienda, 
    FiltrosTienda, 
    TipoNegocioTienda, 
    TipoTienda, 
    PlanSuscripcionTienda, 
    EstadoTienda 
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

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

    // Señales para el estado del componente
    tiendas = signal<Tienda[]>([]);
    cargando = signal(true);
    errorCarga = signal<string | null>(null);

    // Señales para filtros
    busqueda = signal('');
    tipoNegocioSeleccionado = signal<TipoNegocioTienda | null>(null);
    tipoTiendaSeleccionado = signal<TipoTienda | null>(null);
    estadoSeleccionado = signal<EstadoTienda | null>(null);
    planSeleccionado = signal<PlanSuscripcionTienda | null>(null);
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

    // Opciones estáticas para selects
    tiposNegocio = [
        { valor: TipoNegocioTienda.TIENDA_ROPA, etiqueta: 'Tienda de Ropa' },
        { valor: TipoNegocioTienda.RESTAURANTE, etiqueta: 'Restaurante' },
        { valor: TipoNegocioTienda.SUPERMERCADO, etiqueta: 'Supermercado' },
        { valor: TipoNegocioTienda.FARMACIA, etiqueta: 'Farmacia' },
        { valor: TipoNegocioTienda.TECNOLOGIA, etiqueta: 'Tecnología' },
        { valor: TipoNegocioTienda.FERRETERIA, etiqueta: 'Ferretería' },
        { valor: TipoNegocioTienda.LIBRERIA, etiqueta: 'Librería' },
        { valor: TipoNegocioTienda.SERVICIOS, etiqueta: 'Servicios' },
        { valor: TipoNegocioTienda.MAYORISTA, etiqueta: 'Mayorista' },
        { valor: TipoNegocioTienda.OTRO, etiqueta: 'Otro' }
    ];

    tiposTienda = [
        { valor: TipoTienda.TIENDA_FISICA, etiqueta: 'Tienda Física' },
        { valor: TipoTienda.TIENDA_VIRTUAL, etiqueta: 'Tienda Virtual' },
        { valor: TipoTienda.TIENDA_HIBRIDA, etiqueta: 'Tienda Híbrida' },
        { valor: TipoTienda.QUIOSCO, etiqueta: 'Quiosco' },
        { valor: TipoTienda.SUCURSAL, etiqueta: 'Sucursal' },
        { valor: TipoTienda.FRANQUICIA, etiqueta: 'Franquicia' },
        { valor: TipoTienda.POPUP_STORE, etiqueta: 'Pop-up Store' },
        { valor: TipoTienda.OUTLET, etiqueta: 'Outlet' }
    ];

    planesSuscripcion = [
        { valor: PlanSuscripcionTienda.BASICO, etiqueta: 'Básico' },
        { valor: PlanSuscripcionTienda.PROFESIONAL, etiqueta: 'Profesional' },
        { valor: PlanSuscripcionTienda.EMPRESARIAL, etiqueta: 'Empresarial' },
        { valor: PlanSuscripcionTienda.PREMIUM, etiqueta: 'Premium' }
    ];

    estadosTienda = [
        { valor: EstadoTienda.ACTIVA, etiqueta: 'Activa' },
        { valor: EstadoTienda.INACTIVA, etiqueta: 'Inactiva' },
        { valor: EstadoTienda.EN_CONSTRUCCION, etiqueta: 'En Construcción' },
        { valor: EstadoTienda.MANTENIMIENTO, etiqueta: 'Mantenimiento' },
        { valor: EstadoTienda.CERRADA_TEMPORAL, etiqueta: 'Cerrada Temporal' }
    ];

    departamentos = [
        'Francisco Morazán', 'Cortés', 'Atlántida', 'Choluteca', 'Comayagua',
        'Copán', 'El Paraíso', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía',
        'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara',
        'Valle', 'Yoro', 'Colon'
    ];

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

    obtenerEtiquetaTipoNegocio(tipo: TipoNegocioTienda): string {
        return this.tiendasService.obtenerTipoNegocioTexto(tipo);
    }

    obtenerEtiquetaTipoTienda(tipo?: TipoTienda): string {
        if (!tipo) return 'No especificado';
        const encontrado = this.tiposTienda.find(t => t.valor === tipo);
        return encontrado ? encontrado.etiqueta : tipo;
    }

    obtenerEtiquetaPlan(plan: PlanSuscripcionTienda): string {
        return this.tiendasService.obtenerPlanTexto(plan);
    }

    obtenerEtiquetaEstado(estado: EstadoTienda): string {
        return this.tiendasService.obtenerEstadoTexto(estado);
    }

    obtenerClasesEstado(estado: EstadoTienda): string[] {
        const clases = ['badge-estado'];
        switch (estado) {
            case EstadoTienda.ACTIVA:
                clases.push('activo');
                break;
            case EstadoTienda.INACTIVA:
                clases.push('inactivo');
                break;
            case EstadoTienda.EN_CONSTRUCCION:
                clases.push('construccion');
                break;
            case EstadoTienda.MANTENIMIENTO:
                clases.push('mantenimiento');
                break;
            case EstadoTienda.CERRADA_TEMPORAL:
                clases.push('cerrada');
                break;
            default:
                clases.push('inactivo');
        }
        return clases;
    }

    obtenerIconoEstado(estado: EstadoTienda): string {
        switch (estado) {
            case EstadoTienda.ACTIVA:
                return 'bi-check-circle-fill';
            case EstadoTienda.INACTIVA:
                return 'bi-x-circle-fill';
            case EstadoTienda.EN_CONSTRUCCION:
                return 'bi-tools';
            case EstadoTienda.MANTENIMIENTO:
                return 'bi-gear-fill';
            case EstadoTienda.CERRADA_TEMPORAL:
                return 'bi-pause-circle-fill';
            default:
                return 'bi-question-circle-fill';
        }
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

    // Mock de datos para desarrollo - se puede remover cuando esté el backend
    private tiendasMock: Tienda[] = [
        {
            id: 1,
            nombre: 'Boutique Eleganza',
            rtn: '0801-2024-001001',
            correo: 'info@eleganza.hn',
            telefono: '2233-4455',
            celular: '9988-7766',
            tipoNegocio: TipoNegocioTienda.TIENDA_ROPA,
            tipoTienda: TipoTienda.TIENDA_FISICA,
            estado: EstadoTienda.ACTIVA,
            ubicacion: {
                direccion: 'CC City Mall, Local 201',
                departamento: 'Francisco Morazán',
                ciudad: 'Tegucigalpa',
                pais: 'HN'
            },
            planSuscripcion: PlanSuscripcionTienda.PROFESIONAL,
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            activa: true,
            creadoEn: '2024-01-15T10:00:00Z',
            actualizadoEn: '2024-01-15T10:00:00Z'
        },
        {
            id: 2,
            nombre: 'TecnoPlaza',
            rtn: '0501-2024-002002',
            correo: 'ventas@tecnoplaza.hn',
            telefono: '2255-6677',
            tipoNegocio: TipoNegocioTienda.TECNOLOGIA,
            tipoTienda: TipoTienda.TIENDA_HIBRIDA,
            estado: EstadoTienda.ACTIVA,
            ubicacion: {
                direccion: 'Boulevard Los Próceres',
                departamento: 'Cortés',
                ciudad: 'San Pedro Sula',
                pais: 'HN'
            },
            planSuscripcion: PlanSuscripcionTienda.EMPRESARIAL,
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            activa: true,
            creadoEn: '2024-03-20T14:30:00Z',
            actualizadoEn: '2024-03-20T14:30:00Z'
        },
        {
            id: 3,
            nombre: 'Farmacia Salud Total',
            rtn: '0801-2024-003003',
            correo: 'farmacia@saludtotal.hn',
            telefono: '2244-5566',
            tipoNegocio: TipoNegocioTienda.FARMACIA,
            tipoTienda: TipoTienda.SUCURSAL,
            estado: EstadoTienda.EN_CONSTRUCCION,
            ubicacion: {
                direccion: 'Col. Kennedy, 3ra Ave',
                departamento: 'Atlántida',
                ciudad: 'La Ceiba',
                pais: 'HN'
            },
            planSuscripcion: PlanSuscripcionTienda.BASICO,
            moneda: 'HNL',
            zonaHoraria: 'America/Tegucigalpa',
            activa: false,
            creadoEn: '2024-06-10T09:15:00Z',
            actualizadoEn: '2024-06-10T09:15:00Z'
        }
    ];
}