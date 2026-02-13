export interface ColabModulo {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    icono?: string;
    ruta?: string;
    moduloPadreId?: number;
    orden: number;
    esMenu: boolean;
    esActivo: boolean;
}

export interface ColabPermiso {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    accion: string;
    esActivo: boolean;
    modulo?: {
        id: number;
        codigo: string;
        nombre: string;
        icono?: string;
    };
}

export interface ColabModuloConPermisos {
    id: number;
    codigo: string;
    nombre: string;
    icono?: string;
    orden: number;
    permisos: {
        id: number;
        codigo: string;
        nombre: string;
        accion: string;
    }[];
}

export interface ColabRolPortal {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    nivelJerarquia: number;
    esSupervisor: boolean;
    color?: string;
    esActivo: boolean;
    creadoEn: string;
    _count: {
        usuariosRoles: number;
        rolesPermisos: number;
    };
}

export interface ColabRolDetalle {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    nivelJerarquia: number;
    esSupervisor: boolean;
    color?: string;
    esActivo: boolean;
    creadoEn: string;
    rolesPermisos: {
        id: number;
        permiso: {
            id: number;
            codigo: string;
            nombre: string;
            accion: string;
            modulo: {
                id: number;
                codigo: string;
                nombre: string;
                icono?: string;
            };
        };
    }[];
    usuariosRoles: {
        id: number;
        esPrincipal: boolean;
        usuario: {
            id: number;
            nombre: string;
            apellido: string;
            codigoColaborador: string;
            esActivo: boolean;
        };
    }[];
}

export interface CrearColabRolPortalDto {
    codigo: string;
    nombre: string;
    descripcion?: string;
    nivelJerarquia?: number;
    esSupervisor?: boolean;
    color?: string;
}

export interface ActualizarColabRolPortalDto {
    nombre?: string;
    descripcion?: string;
    nivelJerarquia?: number;
    esSupervisor?: boolean;
    color?: string;
    esActivo?: boolean;
}
