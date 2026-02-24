import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Marca, CrearMarcaDto, ActualizarMarcaDto, RespuestaApi } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class MarcasService {
    private readonly apiUrl = `${environment.apiUrl}/admin/marcas`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private marcas = signal<Marca[]>([]);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaMarcas = this.marcas.asReadonly();

    obtenerTodas(): Observable<Marca[]> {
        this.cargando.set(true);
        return this.http.get<RespuestaApi<{ datos: Marca[]; total: number }>>(this.apiUrl).pipe(
            map(respuesta => respuesta.datos.datos),
            tap(datos => {
                this.marcas.set(datos);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerPorId(id: number): Observable<Marca> {
        return this.http.get<RespuestaApi<Marca>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }

    crear(datos: CrearMarcaDto): Observable<Marca> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ marca: Marca }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos.marca),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizar(id: number, datos: ActualizarMarcaDto): Observable<Marca> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ marca: Marca }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.marca),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarEstado(id: number, activa: boolean): Observable<Marca> {
        return this.http.patch<RespuestaApi<{ marca: Marca }>>(`${this.apiUrl}/${id}/estado`, { activa }).pipe(
            map(respuesta => respuesta.datos.marca)
        );
    }

    eliminar(id: number): Observable<{ mensaje: string }> {
        return this.http.delete<RespuestaApi<{ mensaje: string }>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos)
        );
    }
}
