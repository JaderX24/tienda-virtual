import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColabRolesPermisosService } from '../../services';
import { ToastService } from '../../../../../core/services/toast.service';
import {
    ColabRolPortal,
    ColabRolDetalle,
    ColabModuloConPermisos,
    CrearColabRolPortalDto,
    ActualizarColabRolPortalDto
} from '../../interfaces';

@Component({
    selector: 'app-roles-permisos-colaborador',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './roles-permisos-colaborador.component.html',
    styleUrls: ['./roles-permisos-colaborador.component.scss']
})
export class RolesPermisosColaboradorComponent implements OnInit {
    private rbacService = inject(ColabRolesPermisosService);
    private toastService = inject(ToastService);

    roles = signal<ColabRolPortal[]>([]);
    modulosConPermisos = signal<ColabModuloConPermisos[]>([]);
    cargando = signal(true);
    cargandoDetalle = signal(false);

    // Vista activa: 'roles' o 'permisos'
    vistaActiva = signal<'roles' | 'permisos'>('roles');

    // Modal de rol
    mostrarModalRol = signal(false);
    modoEdicion = signal(false);
    rolEnEdicion = signal<ColabRolDetalle | null>(null);
    procesando = signal(false);

    // Formulario del rol
    formRol = signal<CrearColabRolPortalDto>({
        codigo: '',
        nombre: '',
        descripcion: '',
        nivelJerarquia: 1,
        esSupervisor: false,
        color: '#6c757d'
    });

    // Modal de permisos del rol
    mostrarModalPermisos = signal(false);
    rolParaPermisos = signal<ColabRolPortal | null>(null);
    permisosSeleccionados = signal<Set<number>>(new Set());
    guardandoPermisos = signal(false);

    // Detalle del rol
    mostrarDetalle = signal(false);
    rolDetalle = signal<ColabRolDetalle | null>(null);

    // Paginación
    paginaActual = signal(1);
    limite = signal(10);

    totalRolesActivos = computed(() =>
        this.roles().filter(r => r.esActivo).length
    );

    totalPermisos = computed(() =>
        this.modulosConPermisos().reduce((acc, m) => acc + m.permisos.length, 0)
    );

    totalPaginas = computed(() =>
        Math.ceil(this.roles().length / this.limite())
    );

