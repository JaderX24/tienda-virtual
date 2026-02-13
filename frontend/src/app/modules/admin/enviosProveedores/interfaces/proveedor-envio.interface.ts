export enum TipoProveedor {
    INTERNO = 'interno',
    EXTERNO = 'externo',
    FREELANCE = 'freelance',
    EMPRESA_COURIER = 'empresa_courier'
}

export enum EstadoProveedor {
    ACTIVO = 'activo',
    INACTIVO = 'inactivo',
    SUSPENDIDO = 'suspendido',
    EN_REVISION = 'en_revision'
}

export enum TipoServicio {
    LOCAL = 'local',
    NACIONAL = 'nacional',
    INTERNACIONAL = 'internacional',
    EXPRESS = 'express',
    STANDARD = 'standard',
    ECONOMICO = 'economico'
}

export enum ZonaCobertura {
    LOCAL = 'local',
    REGIONAL = 'regional',
    NACIONAL = 'nacional',
    INTERNACIONAL = 'internacional'
}

export interface ContactoProveedor {
    id: number;
    transportistaId: number;
    nombreCompleto: string;
    cargo: string;
    departamento: string | null;
    telefonoPrincipal: string;
    telefonoSecundario: string | null;
    correo: string;
    correoSecundario: string | null;
    esPrincipal: boolean;
    notas: string | null;
    esActivo: boolean;
    creadoEn?: string;
    actualizadoEn?: string;
}

export interface ProveedorEnvio {
    id: number;
    codigo: string;
    nombre: string;
    razonSocial: string | null;
    rtn: string | null;
    tipo: TipoProveedor;
    descripcion: string | null;
    logoUrl: string | null;
    sitioWeb: string | null;

    direccion: string | null;
    ciudad: string | null;
    departamento: string | null;
    pais: string;
    codigoPostal: string | null;

    telefonoPrincipal: string;
    telefonoSecundario: string | null;
    correoGeneral: string;
    correoOperaciones: string | null;

    servicios: TipoServicio[];
    zonasCobertura: ZonaCobertura[];
    departamentosCobertura: string[];

    tiempoEntregaMinimo: number;
    tiempoEntregaMaximo: number;
    costoBase: number;
    costoKgAdicional: number;
    moneda: string;
    capacidadDiaria: number | null;
    pesoMaximoPaquete: number | null;
    horarioAtencion: string | null;

    soportaRastreo: boolean;
    soportaSeguro: boolean;
    soportaContraEntrega: boolean;
    soportaDevolucion: boolean;
    soportaEntregaProgramada: boolean;
    soportaRecogidaDomicilio: boolean;

    urlRastreo: string | null;
    apiUrl: string | null;
    tieneApiConfigurada: boolean;

    calificacion: number;
    totalEnvios: number;

    ordenPrioridad: number;
    esActivo: boolean;
    esVisible: boolean;
    notas: string | null;

    contactos: ContactoProveedor[];

    creadoEn: string;
    actualizadoEn: string;
}

export interface CrearProveedorEnvioDto {
    codigo: string;
    nombre: string;
    razonSocial?: string;
    rtn?: string;
    tipo: TipoProveedor;
    descripcion?: string;
    logoUrl?: string;
    sitioWeb?: string;

    direccion?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
    codigoPostal?: string;

    telefonoPrincipal: string;
    telefonoSecundario?: string;
    correoGeneral: string;
    correoOperaciones?: string;

    servicios?: TipoServicio[];
    zonasCobertura?: ZonaCobertura[];
    departamentosCobertura?: string[];

    tiempoEntregaMinimo?: number;
    tiempoEntregaMaximo?: number;
    costoBase?: number;
    costoKgAdicional?: number;
    moneda?: string;
    capacidadDiaria?: number;
    pesoMaximoPaquete?: number;
    horarioAtencion?: string;

    soportaRastreo?: boolean;
    soportaSeguro?: boolean;
    soportaContraEntrega?: boolean;
    soportaDevolucion?: boolean;
    soportaEntregaProgramada?: boolean;
    soportaRecogidaDomicilio?: boolean;

    urlRastreo?: string;
    apiUrl?: string;

    ordenPrioridad?: number;
    esActivo?: boolean;
    esVisible?: boolean;
    notas?: string;
    contactos?: CrearContactoProveedorDto[];
}

export interface ActualizarProveedorEnvioDto extends Partial<CrearProveedorEnvioDto> {}

export interface CrearContactoProveedorDto {
    nombreCompleto: string;
    cargo: string;
    departamento?: string;
    telefonoPrincipal: string;
    telefonoSecundario?: string;
    correo: string;
    correoSecundario?: string;
    esPrincipal?: boolean;
    notas?: string;
}

export interface ActualizarContactoProveedorDto extends Partial<CrearContactoProveedorDto> {}

export interface FiltrosProveedorEnvio {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    tipo?: TipoProveedor;
    estado?: EstadoProveedor;
    esActivo?: boolean;
    zonaCobertura?: ZonaCobertura;
    orden?: string;
    direccion?: 'asc' | 'desc';
}

export interface ResumenProveedores {
    total: number;
    activos: number;
    inactivos: number;
    porTipo: { tipo: TipoProveedor; cantidad: number }[];
    promedioCalificacion: number;
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

export const DEPARTAMENTOS_HONDURAS: OpcionSelect[] = [
    { valor: 'ATL', etiqueta: 'Atlántida' },
    { valor: 'CHO', etiqueta: 'Choluteca' },
    { valor: 'COL', etiqueta: 'Colón' },
    { valor: 'COM', etiqueta: 'Comayagua' },
    { valor: 'COP', etiqueta: 'Copán' },
    { valor: 'COR', etiqueta: 'Cortés' },
    { valor: 'EPA', etiqueta: 'El Paraíso' },
    { valor: 'FMO', etiqueta: 'Francisco Morazán' },
    { valor: 'GDA', etiqueta: 'Gracias a Dios' },
    { valor: 'INT', etiqueta: 'Intibucá' },
    { valor: 'ISB', etiqueta: 'Islas de la Bahía' },
    { valor: 'LPA', etiqueta: 'La Paz' },
    { valor: 'LEM', etiqueta: 'Lempira' },
    { valor: 'OCC', etiqueta: 'Ocotepeque' },
    { valor: 'OLA', etiqueta: 'Olancho' },
    { valor: 'SBA', etiqueta: 'Santa Bárbara' },
    { valor: 'VAL', etiqueta: 'Valle' },
    { valor: 'YOR', etiqueta: 'Yoro' }
];
