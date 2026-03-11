import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ParametroSistema, ActualizarParametroDto } from '../interfaces';

interface RespuestaBackend {
    exito: boolean;
    datos: {
        mensaje: string;
        datos: unknown;
    };
}

function extraerDatos<T>(respuesta: RespuestaBackend): T {
    return respuesta.datos?.datos as T;
}

@Injectable({
    providedIn: 'root'
})
export class ParametrosMantenimientoService {
    private readonly apiUrl = `${environment.apiUrl}/admin/parametros`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private parametros = signal<ParametroSistema[]>([]);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaParametros = this.parametros.asReadonly();

    obtenerParametros(categoria?: string): Observable<ParametroSistema[]> {
        this.cargando.set(true);

        let url = this.apiUrl;
        if (categoria) {
            url += `?categoria=${categoria}`;
        }

        return this.http.get<RespuestaBackend>(url).pipe(
            map(respuesta => extraerDatos<ParametroSistema[]>(respuesta) || []),
            tap(params => {
                this.parametros.set(Array.isArray(params) ? params : []);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerParametroPorId(id: number): Observable<ParametroSistema> {
        return this.http.get<RespuestaBackend>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => extraerDatos<ParametroSistema>(respuesta))
        );
    }

    obtenerParametroPorClave(clave: string): Observable<ParametroSistema> {
        return this.http.get<RespuestaBackend>(`${this.apiUrl}/clave/${clave}`).pipe(
            map(respuesta => extraerDatos<ParametroSistema>(respuesta))
        );
    }

    actualizarParametro(id: number, datos: ActualizarParametroDto): Observable<ParametroSistema> {
        this.cargando.set(true);

        return this.http.patch<RespuestaBackend>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => extraerDatos<ParametroSistema>(respuesta)),
            tap(param => {
                this.parametros.update(lista =>
                    lista.map(p => p.id === id ? param : p)
                );
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerParametrosPorCategoria(categoria: string): ParametroSistema[] {
        return this.parametros().filter(p => p.categoria === categoria);
    }
}
