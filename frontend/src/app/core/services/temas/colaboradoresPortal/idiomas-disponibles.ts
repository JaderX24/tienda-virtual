export interface IdiomaOpcion {
    valor: string;
    etiqueta: string;
}

export const IDIOMAS_DISPONIBLES: IdiomaOpcion[] = [
    { valor: 'es', etiqueta: 'Español' },
    { valor: 'en', etiqueta: 'English' },
];

export const IDIOMA_POR_DEFECTO = 'es';
