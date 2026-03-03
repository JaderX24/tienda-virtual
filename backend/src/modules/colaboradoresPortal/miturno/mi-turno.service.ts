import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MiTurnoService {
    private readonly logger = new Logger(MiTurnoService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerTurnoHoy(usuarioId: number) {
        const { hoy, manana } = this.obtenerRangoHoy();

        const turno = await this.prisma.colabTurno.findFirst({
            where: {
                usuarioId,
                fecha: { gte: hoy, lt: manana },
            },
            include: {
                almacen: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                    },
                },
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
            datos: this.formatearTurno(turno),
        };
    }

    async obtenerHistorialTurnos(
        usuarioId: number,
        pagina: number = 1,
        limite: number = 10,
    ) {
        const salto = (pagina - 1) * limite;

        const [turnos, total] = await Promise.all([
            this.prisma.colabTurno.findMany({
                where: { usuarioId },
                include: {
                    almacen: {
                        select: { nombre: true, codigo: true },
                    },
                },
                orderBy: { fecha: 'desc' },
                skip: salto,
                take: limite,
            }),
            this.prisma.colabTurno.count({
                where: { usuarioId },
            }),
        ]);

        return {
            exito: true,
            datos: turnos.map((t) => this.formatearTurno(t)),
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerResumenSemanal(usuarioId: number) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Inicio de la semana (lunes)
        const inicioSemana = new Date(hoy);
        const diaSemana = hoy.getDay();
        const diasDesdelunes = diaSemana === 0 ? 6 : diaSemana - 1;
        inicioSemana.setDate(hoy.getDate() - diasDesdelunes);

        const finSemana = new Date(inicioSemana);
        finSemana.setDate(finSemana.getDate() + 7);

        const turnos = await this.prisma.colabTurno.findMany({
            where: {
                usuarioId,
                fecha: { gte: inicioSemana, lt: finSemana },
            },
            include: {
                almacen: { select: { nombre: true, codigo: true } },
            },
            orderBy: { fecha: 'asc' },
        });

        const turnosFinalizados = turnos.filter((t) => t.estado === 'finalizado');
        let totalHorasTrabajadas = 0;

        for (const turno of turnosFinalizados) {
            if (turno.horaEntrada && turno.horaSalida) {
                const entrada = new Date(turno.horaEntrada).getTime();
                const salida = new Date(turno.horaSalida).getTime();
                totalHorasTrabajadas += (salida - entrada) / 3600000;
            }
        }

        const turnosPuntuales = turnosFinalizados.filter((t) => {
            if (!t.horaEntrada) return false;
            const entrada = new Date(t.horaEntrada);
            const programada = this.combinarFechaHora(t.fecha, t.horaInicioProgramada);
            // Tolerancia de 5 minutos
            return entrada.getTime() <= programada.getTime() + 5 * 60 * 1000;
        });

        return {
            exito: true,
            datos: {
                semana: turnos.map((t) => this.formatearTurno(t)),
                resumen: {
                    totalTurnos: turnos.length,
                    turnosCompletados: turnosFinalizados.length,
                    turnosPendientes: turnos.filter((t) => t.estado === 'programado').length,
                    horasTrabajadas: Math.round(totalHorasTrabajadas * 100) / 100,
                    puntualidad: turnosFinalizados.length > 0
                        ? Math.round((turnosPuntuales.length / turnosFinalizados.length) * 100)
                        : 100,
                },
            },
        };
    }

    async registrarEntrada(usuarioId: number, ip: string, notas?: string) {
        const { hoy, manana } = this.obtenerRangoHoy();

        const turno = await this.prisma.colabTurno.findFirst({
            where: {
                usuarioId,
                fecha: { gte: hoy, lt: manana },
                estado: 'programado',
            },
            include: {
                almacen: { select: { nombre: true, codigo: true } },
            },
        });

        if (!turno) {
            throw new NotFoundException('No hay turno programado para registrar entrada');
        }

        if (turno.horaEntrada) {
            throw new BadRequestException('Ya se registró la entrada para este turno');
        }

        const turnoActualizado = await this.prisma.colabTurno.update({
            where: { id: turno.id },
            data: {
                horaEntrada: new Date(),
                estado: 'en_curso',
                notasEntrada: notas || null,
                ipEntrada: ip,
            },
            include: {
                almacen: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                    },
                },
            },
        });

        this.logger.log(`Entrada registrada - Colaborador: ${usuarioId}, Turno: ${turno.id}`);

        return {
            exito: true,
            mensaje: 'Entrada registrada correctamente',
            datos: this.formatearTurno(turnoActualizado),
        };
    }

    async registrarSalida(usuarioId: number, ip: string, notas?: string) {
        const { hoy, manana } = this.obtenerRangoHoy();

        const turno = await this.prisma.colabTurno.findFirst({
            where: {
                usuarioId,
                fecha: { gte: hoy, lt: manana },
                estado: 'en_curso',
            },
            include: {
                almacen: { select: { nombre: true, codigo: true } },
            },
        });

        if (!turno) {
            throw new NotFoundException('No hay turno en curso para registrar salida');
        }

        if (turno.horaSalida) {
            throw new BadRequestException('Ya se registró la salida para este turno');
        }

        const ahora = new Date();

        // Calcular duración
        const horaEntrada = turno.horaEntrada ? new Date(turno.horaEntrada) : ahora;
        const duracionMs = ahora.getTime() - horaEntrada.getTime();
        const horasTrabajadas = Math.round((duracionMs / 3600000) * 100) / 100;

        const turnoActualizado = await this.prisma.colabTurno.update({
            where: { id: turno.id },
            data: {
                horaSalida: ahora,
                estado: 'finalizado',
                notasSalida: notas || null,
                ipSalida: ip,
            },
            include: {
                almacen: {
                    select: {
                        id: true,
                        nombre: true,
                        codigo: true,
                        direccion: true,
                        telefono: true,
                    },
                },
            },
        });

        this.logger.log(
            `Salida registrada - Colaborador: ${usuarioId}, Turno: ${turno.id}, Horas: ${horasTrabajadas}`,
        );

        return {
            exito: true,
            mensaje: `Salida registrada. Horas trabajadas: ${horasTrabajadas}`,
            datos: this.formatearTurno(turnoActualizado),
            horasTrabajadas,
        };
    }

    async obtenerActividadTurno(usuarioId: number, turnoId?: number) {
        const where: any = { usuarioId };

        if (turnoId) {
            where.turnoId = turnoId;
        } else {
            const { hoy, manana } = this.obtenerRangoHoy();
            const turnoActual = await this.prisma.colabTurno.findFirst({
                where: {
                    usuarioId,
                    fecha: { gte: hoy, lt: manana },
                    estado: { in: ['en_curso', 'finalizado'] },
                },
            });

            if (turnoActual) {
                where.turnoId = turnoActual.id;
            } else {
                return { exito: true, datos: [] };
            }
        }

        const actividades = await this.prisma.colabActividadInventario.findMany({
            where,
            include: {
                producto: { select: { nombre: true, sku: true } },
                almacen: { select: { nombre: true } },
            },
            orderBy: { creadoEn: 'desc' },
            take: 20,
        });

        return {
            exito: true,
            datos: actividades.map((act) => ({
                id: act.id.toString(),
                tipo: act.tipoOperacion,
                producto: act.producto?.nombre || 'N/A',
                sku: act.producto?.sku || '',
                cantidad: act.cantidad,
                almacen: act.almacen?.nombre || '',
                fecha: act.creadoEn,
            })),
        };
    }

    // Métodos auxiliares

    private formatearTurno(turno: any) {
        const horasTrabajadas = this.calcularHorasTrabajadas(
            turno.horaEntrada,
            turno.horaSalida,
        );

        const puntualidad = this.evaluarPuntualidad(
            turno.fecha,
            turno.horaInicioProgramada,
            turno.horaEntrada,
        );

        return {
            id: turno.id,
            fecha: turno.fecha,
            horaInicioProgramada: turno.horaInicioProgramada,
            horaFinProgramada: turno.horaFinProgramada,
            horaEntrada: turno.horaEntrada,
            horaSalida: turno.horaSalida,
            estado: turno.estado,
            notasEntrada: turno.notasEntrada,
            notasSalida: turno.notasSalida,
            almacen: turno.almacen
                ? {
                    id: turno.almacen.id,
                    nombre: turno.almacen.nombre,
                    codigo: turno.almacen.codigo,
                    direccion: turno.almacen.direccion || null,
                    telefono: turno.almacen.telefono || null,
                }
                : null,
            horasTrabajadas,
            puntualidad,
        };
    }

    private calcularHorasTrabajadas(
        horaEntrada: Date | null,
        horaSalida: Date | null,
    ): number | null {
        if (!horaEntrada) return null;
        const fin = horaSalida ? new Date(horaSalida) : new Date();
        const inicio = new Date(horaEntrada);
        const horas = (fin.getTime() - inicio.getTime()) / 3600000;
        return Math.round(horas * 100) / 100;
    }

    private evaluarPuntualidad(
        fecha: Date,
        horaInicioProgramada: Date,
        horaEntrada: Date | null,
    ): string {
        if (!horaEntrada) return 'pendiente';
        const entrada = new Date(horaEntrada);
        const programada = this.combinarFechaHora(fecha, horaInicioProgramada);
        const diferenciaMinutos = (entrada.getTime() - programada.getTime()) / 60000;

        if (diferenciaMinutos <= 0) return 'anticipado';
        if (diferenciaMinutos <= 5) return 'puntual';
        if (diferenciaMinutos <= 15) return 'leve_retraso';
        return 'retraso';
    }

    private combinarFechaHora(fecha: Date, hora: Date): Date {
        const f = new Date(fecha);
        const h = new Date(hora);
        f.setHours(h.getHours(), h.getMinutes(), h.getSeconds(), 0);
        return f;
    }

    private obtenerRangoHoy() {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        return { hoy, manana };
    }
}
