export interface Colaborador {
    id: number;
    nombre: string;
    apellido: string;
    numeroIdentidad?: string;
    fechaNacimiento?: Date | string;
    genero?: 'masculino' | 'femenino' | 'otro' | 'no_especificado';

    correo: string;
    telefono?: string;
    telefonoEmergencia?: string;
    contactoEmergenciaNombre?: string;

    codigoColaborador: string;
    cargo?: string;
    fechaIngreso: Date | string;
    fechaBaja?: Date | string;
    tipoContrato: 'permanente' | 'temporal' | 'medio_tiempo' | 'practicante';

    empresaId?: number;
    empresa?: EmpresaResumen;

    contrasenaHash?: string;
    contrasenaTemporal?: boolean;

    esActivo: boolean;
    esVerificado: boolean;
    verificadoEn?: Date | string;
    motivoInactivacion?: string;

    requiere2fa: boolean;
    metodo2fa?: 'ninguno' | 'app' | 'sms' | 'correo';

    accesoSoloIpConfiable: boolean;
    accesoSoloHorarioTurno: boolean;
    accesoSoloDispositivoRegistrado: boolean;
    maxSesionesSimultaneas: number;

    avatarUrl?: string;
    ultimoAcceso?: Date | string;
    creadoEn: Date | string;
    actualizadoEn: Date | string;

    roles?: ColaboradorRol[];
    asignaciones?: AsignacionAlmacen[];
}

export interface ColaboradorRol {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    esActivo: boolean;
}

export interface EmpresaResumen {
    id: number;
    nombre: string;
}

export interface AsignacionAlmacen {
    id: number;
    almacenId: number;
    almacenNombre: string;
    almacenCodigo: string;
    esPrincipal: boolean;
    fechaAsignacion: Date | string;
    esActivo: boolean;
}

export interface Almacen {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    ciudad?: string;
    departamento?: string;
    esActivo: boolean;
}

export interface TurnoColaborador {
    id: number;
    usuarioId: number;
    almacenId: number;
    almacenNombre?: string;
    tipo: 'entrada' | 'salida';
    fechaHoraEntrada: Date | string;
    fechaHoraSalida?: Date | string;
    duracionMinutos?: number;
    notas?: string;
    creadoEn: Date | string;
}

export interface CrearColaboradorDto {
    nombre: string;
    apellido: string;
    correo: string;
    codigoColaborador: string;
    numeroIdentidad?: string;
    fechaNacimiento?: string;
    genero?: string;
    telefono?: string;
    telefonoEmergencia?: string;
    contactoEmergenciaNombre?: string;
    cargo?: string;
    fechaIngreso?: string;
    tipoContrato?: string;
    empresaId?: number;
    requiere2fa?: boolean;
    metodo2fa?: string;
    accesoSoloHorarioTurno?: boolean;
    maxSesionesSimultaneas?: number;
}

export interface ActualizarColaboradorDto {
    nombre?: string;
    apellido?: string;
    correo?: string;
    numeroIdentidad?: string;
    fechaNacimiento?: string;
    genero?: string;
    telefono?: string;
    telefonoEmergencia?: string;
    contactoEmergenciaNombre?: string;
    cargo?: string;
    fechaIngreso?: string;
    fechaBaja?: string;
    tipoContrato?: string;
    empresaId?: number;
    esActivo?: boolean;
    motivoInactivacion?: string;
    requiere2fa?: boolean;
    metodo2fa?: string;
    accesoSoloIpConfiable?: boolean;
    accesoSoloHorarioTurno?: boolean;
    accesoSoloDispositivoRegistrado?: boolean;
    maxSesionesSimultaneas?: number;
}

export interface FiltrosColaborador {
    busqueda?: string;
    empresaId?: number;
    tipoContrato?: string;
    activo?: boolean;
    almacenId?: number;
    pagina: number;
    limite: number;
}

export interface RespuestaPaginada<T> {
    datos: T[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
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
