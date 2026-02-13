import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MENSAJES_EXITO } from '../../common/constants';

export type EstadoEnvio = 'pendiente' | 'preparando' | 'en_transito' | 'entregado' | 'fallido';

@Injectable()
export class EnviosService {
    private readonly logger = new Logger(EnviosService.name);

    constructor(private prisma: PrismaService) {}

    async crearEnvio(pedidoId: number, datos: { transportistaId?: number; costoEnvio: number }) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { id: pedidoId },
        });

        if (!pedido) {
            throw new NotFoundException('Pedido no encontrado');
        }

        const envio = await this.prisma.envio.create({
            data: {
                pedidoId,
                numeroGuia: this.generarNumeroGuia(),
                transportistaId: datos.transportistaId,
                costoEnvio: datos.costoEnvio,
                estado: 'pendiente',
            },
        });

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            envio,
        };
    }

    async obtenerEnvioPedido(pedidoId: number) {
        const envio = await this.prisma.envio.findFirst({
            where: { pedidoId },
            include: {
                transportista: true,
                seguimientos: {
                    orderBy: { fecha: 'desc' },
                },
            },
        });

        if (!envio) {
            throw new NotFoundException('Envío no encontrado');
        }

        return envio;
    }

    async actualizarEstado(envioId: number, nuevoEstado: EstadoEnvio, ubicacion?: string, notas?: string) {
        const envio = await this.prisma.envio.findUnique({
            where: { id: envioId },
        });

        if (!envio) {
            throw new NotFoundException('Envío no encontrado');
        }

        const envioActualizado = await this.prisma.$transaction(async (tx) => {
            const resultado = await tx.envio.update({
                where: { id: envioId },
                data: {
                    estado: nuevoEstado,
                    fechaEntrega: nuevoEstado === 'entregado' ? new Date() : undefined,
                },
            });

            await tx.seguimientoEnvio.create({
                data: {
                    envioId,
                    estado: nuevoEstado,
                    ubicacion,
                    notas,
                },
            });

            if (nuevoEstado === 'entregado') {
                await tx.pedido.update({
                    where: { id: envio.pedidoId },
                    data: { estado: 'entregado' },
                });
            }

            return resultado;
        });

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            envio: envioActualizado,
        };
    }

    async obtenerSeguimiento(numeroGuia: string) {
        const envio = await this.prisma.envio.findUnique({
            where: { numeroGuia },
            include: {
                seguimientos: {
                    orderBy: { fecha: 'desc' },
                },
                pedido: {
                    select: { numeroPedido: true },
                },
            },
        });

        if (!envio) {
            throw new NotFoundException('Número de guía no encontrado');
        }

        return envio;
    }

    async obtenerEnviosPendientes() {
        return this.prisma.envio.findMany({
            where: {
                estado: { in: ['pendiente', 'preparando', 'en_transito'] },
            },
            include: {
                pedido: {
                    select: { numeroPedido: true, clienteId: true },
                },
                transportista: true,
            },
            orderBy: { creadoEn: 'asc' },
        });
    }

    private generarNumeroGuia(): string {
        const fecha = new Date();
        const anio = fecha.getFullYear().toString().slice(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const aleatorio = Math.random().toString(36).substr(2, 8).toUpperCase();
        return `ENV${anio}${mes}${aleatorio}`;
    }
}
