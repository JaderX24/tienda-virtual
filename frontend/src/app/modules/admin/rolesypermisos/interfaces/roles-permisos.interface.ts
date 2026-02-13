export interface Rol {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}

export interface Permiso {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    modulo: string;
}

export interface PermisoAgrupado {
    modulo: string;
    nombreModulo: string;
    permisos: PermisoConEstado[];
}

export interface PermisoConEstado extends Permiso {
    asignado: boolean;
}

export interface AsignarPermisosDto {
    permisoIds: number[];
}

export interface RespuestaApi<T> {
    exito: boolean;
    mensaje?: string;
    datos: T;
}

export const MODULOS_NOMBRES: Record<string, string> = {
    'admin': 'Administración',
    'usuarios': 'Usuarios',
    'roles': 'Roles',
    'productos': 'Productos',
    'categorias': 'Categorías',
    'marcas': 'Marcas',
    'inventario': 'Inventario',
    'pedidos': 'Pedidos',
    'clientes': 'Clientes',
    'cupones': 'Cupones y Promociones',
    'envios': 'Envíos',
    'pagos': 'Pagos',
    'reportes': 'Reportes',
    'configuracion': 'Configuración'
};
