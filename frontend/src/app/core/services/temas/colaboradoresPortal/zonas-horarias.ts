export interface ZonaHorariaOpcion {
    valor: string;
    etiqueta: string;
    utc: string;
}

export const ZONAS_HORARIAS: ZonaHorariaOpcion[] = [
    { valor: 'America/Anchorage', etiqueta: 'Alaska', utc: 'UTC-9' },
    { valor: 'America/Los_Angeles', etiqueta: 'Pacífico (EE.UU.)', utc: 'UTC-8' },
    { valor: 'America/Denver', etiqueta: 'Montaña (EE.UU.)', utc: 'UTC-7' },
    { valor: 'America/Phoenix', etiqueta: 'Arizona', utc: 'UTC-7' },
    { valor: 'America/Chicago', etiqueta: 'Central (EE.UU.)', utc: 'UTC-6' },
    { valor: 'America/Mexico_City', etiqueta: 'Ciudad de México', utc: 'UTC-6' },
    { valor: 'America/Tegucigalpa', etiqueta: 'Tegucigalpa', utc: 'UTC-6' },
    { valor: 'America/Guatemala', etiqueta: 'Guatemala', utc: 'UTC-6' },
    { valor: 'America/El_Salvador', etiqueta: 'El Salvador', utc: 'UTC-6' },
    { valor: 'America/Managua', etiqueta: 'Managua', utc: 'UTC-6' },
    { valor: 'America/Costa_Rica', etiqueta: 'Costa Rica', utc: 'UTC-6' },
    { valor: 'America/New_York', etiqueta: 'Este (EE.UU.)', utc: 'UTC-5' },
    { valor: 'America/Panama', etiqueta: 'Panamá', utc: 'UTC-5' },
    { valor: 'America/Bogota', etiqueta: 'Bogotá', utc: 'UTC-5' },
    { valor: 'America/Lima', etiqueta: 'Lima', utc: 'UTC-5' },
    { valor: 'America/Guayaquil', etiqueta: 'Guayaquil', utc: 'UTC-5' },
    { valor: 'America/Caracas', etiqueta: 'Caracas', utc: 'UTC-4' },
    { valor: 'America/Santo_Domingo', etiqueta: 'Santo Domingo', utc: 'UTC-4' },
    { valor: 'America/La_Paz', etiqueta: 'La Paz', utc: 'UTC-4' },
    { valor: 'America/Santiago', etiqueta: 'Santiago', utc: 'UTC-4' },
    { valor: 'America/Asuncion', etiqueta: 'Asunción', utc: 'UTC-4' },
    { valor: 'America/Argentina/Buenos_Aires', etiqueta: 'Buenos Aires', utc: 'UTC-3' },
    { valor: 'America/Sao_Paulo', etiqueta: 'São Paulo', utc: 'UTC-3' },
    { valor: 'America/Montevideo', etiqueta: 'Montevideo', utc: 'UTC-3' },
];

export const ZONA_POR_DEFECTO = 'America/Tegucigalpa';
