export enum TipoNegocio {
    TIENDA_ROPA = 'tienda_ropa',
    RESTAURANTE = 'restaurante',
    SUPERMERCADO = 'supermercado',
    FARMACIA = 'farmacia',
    TECNOLOGIA = 'tecnologia',
    FERRETERIA = 'ferreteria',
    LIBRERIA = 'libreria',
    SERVICIOS = 'servicios',
    MAYORISTA = 'mayorista',
    OTRO = 'otro'
}

export enum PlanSuscripcion {
    BASICO = 'basico',
    PROFESIONAL = 'profesional',
    EMPRESARIAL = 'empresarial',
    PREMIUM = 'premium'
}

export enum RangoEmpleados {
    UNO_CINCO = '1-5',
    SEIS_VEINTE = '6-20',
    VEINTIUNO_CINCUENTA = '21-50',
    CINCUENTA_UNO_CIEN = '51-100',
    CIEN_UNO_QUINIENTOS = '101-500',
    MAS_QUINIENTOS = '500+'
}

export interface RedesSociales {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
}

export interface Empresa {
    id: number;
    nombre: string;
    rtn: string;
    nit?: string;
    correo: string;
    telefono: string;
    celular?: string;
    direccion?: string;
    departamento?: string;
    ciudad?: string;
    codigoPostal?: string;
    pais?: string;
    logo?: string;
    sitioWeb?: string;
    tipoNegocio: TipoNegocio;
    descripcion?: string;
    redesSociales?: RedesSociales;
    representanteLegal?: string;
    planSuscripcion?: PlanSuscripcion;
    moneda?: string;
    zonaHoraria?: string;
    cantidadEmpleados?: RangoEmpleados;
    activa: boolean;
    creadoEn: Date | string;
    actualizadoEn: Date | string;
}

export interface CrearEmpresaDto {
    nombre: string;
    rtn: string;
    nit?: string;
    correo: string;
    telefono: string;
    celular?: string;
    direccion?: string;
    departamento?: string;
    ciudad?: string;
    codigoPostal?: string;
    pais?: string;
    logo?: string;
    sitioWeb?: string;
    tipoNegocio: TipoNegocio;
    descripcion?: string;
    redesSociales?: RedesSociales;
    representanteLegal?: string;
    planSuscripcion?: PlanSuscripcion;
    moneda?: string;
    zonaHoraria?: string;
    cantidadEmpleados?: RangoEmpleados;
}

export interface ActualizarEmpresaDto {
    nombre?: string;
    rtn?: string;
    nit?: string;
    correo?: string;
    telefono?: string;
    celular?: string;
    direccion?: string;
    departamento?: string;
    ciudad?: string;
    codigoPostal?: string;
    pais?: string;
    logo?: string;
    sitioWeb?: string;
    tipoNegocio?: TipoNegocio;
    descripcion?: string;
    redesSociales?: RedesSociales;
    representanteLegal?: string;
    planSuscripcion?: PlanSuscripcion;
    moneda?: string;
    zonaHoraria?: string;
    cantidadEmpleados?: RangoEmpleados;
    activa?: boolean;
}

export interface FiltrosEmpresa {
    busqueda?: string;
    tipoNegocio?: TipoNegocio;
    planSuscripcion?: PlanSuscripcion;
    activa?: boolean;
    pagina: number;
    limite: number;
}

export interface EstadisticasEmpresa {
    totalProductos: number;
    totalPedidos: number;
    totalVentas: number;
    totalUsuarios: number;
}
