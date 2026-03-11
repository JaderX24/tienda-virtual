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
