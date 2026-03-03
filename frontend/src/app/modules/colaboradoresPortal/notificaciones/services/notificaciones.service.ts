import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// --- Interfaces ---

export interface Notificacion {
    id: string;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'success' | 'warning' | 'danger' | 'sistema';
    prioridad: string;
    icono: string;
    urlAccion: string | null;
    textoAccion: string | null;
    leida: boolean;
    leidaEn: string | null;
    archivada: boolean;
    fecha: string;
}

export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface FiltrosNotificaciones {
    tipo?: string;
    leida?: boolean;
    archivada?: boolean;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}

export interface RespuestaListado {
    exito: boolean;
    datos: Notificacion[];
    paginacion: Paginacion;
}

export interface RespuestaRecientes {
    exito: boolean;
    datos: {
        notificaciones: Notificacion[];
        totalSinLeer: number;
    };
}

export interface RespuestaContador {
    exito: boolean;
    datos: { totalSinLeer: number };
}

export interface RespuestaAccion {
    exito: boolean;
    mensaje: string;
    datos?: { actualizadas?: number; archivadas?: number };
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
    private readonly urlBase = `${environment.apiUrl}/colaborador/notificaciones`;

    private contadorSubject = new BehaviorSubject<number>(0);
    contador$ = this.contadorSubject.asObservable();

    constructor(private http: HttpClient) {}

    // Obtener listado paginado para la página completa
    obtenerNotificaciones(filtros: FiltrosNotificaciones): Observable<RespuestaListado> {
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaListado>(this.urlBase, { params });
    }

    // Obtener las más recientes para el dropdown
    obtenerRecientes(): Observable<RespuestaRecientes> {
        return this.http.get<RespuestaRecientes>(`${this.urlBase}/recientes`).pipe(
            tap((resp) => {
                if (resp.exito) this.contadorSubject.next(resp.datos.totalSinLeer);
            }),
        );
    }

    // Solo el contador
    actualizarContador(): void {
        this.http.get<RespuestaContador>(`${this.urlBase}/contador`).subscribe({
            next: (resp) => {
                if (resp.exito) this.contadorSubject.next(resp.datos.totalSinLeer);
            },
        });
    }

    // Marcar una como leída
    marcarComoLeida(id: string): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/${id}/leer`, {}).pipe(
            tap(() => this.decrementarContador()),
        );
    }

    // Marcar todas como leídas
    marcarTodasComoLeidas(): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/marcar-todas-leidas`, {}).pipe(
            tap(() => this.contadorSubject.next(0)),
        );
    }

    // Marcar seleccionadas como leídas
    marcarSeleccionadasComoLeidas(ids: string[]): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/marcar-leidas`, { ids });
    }

    // Archivar una
    archivarNotificacion(id: string): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/${id}/archivar`, {});
    }

    // Archivar todas las leídas
    archivarTodasLeidas(): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/archivar-leidas`, {});
    }

    // Eliminar una
    eliminarNotificacion(id: string): Observable<RespuestaAccion> {
        return this.http.delete<RespuestaAccion>(`${this.urlBase}/${id}`);
    }

    // Actualizar el valor del contador directamente
    establecerContador(valor: number): void {
        this.contadorSubject.next(valor);
    }

    private decrementarContador(): void {
        const actual = this.contadorSubject.value;
        if (actual > 0) this.contadorSubject.next(actual - 1);
    }

    private construirParams(filtros: Record<string, any>): HttpParams {
        let params = new HttpParams();
        for (const clave of Object.keys(filtros)) {
            if (filtros[clave] !== undefined && filtros[clave] !== null && filtros[clave] !== '') {
                params = params.set(clave, filtros[clave].toString());
            }
        }
        return params;
    }
}
