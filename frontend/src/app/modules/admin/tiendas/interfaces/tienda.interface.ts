export enum TipoTienda {
    TIENDA_FISICA = 'tienda_fisica',
    TIENDA_VIRTUAL = 'tienda_virtual',
    TIENDA_HIBRIDA = 'tienda_hibrida',
    QUIOSCO = 'quiosco',
    SUCURSAL = 'sucursal',
    FRANQUICIA = 'franquicia',
    POPUP_STORE = 'popup_store',
    OUTLET = 'outlet'
}

export enum EstadoTienda {
    ACTIVA = 'activa',
    INACTIVA = 'inactiva',
    EN_CONSTRUCCION = 'en_construccion',
    MANTENIMIENTO = 'mantenimiento',
    CERRADA_TEMPORAL = 'cerrada_temporal'
}

export enum TipoNegocioTienda {
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

export enum PlanSuscripcionTienda {
    BASICO = 'basico',
    PROFESIONAL = 'profesional',
    EMPRESARIAL = 'empresarial',
    PREMIUM = 'premium'
}

export enum RangoEmpleadosTienda {
    UNO_CINCO = '1-5',
    SEIS_VEINTE = '6-20',
    VEINTIUNO_CINCUENTA = '21-50',
    CINCUENTA_UNO_CIEN = '51-100',
    CIEN_UNO_QUINIENTOS = '101-500',
    MAS_QUINIENTOS = '500+'
}

export interface RedesSocialesTienda {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    whatsapp?: string;
    linkedin?: string;
}

export interface UbicacionTienda {
    direccion: string;
    departamento: string;
    ciudad: string;
    codigoPostal?: string;
    pais: string;
    latitud?: number;
    longitud?: number;
    referenciasUbicacion?: string;
}

export interface HorarioAtencion {
    lunes?: HorarioDia;
    martes?: HorarioDia;
    miercoles?: HorarioDia;
    jueves?: HorarioDia;
    viernes?: HorarioDia;
    sabado?: HorarioDia;
    domingo?: HorarioDia;
    diasEspeciales?: DiaEspecial[];
}

export interface HorarioDia {
    abierto: boolean;
    horaApertura?: string; // Formato: "08:00"
    horaCierre?: string;   // Formato: "18:00"
    descansoInicio?: string; // Para horario partido
    descansoFin?: string;
}

export interface DiaEspecial {
    fecha: string; // Formato: "2026-12-25"
    descripcion: string; // "Navidad", "Día del Trabajador", etc.
    abierto: boolean;
    horaApertura?: string;
    horaCierre?: string;
}

export interface ConfiguracionTienda {
    permitePedidosOnline: boolean;
    permitePagosOnline: boolean;
    permitePedidosDomicilio: boolean;
    minimoCompraPublica?: number;
    costoEnvioDomicilio?: number;
    radioPedidosKm?: number;
    tiempoPreparacion?: number; // En minutos
    metodosPagoAceptados: string[];
    configuracionNotificaciones?: ConfiguracionNotificaciones;
}

export interface ConfiguracionNotificaciones {
    emailNuevosPedidos: boolean;
    emailStockBajo: boolean;
    smsNuevosPedidos: boolean;
    whatsappNuevosPedidos: boolean;
}

export interface EstadisticasTienda {
    pedidosDelMes: number;
    ventasDelMes: number;
    clientesActivos: number;
    productosActivos: number;
    stockBajo: number;
    valoracionPromedio?: number;
    ultimaVenta?: string;
}

export interface Tienda {
    id: number;
    nombre: string;
    nombreComercial?: string;
    rtn: string;
    nit?: string;
    correo: string;
    telefono: string;
    celular?: string;
    tipoTienda?: TipoTienda;
    estado: EstadoTienda;
    ubicacion: UbicacionTienda;
    logo?: string;
    sitioWeb?: string;
    tipoNegocio: TipoNegocioTienda;
    descripcion?: string;
    redesSociales?: RedesSocialesTienda;
    representanteLegal?: string;
    planSuscripcion: PlanSuscripcionTienda;
    moneda: string;
    zonaHoraria: string;
    cantidadEmpleados?: RangoEmpleadosTienda;
    horarioAtencion?: HorarioAtencion;
    configuracion?: ConfiguracionTienda;
    estadisticas?: EstadisticasTienda;
    activa: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface CrearTiendaDto {
    nombre: string;
    nombreComercial?: string;
    rtn: string;
    nit?: string;
    correo: string;
    telefono: string;
    celular?: string;
    tipoTienda?: TipoTienda;
    ubicacion: UbicacionTienda;
    logo?: string;
    sitioWeb?: string;
    tipoNegocio: TipoNegocioTienda;
    descripcion?: string;
    redesSociales?: RedesSocialesTienda;
    representanteLegal?: string;
    planSuscripcion: PlanSuscripcionTienda;
    cantidadEmpleados?: RangoEmpleadosTienda;
    horarioAtencion?: HorarioAtencion;
    configuracion?: ConfiguracionTienda;
}

export interface ActualizarTiendaDto {
    nombre?: string;
    nombreComercial?: string;
    correo?: string;
    telefono?: string;
    celular?: string;
    tipoTienda?: TipoTienda;
    estado?: EstadoTienda;
    ubicacion?: Partial<UbicacionTienda>;
    logo?: string;
    sitioWeb?: string;
    descripcion?: string;
    redesSociales?: RedesSocialesTienda;
    representanteLegal?: string;
    planSuscripcion?: PlanSuscripcionTienda;
    cantidadEmpleados?: RangoEmpleadosTienda;
    horarioAtencion?: HorarioAtencion;
    configuracion?: ConfiguracionTienda;
    activa?: boolean;
}

export interface FiltrosTienda {
    busqueda?: string;
    tipoNegocio?: TipoNegocioTienda;
    tipoTienda?: TipoTienda;
    estado?: EstadoTienda;
    departamento?: string;
    ciudad?: string;
    planSuscripcion?: PlanSuscripcionTienda;
    soloActivas?: boolean;
    fecha?: string;
    orden?: 'nombre' | 'fecha' | 'ventas' | 'pedidos';
    direccion?: 'asc' | 'desc';
    pagina?: number;
    limite?: number;
}

export interface RespuestaPaginadaTiendas {
    tiendas: Tienda[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export interface RespuestaApi<T> {
    exito: boolean;
    mensaje: string;
    datos: T;
}

export interface ErrorValidacion {
    campo: string;
    mensaje: string;
}

export interface RespuestaError {
    exito: false;
    mensaje: string;
    errores?: ErrorValidacion[];
}

// Tipos para formularios reactivos
export interface FormularioTienda {
    // Datos básicos
    nombre: string;
    nombreComercial?: string;
    rtn: string;
    nit?: string;
    correo: string;
    telefono: string;
    celular?: string;
    tipoTienda: TipoTienda;
    tipoNegocio: TipoNegocioTienda;
    descripcion?: string;
    representanteLegal?: string;
    planSuscripcion: PlanSuscripcionTienda;
    cantidadEmpleados: RangoEmpleadosTienda;
    
    // Ubicación
    direccion: string;
    departamento: string;
    ciudad: string;
    codigoPostal?: string;
    pais: string;
    referenciasUbicacion?: string;
    
    // Contacto digital
    sitioWeb?: string;
    logoFile?: File;
    
    // Redes sociales
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    
    // Configuración operativa
    permitePedidosOnline: boolean;
    permitePagosOnline: boolean;
    permitePedidosDomicilio: boolean;
    minimoCompraPublica?: number;
    costoEnvioDomicilio?: number;
    radioPedidosKm?: number;
    
    // Horarios (simplificado para formulario)
    horarioLunes?: string; // Formato: "08:00-18:00" o "Cerrado"
    horarioMartes?: string;
    horarioMiercoles?: string;
    horarioJueves?: string;
    horarioViernes?: string;
    horarioSabado?: string;
    horarioDomingo?: string;
}

// Opciones para selects
export interface OpcionSelect {
    valor: string;
    etiqueta: string;
    descripcion?: string;
}

export interface OpcionesFormulario {
    tiposTienda: OpcionSelect[];
    tiposNegocio: OpcionSelect[];
    planes: OpcionSelect[];
    rangoEmpleados: OpcionSelect[];
    departamentos: OpcionSelect[];
    paises: OpcionSelect[];
}

// Para componente de estadísticas
export interface ResumenEstadisticas {
    totalTiendas: number;
    tiendasActivas: number;
    tiendasInactivas: number;
    ventasMesActual: number;
    crecimientoVentas: number;
    tiendaPorDepartamento: Array<{ departamento: string; cantidad: number }>;
    ventasPorPlan: Array<{ plan: string; ventas: number }>;
}