import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// --- Interfaces del resumen ---
export interface ResumenMiActividad {
    totalEventosBitacora: number;
    totalOperacionesInventario: number;
    totalConteosRealizados: number;
    totalSesiones: number;
    loginExitosos: number;
    loginFallidos: number;
    entradasInventario: number;
    salidasInventario: number;
    ajustesInventario: number;
    transferenciasInventario: number;
    ultimoLogin: { fecha: string; ip: string } | null;
    ultimaOperacion: { fecha: string; tipo: string } | null;
}

// --- Interfaces de bitácora ---
export interface EventoBitacora {
    id: string;
    tipoEvento: string;
    tipoEventoTexto: string;
    descripcion: string;
    severidad: string;
    severidadTexto: string;
    ip: string;
    navegador: string;
    fecha: string;
    datosExtra: any;
}

// --- Interfaces de operaciones ---
export interface OperacionInventario {
    id: string;
    tipoOperacion: string;
    tipoOperacionTexto: string;
    producto: string;
    sku: string;
    cantidad: number;
    cantidadAnterior: number;
    cantidadNueva: number;
    almacen: string;
    motivo: string;
    notas: string;
    documentoTipo: string;
    documentoNumero: string;
    fecha: string;
}

// --- Interfaces de sesiones ---
export interface SesionUsuario {
    id: number;
    ip: string;
    pais: string;
    ciudad: string;
    navegador: string;
    sistemaOperativo: string;
    inicio: string;
    ultimaActividad: string;
    expiracion: string;
    esActiva: boolean;
    cerradaEn: string | null;
    motivoCierre: string;
}

// --- Interfaces de timeline ---
export interface EventoTimeline {
    id: string;
    origen: 'bitacora' | 'inventario' | 'conteo';
    icono: string;
    color: string;
    titulo: string;
    descripcion: string;
    detalle: string;
    severidad: string;
    fecha: string;
}

// --- Paginación ---
export interface Paginacion {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

// --- Filtros ---
export interface FiltrosBase {
    fechaDesde?: string;
    fechaHasta?: string;
    busqueda?: string;
    pagina?: number;
    limite?: number;
}

export interface FiltrosBitacora extends FiltrosBase {
    tipoEvento?: string;
    severidad?: string;
}

export interface FiltrosOperaciones extends FiltrosBase {
    tipoOperacion?: string;
}

// --- Respuestas ---
export interface RespuestaResumen {
    exito: boolean;
    datos: ResumenMiActividad;
}

export interface RespuestaBitacora {
    exito: boolean;
    datos: EventoBitacora[];
    paginacion: Paginacion;
}

export interface RespuestaOperaciones {
    exito: boolean;
    datos: OperacionInventario[];
    paginacion: Paginacion;
}

export interface RespuestaSesiones {
    exito: boolean;
    datos: SesionUsuario[];
    paginacion: Paginacion;
}

export interface RespuestaTimeline {
    exito: boolean;
    datos: EventoTimeline[];
    paginacion: Paginacion;
}

@Injectable({ providedIn: 'root' })
export class MiActividadService {
    private readonly urlBase = `${environment.apiUrl}/colaborador/mi-actividad`;

    constructor(private http: HttpClient) {}

    obtenerResumen(filtros: FiltrosBase): Observable<RespuestaResumen> {
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaResumen>(`${this.urlBase}/resumen`, { params });
    }

    obtenerBitacora(filtros: FiltrosBitacora): Observable<RespuestaBitacora> {
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaBitacora>(`${this.urlBase}/bitacora`, { params });
    }

    obtenerOperaciones(filtros: FiltrosOperaciones): Observable<RespuestaOperaciones> {
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaOperaciones>(`${this.urlBase}/operaciones`, { params });
    }

    obtenerSesiones(filtros: FiltrosBase): Observable<RespuestaSesiones> {
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaSesiones>(`${this.urlBase}/sesiones`, { params });
    }

    obtenerTimeline(filtros: FiltrosBase): Observable<RespuestaTimeline> {
        const params = this.construirParams(filtros);
        return this.http.get<RespuestaTimeline>(`${this.urlBase}/timeline`, { params });
    }

    exportarBitacoraCsv(filtros: FiltrosBitacora): void {
        const params = this.construirParams(filtros);
        this.http.get(`${this.urlBase}/exportar/bitacora`, { params, responseType: 'blob' })
            .subscribe({
                next: (blob) => this.descargarArchivo(blob, `bitacora_${this.obtenerFechaArchivo()}.csv`),
            });
    }

    exportarOperacionesCsv(filtros: FiltrosOperaciones): void {
        const params = this.construirParams(filtros);
        this.http.get(`${this.urlBase}/exportar/operaciones`, { params, responseType: 'blob' })
            .subscribe({
                next: (blob) => this.descargarArchivo(blob, `operaciones_${this.obtenerFechaArchivo()}.csv`),
            });
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

    private descargarArchivo(blob: Blob, nombre: string): void {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        enlace.click();
        window.URL.revokeObjectURL(url);
    }

    private obtenerFechaArchivo(): string {
        const ahora = new Date();
        const dia = String(ahora.getDate()).padStart(2, '0');
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const anio = ahora.getFullYear();
        return `${dia}-${mes}-${anio}`;
    }
}
