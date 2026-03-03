import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface TarjetaResumen {
    titulo: string;
    valor: string | number;
    icono: string;
    color: string;
    tendencia?: string;
    tendenciaPositiva?: boolean;
}

export interface ActividadReciente {
    id: string;
    descripcion: string;
    hora: string;
    fecha: string;
    icono: string;
    color: string;
    tipo: string;
    producto: string;
    almacen: string;
    cantidad: number;
}

export interface TareaDia {
    id: string;
    tarea: string;
    tipo: 'turno' | 'conteo';
    completada: boolean;
    estado: string;
}

export interface TurnoActual {
    id: number;
    almacen: string;
    codigoAlmacen: string;
    estado: string;
    horaInicio: string;
    horaFin: string;
    horaEntrada: string | null;
    horaSalida: string | null;
}

export interface NotificacionColab {
    id: string;
    titulo: string;
    mensaje: string;
    tipo: string;
    prioridad: string;
    leida: boolean;
    urlAccion: string | null;
    creadoEn: string;
}

interface RespuestaResumen {
    exito: boolean;
    datos: { tarjetas: TarjetaResumen[] };
}

interface RespuestaActividad {
    exito: boolean;
    datos: ActividadReciente[];
}

interface RespuestaTareas {
    exito: boolean;
    datos: TareaDia[];
}

interface RespuestaTurno {
    exito: boolean;
    datos: TurnoActual | null;
    mensaje?: string;
}

interface RespuestaNotificaciones {
    exito: boolean;
    datos: {
        notificaciones: NotificacionColab[];
        sinLeer: number;
    };
}

@Injectable({
    providedIn: 'root',
})
export class DashboardColaboradorService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/dashboard`;

    cargandoResumen = signal(false);
    cargandoActividad = signal(false);
    cargandoTareas = signal(false);

    constructor(private http: HttpClient) {}

    obtenerResumen(): Observable<RespuestaResumen> {
        this.cargandoResumen.set(true);
        return this.http.get<RespuestaResumen>(`${this.apiUrl}/resumen`).pipe(
            tap(() => this.cargandoResumen.set(false)),
            catchError((error) => {
                this.cargandoResumen.set(false);
                return of({
                    exito: false,
                    datos: { tarjetas: [] },
                });
            }),
        );
    }

    obtenerActividadReciente(limite: number = 10): Observable<RespuestaActividad> {
        this.cargandoActividad.set(true);
        return this.http
            .get<RespuestaActividad>(`${this.apiUrl}/actividad-reciente`, {
                params: { limite: limite.toString() },
            })
            .pipe(
                tap(() => this.cargandoActividad.set(false)),
                catchError((error) => {
                    this.cargandoActividad.set(false);
                    return of({ exito: false, datos: [] });
                }),
            );
    }

    obtenerTareasDia(): Observable<RespuestaTareas> {
        this.cargandoTareas.set(true);
        return this.http.get<RespuestaTareas>(`${this.apiUrl}/tareas-dia`).pipe(
            tap(() => this.cargandoTareas.set(false)),
            catchError((error) => {
                this.cargandoTareas.set(false);
                return of({ exito: false, datos: [] });
            }),
        );
    }

    obtenerTurnoActual(): Observable<RespuestaTurno> {
        return this.http.get<RespuestaTurno>(`${this.apiUrl}/turno-actual`).pipe(
            catchError((error) => {
                return of({ exito: false, datos: null });
            }),
        );
    }

    obtenerNotificaciones(limite: number = 5): Observable<RespuestaNotificaciones> {
        return this.http
            .get<RespuestaNotificaciones>(`${this.apiUrl}/notificaciones`, {
                params: { limite: limite.toString() },
            })
            .pipe(
                catchError((error) => {
                    return of({
                        exito: false,
                        datos: { notificaciones: [], sinLeer: 0 },
                    });
                }),
            );
    }
}
