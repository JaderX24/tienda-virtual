import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type TipoNotificacion = 'pedido' | 'envio' | 'pago' | 'sistema' | 'promocion';

@Injectable()
export class NotificacionesService {
    private readonly logger = new Logger(NotificacionesService.name);

    constructor(private prisma: PrismaService) {}

    async crear(datos: {
        usuarioId: number;
        tipo: TipoNotificacion;
        titulo: string;
        mensaje: string;
        enlace?: string;
    }) {
        return this.prisma.notificacion.create({
            data: {
                ...datos,
                leida: false,
            },
        });
    }

    async obtenerPorUsuario(usuarioId: number, opciones: { soloNoLeidas?: boolean; pagina?: number; limite?: number } = {}) {
        const { soloNoLeidas, pagina = 1, limite = 20 } = opciones;

        const where: Record<string, unknown> = { usuarioId };
        if (soloNoLeidas) {
            where.leida = false;
        }

        const [notificaciones, total, noLeidas] = await Promise.all([
            this.prisma.notificacion.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { creadoEn: 'desc' },
            }),
            this.prisma.notificacion.count({ where }),
            this.prisma.notificacion.count({ where: { usuarioId, leida: false } }),
        ]);

        return {
            datos: notificaciones,
            meta: {
                total,
                noLeidas,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async marcarComoLeida(id: number, usuarioId: number) {
        const notificacion = await this.prisma.notificacion.findFirst({
            where: { id, usuarioId },
        });

        if (!notificacion) {
            throw new NotFoundException('Notificación no encontrada');
        }

        return this.prisma.notificacion.update({
            where: { id },
            data: { leida: true },
        });
    }

    async marcarTodasComoLeidas(usuarioId: number) {
        await this.prisma.notificacion.updateMany({
            where: { usuarioId, leida: false },
            data: { leida: true },
        });

        return { mensaje: 'Todas las notificaciones marcadas como leídas' };
    }

    async eliminar(id: number, usuarioId: number) {
        const notificacion = await this.prisma.notificacion.findFirst({
            where: { id, usuarioId },
        });

        if (!notificacion) {
            throw new NotFoundException('Notificación no encontrada');
        }

        await this.prisma.notificacion.delete({ where: { id } });

        return { mensaje: 'Notificación eliminada' };
    }

    async contarNoLeidas(usuarioId: number) {
        const cantidad = await this.prisma.notificacion.count({
            where: { usuarioId, leida: false },
        });

        return { noLeidas: cantidad };
    }

    async notificarPedidoCreado(usuarioId: number, numeroPedido: string) {
        return this.crear({
            usuarioId,
            tipo: 'pedido',
            titulo: 'Pedido creado',
            mensaje: `Tu pedido ${numeroPedido} ha sido creado exitosamente.`,
            enlace: `/pedidos/${numeroPedido}`,
        });
    }

    async notificarPedidoEnviado(usuarioId: number, numeroPedido: string, numeroGuia: string) {
        return this.crear({
            usuarioId,
            tipo: 'envio',
            titulo: 'Pedido en camino',
            mensaje: `Tu pedido ${numeroPedido} ha sido enviado. Número de guía: ${numeroGuia}`,
            enlace: `/rastreo/${numeroGuia}`,
        });
    }

    async notificarPedidoEntregado(usuarioId: number, numeroPedido: string) {
        return this.crear({
            usuarioId,
            tipo: 'envio',
            titulo: 'Pedido entregado',
            mensaje: `Tu pedido ${numeroPedido} ha sido entregado. ¡Gracias por tu compra!`,
            enlace: `/pedidos/${numeroPedido}`,
        });
    }
}
