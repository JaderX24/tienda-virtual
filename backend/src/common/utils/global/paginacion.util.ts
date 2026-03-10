/**
 * Estructura estándar para respuestas paginadas.
 * Usar en todos los listados que soporten paginación.
 */
export interface ResultadoPaginado<T> {
    datos: T[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

/**
 * Calcula los parámetros de paginación para consultas Prisma.
 */
export function calcularPaginacion(pagina: number = 1, limite: number = 10): { skip: number; take: number } {
    const paginaSegura = Math.max(1, pagina);
    const limiteSeguro = Math.min(Math.max(1, limite), 100);

    return {
        skip: (paginaSegura - 1) * limiteSeguro,
        take: limiteSeguro,
    };
}

/**
 * Construye el objeto de respuesta paginada estándar.
 */
export function construirRespuestaPaginada<T>(
    datos: T[],
    total: number,
    pagina: number,
    limite: number,
): ResultadoPaginado<T> {
    return {
        datos,
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
    };
}
