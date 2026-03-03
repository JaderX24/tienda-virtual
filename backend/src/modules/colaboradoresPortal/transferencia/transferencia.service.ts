import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CrearTransferenciaDto,
    ConsultarTransferenciasDto,
    ActualizarEstadoTransferenciaDto,
} from './dto';

@Injectable()
export class TransferenciaService {
    private readonly logger = new Logger(TransferenciaService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerTransferencias(usuarioId: number, filtros: ConsultarTransferenciasDto) {
        const {
            almacenOrigenId,
            almacenDestinoId,
            estado,
            fechaDesde,
            fechaHasta,
            busqueda,
            pagina = 1,
            limite = 15,
        } = filtros;

        const where: any = {
            usuarioId,
            tipoOperacion: 'transferencia',
        };

        if (almacenOrigenId) {
            await this.validarAccesoAlmacen(usuarioId, almacenOrigenId);
            where.almacenId = almacenOrigenId;
        }

        if (almacenDestinoId) {
            where.ubicacionDestino = almacenDestinoId.toString();
        }

        if (estado) {
            where.estadoAprobacion = estado;
        }

        if (fechaDesde || fechaHasta) {
            where.creadoEn = {};
            if (fechaDesde) where.creadoEn.gte = new Date(fechaDesde);
            if (fechaHasta) {
                const hasta = new Date(fechaHasta);
                hasta.setDate(hasta.getDate() + 1);
                where.creadoEn.lt = hasta;
            }
        }

        if (busqueda) {
            where.producto = {
                OR: [
                    { nombre: { contains: busqueda } },
                    { sku: { contains: busqueda } },
                ],
            };
        }

        const [total, transferencias] = await Promise.all([
            this.prisma.colabActividadInventario.count({ where }),
            this.prisma.colabActividadInventario.findMany({
                where,
                include: {
                    producto: { select: { nombre: true, sku: true, stock: true } },
                    almacen: { select: { id: true, nombre: true, codigo: true } },
                    usuario: { select: { nombre: true, apellido: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        const almacenesDestinoIds = transferencias
            .map(t => t.ubicacionDestino)
            .filter(Boolean)
            .map(id => parseInt(id!, 10))
            .filter(id => !isNaN(id));

        let mapaAlmacenes: Record<number, { nombre: string; codigo: string }> = {};
        if (almacenesDestinoIds.length > 0) {
            const almacenesDestino = await this.prisma.inventarioAlmacen.findMany({
                where: { id: { in: [...new Set(almacenesDestinoIds)] } },
                select: { id: true, nombre: true, codigo: true },
            });
            mapaAlmacenes = Object.fromEntries(almacenesDestino.map(a => [a.id, { nombre: a.nombre, codigo: a.codigo }]));
        }

        const datos = transferencias.map(t => this.formatearTransferencia(t, mapaAlmacenes));

        return {
            exito: true,
            datos,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async crearTransferencia(usuarioId: number, dto: CrearTransferenciaDto, ip: string) {
        if (dto.almacenOrigenId === dto.almacenDestinoId) {
            throw new BadRequestException('El almacén de origen y destino no pueden ser el mismo');
        }

        await this.validarAccesoAlmacen(usuarioId, dto.almacenOrigenId);
        await this.validarAlmacenExiste(dto.almacenDestinoId);

        const producto = await this.prisma.producto.findUnique({
            where: { id: dto.productoId },
            select: { id: true, nombre: true, stock: true, activo: true },
        });

        if (!producto || !producto.activo) {
            throw new NotFoundException('Producto no encontrado o inactivo');
        }

        if (producto.stock < dto.cantidad) {
            throw new BadRequestException(
                `Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${dto.cantidad}`,
            );
        }

        const turnoActivo = await this.obtenerTurnoActivo(usuarioId);

        const resultado = await this.prisma.$transaction(async (tx) => {
            const stockAnterior = producto.stock;

            const actividad = await tx.colabActividadInventario.create({
                data: {
                    usuarioId,
                    turnoId: turnoActivo?.id || null,
                    almacenId: dto.almacenOrigenId,
                    tipoOperacion: 'transferencia',
                    productoId: dto.productoId,
                    cantidad: dto.cantidad,
                    cantidadAnterior: stockAnterior,
                    cantidadNueva: stockAnterior,
                    ubicacionOrigen: dto.almacenOrigenId.toString(),
                    ubicacionDestino: dto.almacenDestinoId.toString(),
                    motivo: dto.motivo,
                    notas: dto.notas || null,
                    documentoTipo: dto.documentoTipo || null,
                    documentoNumero: dto.documentoNumero || null,
                    estadoAprobacion: 'pendiente',
                    requiereAprobacion: true,
                    ipAddress: ip,
                },
                include: {
                    producto: { select: { nombre: true, sku: true, stock: true } },
                    almacen: { select: { id: true, nombre: true, codigo: true } },
                    usuario: { select: { nombre: true, apellido: true } },
                },
            });

            return actividad;
        });

        const almacenDestino = await this.prisma.inventarioAlmacen.findUnique({
            where: { id: dto.almacenDestinoId },
            select: { id: true, nombre: true, codigo: true },
        });

        const mapaAlmacenes: Record<number, { nombre: string; codigo: string }> = {};
        if (almacenDestino) {
            mapaAlmacenes[almacenDestino.id] = { nombre: almacenDestino.nombre, codigo: almacenDestino.codigo };
        }

        this.logger.log(
            `Transferencia creada: producto=${dto.productoId}, cantidad=${dto.cantidad}, origen=${dto.almacenOrigenId}, destino=${dto.almacenDestinoId}, usuario=${usuarioId}`,
        );

        return {
            exito: true,
            mensaje: `Transferencia de ${dto.cantidad} unidades creada correctamente. Pendiente de aprobación.`,
            datos: this.formatearTransferencia(resultado, mapaAlmacenes),
        };
    }

    async actualizarEstado(
        usuarioId: number,
        transferenciaId: string,
        dto: ActualizarEstadoTransferenciaDto,
        ip: string,
    ) {
        const id = BigInt(transferenciaId);

        const transferencia = await this.prisma.colabActividadInventario.findFirst({
            where: { id, tipoOperacion: 'transferencia' },
            include: {
                producto: { select: { id: true, nombre: true, stock: true } },
            },
        });

        if (!transferencia) {
            throw new NotFoundException('Transferencia no encontrada');
        }

        const estadoActual = transferencia.estadoAprobacion;
        this.validarTransicionEstado(estadoActual, dto.estado);

        if (dto.estado === 'completada') {
            await this.completarTransferencia(transferencia, usuarioId, dto.notas, ip);
        } else if (dto.estado === 'cancelada') {
            await this.cancelarTransferencia(transferencia, usuarioId, dto.notas);
        } else {
            await this.prisma.colabActividadInventario.update({
                where: { id },
                data: {
                    estadoAprobacion: dto.estado,
                    notas: dto.notas
                        ? `${transferencia.notas ? transferencia.notas + '\n' : ''}${dto.notas}`
                        : transferencia.notas,
                },
            });
        }

        this.logger.log(
            `Transferencia ${transferenciaId} actualizada a ${dto.estado} por usuario=${usuarioId}`,
        );

        return {
            exito: true,
            mensaje: `Transferencia actualizada a "${this.obtenerEtiquetaEstado(dto.estado)}"`,
        };
    }

    async obtenerDetalle(usuarioId: number, transferenciaId: string) {
        const id = BigInt(transferenciaId);

        const transferencia = await this.prisma.colabActividadInventario.findFirst({
            where: { id, tipoOperacion: 'transferencia' },
            include: {
                producto: {
                    select: { id: true, nombre: true, sku: true, stock: true, stockMinimo: true },
                },
                almacen: { select: { id: true, nombre: true, codigo: true, direccion: true } },
                usuario: { select: { nombre: true, apellido: true, codigoColaborador: true } },
            },
        });

        if (!transferencia) {
            throw new NotFoundException('Transferencia no encontrada');
        }

        let almacenDestino = null;
        if (transferencia.ubicacionDestino) {
            almacenDestino = await this.prisma.inventarioAlmacen.findUnique({
                where: { id: parseInt(transferencia.ubicacionDestino, 10) },
                select: { id: true, nombre: true, codigo: true, direccion: true },
            });
        }

        return {
            exito: true,
            datos: {
                id: transferencia.id.toString(),
                producto: {
                    id: transferencia.producto.id,
                    nombre: transferencia.producto.nombre,
                    sku: transferencia.producto.sku,
                    stockActual: transferencia.producto.stock,
                    stockMinimo: transferencia.producto.stockMinimo,
                },
                cantidad: transferencia.cantidad,
                almacenOrigen: transferencia.almacen
                    ? {
                        id: transferencia.almacen.id,
                        nombre: transferencia.almacen.nombre,
                        codigo: transferencia.almacen.codigo,
                        direccion: transferencia.almacen.direccion,
                    }
                    : null,
                almacenDestino: almacenDestino
                    ? {
                        id: almacenDestino.id,
                        nombre: almacenDestino.nombre,
                        codigo: almacenDestino.codigo,
                        direccion: almacenDestino.direccion,
                    }
                    : null,
                estado: transferencia.estadoAprobacion || 'pendiente',
                motivo: transferencia.motivo,
                notas: transferencia.notas,
                documentoTipo: transferencia.documentoTipo,
                documentoNumero: transferencia.documentoNumero,
                solicitadoPor: {
                    nombre: `${transferencia.usuario.nombre} ${transferencia.usuario.apellido}`,
                    codigo: transferencia.usuario.codigoColaborador,
                },
                fecha: transferencia.creadoEn,
                fechaAprobacion: transferencia.fechaAprobacion,
            },
        };
    }

    private async completarTransferencia(
        transferencia: any,
        usuarioId: number,
        notas: string | undefined,
        ip: string,
    ) {
        const producto = transferencia.producto;

        if (producto.stock < transferencia.cantidad) {
            throw new BadRequestException(
                `Stock insuficiente para completar. Disponible: ${producto.stock}, Requerido: ${transferencia.cantidad}`,
            );
        }

        await this.prisma.$transaction(async (tx) => {
            const stockAnterior = producto.stock;
            const stockNuevo = stockAnterior - transferencia.cantidad;

            await tx.producto.update({
                where: { id: producto.id },
                data: { stock: stockNuevo },
            });

            await tx.movimientoInventario.create({
                data: {
                    productoId: producto.id,
                    cantidad: transferencia.cantidad,
                    tipoMovimiento: 'transferencia',
                    motivo: `Transferencia completada - ${transferencia.motivo}`,
                    stockAnterior,
                    stockNuevo,
                    usuarioId,
                },
            });

            await tx.colabActividadInventario.update({
                where: { id: transferencia.id },
                data: {
                    estadoAprobacion: 'completada',
                    cantidadAnterior: stockAnterior,
                    cantidadNueva: stockNuevo,
                    aprobadoPor: usuarioId,
                    fechaAprobacion: new Date(),
                    notas: notas
                        ? `${transferencia.notas ? transferencia.notas + '\n' : ''}${notas}`
                        : transferencia.notas,
                },
            });
        });
    }

    private async cancelarTransferencia(
        transferencia: any,
        usuarioId: number,
        notas: string | undefined,
    ) {
        await this.prisma.colabActividadInventario.update({
            where: { id: transferencia.id },
            data: {
                estadoAprobacion: 'cancelada',
                aprobadoPor: usuarioId,
                fechaAprobacion: new Date(),
                notas: notas
                    ? `${transferencia.notas ? transferencia.notas + '\n' : ''}Cancelación: ${notas}`
                    : transferencia.notas,
            },
        });
    }

    private validarTransicionEstado(estadoActual: string | null, nuevoEstado: string): void {
        const transicionesValidas: Record<string, string[]> = {
            pendiente: ['en_transito', 'cancelada'],
            en_transito: ['completada', 'cancelada'],
        };

        const estadoBase = estadoActual || 'pendiente';
        const permitidos = transicionesValidas[estadoBase] || [];

        if (!permitidos.includes(nuevoEstado)) {
            throw new BadRequestException(
                `No se puede cambiar de "${this.obtenerEtiquetaEstado(estadoBase)}" a "${this.obtenerEtiquetaEstado(nuevoEstado)}"`,
            );
        }
    }

    private async validarAccesoAlmacen(usuarioId: number, almacenId: number) {
        const asignacion = await this.prisma.colabAsignacionAlmacen.findFirst({
            where: { usuarioId, almacenId, esActiva: true },
        });

        if (!asignacion) {
            throw new ForbiddenException('No tienes acceso al almacén seleccionado');
        }

        return asignacion;
    }

    private async validarAlmacenExiste(almacenId: number) {
        const almacen = await this.prisma.inventarioAlmacen.findUnique({
            where: { id: almacenId },
            select: { id: true, esActivo: true },
        });

        if (!almacen || !almacen.esActivo) {
            throw new NotFoundException('Almacén de destino no encontrado o inactivo');
        }

        return almacen;
    }

    private async obtenerTurnoActivo(usuarioId: number) {
        const ahora = new Date();
        const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        return this.prisma.colabTurno.findFirst({
            where: {
                usuarioId,
                fecha: { gte: hoy, lt: manana },
                estado: 'en_curso',
            },
            select: { id: true },
        });
    }

    async obtenerAlmacenesDisponibles(usuarioId: number) {
        const asignaciones = await this.prisma.colabAsignacionAlmacen.findMany({
            where: { usuarioId, esActiva: true },
            select: { almacenId: true },
        });

        const almacenIdsAsignados = asignaciones.map(a => a.almacenId);

        const todosAlmacenes = await this.prisma.inventarioAlmacen.findMany({
            where: { esActivo: true },
            select: { id: true, codigo: true, nombre: true, tipo: true, direccion: true },
            orderBy: { nombre: 'asc' },
        });

        return {
            exito: true,
            datos: {
                asignados: todosAlmacenes.filter(a => almacenIdsAsignados.includes(a.id)),
                todos: todosAlmacenes,
            },
        };
    }

    private formatearTransferencia(t: any, mapaAlmacenes: Record<number, { nombre: string; codigo: string }>) {
        const almacenDestinoId = t.ubicacionDestino ? parseInt(t.ubicacionDestino, 10) : null;
        const almacenDestino = almacenDestinoId ? mapaAlmacenes[almacenDestinoId] : null;

        return {
            id: t.id.toString(),
            producto: t.producto?.nombre || 'N/A',
            sku: t.producto?.sku || '',
            stockActual: t.producto?.stock ?? 0,
            cantidad: t.cantidad,
            cantidadAnterior: t.cantidadAnterior,
            cantidadNueva: t.cantidadNueva,
            almacenOrigen: t.almacen?.nombre || '',
            almacenOrigenCodigo: t.almacen?.codigo || '',
            almacenOrigenId: t.almacen?.id || null,
            almacenDestino: almacenDestino?.nombre || '',
            almacenDestinoCodigo: almacenDestino?.codigo || '',
            almacenDestinoId: almacenDestinoId,
            estado: t.estadoAprobacion || 'pendiente',
            motivo: t.motivo,
            notas: t.notas,
            documentoTipo: t.documentoTipo,
            documentoNumero: t.documentoNumero,
            solicitadoPor: t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : '',
            fecha: t.creadoEn,
            fechaAprobacion: t.fechaAprobacion,
        };
    }

    private obtenerEtiquetaEstado(estado: string): string {
        const etiquetas: Record<string, string> = {
            pendiente: 'Pendiente',
            en_transito: 'En Tránsito',
            completada: 'Completada',
            cancelada: 'Cancelada',
        };
        return etiquetas[estado] || estado;
    }
}
