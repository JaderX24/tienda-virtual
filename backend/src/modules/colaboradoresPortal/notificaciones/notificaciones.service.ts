import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';
import { FiltrosNotificacionesDto } from './dto';

@Injectable()
export class NotificacionesColaboradorService {
    constructor(private readonly prisma: PrismaService) {}

    // Obtener notificaciones paginadas
    async obtenerNotificaciones(usuarioId: number, filtros: FiltrosNotificacionesDto) {
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const saltar = (pagina - 1) * limite;

        const where: any = {
            usuarioId,
            archivada: filtros.archivada ?? false,
        };

        if (filtros.tipo) where.tipo = filtros.tipo;
        if (filtros.leida !== undefined) where.leida = filtros.leida;

        if (filtros.busqueda) {
            where.OR = [
                { titulo: { contains: filtros.busqueda } },
                { mensaje: { contains: filtros.busqueda } },
            ];
        }

        // Excluir expiradas
        where.OR = where.OR || [];
        where.AND = [
            {
                OR: [
                    { expiraEn: null },
                    { expiraEn: { gte: new Date() } },
                ],
            },
        ];

        if (filtros.busqueda) {
            where.AND.push({
                OR: [
                    { titulo: { contains: filtros.busqueda } },
                    { mensaje: { contains: filtros.busqueda } },
                ],
            });
            delete where.OR;
        }

        const [registros, total] = await Promise.all([
            this.prisma.colabNotificacion.findMany({
                where,
                orderBy: { creadoEn: 'desc' },
                skip: saltar,
                take: limite,
            }),
            this.prisma.colabNotificacion.count({ where }),
        ]);

        const notificaciones = registros.map((n) => this.formatearNotificacion(n));

        return {
            exito: true,
            datos: notificaciones,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    // Obtener las últimas N para el dropdown de la campana
    async obtenerRecientes(usuarioId: number) {
        const [notificaciones, totalSinLeer] = await Promise.all([
            this.prisma.colabNotificacion.findMany({
                where: {
                    usuarioId,
                    archivada: false,
                    OR: [
                        { expiraEn: null },
                        { expiraEn: { gte: new Date() } },
                    ],
                },
                orderBy: { creadoEn: 'desc' },
                take: 8,
            }),
            this.prisma.colabNotificacion.count({
                where: {
                    usuarioId,
                    leida: false,
                    archivada: false,
                    OR: [
                        { expiraEn: null },
                        { expiraEn: { gte: new Date() } },
                    ],
                },
            }),
        ]);

        return {
            exito: true,
            datos: {
                notificaciones: notificaciones.map((n) => this.formatearNotificacion(n)),
                totalSinLeer,
            },
        };
    }

    // Contador de no leídas
    async obtenerContadorSinLeer(usuarioId: number) {
        const total = await this.prisma.colabNotificacion.count({
            where: {
                usuarioId,
                leida: false,
                archivada: false,
                OR: [
                    { expiraEn: null },
                    { expiraEn: { gte: new Date() } },
                ],
            },
        });

        return { exito: true, datos: { totalSinLeer: total } };
    }

    // Marcar una notificación como leída
    async marcarComoLeida(usuarioId: number, notificacionId: bigint) {
        await this.prisma.colabNotificacion.updateMany({
            where: { id: notificacionId, usuarioId },
            data: { leida: true, leidaEn: new Date() },
        });

        return { exito: true, mensaje: 'Notificación marcada como leída' };
    }

    // Marcar todas como leídas
    async marcarTodasComoLeidas(usuarioId: number) {
        const resultado = await this.prisma.colabNotificacion.updateMany({
            where: { usuarioId, leida: false, archivada: false },
            data: { leida: true, leidaEn: new Date() },
        });

        return {
            exito: true,
            mensaje: `${resultado.count} notificaciones marcadas como leídas`,
            datos: { actualizadas: resultado.count },
        };
    }

    // Marcar seleccionadas como leídas
    async marcarSeleccionadasComoLeidas(usuarioId: number, ids: string[]) {
        const idsBigInt = ids.map((id) => BigInt(id));

        const resultado = await this.prisma.colabNotificacion.updateMany({
            where: { id: { in: idsBigInt }, usuarioId },
            data: { leida: true, leidaEn: new Date() },
        });

        return {
            exito: true,
            mensaje: `${resultado.count} notificaciones marcadas como leídas`,
            datos: { actualizadas: resultado.count },
        };
    }

    // Archivar una notificación
    async archivarNotificacion(usuarioId: number, notificacionId: bigint) {
        await this.prisma.colabNotificacion.updateMany({
            where: { id: notificacionId, usuarioId },
            data: { archivada: true, archivadaEn: new Date() },
        });

        return { exito: true, mensaje: 'Notificación archivada' };
    }

    // Archivar todas las leídas
    async archivarTodasLeidas(usuarioId: number) {
        const resultado = await this.prisma.colabNotificacion.updateMany({
            where: { usuarioId, leida: true, archivada: false },
            data: { archivada: true, archivadaEn: new Date() },
        });

        return {
            exito: true,
            mensaje: `${resultado.count} notificaciones archivadas`,
            datos: { archivadas: resultado.count },
        };
    }

    // Eliminar una notificación
    async eliminarNotificacion(usuarioId: number, notificacionId: bigint) {
        await this.prisma.colabNotificacion.deleteMany({
            where: { id: notificacionId, usuarioId },
        });

        return { exito: true, mensaje: 'Notificación eliminada' };
    }

    // --- Utilidades privadas ---

    private formatearNotificacion(n: any) {
        return {
            id: n.id.toString(),
            titulo: n.titulo,
            mensaje: n.mensaje,
            tipo: n.tipo,
            prioridad: n.prioridad,
            icono: this.obtenerIcono(n.tipo),
            urlAccion: n.urlAccion,
            textoAccion: n.textoAccion,
            leida: n.leida,
            leidaEn: n.leidaEn,
            archivada: n.archivada,
            fecha: n.creadoEn,
        };
    }

    private obtenerIcono(tipo: string): string {
        const iconos: Record<string, string> = {
            info: 'bi-info-circle-fill',
            success: 'bi-check-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            danger: 'bi-x-octagon-fill',
            sistema: 'bi-gear-fill',
        };
        return iconos[tipo] || 'bi-bell-fill';
    }
}
