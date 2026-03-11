import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Rol,
    Permiso,
    PermisoAgrupado,
    PermisoConEstado,
    AsignarPermisosDto,
    RespuestaApi,
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class RolesPermisosService {
    private readonly apiUrlRoles = `${environment.apiUrl}/admin/roles`;
    private readonly apiUrlPermisos = `${environment.apiUrl}/admin/permisos`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private rol = signal<Rol | null>(null);
    private permisosAgrupados = signal<PermisoAgrupado[]>([]);
    private permisosSeleccionados = signal<Set<number>>(new Set());

    readonly estaCargando = this.cargando.asReadonly();
    readonly rolActual = this.rol.asReadonly();
    readonly listaPermisosAgrupados = this.permisosAgrupados.asReadonly();
    readonly seleccionados = this.permisosSeleccionados.asReadonly();

    cargarRolConPermisos(rolId: number): Observable<{ rol: Rol; permisos: PermisoAgrupado[] }> {
        this.cargando.set(true);

        return forkJoin({
            rol: this.http.get<RespuestaApi<Rol>>(`${this.apiUrlRoles}/${rolId}`).pipe(
                map(r => r.datos)
            ),
            todosPermisos: this.http.get<RespuestaApi<Permiso[]>>(this.apiUrlPermisos).pipe(
                map(r => r.datos)
            ),
            permisosRol: this.http.get<RespuestaApi<Permiso[]>>(`${this.apiUrlRoles}/${rolId}/permisos`).pipe(
                map(r => r.datos)
            )
        }).pipe(
            map(({ rol, todosPermisos, permisosRol }) => {
                const idsAsignados = new Set(permisosRol.map(p => p.id));
                this.permisosSeleccionados.set(idsAsignados);

                const agrupados = this.agruparPermisos(todosPermisos, idsAsignados);
                
                this.rol.set(rol);
                this.permisosAgrupados.set(agrupados);
                this.cargando.set(false);

                return { rol, permisos: agrupados };
            })
        );
    }

    private agruparPermisos(permisos: Permiso[], asignados: Set<number>): PermisoAgrupado[] {
        const grupos: Map<string, PermisoConEstado[]> = new Map();

        permisos.forEach(permiso => {
            if (!grupos.has(permiso.modulo)) {
                grupos.set(permiso.modulo, []);
            }
            grupos.get(permiso.modulo)!.push({
                ...permiso,
                asignado: asignados.has(permiso.id)
            });
        });

        return Array.from(grupos.entries())
            .map(([modulo, permisos]) => ({
                modulo,
                nombreModulo: permisos[0]?.nombreModulo || modulo.charAt(0).toUpperCase() + modulo.slice(1),
                permisos: permisos.sort((a, b) => a.nombre.localeCompare(b.nombre))
            }))
            .sort((a, b) => a.nombreModulo.localeCompare(b.nombreModulo));
    }

    togglePermiso(permisoId: number): void {
        const seleccionados = new Set(this.permisosSeleccionados());
        
        if (seleccionados.has(permisoId)) {
            seleccionados.delete(permisoId);
        } else {
            seleccionados.add(permisoId);
        }
        
        this.permisosSeleccionados.set(seleccionados);
        this.actualizarEstadoPermisos();
    }

    toggleModulo(modulo: string): void {
        const grupo = this.permisosAgrupados().find(g => g.modulo === modulo);
        if (!grupo) return;

        const seleccionados = new Set(this.permisosSeleccionados());
        const todosSeleccionados = grupo.permisos.every(p => seleccionados.has(p.id));

        grupo.permisos.forEach(permiso => {
            if (todosSeleccionados) {
                seleccionados.delete(permiso.id);
            } else {
                seleccionados.add(permiso.id);
            }
        });

        this.permisosSeleccionados.set(seleccionados);
        this.actualizarEstadoPermisos();
    }

    seleccionarTodos(): void {
        const todosIds = new Set<number>();
        this.permisosAgrupados().forEach(grupo => {
            grupo.permisos.forEach(permiso => todosIds.add(permiso.id));
        });
        this.permisosSeleccionados.set(todosIds);
        this.actualizarEstadoPermisos();
    }

    deseleccionarTodos(): void {
        this.permisosSeleccionados.set(new Set());
        this.actualizarEstadoPermisos();
    }

    private actualizarEstadoPermisos(): void {
        const seleccionados = this.permisosSeleccionados();
        const agrupados = this.permisosAgrupados().map(grupo => ({
            ...grupo,
            permisos: grupo.permisos.map(permiso => ({
                ...permiso,
                asignado: seleccionados.has(permiso.id)
            }))
        }));
        this.permisosAgrupados.set(agrupados);
    }

    guardarPermisos(rolId: number): Observable<void> {
        const datos: AsignarPermisosDto = {
            permisoIds: Array.from(this.permisosSeleccionados())
        };

        return this.http.post<RespuestaApi<void>>(`${this.apiUrlRoles}/${rolId}/permisos`, datos).pipe(
            map(() => undefined)
        );
    }

    estaSeleccionado(permisoId: number): boolean {
        return this.permisosSeleccionados().has(permisoId);
    }

    moduloCompleto(modulo: string): boolean {
        const grupo = this.permisosAgrupados().find(g => g.modulo === modulo);
        if (!grupo) return false;
        return grupo.permisos.every(p => this.permisosSeleccionados().has(p.id));
    }

    moduloParcial(modulo: string): boolean {
        const grupo = this.permisosAgrupados().find(g => g.modulo === modulo);
        if (!grupo) return false;
        const seleccionados = grupo.permisos.filter(p => this.permisosSeleccionados().has(p.id));
        return seleccionados.length > 0 && seleccionados.length < grupo.permisos.length;
    }

    contarSeleccionados(): number {
        return this.permisosSeleccionados().size;
    }

    contarTotal(): number {
        return this.permisosAgrupados().reduce((acc, g) => acc + g.permisos.length, 0);
    }
}
