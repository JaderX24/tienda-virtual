import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AlmacenTurno {
    id: number;
    nombre: string;
    codigo: string;
    direccion: string | null;
    telefono: string | null;
}

export interface Turno {
    id: number;
    fecha: string;
    horaInicioProgramada: string;
    horaFinProgramada: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    estado: 'programado' | 'en_curso' | 'finalizado';
    notasEntrada: string | null;
    notasSalida: string | null;
    almacen: AlmacenTurno | null;
    horasTrabajadas: number | null;
    puntualidad: string;
}

export interface ResumenSemanal {
    totalTurnos: number;
    turnosCompletados: number;
    turnosPendientes: number;
    horasTrabajadas: number;
    puntualidad: number;
}

export interface ActividadTurno {
    id: string;
    tipo: string;
    producto: string;
    sku: string;
    cantidad: number;
    almacen: string;
    fecha: string;
}

interface RespuestaTurno {
    exito: boolean;
    datos: Turno | null;
    mensaje?: string;
}

interface RespuestaHistorial {
    exito: boolean;
    datos: Turno[];
    paginacion: {
        pagina: number;
        limite: number;
        total: number;
        totalPaginas: number;
    };
}

interface RespuestaResumenSemanal {
    exito: boolean;
    datos: {
        semana: Turno[];
        resumen: ResumenSemanal;
    };
}

interface RespuestaRegistro {
    exito: boolean;
    mensaje: string;
    datos: Turno;
    horasTrabajadas?: number;
}

interface RespuestaActividad {
    exito: boolean;
    datos: ActividadTurno[];
}

@Injectable({
    providedIn: 'root',
})
export class MiTurnoService {
    private readonly apiUrl = `${environment.apiUrl}/colaborador/mi-turno`;

    cargando = signal(false);
    procesando = signal(false);

    constructor(private http: HttpClient) {}

    obtenerTurnoHoy(): Observable<RespuestaTurno> {
        this.cargando.set(true);
        return this.http.get<RespuestaTurno>(`${this.apiUrl}/hoy`).pipe(
            tap(() => this.cargando.set(false)),
            catchError(() => {
                this.cargando.set(false);
                return of({ exito: false, datos: null, mensaje: 'Error al obtener turno' });
            }),
        );
    }

    obtenerHistorial(pagina: number = 1, limite: number = 10): Observable<RespuestaHistorial> {
        return this.http
            .get<RespuestaHistorial>(`${this.apiUrl}/historial`, {
                params: { pagina: pagina.toString(), limite: limite.toString() },
            })
            .pipe(
                catchError(() =>
                    of({
                        exito: false,
                        datos: [],
                        paginacion: { pagina: 1, limite: 10, total: 0, totalPaginas: 0 },
                    }),
                ),
            );
    }

    obtenerResumenSemanal(): Observable<RespuestaResumenSemanal> {
        return this.http.get<RespuestaResumenSemanal>(`${this.apiUrl}/resumen-semanal`).pipe(
            catchError(() =>
                of({
                    exito: false,
                    datos: {
                        semana: [],
                        resumen: {
                            totalTurnos: 0,
                            turnosCompletados: 0,
                            turnosPendientes: 0,
                            horasTrabajadas: 0,
                            puntualidad: 100,
                        },
                    },
                }),
            ),
        );
    }

    registrarEntrada(notas?: string): Observable<RespuestaRegistro> {
        this.procesando.set(true);
        return this.http
            .post<RespuestaRegistro>(`${this.apiUrl}/entrada`, { notas })
            .pipe(
                tap(() => this.procesando.set(false)),
                catchError(() => {
                    this.procesando.set(false);
                    return of({
                        exito: false,
                        mensaje: 'Error al registrar entrada',
                        datos: null as any,
                    });
                }),
            );
    }

    registrarSalida(notas?: string): Observable<RespuestaRegistro> {
        this.procesando.set(true);
        return this.http
            .post<RespuestaRegistro>(`${this.apiUrl}/salida`, { notas })
            .pipe(
                tap(() => this.procesando.set(false)),
                catchError(() => {
                    this.procesando.set(false);
                    return of({
                        exito: false,
                        mensaje: 'Error al registrar salida',
                        datos: null as any,
                    });
                }),
            );
    }

    obtenerActividadTurno(turnoId?: number): Observable<RespuestaActividad> {
        const params: any = {};
        if (turnoId) params.turnoId = turnoId.toString();

        return this.http
            .get<RespuestaActividad>(`${this.apiUrl}/actividad`, { params })
            .pipe(
                catchError(() => of({ exito: false, datos: [] })),
            );
    }
}
