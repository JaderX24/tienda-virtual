import { Injectable, inject, signal, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap, finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthAdminService } from '../../auth/services/auth-admin.service';
import { SeccionMenu } from './menu.config';

@Injectable({
    providedIn: 'root',
})
export class MenuAdminService {
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthAdminService);
    private readonly apiUrl = `${environment.apiUrl}/admin/menu`;

    private readonly menuSecciones = signal<SeccionMenu[]>([]);
    private readonly cargandoMenu = signal(false);
    private readonly errorMenu = signal<string | null>(null);
    private readonly idsExpandidos = signal<Set<string>>(new Set());

    readonly menu = this.menuSecciones.asReadonly();
    readonly estaCargando = this.cargandoMenu.asReadonly();
    readonly error = this.errorMenu.asReadonly();

    constructor() {
        effect(() => {
            const autenticado = this.authService.estaAutenticado();
            this.authService.permisos();

            untracked(() => {
                if (autenticado) {
                    this.cargarMenu();
                } else {
                    this.menuSecciones.set([]);
                    this.idsExpandidos.set(new Set());
                }
            });
        });
    }

    cargarMenu(): void {
        if (this.cargandoMenu()) return;

        this.cargandoMenu.set(true);
        this.errorMenu.set(null);

        this.http.get<{ exito: boolean; datos: SeccionMenu[] }>(this.apiUrl).pipe(
            tap(respuesta => {
                if (respuesta.exito && respuesta.datos) {
                    this.menuSecciones.set(this.restaurarExpandidos(respuesta.datos));
                }
            }),
            catchError(() => {
                this.errorMenu.set('No se pudo cargar el menú');
                return of(null);
            }),
            finalize(() => this.cargandoMenu.set(false)),
        ).subscribe();
    }

    toggleExpandido(id: string): void {
        const expandidos = new Set(this.idsExpandidos());
        if (expandidos.has(id)) {
            expandidos.delete(id);
        } else {
            expandidos.add(id);
        }
        this.idsExpandidos.set(expandidos);
        this.menuSecciones.update((secciones) => this.restaurarExpandidos(secciones));
    }

    estaExpandido(id: string): boolean {
        return this.idsExpandidos().has(id);
    }

    private restaurarExpandidos(secciones: SeccionMenu[]): SeccionMenu[] {
        const expandidos = this.idsExpandidos();
        return secciones.map(seccion => ({
            ...seccion,
            items: seccion.items.map(item => ({
                ...item,
                expandido: expandidos.has(item.id),
                hijos: item.hijos?.map(hijo => ({
                    ...hijo,
                    expandido: expandidos.has(hijo.id),
                })),
            })),
        }));
    }
}
