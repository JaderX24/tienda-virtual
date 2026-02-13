import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ColaboradoresService } from '../../services';
import { Colaborador, FiltrosColaborador } from '../../interfaces';

@Component({
    selector: 'app-lista-colaboradores',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-colaboradores.component.html',
    styleUrl: './lista-colaboradores.component.scss'
})
export class ListaColaboradoresComponent implements OnInit {
    private colaboradoresService = inject(ColaboradoresService);

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

    tiposContrato = [
        { valor: 'permanente', etiqueta: 'Permanente' },
        { valor: 'temporal', etiqueta: 'Temporal' },
        { valor: 'medio_tiempo', etiqueta: 'Medio Tiempo' },
        { valor: 'practicante', etiqueta: 'Practicante' }
    ];

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
                this.colaboradores.set(this.colaboradoresMock);
                this.totalColaboradores.set(this.colaboradoresMock.length);
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
        const mapa: Record<string, string> = {
            permanente: 'Permanente',
            temporal: 'Temporal',
            medio_tiempo: 'Medio Tiempo',
            practicante: 'Practicante'
        };
        return mapa[tipo] || tipo;
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

    private colaboradoresMock: Colaborador[] = [
        {
            id: 1,
            nombre: 'José Luis',
            apellido: 'Martínez Reyes',
            correo: 'jose.martinez@bodega.tiendavirtual.com',
            telefono: '+504 9876-5432',
            codigoColaborador: 'COL-001',
            cargo: 'Jefe de Bodega',
            fechaIngreso: new Date('2024-03-15'),
            tipoContrato: 'permanente',
            empresaId: 1,
            empresa: { id: 1, nombre: 'TiendaVirtual HN' },
            esActivo: true,
            esVerificado: true,
            requiere2fa: false,
            accesoSoloIpConfiable: false,
            accesoSoloHorarioTurno: true,
            accesoSoloDispositivoRegistrado: false,
            maxSesionesSimultaneas: 1,
            ultimoAcceso: new Date(),
            creadoEn: new Date('2024-03-15'),
            actualizadoEn: new Date()
        },
        {
            id: 2,
            nombre: 'María Elena',
            apellido: 'López Castillo',
            correo: 'maria.lopez@bodega.tiendavirtual.com',
            telefono: '+504 8765-4321',
            codigoColaborador: 'COL-002',
            cargo: 'Operadora de Inventario',
            fechaIngreso: new Date('2024-06-01'),
            tipoContrato: 'permanente',
            empresaId: 1,
            empresa: { id: 1, nombre: 'TiendaVirtual HN' },
            esActivo: true,
            esVerificado: true,
            requiere2fa: false,
            accesoSoloIpConfiable: false,
            accesoSoloHorarioTurno: true,
            accesoSoloDispositivoRegistrado: false,
            maxSesionesSimultaneas: 1,
            ultimoAcceso: new Date('2026-01-28'),
            creadoEn: new Date('2024-06-01'),
            actualizadoEn: new Date()
        },
        {
            id: 3,
            nombre: 'Carlos',
            apellido: 'Hernández Rivera',
            correo: 'carlos.hernandez@bodega.tiendavirtual.com',
            codigoColaborador: 'COL-003',
            cargo: 'Auxiliar de Bodega',
            fechaIngreso: new Date('2025-01-10'),
            tipoContrato: 'temporal',
            empresaId: 1,
            empresa: { id: 1, nombre: 'TiendaVirtual HN' },
            esActivo: true,
            esVerificado: false,
            requiere2fa: false,
            accesoSoloIpConfiable: false,
            accesoSoloHorarioTurno: false,
            accesoSoloDispositivoRegistrado: false,
            maxSesionesSimultaneas: 1,
            ultimoAcceso: new Date('2026-01-27'),
            creadoEn: new Date('2025-01-10'),
            actualizadoEn: new Date()
        },
        {
            id: 4,
            nombre: 'Ana Gabriela',
            apellido: 'Mejía Flores',
            correo: 'ana.mejia@bodega.tiendavirtual.com',
            codigoColaborador: 'COL-004',
            cargo: 'Practicante Logística',
            fechaIngreso: new Date('2025-09-01'),
            tipoContrato: 'practicante',
            empresaId: 1,
            empresa: { id: 1, nombre: 'TiendaVirtual HN' },
            esActivo: false,
            esVerificado: true,
            requiere2fa: false,
            accesoSoloIpConfiable: false,
            accesoSoloHorarioTurno: false,
            accesoSoloDispositivoRegistrado: false,
            maxSesionesSimultaneas: 1,
            motivoInactivacion: 'Finalizó periodo de prácticas',
            creadoEn: new Date('2025-09-01'),
            actualizadoEn: new Date()
        },
        {
            id: 5,
            nombre: 'Roberto',
            apellido: 'Pineda Aguilar',
            correo: 'roberto.pineda@bodega.tiendavirtual.com',
            telefono: '+504 7654-3210',
            codigoColaborador: 'COL-005',
            cargo: 'Despachador',
            fechaIngreso: new Date('2024-11-20'),
            tipoContrato: 'medio_tiempo',
            empresaId: 1,
            empresa: { id: 1, nombre: 'TiendaVirtual HN' },
            esActivo: true,
            esVerificado: true,
            requiere2fa: false,
            accesoSoloIpConfiable: false,
            accesoSoloHorarioTurno: true,
            accesoSoloDispositivoRegistrado: false,
            maxSesionesSimultaneas: 1,
            ultimoAcceso: new Date('2026-01-28'),
            creadoEn: new Date('2024-11-20'),
            actualizadoEn: new Date()
        }
    ];
}
