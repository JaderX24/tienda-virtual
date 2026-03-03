import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';
import {
    FiltrosMiActividadDto,
    FiltrosBitacoraDto,
    FiltrosOperacionesDto,
} from './dto';

@Injectable()
export class MiActividadColaboradorService {
    constructor(private readonly prisma: PrismaService) {}

    // Resumen general de toda la actividad del usuario
    async obtenerResumen(usuarioId: number, filtros: FiltrosMiActividadDto) {
        const { desde, hasta } = this.construirRangoFecha(filtros);

        const [
            totalEventosBitacora,
            totalOperacionesInventario,
            totalConteosRealizados,
            totalSesiones,
            loginExitosos,
            loginFallidos,
            entradasInventario,
            salidasInventario,
            ajustesInventario,
            transferenciasInventario,
            ultimoLogin,
            ultimaOperacion,
        ] = await Promise.all([
            this.prisma.colabBitacoraSeguridad.count({
                where: { usuarioId, creadoEn: { gte: desde, lte: hasta } },
            }),
            this.prisma.colabActividadInventario.count({
                where: { usuarioId, creadoEn: { gte: desde, lte: hasta } },
            }),
            this.prisma.colabConteoInventario.count({
                where: { responsableId: usuarioId, creadoEn: { gte: desde, lte: hasta } },
            }),
            this.prisma.colabSesion.count({
                where: { usuarioId, creadoEn: { gte: desde, lte: hasta } },
            }),
            this.prisma.colabBitacoraSeguridad.count({
                where: { usuarioId, tipoEvento: 'login_exitoso', creadoEn: { gte: desde, lte: hasta } },
            }),
            this.prisma.colabBitacoraSeguridad.count({
                where: { usuarioId, tipoEvento: 'login_fallido', creadoEn: { gte: desde, lte: hasta } },
            }),
            this.prisma.colabActividadInventario.count({
                where: {
                    usuarioId,
                    tipoOperacion: { in: ['entrada', 'recepcion'] },
                    creadoEn: { gte: desde, lte: hasta },
                },
            }),
            this.prisma.colabActividadInventario.count({
                where: {
                    usuarioId,
                    tipoOperacion: { in: ['salida', 'despacho'] },
                    creadoEn: { gte: desde, lte: hasta },
                },
            }),
            this.prisma.colabActividadInventario.count({
                where: {
                    usuarioId,
                    tipoOperacion: { in: ['ajuste_positivo', 'ajuste_negativo'] },
                    creadoEn: { gte: desde, lte: hasta },
                },
            }),
            this.prisma.colabActividadInventario.count({
                where: {
                    usuarioId,
                    tipoOperacion: 'transferencia',
                    creadoEn: { gte: desde, lte: hasta },
                },
            }),
            this.prisma.colabBitacoraSeguridad.findFirst({
                where: { usuarioId, tipoEvento: 'login_exitoso' },
                orderBy: { creadoEn: 'desc' },
                select: { creadoEn: true, ipAddress: true },
            }),
            this.prisma.colabActividadInventario.findFirst({
                where: { usuarioId },
                orderBy: { creadoEn: 'desc' },
                select: { creadoEn: true, tipoOperacion: true },
            }),
        ]);

        return {
            exito: true,
            datos: {
                totalEventosBitacora,
                totalOperacionesInventario,
                totalConteosRealizados,
                totalSesiones,
                loginExitosos,
                loginFallidos,
                entradasInventario,
                salidasInventario,
                ajustesInventario,
                transferenciasInventario,
                ultimoLogin: ultimoLogin
                    ? { fecha: ultimoLogin.creadoEn, ip: ultimoLogin.ipAddress }
                    : null,
                ultimaOperacion: ultimaOperacion
                    ? {
                        fecha: ultimaOperacion.creadoEn,
                        tipo: this.traducirTipoOperacion(ultimaOperacion.tipoOperacion),
                    }
                    : null,
            },
        };
    }

