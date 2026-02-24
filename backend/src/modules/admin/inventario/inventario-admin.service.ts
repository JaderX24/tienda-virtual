import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';
import { FiltroMovimientosDto, RegistrarMovimientoDto, AjustarStockDto } from './dto';

@Injectable()
export class InventarioAdminService {
    private readonly logger = new Logger(InventarioAdminService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerResumen() {
        const [
            totalProductos,
            productosActivos,
            sinStock,
            stockBajo,
            productosConValor,
            movimientosHoy,
            movimientosSemana,
            movimientosMes,
        ] = await Promise.all([
            this.prisma.producto.count(),
            this.prisma.producto.count({ where: { activo: true } }),
            this.prisma.producto.count({ where: { stock: 0, activo: true } }),
            this.contarStockBajo(),
            this.prisma.producto.findMany({
                where: { activo: true },
                select: { precio: true, costo: true, stock: true },
            }),
            this.contarMovimientosPeriodo('hoy'),
            this.contarMovimientosPeriodo('semana'),
            this.contarMovimientosPeriodo('mes'),
        ]);

        let valorTotalInventario = 0;
        let valorTotalCosto = 0;

        for (const p of productosConValor) {
            valorTotalInventario += Number(p.precio) * p.stock;
            valorTotalCosto += (p.costo ? Number(p.costo) : 0) * p.stock;
        }

        return {
            totalProductos,
            productosActivos,
            sinStock,
            stockBajo,
            valorTotalInventario: Math.round(valorTotalInventario * 100) / 100,
            valorTotalCosto: Math.round(valorTotalCosto * 100) / 100,
            totalMovimientosHoy: movimientosHoy,
            totalMovimientosSemana: movimientosSemana,
            totalMovimientosMes: movimientosMes,
        };
    }

    async obtenerMovimientos(filtros: FiltroMovimientosDto) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const skip = (pagina - 1) * limite;

        const where: any = {};

        if (filtros.tipoMovimiento) {
            where.tipoMovimiento = filtros.tipoMovimiento;
        }

        if (filtros.productoId) {
            where.productoId = filtros.productoId;
        }

        if (filtros.fechaInicio || filtros.fechaFin) {
            where.creadoEn = {};
            if (filtros.fechaInicio) {
                where.creadoEn.gte = new Date(filtros.fechaInicio);
            }
            if (filtros.fechaFin) {
                const fechaFin = new Date(filtros.fechaFin);
                fechaFin.setHours(23, 59, 59, 999);
                where.creadoEn.lte = fechaFin;
            }
        }

        if (filtros.busqueda?.trim()) {
            where.OR = [
                { motivo: { contains: filtros.busqueda.trim() } },
                { producto: { nombre: { contains: filtros.busqueda.trim() } } },
                { producto: { sku: { contains: filtros.busqueda.trim() } } },
            ];
        }

        const ordenarPor = filtros.ordenarPor || 'creadoEn';
        const orden = filtros.orden || 'desc';

        const [movimientos, total] = await Promise.all([
            this.prisma.movimientoInventario.findMany({
                where,
                skip,
                take: limite,
                orderBy: { [ordenarPor]: orden },
                include: {
                    producto: {
                        select: { id: true, nombre: true, sku: true, stock: true, stockMinimo: true, precio: true, costo: true, activo: true },
                    },
                    usuario: {
                        select: { id: true, nombre: true, correo: true },
                    },
                },
            }),
            this.prisma.movimientoInventario.count({ where }),
        ]);

        const datosFormateados = movimientos.map(m => ({
            ...m,
            producto: m.producto ? {
                ...m.producto,
                precio: Number(m.producto.precio),
                costo: m.producto.costo ? Number(m.producto.costo) : null,
            } : undefined,
        }));

        return {
            datos: datosFormateados,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async registrarMovimiento(dto: RegistrarMovimientoDto, usuarioId: number) {
        const producto = await this.prisma.producto.findUnique({
            where: { id: dto.productoId },
            select: { id: true, nombre: true, stock: true },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        let stockNuevo: number;

        if (dto.tipoMovimiento === 'entrada' || dto.tipoMovimiento === 'devolucion') {
            stockNuevo = producto.stock + dto.cantidad;
        } else if (dto.tipoMovimiento === 'salida') {
            if (producto.stock < dto.cantidad) {
                throw new BadRequestException(MENSAJES_ERROR.STOCK_INSUFICIENTE);
            }
            stockNuevo = producto.stock - dto.cantidad;
        } else {
            stockNuevo = dto.cantidad;
        }

        const movimiento = await this.prisma.$transaction(async (tx) => {
            const nuevoMovimiento = await tx.movimientoInventario.create({
                data: {
                    productoId: dto.productoId,
                    cantidad: dto.cantidad,
                    tipoMovimiento: dto.tipoMovimiento,
                    motivo: dto.motivo,
                    stockAnterior: producto.stock,
                    stockNuevo,
                    usuarioId,
                },
                include: {
                    producto: {
                        select: { id: true, nombre: true, sku: true, stock: true, stockMinimo: true, precio: true, costo: true },
                    },
                    usuario: {
                        select: { id: true, nombre: true },
                    },
                },
            });

            await tx.producto.update({
                where: { id: dto.productoId },
                data: { stock: stockNuevo },
            });

            return nuevoMovimiento;
        });

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            datos: {
                ...movimiento,
                producto: movimiento.producto ? {
                    ...movimiento.producto,
                    precio: Number(movimiento.producto.precio),
                    costo: movimiento.producto.costo ? Number(movimiento.producto.costo) : null,
                } : undefined,
            },
        };
    }

    async ajustarStock(productoId: number, dto: AjustarStockDto, usuarioId: number) {
        const producto = await this.prisma.producto.findUnique({
            where: { id: productoId },
            select: { id: true, nombre: true, stock: true },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        const stockNuevo = dto.cantidad;

        const resultado = await this.prisma.$transaction(async (tx) => {
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    productoId,
                    cantidad: Math.abs(stockNuevo - producto.stock),
                    tipoMovimiento: 'ajuste',
                    motivo: dto.motivo,
                    stockAnterior: producto.stock,
                    stockNuevo,
                    usuarioId,
                },
            });

            await tx.producto.update({
                where: { id: productoId },
                data: { stock: stockNuevo },
            });

            return movimiento;
        });

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            datos: resultado,
        };
    }

    async obtenerEstadisticasPorTipo() {
        const movimientos = await this.prisma.movimientoInventario.groupBy({
            by: ['tipoMovimiento'],
            _count: { id: true },
        });

        const total = movimientos.reduce((sum, m) => sum + m._count.id, 0);

        return movimientos.map(m => ({
            tipo: m.tipoMovimiento,
            cantidad: m._count.id,
            porcentaje: total > 0 ? Math.round((m._count.id / total) * 100) : 0,
        }));
    }

    async obtenerStockCritico() {
        const productos = await this.prisma.producto.findMany({
            where: {
                activo: true,
                OR: [
                    { stock: 0 },
                    { stock: { lte: this.prisma.producto.fields?.stockMinimo as any } },
                ],
            },
            select: {
                id: true,
                nombre: true,
                sku: true,
                stock: true,
                stockMinimo: true,
                precio: true,
                categoria: { select: { nombre: true } },
            },
            orderBy: { stock: 'asc' },
            take: 50,
        });

        // Prisma no permite comparar columnas directamente, filtrar en memoria
        const productosFiltrados = await this.prisma.producto.findMany({
            where: { activo: true },
            select: {
                id: true,
                nombre: true,
                sku: true,
                stock: true,
                stockMinimo: true,
                precio: true,
                categoria: { select: { nombre: true } },
            },
            orderBy: { stock: 'asc' },
        });

        return productosFiltrados
            .filter(p => p.stock <= p.stockMinimo)
            .slice(0, 50)
            .map(p => ({
                id: p.id,
                nombre: p.nombre,
                sku: p.sku,
                stock: p.stock,
                stockMinimo: p.stockMinimo,
                precio: Number(p.precio),
                categoria: p.categoria?.nombre || 'Sin categoría',
                estado: p.stock === 0 ? 'sin-stock' : 'stock-bajo',
            }));
    }

    async obtenerMovimientosPorDia(dias: number = 30) {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - dias);
        fechaInicio.setHours(0, 0, 0, 0);

        const movimientos = await this.prisma.movimientoInventario.findMany({
            where: { creadoEn: { gte: fechaInicio } },
            select: {
                tipoMovimiento: true,
                cantidad: true,
                creadoEn: true,
            },
            orderBy: { creadoEn: 'asc' },
        });

        const mapaFechas = new Map<string, { entradas: number; salidas: number; ajustes: number }>();

        // Inicializar todos los días del rango
        for (let i = 0; i <= dias; i++) {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fecha.getDate() + i);
            const clave = fecha.toISOString().split('T')[0];
            mapaFechas.set(clave, { entradas: 0, salidas: 0, ajustes: 0 });
        }

