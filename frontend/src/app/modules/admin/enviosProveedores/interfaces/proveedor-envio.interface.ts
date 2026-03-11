export type TipoProveedor = string;

export type EstadoProveedor = string;

export type TipoServicio = string;

export type ZonaCobertura = string;

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
