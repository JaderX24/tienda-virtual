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
}
