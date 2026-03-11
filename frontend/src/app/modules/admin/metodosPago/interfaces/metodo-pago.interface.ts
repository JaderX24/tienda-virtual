export type TipoPasarela = string;

export type ModoIntegracion = string;

export type AmbientePasarela = string;

export type TipoComision = string;

export type TipoTransaccionComision = string;

export interface PasarelaPago {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    tipo: TipoPasarela;
    proveedor: string | null;
    logoUrl: string | null;
    urlDocumentacion: string | null;
    modoIntegracion: ModoIntegracion;
    urlApiSandbox: string | null;
    urlApiProduccion: string | null;
    versionApi: string | null;
    soportaTokenizacion: boolean;
    soporta3ds: boolean;
    soportaReembolsos: boolean;
    soportaReembolsosParciales: boolean;
    soportaSuscripciones: boolean;
    soportaSplitPayment: boolean;
    soportaPreautorizacion: boolean;
    soportaCapturaDiferida: boolean;
    monedasSoportadas: string[] | null;
    montoMinimo: number;
    montoMaximo: number;
    ordenPrioridad: number;
    esActivo: boolean;
    esVisibleCliente: boolean;
    requiereConfiguracion: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface CrearPasarelaDto {
    codigo: string;
    nombre: string;
    descripcion?: string;
    tipo: TipoPasarela;
    proveedor?: string;
    logoUrl?: string;
    urlDocumentacion?: string;
    modoIntegracion: ModoIntegracion;
    urlApiSandbox?: string;
    urlApiProduccion?: string;
    versionApi?: string;
    soportaTokenizacion?: boolean;
    soporta3ds?: boolean;
    soportaReembolsos?: boolean;
    soportaReembolsosParciales?: boolean;
    soportaSuscripciones?: boolean;
    soportaSplitPayment?: boolean;
    soportaPreautorizacion?: boolean;
    soportaCapturaDiferida?: boolean;
    monedasSoportadas?: string[];
    montoMinimo?: number;
    montoMaximo?: number;
    ordenPrioridad?: number;
    esActivo?: boolean;
    esVisibleCliente?: boolean;
    requiereConfiguracion?: boolean;
}

export interface ActualizarPasarelaDto extends Partial<CrearPasarelaDto> {}

export interface FiltrosPasarela {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    tipo?: TipoPasarela;
    modoIntegracion?: ModoIntegracion;
    esActivo?: boolean;
    esVisibleCliente?: boolean;
    orden?: string;
    direccion?: 'asc' | 'desc';
}

export interface ComisionPasarela {
    id: number;
    pasarelaId: number;
    empresaId: number | null;
    tipoComision: TipoComision;
    porcentaje: number;
    montoFijo: number;
    monedaId: number | null;
    montoDesde: number;
    montoHasta: number;
    tipoTransaccion: TipoTransaccionComision;
    esActivo: boolean;
    vigenciaDesde: string | null;
    vigenciaHasta: string | null;
    creadoEn: string;
}

export interface CredencialPasarela {
    id: number;
    pasarelaId: number;
    empresaId: number;
    ambiente: AmbientePasarela;
    apiKeyPublica: string | null;
    merchantId: string | null;
    esActivo: boolean;
    verificadoEn: string | null;
    ultimoUsoEn: string | null;
    creadoPor: number;
    creadoEn: string;
    actualizadoEn: string;
}

export interface MonedaSoportada {
    id: number;
    codigo: string;
    nombre: string;
    simbolo: string;
    decimales: number;
    formatoPatron: string;
    esPrincipal: boolean;
    tasaCambioBase: number;
    esActivo: boolean;
}

export interface ResumenPasarelas {
    total: number;
    activas: number;
    inactivas: number;
    porTipo: { tipo: TipoPasarela; cantidad: number }[];
}

export interface RespuestaApi<T> {
    exito: boolean;
    mensaje?: string;
    datos: T;
    meta?: {
        total?: number;
        pagina?: number;
        limite?: number;
        totalPaginas?: number;
    };
}

export interface RespuestaPaginada<T> {
    datos: T[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export interface OpcionSelect {
    valor: string;
    etiqueta: string;
}
