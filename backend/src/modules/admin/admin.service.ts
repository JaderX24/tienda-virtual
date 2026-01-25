import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerEstadisticasGenerales() {
        const [
            totalUsuarios,
            totalProductos,
            totalPedidos,
            totalVentas,
            pedidosPendientes,
            productosStockBajo,
        ] = await Promise.all([
            this.prisma.usuario.count({ where: { activo: true } }),
            this.prisma.producto.count({ where: { activo: true } }),
            this.prisma.pedido.count(),
            this.prisma.pago.aggregate({
                where: { estado: 'completado' },
                _sum: { monto: true },
            }),
            this.prisma.pedido.count({ where: { estado: 'pendiente' } }),
            this.prisma.producto.count({
                where: {
                    activo: true,
                    stock: { lte: 10 },
                },
            }),
        ]);

        return {
            usuarios: totalUsuarios,
            productos: totalProductos,
            pedidos: {
                total: totalPedidos,
                pendientes: pedidosPendientes,
            },
            ventas: {
                total: totalVentas._sum.monto || 0,
            },
            alertas: {
                productosStockBajo,
            },
        };
    }

    async obtenerVentasPorPeriodo(inicio: Date, fin: Date) {
        const pagos = await this.prisma.pago.findMany({
            where: {
                estado: 'completado',
                creadoEn: {
                    gte: inicio,
                    lte: fin,
                },
            },
            select: {
                monto: true,
                creadoEn: true,
            },
            orderBy: { creadoEn: 'asc' },
        });

        const ventasPorDia = pagos.reduce((acc, pago) => {
            const fecha = pago.creadoEn.toISOString().split('T')[0];
            acc[fecha] = (acc[fecha] || 0) + Number(pago.monto);
            return acc;
        }, {} as Record<string, number>);

        return {
            periodo: { inicio, fin },
            ventasPorDia,
            total: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
        };
    }

    async obtenerProductosMasVendidos(limite = 10) {
        const productos = await this.prisma.itemPedido.groupBy({
            by: ['productoId'],
            _sum: { cantidad: true },
            orderBy: { _sum: { cantidad: 'desc' } },
            take: limite,
        });

        const productosConDetalles = await Promise.all(
            productos.map(async (item) => {
                const producto = await this.prisma.producto.findUnique({
                    where: { id: item.productoId },
                    select: { id: true, nombre: true, sku: true, precio: true },
                });
                return {
                    ...producto,
                    cantidadVendida: item._sum.cantidad,
                };
            }),
        );

        return productosConDetalles;
    }

    async obtenerPedidosRecientes(limite = 10) {
        return this.prisma.pedido.findMany({
            take: limite,
            orderBy: { creadoEn: 'desc' },
            include: {
                cliente: {
                    select: { nombre: true, correo: true },
                },
            },
        });
    }

    async obtenerUsuariosRecientes(limite = 10) {
        return this.prisma.usuario.findMany({
            take: limite,
            orderBy: { creadoEn: 'desc' },
            select: {
                id: true,
                nombre: true,
                correo: true,
                creadoEn: true,
                rol: { select: { nombre: true } },
            },
        });
    }
}
