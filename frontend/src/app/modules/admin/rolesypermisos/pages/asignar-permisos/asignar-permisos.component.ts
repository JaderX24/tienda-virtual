import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RolesPermisosService } from '../../services';
import { Rol, PermisoAgrupado } from '../../interfaces';
import { ToastService } from '../../../../../core/services';

@Component({
    selector: 'app-asignar-permisos',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './asignar-permisos.component.html',
    styleUrls: ['./asignar-permisos.component.scss']
})
export class AsignarPermisosComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    readonly rolesPermisosService = inject(RolesPermisosService);
    private readonly toastService = inject(ToastService);

    readonly estaCargando = this.rolesPermisosService.estaCargando;
    readonly rol = this.rolesPermisosService.rolActual;
    readonly permisosAgrupados = this.rolesPermisosService.listaPermisosAgrupados;

    guardando = signal(false);
    modulosExpandidos = signal<Set<string>>(new Set());
    busqueda = signal('');

    ngOnInit(): void {
        const rolId = Number(this.route.snapshot.paramMap.get('id'));
        if (rolId) {
            this.cargarDatos(rolId);
        } else {
            this.router.navigate(['/admin/roles']);
        }
    }

    private cargarDatos(rolId: number): void {
        this.rolesPermisosService.cargarRolConPermisos(rolId).subscribe({
            next: () => {
                const todosModulos = new Set(
                    this.permisosAgrupados().map(g => g.modulo)
                );
                this.modulosExpandidos.set(todosModulos);
            },
            error: () => {
                this.toastService.error('Error al cargar los permisos del rol');
                this.router.navigate(['/admin/roles']);
            }
        });
    }

    toggleModuloExpandido(modulo: string): void {
        const expandidos = new Set(this.modulosExpandidos());
        if (expandidos.has(modulo)) {
            expandidos.delete(modulo);
        } else {
            expandidos.add(modulo);
        }
        this.modulosExpandidos.set(expandidos);
    }

    estaExpandido(modulo: string): boolean {
        return this.modulosExpandidos().has(modulo);
    }

    togglePermiso(permisoId: number): void {
        this.rolesPermisosService.togglePermiso(permisoId);
    }

    toggleModulo(modulo: string): void {
        this.rolesPermisosService.toggleModulo(modulo);
    }

    seleccionarTodos(): void {
        this.rolesPermisosService.seleccionarTodos();
    }

    deseleccionarTodos(): void {
        this.rolesPermisosService.deseleccionarTodos();
    }

    estaSeleccionado(permisoId: number): boolean {
        return this.rolesPermisosService.estaSeleccionado(permisoId);
    }

    moduloCompleto(modulo: string): boolean {
        return this.rolesPermisosService.moduloCompleto(modulo);
    }

    moduloParcial(modulo: string): boolean {
        return this.rolesPermisosService.moduloParcial(modulo);
    }

    get contadorSeleccionados(): string {
        return `${this.rolesPermisosService.contarSeleccionados()} de ${this.rolesPermisosService.contarTotal()}`;
    }

    get permisosFiltrados(): PermisoAgrupado[] {
        const termino = this.busqueda().toLowerCase().trim();
        if (!termino) return this.permisosAgrupados();

        return this.permisosAgrupados()
            .map(grupo => ({
                ...grupo,
                permisos: grupo.permisos.filter(p =>
                    p.nombre.toLowerCase().includes(termino) ||
                    p.descripcion?.toLowerCase().includes(termino) ||
                    grupo.nombreModulo.toLowerCase().includes(termino)
                )
            }))
            .filter(grupo => grupo.permisos.length > 0);
    }

    guardar(): void {
        const rolActual = this.rol();
        if (!rolActual) return;

        this.guardando.set(true);
        this.rolesPermisosService.guardarPermisos(rolActual.id).subscribe({
            next: () => {
                this.toastService.success('Permisos actualizados correctamente');
                this.guardando.set(false);
                this.router.navigate(['/admin/roles']);
            },
            error: () => {
                this.toastService.error('Error al guardar los permisos');
                this.guardando.set(false);
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/admin/roles']);
    }
}
