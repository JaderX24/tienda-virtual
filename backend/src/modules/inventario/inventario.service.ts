import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../common/constants';

export interface MovimientoInventario {
    productoId: number;
    cantidad: number;
    tipoMovimiento: 'entrada' | 'salida' | 'ajuste';
    motivo: string;
    usuarioId: number;
}

@Injectable()
export class InventarioService {
    private readonly logger = new Logger(InventarioService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerStockProducto(productoId: number) {
        const producto = await this.prisma.producto.findUnique({
            where: { id: productoId },
            select: {
                id: true,
                nombre: true,
                sku: true,
                stock: true,
                stockMinimo: true,
            },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        return {
            ...producto,
            stockBajo: producto.stock <= (producto.stockMinimo || 0),
        };
    }

    async registrarMovimiento(movimiento: MovimientoInventario) {
        const { productoId, cantidad, tipoMovimiento, motivo, usuarioId } = movimiento;

        const producto = await this.prisma.producto.findUnique({
            where: { id: productoId },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        let nuevoStock = producto.stock || 0;

        if (tipoMovimiento === 'entrada') {
            nuevoStock += cantidad;
        } else if (tipoMovimiento === 'salida') {
            if (nuevoStock < cantidad) {
                throw new BadRequestException(MENSAJES_ERROR.STOCK_INSUFICIENTE);
            }
            nuevoStock -= cantidad;
        } else {
            nuevoStock = cantidad;
        }

        const resultado = await this.prisma.$transaction([
            this.prisma.producto.update({
                where: { id: productoId },
                data: { stock: nuevoStock },
            }),
            this.prisma.movimientoInventario.create({
                data: {
                    productoId,
                    cantidad,
                    tipoMovimiento,
                    motivo,
                    stockAnterior: producto.stock || 0,
                    stockNuevo: nuevoStock,
                    usuarioId,
                },
            }),
        ]);

        return {
            mensaje: 'Movimiento registrado exitosamente',
            stockActual: nuevoStock,
            movimiento: resultado[1],
        };
    }

    async obtenerMovimientos(productoId: number, opciones: { pagina?: number; limite?: number } = {}) {
        const { pagina = 1, limite = 20 } = opciones;

        const [movimientos, total] = await Promise.all([
            this.prisma.movimientoInventario.findMany({
                where: { productoId },
                include: {
                    usuario: {
                        select: { id: true, nombre: true },
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { creadoEn: 'desc' },
            }),
            this.prisma.movimientoInventario.count({ where: { productoId } }),
        ]);

        return {
            datos: movimientos,
            meta: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerProductosStockBajo() {
        return this.prisma.producto.findMany({
            where: {
                activo: true,
                stock: {
                    lte: this.prisma.producto.fields.stockMinimo,
                },
            },
            select: {
                id: true,
                nombre: true,
                sku: true,
                stock: true,
                stockMinimo: true,
            },
            orderBy: { stock: 'asc' },
        });
    }

    async verificarDisponibilidad(productoId: number, cantidadRequerida: number) {
        const producto = await this.prisma.producto.findUnique({
            where: { id: productoId },
            select: { stock: true, activo: true },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        return {
            disponible: producto.activo && (producto.stock || 0) >= cantidadRequerida,
            stockActual: producto.stock || 0,
            cantidadRequerida,
        };
    }
}
