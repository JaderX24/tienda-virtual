import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardColaboradorService {
    private readonly logger = new Logger(DashboardColaboradorService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerResumen(usuarioId: number) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);

        const [
            operacionesHoy,
            operacionesAyer,
            productosHoy,
            productosAyer,
            transferenciasHoy,
            alertasStock,
        ] = await Promise.all([
            this.contarOperaciones(usuarioId, hoy, manana),
            this.contarOperaciones(usuarioId, ayer, hoy),
            this.contarProductosProcesados(usuarioId, hoy, manana),
            this.contarProductosProcesados(usuarioId, ayer, hoy),
            this.contarTransferencias(usuarioId, hoy, manana),
            this.contarAlertasStock(),
        ]);

        const tendenciaOperaciones = this.calcularTendencia(operacionesHoy, operacionesAyer);
        const tendenciaProductos = this.calcularTendencia(productosHoy, productosAyer);

        return {
            exito: true,
            datos: {
                tarjetas: [
                    {
                        titulo: 'Operaciones Hoy',
                        valor: operacionesHoy,
                        icono: 'bi-clipboard-check',
                        color: 'primary',
                        tendencia: tendenciaOperaciones.texto,
                        tendenciaPositiva: tendenciaOperaciones.positiva,
                    },
                    {
                        titulo: 'Productos Procesados',
                        valor: productosHoy,
                        icono: 'bi-box-seam',
                        color: 'success',
                        tendencia: tendenciaProductos.texto,
                        tendenciaPositiva: tendenciaProductos.positiva,
                    },
                    {
                        titulo: 'Transferencias',
                        valor: transferenciasHoy,
                        icono: 'bi-arrow-left-right',
                        color: 'info',
                    },
                    {
                        titulo: 'Alertas Pendientes',
                        valor: alertasStock,
                        icono: 'bi-exclamation-triangle',
                        color: 'warning',
                    },
                ],
            },
        };
    }

    async obtenerActividadReciente(usuarioId: number, limite: number = 10) {
        const actividades = await this.prisma.colabActividadInventario.findMany({
            where: { usuarioId },
            orderBy: { creadoEn: 'desc' },
            take: limite,
            include: {
                producto: { select: { nombre: true, sku: true } },
                almacen: { select: { nombre: true } },
            },
        });

        const actividadesFormateadas = actividades.map((act) => ({
            id: act.id.toString(),
            descripcion: this.formatearDescripcionActividad(act),
            hora: this.formatearTiempoRelativo(act.creadoEn),
            fecha: act.creadoEn,
            icono: this.obtenerIconoOperacion(act.tipoOperacion),
            color: this.obtenerColorOperacion(act.tipoOperacion),
            tipo: act.tipoOperacion,
            producto: act.producto?.nombre || '',
            almacen: act.almacen?.nombre || '',
            cantidad: act.cantidad,
        }));

        return {
            exito: true,
            datos: actividadesFormateadas,
        };
    }

    async obtenerTareasDia(usuarioId: number) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        // Conteos de inventario asignados
        const conteos = await this.prisma.colabConteoInventario.findMany({
            where: {
                responsableId: usuarioId,
                fechaProgramada: { gte: hoy, lt: manana },
            },
            include: {
                almacen: { select: { nombre: true } },
            },
            orderBy: { fechaProgramada: 'asc' },
        });

        // Turnos programados para hoy
        const turnos = await this.prisma.colabTurno.findMany({
            where: {
                usuarioId,
                fecha: { gte: hoy, lt: manana },
            },
            include: {
                almacen: { select: { nombre: true } },
            },
            orderBy: { horaInicioProgramada: 'asc' },
        });

        const tareas = [
            ...turnos.map((turno) => ({
                id: `turno-${turno.id}`,
                tarea: `Turno en ${turno.almacen.nombre}`,
                tipo: 'turno' as const,
                completada: turno.estado === 'finalizado',
                estado: turno.estado,
            })),
            ...conteos.map((conteo) => ({
                id: `conteo-${conteo.id}`,
                tarea: `Conteo de inventario - ${conteo.almacen.nombre}`,
                tipo: 'conteo' as const,
                completada: conteo.estado === 'completado' || conteo.estado === 'aprobado',
                estado: conteo.estado,
            })),
        ];

        return {
            exito: true,
            datos: tareas,
        };
    }

    async obtenerTurnoActual(usuarioId: number) {
        const ahora = new Date();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const turno = await this.prisma.colabTurno.findFirst({
            where: {
                usuarioId,
                fecha: { gte: hoy, lt: manana },
                estado: { in: ['programado', 'en_curso'] },
            },
            include: {
                almacen: { select: { nombre: true, codigo: true } },
            },
            orderBy: { horaInicioProgramada: 'asc' },
        });

        if (!turno) {
            return {
                exito: true,
                datos: null,
                mensaje: 'No hay turno programado para hoy',
            };
        }

        return {
            exito: true,
            datos: {
                id: turno.id,
                almacen: turno.almacen.nombre,
                codigoAlmacen: turno.almacen.codigo,
                estado: turno.estado,
                horaInicio: turno.horaInicioProgramada,
                horaFin: turno.horaFinProgramada,
                horaEntrada: turno.horaEntrada,
                horaSalida: turno.horaSalida,
            },
        };
    }

    async obtenerNotificacionesRecientes(usuarioId: number, limite: number = 5) {
        const notificaciones = await this.prisma.colabNotificacion.findMany({
            where: {
                usuarioId,
                archivada: false,
            },
            orderBy: { creadoEn: 'desc' },
            take: limite,
            select: {
                id: true,
                titulo: true,
                mensaje: true,
                tipo: true,
                prioridad: true,
                leida: true,
                urlAccion: true,
                creadoEn: true,
            },
        });

        const sinLeer = await this.prisma.colabNotificacion.count({
            where: {
                usuarioId,
                leida: false,
                archivada: false,
            },
        });

        return {
            exito: true,
            datos: {
                notificaciones: notificaciones.map((n) => ({
                    ...n,
                    id: n.id.toString(),
                })),
                sinLeer,
            },
        };
    }

    // Métodos auxiliares

    private async contarOperaciones(
        usuarioId: number,
        desde: Date,
        hasta: Date,
    ): Promise<number> {
        return this.prisma.colabActividadInventario.count({
            where: {
                usuarioId,
                creadoEn: { gte: desde, lt: hasta },
            },
        });
    }

    private async contarProductosProcesados(
        usuarioId: number,
        desde: Date,
        hasta: Date,
    ): Promise<number> {
        const resultado = await this.prisma.colabActividadInventario.aggregate({
            where: {
                usuarioId,
                creadoEn: { gte: desde, lt: hasta },
            },
            _sum: { cantidad: true },
        });
        return resultado._sum.cantidad || 0;
    }

    private async contarTransferencias(
        usuarioId: number,
        desde: Date,
        hasta: Date,
    ): Promise<number> {
        return this.prisma.colabActividadInventario.count({
            where: {
                usuarioId,
                tipoOperacion: { in: ['transferencia_salida', 'transferencia_entrada'] },
                creadoEn: { gte: desde, lt: hasta },
            },
        });
    }

    private async contarAlertasStock(): Promise<number> {
        const resultado = await this.prisma.$queryRaw<[{ total: bigint }]>`
            SELECT COUNT(*) as total FROM productos
            WHERE activo = 1 AND stock <= stock_minimo
        `;
        return Number(resultado[0]?.total || 0);
    }

    private calcularTendencia(
        actual: number,
        anterior: number,
    ): { texto: string; positiva: boolean } {
        if (anterior === 0) {
            return actual > 0
                ? { texto: '+100%', positiva: true }
                : { texto: '0%', positiva: true };
        }

        const porcentaje = Math.round(((actual - anterior) / anterior) * 100);
        const signo = porcentaje >= 0 ? '+' : '';
        return {
            texto: `${signo}${porcentaje}%`,
            positiva: porcentaje >= 0,
        };
    }

    private formatearDescripcionActividad(actividad: any): string {
        const producto = actividad.producto?.nombre || 'Producto desconocido';
        const almacen = actividad.almacen?.nombre || '';

        const descripciones: Record<string, string> = {
            entrada: `Entrada de mercancía - ${producto}`,
            salida: `Salida de mercancía - ${producto}`,
            ajuste_positivo: `Ajuste positivo de inventario - ${producto}`,
            ajuste_negativo: `Ajuste negativo de inventario - ${producto}`,
            transferencia_salida: `Transferencia enviada - ${producto} desde ${almacen}`,
            transferencia_entrada: `Transferencia recibida - ${producto} en ${almacen}`,
            conteo: `Conteo de inventario - ${producto}`,
            recepcion: `Recepción de mercancía - ${producto}`,
            despacho: `Despacho preparado - ${producto}`,
            devolucion: `Devolución registrada - ${producto}`,
        };

        return descripciones[actividad.tipoOperacion]
            || `${actividad.tipoOperacion} - ${producto}`;
    }

    private formatearTiempoRelativo(fecha: Date): string {
        const ahora = new Date();
        const diferencia = ahora.getTime() - fecha.getTime();
        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        const dias = Math.floor(diferencia / 86400000);

        if (minutos < 1) return 'Hace un momento';
        if (minutos < 60) return `Hace ${minutos} min`;
        if (horas < 24) return `Hace ${horas} h`;
        if (dias === 1) return 'Ayer';
        return `Hace ${dias} días`;
    }

    private obtenerIconoOperacion(tipo: string): string {
        const iconos: Record<string, string> = {
            entrada: 'bi-box-arrow-in-down',
            salida: 'bi-box-arrow-up',
            ajuste_positivo: 'bi-plus-circle-fill',
            ajuste_negativo: 'bi-dash-circle-fill',
            transferencia_salida: 'bi-arrow-left-right',
            transferencia_entrada: 'bi-arrow-left-right',
            conteo: 'bi-clipboard-data',
            recepcion: 'bi-box-arrow-in-down',
            despacho: 'bi-truck',
            devolucion: 'bi-arrow-return-left',
        };
        return iconos[tipo] || 'bi-circle';
    }

    private obtenerColorOperacion(tipo: string): string {
        const colores: Record<string, string> = {
            entrada: 'primary',
            salida: 'danger',
            ajuste_positivo: 'success',
            ajuste_negativo: 'warning',
            transferencia_salida: 'info',
            transferencia_entrada: 'info',
            conteo: 'primary',
            recepcion: 'success',
            despacho: 'success',
            devolucion: 'warning',
        };
        return colores[tipo] || 'secondary';
    }
}
