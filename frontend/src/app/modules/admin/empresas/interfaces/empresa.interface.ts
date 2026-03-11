export type TipoNegocio = string;

export type PlanSuscripcion = string;

export type RangoEmpleados = string;

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
