export interface MovimientoInventario {
    id: number;
    productoId: number;
    cantidad: number;
    tipoMovimiento: string;
    motivo: string;
    stockAnterior: number;
    stockNuevo: number;
    usuarioId: number;
    creadoEn: string;
    producto?: ProductoInventario;
    usuario?: UsuarioResumen;
}

export interface ProductoInventario {
    id: number;
    nombre: string;
    sku: string;
    stock: number;
    stockMinimo: number;
    precio: number;
    costo: number | null;
    activo: boolean;
    categoria?: { id: number; nombre: string };
    marca?: { id: number; nombre: string };
    imagenes?: { url: string; esPrincipal: boolean }[];
}

export interface UsuarioResumen {
    id: number;
    nombre: string;
    correo?: string;
}

export interface Almacen {
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    descripcion?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    responsable?: string;
    capacidadMaxima?: number;
    esActivo: boolean;
    creadoEn: string;
}

export interface ConteoInventario {
    id: number;
    almacenId: number;
    codigo: string;
    tipo: string;
    estado: string;
    fechaProgramada: string;
    fechaInicio?: string;
    fechaFin?: string;
    totalProductosContados: number;
    totalDiscrepancias: number;
    totalFaltantes: number;
    totalSobrantes: number;
    almacen?: { id: number; nombre: string };
    responsable?: { id: number; nombre: string };
}

export interface ResumenInventario {
    totalProductos: number;
    productosActivos: number;
    sinStock: number;
    stockBajo: number;
    valorTotalInventario: number;
    valorTotalCosto: number;
    totalMovimientosHoy: number;
    totalMovimientosSemana: number;
    totalMovimientosMes: number;
}

export interface MovimientoPorTipo {
    tipo: string;
    cantidad: number;
    porcentaje: number;
}

export interface ProductoStockCritico {
    id: number;
    nombre: string;
    sku: string;
    stock: number;
    stockMinimo: number;
    precio: number;
    categoria: string;
    estado: 'sin-stock' | 'stock-bajo';
}

export interface MovimientoPorDia {
    fecha: string;
    entradas: number;
    salidas: number;
    ajustes: number;
}

export interface ValorPorCategoria {
    categoria: string;
    valorInventario: number;
    cantidadProductos: number;
    porcentaje: number;
}

export interface TopProducto {
    id: number;
    nombre: string;
    sku: string;
    stock: number;
    totalMovimientos: number;
    valorInventario: number;
}

export interface FiltrosMovimiento {
    busqueda?: string;
    tipoMovimiento?: string;
    productoId?: number;
    fechaInicio?: string;
    fechaFin?: string;
    pagina: number;
    limite: number;
    ordenarPor?: string;
    orden?: 'asc' | 'desc';
}

export interface FiltrosProductoInventario {
    busqueda?: string;
    categoriaId?: number;
    estadoStock?: 'todos' | 'sin-stock' | 'stock-bajo' | 'en-stock';
    activo?: boolean;
    pagina: number;
    limite: number;
}

export interface RespuestaApi<T> {
    exito?: boolean;
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
