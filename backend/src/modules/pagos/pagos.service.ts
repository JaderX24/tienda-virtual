import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../common/constants';

export type MetodoPago = 'tarjeta' | 'transferencia' | 'efectivo' | 'paypal';
export type EstadoPago = 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'reembolsado';

export interface ProcesarPagoDto {
    pedidoId: number;
    metodoPago: MetodoPago;
    monto: number;
    referencia?: string;
    datosTarjeta?: {
        ultimosDigitos: string;
        marca: string;
    };
}

@Injectable()
export class PagosService {
    private readonly logger = new Logger(PagosService.name);

    constructor(private prisma: PrismaService) {}

    async procesarPago(datos: ProcesarPagoDto) {
        const { pedidoId, metodoPago, monto, referencia, datosTarjeta } = datos;

        const pedido = await this.prisma.pedido.findUnique({
            where: { id: pedidoId },
        });

        if (!pedido) {
            throw new NotFoundException(MENSAJES_ERROR.PEDIDO_NO_ENCONTRADO);
        }

        if (Math.abs(Number(pedido.total) - monto) > 0.01) {
            throw new BadRequestException(MENSAJES_ERROR.MONTO_INVALIDO);
        }

        const pago = await this.prisma.$transaction(async (tx) => {
            const nuevoPago = await tx.pago.create({
                data: {
                    pedidoId,
                    metodoPago,
                    monto,
                    estado: 'completado',
                    referencia: referencia || this.generarReferencia(),
                    ultimosDigitosTarjeta: datosTarjeta?.ultimosDigitos,
                    marcaTarjeta: datosTarjeta?.marca,
                },
            });

            await tx.pedido.update({
                where: { id: pedidoId },
                data: { estado: 'confirmado' },
            });

            return nuevoPago;
        });

        return {
            mensaje: MENSAJES_EXITO.PAGO_PROCESADO,
            pago,
        };
    }

    async obtenerPagoPedido(pedidoId: number) {
        const pago = await this.prisma.pago.findFirst({
            where: { pedidoId },
            include: {
                pedido: {
                    select: { numeroPedido: true, total: true },
                },
            },
        });

        if (!pago) {
            throw new NotFoundException('Pago no encontrado');
        }

        return pago;
    }

    async obtenerHistorialPagos(filtros: { estado?: EstadoPago; pagina?: number; limite?: number } = {}) {
        const { estado, pagina = 1, limite = 20 } = filtros;

        const where: Record<string, unknown> = {};
        if (estado) where.estado = estado;

        const [pagos, total] = await Promise.all([
            this.prisma.pago.findMany({
                where,
                include: {
                    pedido: {
                        select: { numeroPedido: true, clienteId: true },
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { creadoEn: 'desc' },
            }),
            this.prisma.pago.count({ where }),
        ]);

        return {
            datos: pagos,
            meta: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async procesarReembolso(pagoId: number, motivo: string) {
        const pago = await this.prisma.pago.findUnique({
            where: { id: pagoId },
            include: { pedido: true },
        });

        if (!pago) {
            throw new NotFoundException('Pago no encontrado');
        }

        if (pago.estado !== 'completado') {
            throw new BadRequestException('Solo se pueden reembolsar pagos completados');
        }

        const pagoActualizado = await this.prisma.$transaction(async (tx) => {
            const resultado = await tx.pago.update({
                where: { id: pagoId },
                data: {
                    estado: 'reembolsado',
                    motivoReembolso: motivo,
                    fechaReembolso: new Date(),
                },
            });

            await tx.pedido.update({
                where: { id: pago.pedidoId },
                data: { estado: 'cancelado' },
            });

            return resultado;
        });

        return {
            mensaje: MENSAJES_EXITO.REEMBOLSO_PROCESADO,
            pago: pagoActualizado,
        };
    }

    private generarReferencia(): string {
        const fecha = new Date();
        const timestamp = fecha.getTime().toString(36).toUpperCase();
        const aleatorio = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `PAG-${timestamp}-${aleatorio}`;
    }
}