    // Bitácora de seguridad paginada del usuario
    async obtenerBitacora(usuarioId: number, filtros: FiltrosBitacoraDto) {
        const { desde, hasta } = this.construirRangoFecha(filtros);
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const saltar = (pagina - 1) * limite;

        const where: any = {
            usuarioId,
            creadoEn: { gte: desde, lte: hasta },
        };

        if (filtros.tipoEvento) {
            where.tipoEvento = filtros.tipoEvento;
        }

        if (filtros.severidad) {
            where.severidad = filtros.severidad;
        }

        if (filtros.busqueda) {
            where.descripcion = { contains: filtros.busqueda };
        }

        const [registros, total] = await Promise.all([
            this.prisma.colabBitacoraSeguridad.findMany({
                where,
                orderBy: { creadoEn: 'desc' },
                skip: saltar,
                take: limite,
                select: {
                    id: true,
                    tipoEvento: true,
                    descripcion: true,
                    severidad: true,
                    ipAddress: true,
                    userAgent: true,
                    creadoEn: true,
                    datosExtra: true,
                },
            }),
            this.prisma.colabBitacoraSeguridad.count({ where }),
        ]);

        const eventos = registros.map((r) => ({
            id: r.id.toString(),
            tipoEvento: r.tipoEvento,
            tipoEventoTexto: this.traducirTipoEvento(r.tipoEvento),
            descripcion: r.descripcion || '',
            severidad: r.severidad,
            severidadTexto: this.traducirSeveridad(r.severidad),
            ip: r.ipAddress || '',
            navegador: this.extraerNavegador(r.userAgent),
            fecha: r.creadoEn,
            datosExtra: r.datosExtra,
        }));

        return {
            exito: true,
            datos: eventos,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    // Operaciones de inventario paginadas del usuario
    async obtenerOperacionesInventario(usuarioId: number, filtros: FiltrosOperacionesDto) {
        const { desde, hasta } = this.construirRangoFecha(filtros);
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const saltar = (pagina - 1) * limite;

        const where: any = {
            usuarioId,
            creadoEn: { gte: desde, lte: hasta },
        };

        if (filtros.tipoOperacion) {
            where.tipoOperacion = filtros.tipoOperacion;
        }

        if (filtros.busqueda) {
            where.producto = {
                OR: [
                    { nombre: { contains: filtros.busqueda } },
                    { sku: { contains: filtros.busqueda } },
                ],
            };
        }

        const [registros, total] = await Promise.all([
            this.prisma.colabActividadInventario.findMany({
                where,
                orderBy: { creadoEn: 'desc' },
                skip: saltar,
                take: limite,
                include: {
                    producto: {
                        select: { nombre: true, sku: true },
                    },
                    almacen: {
                        select: { nombre: true },
                    },
                },
            }),
            this.prisma.colabActividadInventario.count({ where }),
        ]);

        const operaciones = registros.map((r) => ({
            id: r.id.toString(),
            tipoOperacion: r.tipoOperacion,
            tipoOperacionTexto: this.traducirTipoOperacion(r.tipoOperacion),
            producto: r.producto?.nombre || 'Producto eliminado',
            sku: r.producto?.sku || '',
            cantidad: r.cantidad,
            cantidadAnterior: r.cantidadAnterior,
            cantidadNueva: r.cantidadNueva,
            almacen: r.almacen?.nombre || '',
            motivo: r.motivo || '',
            notas: r.notas || '',
            documentoTipo: r.documentoTipo || '',
            documentoNumero: r.documentoNumero || '',
            fecha: r.creadoEn,
        }));

        return {
            exito: true,
            datos: operaciones,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    // Historial de sesiones del usuario
    async obtenerSesiones(usuarioId: number, filtros: FiltrosMiActividadDto) {
        const { desde, hasta } = this.construirRangoFecha(filtros);
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 20;
        const saltar = (pagina - 1) * limite;

        const where: any = {
            usuarioId,
            creadoEn: { gte: desde, lte: hasta },
        };

        const [registros, total] = await Promise.all([
            this.prisma.colabSesion.findMany({
                where,
                orderBy: { creadoEn: 'desc' },
                skip: saltar,
                take: limite,
                select: {
                    id: true,
                    ipAddress: true,
                    ipPais: true,
                    ipCiudad: true,
                    userAgent: true,
                    creadoEn: true,
                    expiraEn: true,
                    ultimaActividad: true,
                    esActiva: true,
                    cerradaEn: true,
                    motivoCierre: true,
                },
            }),
            this.prisma.colabSesion.count({ where }),
        ]);

        const sesiones = registros.map((r) => ({
            id: r.id,
            ip: r.ipAddress,
            pais: r.ipPais || '',
            ciudad: r.ipCiudad || '',
            navegador: this.extraerNavegador(r.userAgent),
            sistemaOperativo: this.extraerSistemaOperativo(r.userAgent),
            inicio: r.creadoEn,
            ultimaActividad: r.ultimaActividad,
            expiracion: r.expiraEn,
            esActiva: r.esActiva,
            cerradaEn: r.cerradaEn,
            motivoCierre: r.motivoCierre ? this.traducirMotivoCierre(r.motivoCierre) : '',
        }));

        return {
            exito: true,
            datos: sesiones,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    // Timeline unificado: combina bitácora + operaciones en orden cronológico
    async obtenerTimeline(usuarioId: number, filtros: FiltrosMiActividadDto) {
        const { desde, hasta } = this.construirRangoFecha(filtros);
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 30;
        const saltar = (pagina - 1) * limite;

        const [eventosBitacora, operaciones, conteos] = await Promise.all([
            this.prisma.colabBitacoraSeguridad.findMany({
                where: { usuarioId, creadoEn: { gte: desde, lte: hasta } },
                orderBy: { creadoEn: 'desc' },
                select: {
                    id: true,
                    tipoEvento: true,
                    descripcion: true,
                    severidad: true,
                    ipAddress: true,
                    creadoEn: true,
                },
            }),
            this.prisma.colabActividadInventario.findMany({
                where: { usuarioId, creadoEn: { gte: desde, lte: hasta } },
                orderBy: { creadoEn: 'desc' },
                include: {
                    producto: { select: { nombre: true, sku: true } },
                    almacen: { select: { nombre: true } },
                },
            }),
            this.prisma.colabConteoInventario.findMany({
                where: { responsableId: usuarioId, creadoEn: { gte: desde, lte: hasta } },
                orderBy: { creadoEn: 'desc' },
                select: {
                    id: true,
                    codigo: true,
                    tipo: true,
                    estado: true,
                    totalProductosContados: true,
                    totalDiscrepancias: true,
                    creadoEn: true,
                    almacen: { select: { nombre: true } },
                },
            }),
        ]);

        // Unificar en un solo timeline
        const timeline: any[] = [];

        for (const ev of eventosBitacora) {
            timeline.push({
                id: `bit-${ev.id}`,
                origen: 'bitacora',
                icono: this.obtenerIconoEvento(ev.tipoEvento),
                color: this.obtenerColorSeveridad(ev.severidad),
                titulo: this.traducirTipoEvento(ev.tipoEvento),
                descripcion: ev.descripcion || '',
                detalle: ev.ipAddress ? `IP: ${ev.ipAddress}` : '',
                severidad: ev.severidad,
                fecha: ev.creadoEn,
            });
        }

        for (const op of operaciones) {
            timeline.push({
                id: `op-${op.id}`,
                origen: 'inventario',
                icono: this.obtenerIconoOperacion(op.tipoOperacion),
                color: this.obtenerColorOperacion(op.tipoOperacion),
                titulo: this.traducirTipoOperacion(op.tipoOperacion),
                descripcion: `${op.producto?.nombre || 'Producto'} (${op.producto?.sku || ''})`,
                detalle: `Cantidad: ${op.cantidad} | ${op.almacen?.nombre || ''}`,
                severidad: 'info',
                fecha: op.creadoEn,
            });
        }

        for (const c of conteos) {
            timeline.push({
                id: `cnt-${c.id}`,
                origen: 'conteo',
                icono: 'bi-clipboard-check',
                color: 'primary',
                titulo: `Conteo ${c.tipo}`,
                descripcion: `${c.codigo} - ${c.almacen?.nombre || ''}`,
                detalle: `${c.totalProductosContados} productos | ${c.totalDiscrepancias} discrepancias | Estado: ${c.estado}`,
                severidad: 'info',
                fecha: c.creadoEn,
            });
        }

        // Ordenar por fecha descendente
        timeline.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        const total = timeline.length;
        const paginados = timeline.slice(saltar, saltar + limite);

        return {
            exito: true,
            datos: paginados,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    // Exportar bitácora a CSV
    async exportarBitacoraCsv(usuarioId: number, filtros: FiltrosBitacoraDto): Promise<string> {
        const { desde, hasta } = this.construirRangoFecha(filtros);

        const where: any = {
            usuarioId,
            creadoEn: { gte: desde, lte: hasta },
        };

        if (filtros.tipoEvento) where.tipoEvento = filtros.tipoEvento;
        if (filtros.severidad) where.severidad = filtros.severidad;

        const registros = await this.prisma.colabBitacoraSeguridad.findMany({
            where,
            orderBy: { creadoEn: 'desc' },
            take: 5000,
            select: {
                tipoEvento: true,
                descripcion: true,
                severidad: true,
                ipAddress: true,
                creadoEn: true,
            },
        });

        const encabezado = 'Fecha,Tipo Evento,Severidad,Descripción,IP';
        const filas = registros.map((r) =>
            [
                this.formatearFechaCsv(r.creadoEn),
                this.traducirTipoEvento(r.tipoEvento),
                this.traducirSeveridad(r.severidad),
                `"${(r.descripcion || '').replace(/"/g, '""')}"`,
                r.ipAddress || '',
            ].join(','),
        );

        return '\uFEFF' + [encabezado, ...filas].join('\n');
    }

    // Exportar operaciones a CSV
    async exportarOperacionesCsv(usuarioId: number, filtros: FiltrosOperacionesDto): Promise<string> {
        const { desde, hasta } = this.construirRangoFecha(filtros);

        const where: any = {
            usuarioId,
            creadoEn: { gte: desde, lte: hasta },
        };

        if (filtros.tipoOperacion) where.tipoOperacion = filtros.tipoOperacion;

        const registros = await this.prisma.colabActividadInventario.findMany({
            where,
            orderBy: { creadoEn: 'desc' },
            take: 5000,
            include: {
                producto: { select: { nombre: true, sku: true } },
                almacen: { select: { nombre: true } },
            },
        });

        const encabezado = 'Fecha,Tipo,Producto,SKU,Cantidad,Anterior,Nuevo,Almacén,Motivo';
        const filas = registros.map((r) =>
            [
                this.formatearFechaCsv(r.creadoEn),
                this.traducirTipoOperacion(r.tipoOperacion),
                `"${(r.producto?.nombre || '').replace(/"/g, '""')}"`,
                r.producto?.sku || '',
                r.cantidad,
                r.cantidadAnterior,
                r.cantidadNueva,
                `"${(r.almacen?.nombre || '').replace(/"/g, '""')}"`,
                `"${(r.motivo || '').replace(/"/g, '""')}"`,
            ].join(','),
        );

        return '\uFEFF' + [encabezado, ...filas].join('\n');
    }

    // --- Utilidades privadas ---

    private construirRangoFecha(filtros: FiltrosMiActividadDto) {
        const ahora = new Date();
        let desde = new Date(ahora);
        desde.setDate(desde.getDate() - 30);
        let hasta = new Date(ahora);

        if (filtros.fechaDesde) desde = new Date(filtros.fechaDesde);
        if (filtros.fechaHasta) {
            hasta = new Date(filtros.fechaHasta);
            hasta.setHours(23, 59, 59, 999);
        }

        return { desde, hasta };
    }

    private formatearFechaCsv(fecha: Date): string {
        const d = new Date(fecha);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const seg = String(d.getSeconds()).padStart(2, '0');
        return `${dia}/${mes}/${anio} ${hora}:${min}:${seg}`;
    }

    private traducirTipoEvento(tipo: string): string {
        const mapa: Record<string, string> = {
            login_exitoso: 'Inicio de sesión',
            login_fallido: 'Inicio de sesión fallido',
            logout: 'Cierre de sesión',
            cambio_contrasena: 'Cambio de contraseña',
            recuperacion_contrasena: 'Recuperación de contraseña',
            bloqueo_cuenta: 'Cuenta bloqueada',
            desbloqueo_cuenta: 'Cuenta desbloqueada',
            verificacion_2fa: 'Verificación 2FA',
            fallo_2fa: 'Fallo en 2FA',
            dispositivo_nuevo: 'Dispositivo nuevo registrado',
            dispositivo_rechazado: 'Dispositivo rechazado',
            ip_no_autorizada: 'IP no autorizada',
            acceso_fuera_horario: 'Acceso fuera de horario',
            sesion_forzada: 'Sesión cerrada forzosamente',
            intento_escalacion: 'Intento de escalación',
            acceso_denegado: 'Acceso denegado',
            multiples_intentos: 'Múltiples intentos fallidos',
        };
        return mapa[tipo] || tipo;
    }

    private traducirSeveridad(severidad: string): string {
        const mapa: Record<string, string> = {
            info: 'Información',
            warn: 'Advertencia',
            error: 'Error',
            critical: 'Crítico',
        };
        return mapa[severidad] || severidad;
    }

    private traducirTipoOperacion(tipo: string): string {
        const mapa: Record<string, string> = {
            entrada: 'Entrada',
            salida: 'Salida',
            recepcion: 'Recepción',
            despacho: 'Despacho',
            ajuste_positivo: 'Ajuste (+)',
            ajuste_negativo: 'Ajuste (-)',
            transferencia: 'Transferencia',
        };
        return mapa[tipo] || tipo;
    }

    private traducirMotivoCierre(motivo: string): string {
        const mapa: Record<string, string> = {
            logout: 'Cierre voluntario',
            expirada: 'Sesión expirada',
            forzada: 'Cerrada por administrador',
            seguridad: 'Cerrada por seguridad',
            limite_sesiones: 'Límite de sesiones alcanzado',
        };
        return mapa[motivo] || motivo;
    }

    private extraerNavegador(userAgent: string | null | undefined): string {
        if (!userAgent) return 'Desconocido';
        if (userAgent.includes('Edg/')) return 'Edge';
        if (userAgent.includes('Chrome/')) return 'Chrome';
        if (userAgent.includes('Firefox/')) return 'Firefox';
        if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Opera') || userAgent.includes('OPR/')) return 'Opera';
        return 'Otro';
    }

    private extraerSistemaOperativo(userAgent: string | null | undefined): string {
        if (!userAgent) return 'Desconocido';
        if (userAgent.includes('Windows NT 10')) return 'Windows 10/11';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac OS X')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
        return 'Otro';
    }

    private obtenerIconoEvento(tipo: string): string {
        const mapa: Record<string, string> = {
            login_exitoso: 'bi-box-arrow-in-right',
            login_fallido: 'bi-x-circle',
            logout: 'bi-box-arrow-right',
            cambio_contrasena: 'bi-key',
            recuperacion_contrasena: 'bi-envelope-check',
            bloqueo_cuenta: 'bi-lock',
            desbloqueo_cuenta: 'bi-unlock',
            verificacion_2fa: 'bi-shield-check',
            fallo_2fa: 'bi-shield-x',
            dispositivo_nuevo: 'bi-phone',
            dispositivo_rechazado: 'bi-phone-flip',
            ip_no_autorizada: 'bi-geo-alt-fill',
            acceso_fuera_horario: 'bi-clock-history',
            sesion_forzada: 'bi-power',
            intento_escalacion: 'bi-exclamation-diamond',
            acceso_denegado: 'bi-slash-circle',
            multiples_intentos: 'bi-shield-exclamation',
        };
        return mapa[tipo] || 'bi-record-circle';
    }

    private obtenerColorSeveridad(severidad: string): string {
        const mapa: Record<string, string> = {
            info: 'success',
            warn: 'warning',
            error: 'danger',
            critical: 'danger',
        };
        return mapa[severidad] || 'secondary';
    }

    private obtenerIconoOperacion(tipo: string): string {
        const mapa: Record<string, string> = {
            entrada: 'bi-box-arrow-in-down',
            recepcion: 'bi-box-arrow-in-down',
            salida: 'bi-box-arrow-up',
            despacho: 'bi-truck',
            ajuste_positivo: 'bi-plus-circle',
            ajuste_negativo: 'bi-dash-circle',
            transferencia: 'bi-arrow-left-right',
        };
        return mapa[tipo] || 'bi-record-circle';
    }

    private obtenerColorOperacion(tipo: string): string {
        const mapa: Record<string, string> = {
            entrada: 'success',
            recepcion: 'success',
            salida: 'danger',
            despacho: 'danger',
            ajuste_positivo: 'info',
            ajuste_negativo: 'warning',
            transferencia: 'primary',
        };
        return mapa[tipo] || 'secondary';
    }
}