        for (const m of movimientos) {
            const clave = m.creadoEn.toISOString().split('T')[0];
            const dia = mapaFechas.get(clave);
            if (!dia) continue;

            if (m.tipoMovimiento === 'entrada' || m.tipoMovimiento === 'devolucion') {
                dia.entradas += m.cantidad;
            } else if (m.tipoMovimiento === 'salida') {
                dia.salidas += m.cantidad;
            } else {
                dia.ajustes += m.cantidad;
            }
        }

        return Array.from(mapaFechas.entries()).map(([fecha, valores]) => ({
            fecha,
            ...valores,
        }));
    }

    async obtenerValorPorCategoria() {
        const productos = await this.prisma.producto.findMany({
            where: { activo: true },
            select: {
                precio: true,
                stock: true,
                categoria: { select: { nombre: true } },
            },
        });

        const mapaCategorias = new Map<string, { valorInventario: number; cantidadProductos: number }>();

        for (const p of productos) {
            const nombreCategoria = p.categoria?.nombre || 'Sin categoría';
            const actual = mapaCategorias.get(nombreCategoria) || { valorInventario: 0, cantidadProductos: 0 };
            actual.valorInventario += Number(p.precio) * p.stock;
            actual.cantidadProductos += 1;
            mapaCategorias.set(nombreCategoria, actual);
        }

        const valorTotal = Array.from(mapaCategorias.values()).reduce((sum, c) => sum + c.valorInventario, 0);

        return Array.from(mapaCategorias.entries())
            .map(([categoria, valores]) => ({
                categoria,
                valorInventario: Math.round(valores.valorInventario * 100) / 100,
                cantidadProductos: valores.cantidadProductos,
                porcentaje: valorTotal > 0 ? Math.round((valores.valorInventario / valorTotal) * 100) : 0,
            }))
            .sort((a, b) => b.valorInventario - a.valorInventario);
    }

    async obtenerTopProductos(limite: number = 10) {
        const productos = await this.prisma.producto.findMany({
            where: { activo: true },
            select: {
                id: true,
                nombre: true,
                sku: true,
                stock: true,
                precio: true,
                _count: { select: { movimientosInventario: true } },
            },
            orderBy: { stock: 'desc' },
            take: limite,
        });

        // Reordenar por valor de inventario
        const datosConValor = productos.map(p => ({
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            stock: p.stock,
            totalMovimientos: p._count.movimientosInventario,
            valorInventario: Math.round(Number(p.precio) * p.stock * 100) / 100,
        }));

        datosConValor.sort((a, b) => b.valorInventario - a.valorInventario);

        return datosConValor.slice(0, limite);
    }

    // Métodos privados auxiliares

    private async contarStockBajo(): Promise<number> {
        const productos = await this.prisma.producto.findMany({
            where: { activo: true, stock: { gt: 0 } },
            select: { stock: true, stockMinimo: true },
        });
        return productos.filter(p => p.stock <= p.stockMinimo).length;
    }

    private async contarMovimientosPeriodo(periodo: 'hoy' | 'semana' | 'mes'): Promise<number> {
        const ahora = new Date();
        let fechaInicio: Date;

        if (periodo === 'hoy') {
            fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        } else if (periodo === 'semana') {
            fechaInicio = new Date(ahora);
            fechaInicio.setDate(ahora.getDate() - 7);
        } else {
            fechaInicio = new Date(ahora);
            fechaInicio.setDate(ahora.getDate() - 30);
        }

        return this.prisma.movimientoInventario.count({
            where: { creadoEn: { gte: fechaInicio } },
        });
    }
}
