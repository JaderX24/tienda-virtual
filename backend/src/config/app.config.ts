import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nombre: process.env.NOMBRE_APP || 'TiendaVirtual',
    entorno: process.env.ENTORNO || 'desarrollo',
    puerto: parseInt(process.env.PUERTO || '3000', 10),
    urlFrontend: process.env.URL_FRONTEND || 'http://localhost:4200',
    urlBackend: process.env.URL_BACKEND || 'http://localhost:3000',
    zonaHoraria: process.env.ZONA_HORARIA || 'America/Tegucigalpa',
    esProduccion: process.env.ENTORNO === 'produccion',
    esDesarrollo: process.env.ENTORNO === 'desarrollo',
}));
