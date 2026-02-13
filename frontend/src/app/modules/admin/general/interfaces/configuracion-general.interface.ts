export interface ConfiguracionSistema {
    // Información del Sistema
    nombreSistema: string;
    versionSistema: string;
    entorno: 'desarrollo' | 'staging' | 'produccion';
    
    // Configuración de Sesiones
    tiempoExpiracionToken: number;
    tiempoExpiracionRefreshToken: number;
    maximoSesionesPorUsuario: number;
    
    // Configuración de Seguridad
    intentosMaximosLogin: number;
    tiempoBloqueoMinutos: number;
    longitudMinimaContrasena: number;
    requiereCaracterEspecial: boolean;
    requiereMayuscula: boolean;
    requiereNumero: boolean;
    
    // Configuración de Archivos
    tamanoMaximoArchivo: number;
    extensionesPermitidas: string[];
    rutaAlmacenamiento: string;
    
    // Configuración de Correo
    smtpActivo: boolean;
    correoRemitente: string;
    
    // Configuración de Logs
    nivelLog: 'debug' | 'info' | 'warn' | 'error';
    diasRetencionLogs: number;
    
    // Mantenimiento
    modoMantenimiento: boolean;
    mensajeMantenimiento?: string;
    
    // Metadatos
    ultimaActualizacion?: Date;
    actualizadoPor?: string;
}

export interface ParametroSistema {
    id: number;
    clave: string;
    valor: string;
    tipo: 'texto' | 'numero' | 'booleano' | 'json';
    categoria: string;
    descripcion: string;
    editable: boolean;
    creadoEn: Date;
    actualizadoEn: Date;
}

export interface ActualizarParametroDto {
    valor: string;
}

export interface RespuestaConfiguracionSistema {
    exito: boolean;
    mensaje: string;
    datos: ConfiguracionSistema;
}

export interface RespuestaParametros {
    exito: boolean;
    mensaje: string;
    datos: ParametroSistema[];
}