    rolesPaginados = computed(() => {
        const inicio = (this.paginaActual() - 1) * this.limite();
        return this.roles().slice(inicio, inicio + this.limite());
    });

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.cargando.set(true);
        this.rbacService.obtenerRoles().subscribe({
            next: (roles) => {
                this.roles.set(roles);
                this.cargarModulosPermisos();
            },
            error: () => {
                this.cargando.set(false);
                this.roles.set(this.rolesMock);
                this.toastService.error('Error al cargar los roles');
            }
        });
    }

    cargarModulosPermisos(): void {
        this.rbacService.obtenerPermisosAgrupados().subscribe({
            next: (modulos) => {
                this.modulosConPermisos.set(modulos);
                this.cargando.set(false);
            },
            error: () => {
                this.modulosConPermisos.set(this.modulosMock);
                this.cargando.set(false);
                this.toastService.error('Error al cargar los permisos');
            }
        });
    }

    cambiarVista(vista: 'roles' | 'permisos'): void {
        this.vistaActiva.set(vista);
    }

    // =============================================
    // CRUD DE ROLES
    // =============================================

    abrirModalCrearRol(): void {
        this.modoEdicion.set(false);
        this.rolEnEdicion.set(null);
        this.formRol.set({
            codigo: '',
            nombre: '',
            descripcion: '',
            nivelJerarquia: 1,
            esSupervisor: false,
            color: '#6c757d'
        });
        this.mostrarModalRol.set(true);
    }

    abrirModalEditarRol(rol: ColabRolPortal): void {
        this.modoEdicion.set(true);
        this.cargandoDetalle.set(true);
        this.mostrarModalRol.set(true);

        this.rbacService.obtenerRolPorId(rol.id).subscribe({
            next: (detalle) => {
                this.rolEnEdicion.set(detalle);
                this.formRol.set({
                    codigo: detalle.codigo,
                    nombre: detalle.nombre,
                    descripcion: detalle.descripcion || '',
                    nivelJerarquia: detalle.nivelJerarquia,
                    esSupervisor: detalle.esSupervisor,
                    color: detalle.color || '#6c757d'
                });
                this.cargandoDetalle.set(false);
            },
            error: () => {
                this.cargandoDetalle.set(false);
                this.cerrarModalRol();
                this.toastService.error('Error al cargar el detalle del rol');
            }
        });
    }

    guardarRol(): void {
        const form = this.formRol();
        if (!form.codigo || !form.nombre) return;

        this.procesando.set(true);

        if (this.modoEdicion() && this.rolEnEdicion()) {
            const datos: ActualizarColabRolPortalDto = {
                nombre: form.nombre,
                descripcion: form.descripcion || undefined,
                nivelJerarquia: form.nivelJerarquia,
                esSupervisor: form.esSupervisor,
                color: form.color || undefined
            };

            this.rbacService.actualizarRol(this.rolEnEdicion()!.id, datos).subscribe({
                next: () => {
                    this.procesando.set(false);
                    this.cerrarModalRol();
                    this.cargarDatos();
                    this.toastService.success('Rol actualizado correctamente');
                },
                error: () => {
                    this.procesando.set(false);
                    this.toastService.error('Error al actualizar el rol');
                }
            });
        } else {
            this.rbacService.crearRol(form).subscribe({
                next: () => {
                    this.procesando.set(false);
                    this.cerrarModalRol();
                    this.cargarDatos();
                    this.toastService.success('Rol creado correctamente');
                },
                error: () => {
                    this.procesando.set(false);
                    this.toastService.error('Error al crear el rol');
                }
            });
        }
    }

    cerrarModalRol(): void {
        this.mostrarModalRol.set(false);
        this.rolEnEdicion.set(null);
        this.modoEdicion.set(false);
    }

    toggleEstadoRol(rol: ColabRolPortal): void {
        const nuevoEstado = !rol.esActivo;
        this.rbacService.actualizarRol(rol.id, { esActivo: nuevoEstado }).subscribe({
            next: () => {
                this.cargarDatos();
                this.toastService.success(
                    nuevoEstado ? `Rol "${rol.nombre}" activado correctamente` : `Rol "${rol.nombre}" desactivado correctamente`
                );
            },
            error: () => {
                this.toastService.error('Error al cambiar el estado del rol');
            }
        });
    }

    // =============================================
    // DETALLE DE ROL
    // =============================================

    verDetalleRol(rol: ColabRolPortal): void {
        this.cargandoDetalle.set(true);
        this.mostrarDetalle.set(true);

        this.rbacService.obtenerRolPorId(rol.id).subscribe({
            next: (detalle) => {
                this.rolDetalle.set(detalle);
                this.cargandoDetalle.set(false);
            },
            error: () => {
                this.cargandoDetalle.set(false);
                this.mostrarDetalle.set(false);
                this.toastService.error('Error al cargar el detalle del rol');
            }
        });
    }

    cerrarDetalle(): void {
        this.mostrarDetalle.set(false);
        this.rolDetalle.set(null);
    }

    // =============================================
    // ASIGNACIÓN DE PERMISOS A ROL
    // =============================================

    abrirModalPermisos(rol: ColabRolPortal): void {
        this.rolParaPermisos.set(rol);
        this.guardandoPermisos.set(false);
        this.permisosSeleccionados.set(new Set());
        this.mostrarModalPermisos.set(true);

        this.rbacService.obtenerPermisosDeRol(rol.id).subscribe({
            next: (permisos) => {
                const ids = new Set(permisos.map((p: any) => p.permiso?.id || p.id));
                this.permisosSeleccionados.set(ids);
            }
        });
    }

    togglePermiso(permisoId: number): void {
        const actuales = new Set(this.permisosSeleccionados());
        if (actuales.has(permisoId)) {
            actuales.delete(permisoId);
        } else {
            actuales.add(permisoId);
        }
        this.permisosSeleccionados.set(actuales);
    }

    toggleTodosModulo(modulo: ColabModuloConPermisos): void {
        const actuales = new Set(this.permisosSeleccionados());
        const idsModulo = modulo.permisos.map(p => p.id);
        const todosSeleccionados = idsModulo.every(id => actuales.has(id));

        if (todosSeleccionados) {
            idsModulo.forEach(id => actuales.delete(id));
        } else {
            idsModulo.forEach(id => actuales.add(id));
        }
        this.permisosSeleccionados.set(actuales);
    }

    todosModuloSeleccionados(modulo: ColabModuloConPermisos): boolean {
        const actuales = this.permisosSeleccionados();
        return modulo.permisos.every(p => actuales.has(p.id));
    }

    algunosModuloSeleccionados(modulo: ColabModuloConPermisos): boolean {
        const actuales = this.permisosSeleccionados();
        const seleccionados = modulo.permisos.filter(p => actuales.has(p.id)).length;
        return seleccionados > 0 && seleccionados < modulo.permisos.length;
    }

    guardarPermisos(): void {
        const rol = this.rolParaPermisos();
        if (!rol) return;

        this.guardandoPermisos.set(true);
        const ids = Array.from(this.permisosSeleccionados());

        this.rbacService.asignarPermisosARol(rol.id, ids).subscribe({
            next: () => {
                this.guardandoPermisos.set(false);
                this.mostrarModalPermisos.set(false);
                this.cargarDatos();
                this.toastService.success(`Permisos del rol "${rol.nombre}" actualizados correctamente`);
            },
            error: () => {
                this.guardandoPermisos.set(false);
                this.toastService.error('Error al guardar los permisos');
            }
        });
    }

    cerrarModalPermisos(): void {
        this.mostrarModalPermisos.set(false);
        this.rolParaPermisos.set(null);
    }

    // =============================================
    // HELPERS
    // =============================================

    obtenerColorBadge(color?: string): string {
        return color || '#6c757d';
    }

    rolesSuma = (acc: number, r: ColabRolPortal) => acc + r._count.usuariosRoles;

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
        }
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

    contarPermisosSeleccionadosModulo(modulo: ColabModuloConPermisos): number {
        const actuales = this.permisosSeleccionados();
        return modulo.permisos.filter(p => actuales.has(p.id)).length;
    }

    obtenerIconoAccion(accion: string): string {
        const iconos: Record<string, string> = {
            'ver': 'bi-eye',
            'crear': 'bi-plus-circle',
            'editar': 'bi-pencil',
            'eliminar': 'bi-trash',
            'aprobar': 'bi-check-circle',
            'exportar': 'bi-download',
            'gestionar': 'bi-gear'
        };
        return iconos[accion] || 'bi-circle';
    }

    obtenerEtiquetaAccion(accion: string): string {
        const etiquetas: Record<string, string> = {
            'ver': 'Ver',
            'crear': 'Crear',
            'editar': 'Editar',
            'eliminar': 'Eliminar',
            'aprobar': 'Aprobar',
            'exportar': 'Exportar',
            'gestionar': 'Gestionar'
        };
        return etiquetas[accion] || accion;
    }

    actualizarFormRol(campo: string, valor: any): void {
        this.formRol.update(form => ({ ...form, [campo]: valor }));
    }

    // Datos mock para desarrollo
    private rolesMock: ColabRolPortal[] = [
        {
            id: 1, codigo: 'jefe_bodega', nombre: 'Jefe de Bodega',
            descripcion: 'Responsable principal del almacén', nivelJerarquia: 100,
            esSupervisor: true, color: '#dc3545', esActivo: true,
            creadoEn: '2026-01-15', _count: { usuariosRoles: 2, rolesPermisos: 25 }
        },
        {
            id: 2, codigo: 'supervisor', nombre: 'Supervisor',
            descripcion: 'Supervisa operaciones del almacén', nivelJerarquia: 80,
            esSupervisor: true, color: '#fd7e14', esActivo: true,
            creadoEn: '2026-01-15', _count: { usuariosRoles: 3, rolesPermisos: 20 }
        },
        {
            id: 3, codigo: 'inventarista', nombre: 'Inventarista',
            descripcion: 'Gestiona el inventario', nivelJerarquia: 60,
            esSupervisor: false, color: '#0d6efd', esActivo: true,
            creadoEn: '2026-01-15', _count: { usuariosRoles: 5, rolesPermisos: 15 }
        },
        {
            id: 4, codigo: 'recepcionista', nombre: 'Recepcionista',
            descripcion: 'Recibe mercadería entrante', nivelJerarquia: 50,
            esSupervisor: false, color: '#198754', esActivo: true,
            creadoEn: '2026-01-15', _count: { usuariosRoles: 4, rolesPermisos: 10 }
        },
        {
            id: 5, codigo: 'despachador', nombre: 'Despachador',
            descripcion: 'Despacha pedidos', nivelJerarquia: 50,
            esSupervisor: false, color: '#6f42c1', esActivo: true,
            creadoEn: '2026-01-15', _count: { usuariosRoles: 3, rolesPermisos: 10 }
        },
        {
            id: 6, codigo: 'consulta', nombre: 'Solo Consulta',
            descripcion: 'Acceso de solo lectura', nivelJerarquia: 10,
            esSupervisor: false, color: '#6c757d', esActivo: true,
            creadoEn: '2026-01-15', _count: { usuariosRoles: 1, rolesPermisos: 5 }
        }
    ];

    private modulosMock: ColabModuloConPermisos[] = [
        {
            id: 1, codigo: 'colab_dashboard', nombre: 'Dashboard', icono: 'bi-speedometer2', orden: 1,
            permisos: [
                { id: 1, codigo: 'colab_dashboard.ver', nombre: 'Ver Dashboard', accion: 'ver' }
            ]
        },
        {
            id: 2, codigo: 'colab_inventario', nombre: 'Inventario', icono: 'bi-boxes', orden: 3,
            permisos: [
                { id: 2, codigo: 'colab_inventario.ver', nombre: 'Ver Inventario', accion: 'ver' },
                { id: 3, codigo: 'colab_inventario.editar', nombre: 'Editar Inventario', accion: 'editar' }
            ]
        },
        {
            id: 3, codigo: 'colab_entradas', nombre: 'Entradas', icono: 'bi-box-arrow-in-down', orden: 4,
            permisos: [
                { id: 4, codigo: 'colab_entradas.ver', nombre: 'Ver Entradas', accion: 'ver' },
                { id: 5, codigo: 'colab_entradas.crear', nombre: 'Crear Entradas', accion: 'crear' },
                { id: 6, codigo: 'colab_entradas.aprobar', nombre: 'Aprobar Entradas', accion: 'aprobar' }
            ]
        },
        {
            id: 4, codigo: 'colab_conteos', nombre: 'Conteos', icono: 'bi-clipboard-check', orden: 7,
            permisos: [
                { id: 7, codigo: 'colab_conteos.ver', nombre: 'Ver Conteos', accion: 'ver' },
                { id: 8, codigo: 'colab_conteos.crear', nombre: 'Crear Conteos', accion: 'crear' },
                { id: 9, codigo: 'colab_conteos.aprobar', nombre: 'Aprobar Conteos', accion: 'aprobar' }
            ]
        }
    ];
}
