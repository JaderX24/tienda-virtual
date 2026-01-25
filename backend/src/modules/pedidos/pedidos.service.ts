import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../common/constants';

export type EstadoPedido = 'pendiente' | 'confirmado' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';

export interface ItemPedido {
    productoId: number;
    cantidad: number;
    precioUnitario: number;
}

export interface CrearPedidoDto {
    clienteId: number;
    direccionEnvioId: number;
    items: ItemPedido[];
    notas?: string;
}

@Injectable()
export class PedidosService {
    private readonly logger = new Logger(PedidosService.name);

    constructor(private prisma: PrismaService) {}

    async crear(datos: CrearPedidoDto) {
        const { clienteId, direccionEnvioId, items, notas } = datos;

        if (!items || items.length === 0) {
            throw new BadRequestException(MENSAJES_ERROR.CARRITO_VACIO);
        }

        const productosIds = items.map(item => item.productoId);
        const productos = await this.prisma.producto.findMany({
            where: { id: { in: productosIds } },
        });

        for (const item of items) {
            const producto = productos.find(p => p.id === item.productoId);
            if (!producto) {
                throw new NotFoundException(`Producto ${item.productoId} no encontrado`);
            }
            if ((producto.stock || 0) < item.cantidad) {
                throw new BadRequestException(`Stock insuficiente para ${producto.nombre}`);
            }
        }

        const subtotal = items.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
        const impuestos = subtotal * 0.15;
        const total = subtotal + impuestos;

        const pedido = await this.prisma.$transaction(async (tx) => {
            const nuevoPedido = await tx.pedido.create({
                data: {
                    numeroPedido: this.generarNumeroPedido(),
                    clienteId,
                    direccionEnvioId,
                    subtotal,
                    impuestos,
                    total,
                    estado: 'pendiente',
                    notas,
                    items: {
                        create: items.map(item => ({
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.precioUnitario * item.cantidad,
                        })),
                    },
                },
                include: {
                    items: {
                        include: { producto: true },
                    },
                },
            });

            for (const item of items) {
                await tx.producto.update({
                    where: { id: item.productoId },
                    data: {
                        stock: { decrement: item.cantidad },
                    },
                });
            }

            return nuevoPedido;
        });

        return {
            mensaje: MENSAJES_EXITO.PEDIDO_CREADO,
            pedido,
        };
    }

    async obtenerPorId(id: number) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { id },
            include: {
                cliente: {
                    select: { id: true, nombre: true, correo: true },
                },
                items: {
                    include: { producto: true },
                },
                direccionEnvio: true,
            },
        });

        if (!pedido) {
            throw new NotFoundException(MENSAJES_ERROR.PEDIDO_NO_ENCONTRADO);
        }

        return pedido;
    }

    async obtenerPedidosCliente(clienteId: number, opciones: { pagina?: number; limite?: number } = {}) {
        const { pagina = 1, limite = 20 } = opciones;

        const [pedidos, total] = await Promise.all([
            this.prisma.pedido.findMany({
                where: { clienteId },
                include: {
                    items: {
                        include: { producto: true },
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { creadoEn: 'desc' },
            }),
            this.prisma.pedido.count({ where: { clienteId } }),
        ]);

        return {
            datos: pedidos,
            meta: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerTodos(filtros: { estado?: EstadoPedido; pagina?: number; limite?: number } = {}) {
        const { estado, pagina = 1, limite = 20 } = filtros;

        const where: Record<string, unknown> = {};
        if (estado) where.estado = estado;

        const [pedidos, total] = await Promise.all([
            this.prisma.pedido.findMany({
                where,
                include: {
                    cliente: {
                        select: { id: true, nombre: true, correo: true },
                    },
                    items: true,
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { creadoEn: 'desc' },
            }),
            this.prisma.pedido.count({ where }),
        ]);

        return {
            datos: pedidos,
            meta: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async actualizarEstado(id: number, nuevoEstado: EstadoPedido) {
        const pedido = await this.prisma.pedido.findUnique({ where: { id } });

        if (!pedido) {
            throw new NotFoundException(MENSAJES_ERROR.PEDIDO_NO_ENCONTRADO);
        }

        const transicionesValidas: Record<string, string[]> = {
            pendiente: ['confirmado', 'cancelado'],
            confirmado: ['procesando', 'cancelado'],
            procesando: ['enviado', 'cancelado'],
            enviado: ['entregado'],
            entregado: [],
            cancelado: [],
        };

        if (!transicionesValidas[pedido.estado]?.includes(nuevoEstado)) {
            throw new BadRequestException(
                `No se puede cambiar de '${pedido.estado}' a '${nuevoEstado}'`
            );
        }

        const pedidoActualizado = await this.prisma.pedido.update({
            where: { id },
            data: { estado: nuevoEstado },
            include: {
                items: {
                    include: { producto: true },
                },
            },
        });

        const mensajes: Record<string, string> = {
            confirmado: MENSAJES_EXITO.PEDIDO_CONFIRMADO,
            enviado: MENSAJES_EXITO.PEDIDO_ENVIADO,
            entregado: MENSAJES_EXITO.PEDIDO_ENTREGADO,
            cancelado: MENSAJES_EXITO.PEDIDO_CANCELADO,
        };

        return {
            mensaje: mensajes[nuevoEstado] || MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            pedido: pedidoActualizado,
        };
    }

    async cancelar(id: number, motivo: string) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!pedido) {
            throw new NotFoundException(MENSAJES_ERROR.PEDIDO_NO_ENCONTRADO);
        }

        if (['enviado', 'entregado', 'cancelado'].includes(pedido.estado)) {
            throw new BadRequestException(MENSAJES_ERROR.PEDIDO_NO_MODIFICABLE);
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.pedido.update({
                where: { id },
                data: {
                    estado: 'cancelado',
                    motivoCancelacion: motivo,
                },
            });

            for (const item of pedido.items) {
                await tx.producto.update({
                    where: { id: item.productoId },
                    data: {
                        stock: { increment: item.cantidad },
                    },
                });
            }
        });

        return { mensaje: MENSAJES_EXITO.PEDIDO_CANCELADO };
    }

    private generarNumeroPedido(): string {
        const fecha = new Date();
        const anio = fecha.getFullYear().toString().slice(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const aleatorio = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `PED-${anio}${mes}-${aleatorio}`;
    }
}
