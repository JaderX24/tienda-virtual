import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface OpcionCatalogo {
    valor: string;
    etiqueta: string;
    descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class OpcionesCatalogoService {
    private http = inject(HttpClient);
    private cache = new Map<string, OpcionCatalogo[]>();
    private cargando = false;
    private cargado = false;

    obtenerGrupo(grupo: string): OpcionCatalogo[] {
        if (!this.cargado && !this.cargando) this.cargarTodos();
        return this.cache.get(grupo) ?? [];
    }

    private cargarTodos(): void {
        this.cargando = true;
        this.http.get<Record<string, OpcionCatalogo[]>>(`${environment.apiUrl}/admin/opciones`)
            .subscribe({
                next: (datos) => {
                    for (const [grupo, opciones] of Object.entries(datos)) {
                        this.cache.set(
                            grupo,
                            opciones.map(o => ({ valor: o.valor, etiqueta: o.etiqueta, descripcion: o.descripcion })),
                        );
                    }
                    this.cargado = true;
                    this.cargando = false;
                },
                error: () => { this.cargando = false; },
            });
    }

    recargar(): void {
        this.cache.clear();
        this.cargado = false;
        this.cargando = false;
        this.cargarTodos();
    }
}
