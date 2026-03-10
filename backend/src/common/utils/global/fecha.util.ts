const ZONA_HORARIA_HONDURAS = 'America/Tegucigalpa';
const LOCALE_HONDURAS = 'es-HN';

/**
 * Obtiene la fecha/hora actual en zona horaria de Honduras.
 */
export function obtenerFechaHonduras(): Date {
    const ahora = new Date();
    const fechaHonduras = new Date(
        ahora.toLocaleString('en-US', { timeZone: ZONA_HORARIA_HONDURAS }),
    );
    return fechaHonduras;
}

/**
 * Formatea una fecha en formato largo: "24 de enero de 2026"
 */
export function formatearFechaLarga(fecha: Date = new Date()): string {
    return fecha.toLocaleDateString(LOCALE_HONDURAS, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Formatea una fecha en formato corto: "24/01/2026"
 */
export function formatearFechaCorta(fecha: Date = new Date()): string {
    return fecha.toLocaleDateString(LOCALE_HONDURAS, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Formatea una fecha con hora: "24/01/2026 14:30:00"
 */
export function formatearFechaHora(fecha: Date = new Date()): string {
    const partesFecha = formatearFechaCorta(fecha);
    const partesHora = fecha.toLocaleTimeString(LOCALE_HONDURAS, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return `${partesFecha} ${partesHora}`;
}
