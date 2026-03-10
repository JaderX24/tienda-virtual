/**
 * Genera un slug URL-friendly a partir de un texto.
 * Remueve acentos, caracteres especiales y normaliza separadores.
 */
export function generarSlug(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
