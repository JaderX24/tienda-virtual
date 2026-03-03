import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CrearConteoDto,
    ConsultarConteosDto,
    RegistrarDetalleConteoDto,
    RegistrarDetallesLoteDto,
    ActualizarEstadoConteoDto,
} from './dto';

@Injectable()
export class ConteoService {
    private readonly logger = new Logger(ConteoService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerConteos(usuarioId: number, filtros: ConsultarConteosDto) {
        const {
            almacenId,
            estado,
            tipo,
            fechaDesde,
            fechaHasta,
            busqueda,
            pagina = 1,
            limite = 15,
        } = filtros;

        const almacenesIds = await this.obtenerAlmacenesDelUsuario(usuarioId);

        const where: any = {
            almacenId: { in: almacenesIds },
        };

        if (almacenId) {
            if (!almacenesIds.includes(almacenId)) {
                throw new ForbiddenException('No tiene acceso a este almacén');
            }
            where.almacenId = almacenId;
        }

        if (estado) where.estado = estado;
        if (tipo) where.tipo = tipo;

        if (fechaDesde || fechaHasta) {
            where.fechaProgramada = {};
            if (fechaDesde) where.fechaProgramada.gte = new Date(fechaDesde);
            if (fechaHasta) {
                const hasta = new Date(fechaHasta);
                hasta.setDate(hasta.getDate() + 1);
                where.fechaProgramada.lt = hasta;
            }
        }

        if (busqueda) {
            where.OR = [
                { codigo: { contains: busqueda } },
                { zonaConteo: { contains: busqueda } },
                { notas: { contains: busqueda } },
            ];
        }

        const [total, conteos] = await Promise.all([
            this.prisma.colabConteoInventario.count({ where }),
            this.prisma.colabConteoInventario.findMany({
                where,
                include: {
                    almacen: { select: { id: true, nombre: true, codigo: true } },
                    responsable: { select: { nombre: true, apellido: true } },
                    _count: { select: { detalles: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        const datos = conteos.map(c => ({
            id: c.id.toString(),
            codigo: c.codigo,
            tipo: c.tipo,
            zonaConteo: c.zonaConteo,
            estado: c.estado,
            almacen: c.almacen.nombre,
            almacenCodigo: c.almacen.codigo,
            almacenId: c.almacen.id,
            responsable: `${c.responsable.nombre} ${c.responsable.apellido}`,
            fechaProgramada: c.fechaProgramada.toISOString(),
            fechaInicio: c.fechaInicio?.toISOString() || null,
            fechaFin: c.fechaFin?.toISOString() || null,
            totalProductosContados: c.totalProductosContados,
            totalDiscrepancias: c.totalDiscrepancias,
            totalFaltantes: c.totalFaltantes,
            totalSobrantes: c.totalSobrantes,
            productosRegistrados: c._count.detalles,
            notas: c.notas,
            fecha: c.creadoEn.toISOString(),
        }));

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

    async crearConteo(usuarioId: number, dto: CrearConteoDto) {
        await this.validarAccesoAlmacen(usuarioId, dto.almacenId);

        if (dto.categoriaId) {
            const categoria = await this.prisma.categoria.findUnique({
                where: { id: dto.categoriaId },
            });
            if (!categoria) {
                throw new BadRequestException('La categoría seleccionada no existe');
            }
        }

        const fechaProg = new Date(dto.fechaProgramada);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fechaProg < hoy) {
            throw new BadRequestException('La fecha programada no puede ser anterior a hoy');
        }

        const codigo = await this.generarCodigoConteo();

        const conteo = await this.prisma.colabConteoInventario.create({
            data: {
                almacenId: dto.almacenId,
                codigo,
                tipo: dto.tipo,
                zonaConteo: dto.zonaConteo || null,
                categoriaId: dto.categoriaId || null,
                responsableId: usuarioId,
                estado: 'programado',
                fechaProgramada: new Date(dto.fechaProgramada),
                notas: dto.notas || null,
            },
            include: {
                almacen: { select: { nombre: true } },
            },
        });

        this.logger.log(`Conteo ${codigo} creado por usuario ${usuarioId} para almacén ${dto.almacenId}`);

        return {
            exito: true,
            mensaje: `Conteo ${codigo} programado exitosamente`,
            datos: {
                id: conteo.id.toString(),
                codigo: conteo.codigo,
                almacen: conteo.almacen.nombre,
                tipo: conteo.tipo,
                estado: conteo.estado,
                fechaProgramada: conteo.fechaProgramada.toISOString(),
            },
        };
    }

    async obtenerDetalle(usuarioId: number, conteoId: string) {
        const id = BigInt(conteoId);
        const conteo = await this.prisma.colabConteoInventario.findFirst({
            where: { id },
            include: {
                almacen: { select: { id: true, nombre: true, codigo: true, direccion: true } },
                responsable: { select: { nombre: true, apellido: true, codigoColaborador: true } },
                detalles: {
                    include: {
                        producto: {
                            select: {
                                id: true,
                                nombre: true,
                                sku: true,
                                stock: true,
                                stockMinimo: true,
                                categoria: { select: { nombre: true } },
                            },
                        },
                        contador: { select: { nombre: true, apellido: true } },
                    },
                    orderBy: { fechaConteo: 'desc' },
                },
            },
        });

        if (!conteo) {
            throw new NotFoundException('Conteo no encontrado');
        }

        const almacenesIds = await this.obtenerAlmacenesDelUsuario(usuarioId);
        if (!almacenesIds.includes(conteo.almacenId)) {
            throw new ForbiddenException('No tiene acceso a este conteo');
        }

        const detalles = conteo.detalles.map(d => ({
            id: d.id.toString(),
            producto: {
                id: d.producto.id,
                nombre: d.producto.nombre,
                sku: d.producto.sku,
                stockSistema: d.producto.stock,
                stockMinimo: d.producto.stockMinimo,
                categoria: d.producto.categoria.nombre,
            },
            cantidadSistema: d.cantidadSistema,
            cantidadFisica: d.cantidadFisica,
            diferencia: d.cantidadFisica - d.cantidadSistema,
            ubicacion: d.ubicacion,
            numeroLote: d.numeroLote,
            estadoProducto: d.estadoProducto,
            contadoPor: `${d.contador.nombre} ${d.contador.apellido}`,
            fechaConteo: d.fechaConteo.toISOString(),
            notas: d.notas,
        }));

        return {
            exito: true,
            datos: {
                id: conteo.id.toString(),
                codigo: conteo.codigo,
                tipo: conteo.tipo,
                zonaConteo: conteo.zonaConteo,
                estado: conteo.estado,
                almacen: conteo.almacen,
                responsable: {
                    nombre: `${conteo.responsable.nombre} ${conteo.responsable.apellido}`,
                    codigo: conteo.responsable.codigoColaborador,
                },
                fechaProgramada: conteo.fechaProgramada.toISOString(),
                fechaInicio: conteo.fechaInicio?.toISOString() || null,
                fechaFin: conteo.fechaFin?.toISOString() || null,
                totalProductosContados: conteo.totalProductosContados,
                totalDiscrepancias: conteo.totalDiscrepancias,
                totalFaltantes: conteo.totalFaltantes,
                totalSobrantes: conteo.totalSobrantes,
                notas: conteo.notas,
                detalles,
                fecha: conteo.creadoEn.toISOString(),
            },
        };
    }

    async registrarDetalle(
        usuarioId: number,
        conteoId: string,
        dto: RegistrarDetalleConteoDto,
    ) {
        const id = BigInt(conteoId);
        const conteo = await this.prisma.colabConteoInventario.findUnique({
            where: { id },
        });

        if (!conteo) {
            throw new NotFoundException('Conteo no encontrado');
        }

        if (conteo.estado !== 'en_progreso') {
            throw new BadRequestException('Solo se puede registrar productos en conteos en progreso');
        }

        await this.validarAccesoAlmacen(usuarioId, conteo.almacenId);

        const producto = await this.prisma.producto.findUnique({
            where: { id: dto.productoId },
            select: { id: true, stock: true, nombre: true },
        });

        if (!producto) {
            throw new BadRequestException('El producto no existe');
        }

        const detalleExistente = await this.prisma.colabConteoInventarioDetalle.findFirst({
            where: { conteoId: id, productoId: dto.productoId },
        });

        if (detalleExistente) {
            const actualizado = await this.prisma.colabConteoInventarioDetalle.update({
                where: { id: detalleExistente.id },
                data: {
                    cantidadFisica: dto.cantidadFisica,
                    cantidadSistema: producto.stock,
                    ubicacion: dto.ubicacion || detalleExistente.ubicacion,
                    numeroLote: dto.numeroLote || detalleExistente.numeroLote,
                    estadoProducto: dto.estadoProducto || detalleExistente.estadoProducto,
                    notas: dto.notas || detalleExistente.notas,
                    contadoPor: usuarioId,
                    fechaConteo: new Date(),
                },
                include: {
                    producto: { select: { nombre: true, sku: true } },
                },
            });

            await this.recalcularTotales(id);

            return {
                exito: true,
                mensaje: `Producto "${producto.nombre}" actualizado en el conteo`,
                datos: {
                    id: actualizado.id.toString(),
                    producto: actualizado.producto.nombre,
                    cantidadSistema: actualizado.cantidadSistema,
                    cantidadFisica: actualizado.cantidadFisica,
                    diferencia: actualizado.cantidadFisica - actualizado.cantidadSistema,
                },
            };
        }

        const detalle = await this.prisma.colabConteoInventarioDetalle.create({
            data: {
                conteoId: id,
                productoId: dto.productoId,
                cantidadSistema: producto.stock,
                cantidadFisica: dto.cantidadFisica,
                ubicacion: dto.ubicacion || null,
                numeroLote: dto.numeroLote || null,
                estadoProducto: dto.estadoProducto || 'bueno',
                contadoPor: usuarioId,
                notas: dto.notas || null,
            },
            include: {
                producto: { select: { nombre: true, sku: true } },
            },
        });

        await this.recalcularTotales(id);

        return {
            exito: true,
            mensaje: `Producto "${producto.nombre}" registrado en el conteo`,
            datos: {
                id: detalle.id.toString(),
                producto: detalle.producto.nombre,
                cantidadSistema: detalle.cantidadSistema,
                cantidadFisica: detalle.cantidadFisica,
                diferencia: detalle.cantidadFisica - detalle.cantidadSistema,
            },
        };
    }

    async registrarDetallesLote(
        usuarioId: number,
        conteoId: string,
        dto: RegistrarDetallesLoteDto,
    ) {
        const resultados = [];
        for (const detalle of dto.detalles) {
            const resultado = await this.registrarDetalle(usuarioId, conteoId, detalle);
            resultados.push(resultado.datos);
        }

        return {
            exito: true,
            mensaje: `${resultados.length} productos registrados en el conteo`,
            datos: resultados,
        };
    }

    async actualizarEstado(
        usuarioId: number,
        conteoId: string,
        dto: ActualizarEstadoConteoDto,
    ) {
        const id = BigInt(conteoId);
        const conteo = await this.prisma.colabConteoInventario.findUnique({
            where: { id },
            include: { detalles: true },
        });

        if (!conteo) {
            throw new NotFoundException('Conteo no encontrado');
        }

        await this.validarAccesoAlmacen(usuarioId, conteo.almacenId);
        this.validarTransicionEstado(conteo.estado, dto.estado);

        const datosActualizar: any = {
            estado: dto.estado,
        };

        if (dto.notas) {
            datosActualizar.notas = conteo.notas
                ? `${conteo.notas}\n---\n${dto.notas}`
                : dto.notas;
        }

        if (dto.estado === 'en_progreso') {
            datosActualizar.fechaInicio = new Date();
        }

        if (dto.estado === 'completado') {
            if (conteo.detalles.length === 0) {
                throw new BadRequestException('No se puede completar un conteo sin productos registrados');
            }
            datosActualizar.fechaFin = new Date();
        }

        if (dto.estado === 'aprobado') {
            datosActualizar.aprobadoPor = usuarioId;
            datosActualizar.fechaAprobacion = new Date();

            if (dto.ajustarStock) {
                await this.ajustarStockSegunConteo(conteo.id, conteo.detalles);
            }
        }

        await this.prisma.colabConteoInventario.update({
            where: { id },
            data: datosActualizar,
        });

        const etiquetasEstado: Record<string, string> = {
            en_progreso: 'iniciado',
            completado: 'completado',
            aprobado: 'aprobado',
            rechazado: 'rechazado',
            cancelado: 'cancelado',
        };

        this.logger.log(
            `Conteo ${conteo.codigo} ${etiquetasEstado[dto.estado]} por usuario ${usuarioId}`,
        );

        return {
            exito: true,
            mensaje: `Conteo ${conteo.codigo} ${etiquetasEstado[dto.estado]} exitosamente`,
        };
    }

    async obtenerProductosParaConteo(usuarioId: number, conteoId: string) {
        const id = BigInt(conteoId);
        const conteo = await this.prisma.colabConteoInventario.findUnique({
            where: { id },
            select: { almacenId: true, categoriaId: true, tipo: true },
        });

        if (!conteo) {
            throw new NotFoundException('Conteo no encontrado');
        }

        await this.validarAccesoAlmacen(usuarioId, conteo.almacenId);

        const where: any = { activo: true };
        if (conteo.tipo === 'parcial' && conteo.categoriaId) {
            where.categoriaId = conteo.categoriaId;
        }

        const productos = await this.prisma.producto.findMany({
            where,
            select: {
                id: true,
                nombre: true,
                sku: true,
                stock: true,
                stockMinimo: true,
                categoria: { select: { nombre: true } },
            },
            orderBy: { nombre: 'asc' },
            take: 500,
        });

        const detallesExistentes = await this.prisma.colabConteoInventarioDetalle.findMany({
            where: { conteoId: id },
            select: { productoId: true, cantidadFisica: true },
        });

        const mapaContados = new Map(
            detallesExistentes.map(d => [d.productoId, d.cantidadFisica]),
        );

        const datos = productos.map(p => ({
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            stock: p.stock,
            stockMinimo: p.stockMinimo,
            categoria: p.categoria.nombre,
            yaContado: mapaContados.has(p.id),
            cantidadRegistrada: mapaContados.get(p.id) ?? null,
        }));

        return { exito: true, datos };
    }

    async obtenerAlmacenesDisponibles(usuarioId: number) {
        const asignaciones = await this.prisma.colabAsignacionAlmacen.findMany({
            where: { usuarioId, esActiva: true },
            select: { almacenId: true },
        });

        if (asignaciones.length === 0) {
            return { exito: true, datos: [] };
        }

        const almacenIds = asignaciones.map(a => a.almacenId);
        const almacenes = await this.prisma.inventarioAlmacen.findMany({
            where: { id: { in: almacenIds }, esActivo: true },
            select: { id: true, codigo: true, nombre: true, tipo: true, direccion: true },
            orderBy: { nombre: 'asc' },
        });

        return { exito: true, datos: almacenes };
    }

    async obtenerCategorias() {
        const categorias = await this.prisma.categoria.findMany({
            where: { activa: true },
            select: { id: true, nombre: true },
            orderBy: { nombre: 'asc' },
        });

        return { exito: true, datos: categorias };
    }

    async obtenerResumen(usuarioId: number) {
        const almacenesIds = await this.obtenerAlmacenesDelUsuario(usuarioId);

        const [programados, enProgreso, completados, totalMes] = await Promise.all([
            this.prisma.colabConteoInventario.count({
                where: { almacenId: { in: almacenesIds }, estado: 'programado' },
            }),
            this.prisma.colabConteoInventario.count({
                where: { almacenId: { in: almacenesIds }, estado: 'en_progreso' },
            }),
            this.prisma.colabConteoInventario.count({
                where: {
                    almacenId: { in: almacenesIds },
                    estado: { in: ['completado', 'aprobado'] },
                    fechaFin: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
                },
            }),
            this.prisma.colabConteoInventario.count({
                where: {
                    almacenId: { in: almacenesIds },
                    creadoEn: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
                },
            }),
        ]);

        return {
            exito: true,
            datos: { programados, enProgreso, completados, totalMes },
        };
    }

    // Métodos privados

    private async obtenerAlmacenesDelUsuario(usuarioId: number): Promise<number[]> {
        const asignaciones = await this.prisma.colabAsignacionAlmacen.findMany({
            where: { usuarioId, esActiva: true },
            select: { almacenId: true },
        });
        return asignaciones.map(a => a.almacenId);
    }

    private async validarAccesoAlmacen(usuarioId: number, almacenId: number): Promise<void> {
        const asignacion = await this.prisma.colabAsignacionAlmacen.findFirst({
            where: { usuarioId, almacenId, esActiva: true },
        });

        if (!asignacion) {
            throw new ForbiddenException('No tiene acceso al almacén seleccionado');
        }
    }

    private validarTransicionEstado(actual: string, nuevo: string): void {
        const transicionesValidas: Record<string, string[]> = {
            programado: ['en_progreso', 'cancelado'],
            en_progreso: ['completado', 'cancelado'],
            completado: ['aprobado', 'rechazado'],
            rechazado: ['en_progreso'],
            aprobado: [],
            cancelado: [],
        };

        const permitidos = transicionesValidas[actual] || [];
        if (!permitidos.includes(nuevo)) {
            throw new BadRequestException(
                `No se puede cambiar el estado de "${actual}" a "${nuevo}"`,
            );
        }
    }

    private async recalcularTotales(conteoId: bigint): Promise<void> {
        const detalles = await this.prisma.colabConteoInventarioDetalle.findMany({
            where: { conteoId },
        });

        let totalContados = detalles.length;
        let totalDiscrepancias = 0;
        let totalFaltantes = 0;
        let totalSobrantes = 0;

        for (const d of detalles) {
            const diferencia = d.cantidadFisica - d.cantidadSistema;
            if (diferencia !== 0) {
                totalDiscrepancias++;
                if (diferencia < 0) totalFaltantes += Math.abs(diferencia);
                if (diferencia > 0) totalSobrantes += diferencia;
            }
        }

        await this.prisma.colabConteoInventario.update({
            where: { id: conteoId },
            data: {
                totalProductosContados: totalContados,
                totalDiscrepancias,
                totalFaltantes,
                totalSobrantes,
            },
        });
    }

    private async ajustarStockSegunConteo(
        conteoId: bigint,
        detalles: Array<{ productoId: number; cantidadSistema: number; cantidadFisica: number }>,
    ): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            for (const detalle of detalles) {
                const diferencia = detalle.cantidadFisica - detalle.cantidadSistema;
                if (diferencia === 0) continue;

                await tx.producto.update({
                    where: { id: detalle.productoId },
                    data: { stock: detalle.cantidadFisica },
                });

                await tx.movimientoInventario.create({
                    data: {
                        productoId: detalle.productoId,
                        tipoMovimiento: diferencia > 0 ? 'entrada' : 'salida',
                        cantidad: Math.abs(diferencia),
                        stockAnterior: detalle.cantidadSistema,
                        stockNuevo: detalle.cantidadFisica,
                        motivo: `Ajuste por conteo #${conteoId}`,
                        usuarioId: 1,
                    },
                });
            }
        });

        this.logger.log(`Stock ajustado según conteo ${conteoId} - ${detalles.length} productos revisados`);
    }

    private async generarCodigoConteo(): Promise<string> {
        const ahora = new Date();
        const anio = ahora.getFullYear().toString().slice(-2);
        const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');

        const ultimoConteo = await this.prisma.colabConteoInventario.findFirst({
            where: {
                codigo: { startsWith: `CNT-${anio}${mes}` },
            },
            orderBy: { codigo: 'desc' },
            select: { codigo: true },
        });

        let secuencial = 1;
        if (ultimoConteo) {
            const partes = ultimoConteo.codigo.split('-');
            const ultimoNum = parseInt(partes[2] || '0', 10);
            secuencial = ultimoNum + 1;
        }

        return `CNT-${anio}${mes}-${secuencial.toString().padStart(4, '0')}`;
    }
}
