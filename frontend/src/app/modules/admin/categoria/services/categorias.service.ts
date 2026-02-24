import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Categoria, CrearCategoriaDto, ActualizarCategoriaDto, RespuestaApi } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class CategoriasService {
    private readonly apiUrl = `${environment.apiUrl}/categorias`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private categorias = signal<Categoria[]>([]);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaCategorias = this.categorias.asReadonly();

    obtenerTodas(): Observable<Categoria[]> {
        this.cargando.set(true);
        return this.http.get<RespuestaApi<Categoria[]>>(this.apiUrl).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.categorias.set(datos);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerArbol(): Observable<Categoria[]> {
        return this.http.get<RespuestaApi<Categoria[]>>(`${this.apiUrl}/arbol`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    obtenerPorId(id: number): Observable<Categoria> {
        return this.http.get<RespuestaApi<Categoria>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    crear(datos: CrearCategoriaDto): Observable<Categoria> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ categoria: Categoria }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos.categoria),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizar(id: number, datos: ActualizarCategoriaDto): Observable<Categoria> {
        this.cargando.set(true);
        return this.http.put<RespuestaApi<{ categoria: Categoria }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.categoria),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    eliminar(id: number): Observable<{ mensaje: string }> {
        return this.http.delete<RespuestaApi<{ mensaje: string }>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }
}
