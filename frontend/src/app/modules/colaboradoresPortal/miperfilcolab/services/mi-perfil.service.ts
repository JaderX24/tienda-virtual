import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// --- Interfaces ---

export interface RolPerfil {
    nombre: string;
    codigo: string;
    esPrincipal: boolean;
}

export interface AlmacenPerfil {
    id: number;
    nombre: string;
    codigo: string;
    nivelAcceso: string;
}

export interface PerfilColaborador {
    id: number;
    nombre: string;
    apellido: string;
    nombreCompleto: string;
    numeroIdentidad: string | null;
    fechaNacimiento: string | null;
    genero: string;
    correo: string;
    telefono: string | null;
    telefonoEmergencia: string | null;
    contactoEmergenciaNombre: string | null;
    codigoColaborador: string;
    cargo: string | null;
    fechaIngreso: string;
    tipoContrato: string;
    avatarUrl: string | null;
    idioma: string;
    zonaHoraria: string;
    requiere2fa: boolean;
    metodo2fa: string;
    maxSesionesSimultaneas: number;
    contrasenaTemporal: boolean;
    ultimoCambioContrasena: string | null;
    ultimoAcceso: string | null;
    esVerificado: boolean;
    miembroDesde: string;
    rol: { nombre: string; codigo: string } | null;
    almacen: { id: number; nombre: string; codigo: string } | null;
    roles: RolPerfil[];
    almacenes: AlmacenPerfil[];
}

export interface EventoSeguridad {
    tipoEvento: string;
    descripcion: string | null;
    ip: string | null;
    fecha: string;
    severidad: string;
}

export interface ResumenSeguridad {
    sesionesActivas: number;
    dispositivosRegistrados: number;
    ultimoCambioContrasena: string | null;
    ultimosEventos: EventoSeguridad[];
}

export interface SesionActiva {
    id: number;
    ip: string;
    ubicacion: string;
    navegador: string;
    sistemaOperativo: string;
    iniciadaEn: string;
    ultimaActividad: string;
}

export interface Dispositivo {
    id: number;
    nombre: string;
    tipo: string;
    navegador: string | null;
    sistemaOperativo: string | null;
    esConfiable: boolean;
    ultimoUso: string | null;
    registradoEn: string;
}

export interface Preferencias {
    idioma: string;
    zonaHoraria: string;
    temaColor: string;
    sidebarCompacto: boolean;
    notificacionesSonido: boolean;
    notificacionesEscritorio: boolean;
}

export interface DatosActualizarPerfil {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    telefonoEmergencia?: string;
    contactoEmergenciaNombre?: string;
    genero?: string;
}

export interface DatosCambiarContrasena {
    contrasenaActual: string;
    nuevaContrasena: string;
    confirmarContrasena: string;
}

export interface DatosActualizarPreferencias {
    idioma?: string;
    zonaHoraria?: string;
    temaColor?: string;
    sidebarCompacto?: boolean;
    notificacionesSonido?: boolean;
    notificacionesEscritorio?: boolean;
}

export interface DatosActualizarSeguridad {
    requiere2fa?: boolean;
    metodo2fa?: string;
    maxSesionesSimultaneas?: number;
}

export interface RespuestaDatos<T> {
    exito: boolean;
    datos: T;
}

export interface RespuestaAccion {
    exito: boolean;
    mensaje: string;
    datos?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class MiPerfilService {
    private readonly urlBase = `${environment.apiUrl}/colaborador/mi-perfil`;

    constructor(private http: HttpClient) {}

    obtenerPerfil(): Observable<RespuestaDatos<PerfilColaborador>> {
        return this.http.get<RespuestaDatos<PerfilColaborador>>(this.urlBase);
    }

    obtenerResumenSeguridad(): Observable<RespuestaDatos<ResumenSeguridad>> {
        return this.http.get<RespuestaDatos<ResumenSeguridad>>(`${this.urlBase}/seguridad/resumen`);
    }

    obtenerSesionesActivas(): Observable<RespuestaDatos<SesionActiva[]>> {
        return this.http.get<RespuestaDatos<SesionActiva[]>>(`${this.urlBase}/sesiones`);
    }

    obtenerDispositivos(): Observable<RespuestaDatos<Dispositivo[]>> {
        return this.http.get<RespuestaDatos<Dispositivo[]>>(`${this.urlBase}/dispositivos`);
    }

    obtenerPreferencias(): Observable<RespuestaDatos<Preferencias>> {
        return this.http.get<RespuestaDatos<Preferencias>>(`${this.urlBase}/preferencias`);
    }

    actualizarPerfil(datos: DatosActualizarPerfil): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/informacion`, datos);
    }

    cambiarContrasena(datos: DatosCambiarContrasena): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/contrasena`, datos);
    }

    actualizarPreferencias(datos: DatosActualizarPreferencias): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/preferencias`, datos);
    }

    actualizarSeguridad(datos: DatosActualizarSeguridad): Observable<RespuestaAccion> {
        return this.http.patch<RespuestaAccion>(`${this.urlBase}/seguridad`, datos);
    }

    cerrarSesion(sesionId: number): Observable<RespuestaAccion> {
        return this.http.delete<RespuestaAccion>(`${this.urlBase}/sesiones/${sesionId}`);
    }

    cerrarTodasLasSesiones(): Observable<RespuestaAccion> {
        return this.http.delete<RespuestaAccion>(`${this.urlBase}/sesiones`);
    }

    eliminarDispositivo(dispositivoId: number): Observable<RespuestaAccion> {
        return this.http.delete<RespuestaAccion>(`${this.urlBase}/dispositivos/${dispositivoId}`);
    }
}
