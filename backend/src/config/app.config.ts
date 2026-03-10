import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nombre: process.env.NOMBRE_APP,
    descripcion: process.env.DESCRIPCION_APP,
    version: process.env.VERSION_APP,
    autor: process.env.AUTOR_APP,
    entorno: process.env.ENTORNO,
    puerto: parseInt(process.env.PUERTO!, 10),
    urlFrontend: process.env.URL_FRONTEND,
    urlBackend: process.env.URL_BACKEND,
    zonaHoraria: process.env.ZONA_HORARIA,
    formatoFecha: process.env.FORMATO_FECHA,
    formatoHora: process.env.FORMATO_HORA,
    formatoFechaHora: process.env.FORMATO_FECHA_HORA,
    esProduccion: process.env.ENTORNO === 'produccion',
    esDesarrollo: process.env.ENTORNO === 'desarrollo',
    log: {
        nivel: process.env.LOG_NIVEL,
        formato: process.env.LOG_FORMATO,
        archivo: process.env.LOG_ARCHIVO,
    },
}));
