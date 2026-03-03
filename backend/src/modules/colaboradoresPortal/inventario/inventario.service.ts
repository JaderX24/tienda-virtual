import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    ConsultarStockDto,
    ConsultarOperacionesDto,
    CrearEntradaDto,
    CrearSalidaDto,
} from './dto';

@Injectable()
export class InventarioService {
    private readonly logger = new Logger(InventarioService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerAlmacenesAsignados(usuarioId: number) {
        const asignaciones = await this.prisma.colabAsignacionAlmacen.findMany({
            where: { usuarioId, esActiva: true },
            select: { almacenId: true, nivelAcceso: true, zonaAsignada: true },
        });

        if (asignaciones.length === 0) {
            return { exito: true, datos: [] };
        }

        const almacenIds = asignaciones.map(a => a.almacenId);

        const almacenes = await this.prisma.inventarioAlmacen.findMany({
            where: { id: { in: almacenIds }, esActivo: true },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                tipo: true,
                direccion: true,
            },
            orderBy: { nombre: 'asc' },
        });

        const datosConAcceso = almacenes.map(alm => {
            const asig = asignaciones.find(a => a.almacenId === alm.id);
            return {
                ...alm,
                nivelAcceso: asig?.nivelAcceso || 'operacion',
                zonaAsignada: asig?.zonaAsignada || null,
            };
        });

        return { exito: true, datos: datosConAcceso };
    }

    async buscarProductos(busqueda?: string, limite: number = 15) {
        const where: any = { activo: true };

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { sku: { contains: busqueda } },
                { descripcionCorta: { contains: busqueda } },
            ];
        }

        const productos = await this.prisma.producto.findMany({
            where,
            select: {
                id: true,
                nombre: true,
                sku: true,
                precio: true,
                stock: true,
                stockMinimo: true,
                categoria: { select: { nombre: true } },
                imagenes: {
                    take: 1,
                    where: { esPrincipal: true },
                    select: { url: true },
                },
            },
            orderBy: { nombre: 'asc' },
            take: Math.min(limite, 30),
        });

        const datos = productos.map(p => ({
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            precio: Number(p.precio),
            stock: p.stock,
            stockMinimo: p.stockMinimo,
            categoria: p.categoria?.nombre || 'Sin categoría',
            imagen: p.imagenes[0]?.url || null,
            estadoStock: this.evaluarEstadoStock(p.stock, p.stockMinimo),
        }));

        return { exito: true, datos };
    }

    async obtenerStockGeneral(usuarioId: number, filtros: ConsultarStockDto) {
        const { busqueda, almacenId, pagina = 1, limite = 15 } = filtros;

        await this.verificarAccesoInventario(usuarioId, almacenId);

        const where: any = { activo: true };

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { sku: { contains: busqueda } },
                { descripcionCorta: { contains: busqueda } },
            ];
        }

        const [total, productos] = await Promise.all([
            this.prisma.producto.count({ where }),
            this.prisma.producto.findMany({
                where,
                select: {
                    id: true,
                    nombre: true,
                    sku: true,
                    precio: true,
                    stock: true,
                    stockMinimo: true,
                    categoria: { select: { id: true, nombre: true } },
                    imagenes: {
                        take: 1,
                        where: { esPrincipal: true },
                        select: { url: true, altText: true },
                    },
                },
                orderBy: { nombre: 'asc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        const datos = productos.map(p => ({
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            precio: Number(p.precio),
            stock: p.stock,
            stockMinimo: p.stockMinimo,
            categoria: p.categoria?.nombre || 'Sin categoría',
            imagen: p.imagenes[0]?.url || null,
            estadoStock: this.evaluarEstadoStock(p.stock, p.stockMinimo),
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

    async obtenerEntradas(usuarioId: number, filtros: ConsultarOperacionesDto) {
        return this.obtenerOperaciones(
            usuarioId,
            ['entrada', 'recepcion', 'ajuste_positivo'],
            filtros,
        );
    }

    async obtenerSalidas(usuarioId: number, filtros: ConsultarOperacionesDto) {
        return this.obtenerOperaciones(
            usuarioId,
            ['salida', 'despacho', 'ajuste_negativo'],
            filtros,
        );
    }

    async crearEntrada(usuarioId: number, dto: CrearEntradaDto, ip: string) {
        if (dto.almacenId) {
            await this.validarAccesoAlmacen(usuarioId, dto.almacenId);
        }

        const producto = await this.prisma.producto.findUnique({
            where: { id: dto.productoId },
            select: { id: true, nombre: true, stock: true, activo: true },
        });

        if (!producto || !producto.activo) {
            throw new NotFoundException('Producto no encontrado o inactivo');
        }

        const turnoActivo = await this.obtenerTurnoActivo(usuarioId);

        const resultado = await this.prisma.$transaction(async (tx) => {
            const stockAnterior = producto.stock;
            const stockNuevo = stockAnterior + dto.cantidad;

            await tx.producto.update({
                where: { id: dto.productoId },
                data: { stock: stockNuevo },
            });

            await tx.movimientoInventario.create({
                data: {
                    productoId: dto.productoId,
                    cantidad: dto.cantidad,
                    tipoMovimiento: 'entrada',
                    motivo: dto.motivo,
                    stockAnterior,
                    stockNuevo,
                    usuarioId,
                },
            });

            const actividad = await tx.colabActividadInventario.create({
                data: {
                    usuarioId,
                    turnoId: turnoActivo?.id || null,
                    almacenId: dto.almacenId || null,
                    tipoOperacion: 'entrada',
                    productoId: dto.productoId,
                    cantidad: dto.cantidad,
                    cantidadAnterior: stockAnterior,
                    cantidadNueva: stockNuevo,
                    motivo: dto.motivo,
                    notas: dto.notas || null,
                    documentoTipo: dto.documentoTipo || null,
                    documentoNumero: dto.documentoNumero || null,
                    ipAddress: ip,
                },
                include: {
                    producto: { select: { nombre: true, sku: true } },
                    almacen: { select: { nombre: true } },
                },
            });

            return actividad;
        });

        this.logger.log(
            `Entrada registrada: producto=${dto.productoId}, cantidad=${dto.cantidad}, usuario=${usuarioId}`,
        );

        return {
            exito: true,
            mensaje: `Entrada de ${dto.cantidad} unidades registrada correctamente`,
            datos: this.formatearOperacion(resultado),
        };
    }

    async crearSalida(usuarioId: number, dto: CrearSalidaDto, ip: string) {
        if (dto.almacenId) {
            await this.validarAccesoAlmacen(usuarioId, dto.almacenId);
        }

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
            const stockNuevo = stockAnterior - dto.cantidad;

            await tx.producto.update({
                where: { id: dto.productoId },
                data: { stock: stockNuevo },
            });

            await tx.movimientoInventario.create({
                data: {
                    productoId: dto.productoId,
                    cantidad: dto.cantidad,
                    tipoMovimiento: 'salida',
                    motivo: dto.motivo,
                    stockAnterior,
                    stockNuevo,
                    usuarioId,
                },
            });

            const actividad = await tx.colabActividadInventario.create({
                data: {
                    usuarioId,
                    turnoId: turnoActivo?.id || null,
                    almacenId: dto.almacenId || null,
                    tipoOperacion: 'salida',
                    productoId: dto.productoId,
                    cantidad: dto.cantidad,
                    cantidadAnterior: stockAnterior,
                    cantidadNueva: stockNuevo,
                    motivo: dto.motivo,
                    notas: dto.notas || null,
                    documentoTipo: dto.documentoTipo || null,
                    documentoNumero: dto.documentoNumero || null,
                    ipAddress: ip,
                },
                include: {
                    producto: { select: { nombre: true, sku: true } },
                    almacen: { select: { nombre: true } },
                },
            });

            return actividad;
        });

        this.logger.log(
            `Salida registrada: producto=${dto.productoId}, cantidad=${dto.cantidad}, usuario=${usuarioId}`,
        );

        return {
            exito: true,
            mensaje: `Salida de ${dto.cantidad} unidades registrada correctamente`,
            datos: this.formatearOperacion(resultado),
        };
    }

    // Métodos privados

    private async obtenerOperaciones(
        usuarioId: number,
        tiposOperacion: string[],
        filtros: ConsultarOperacionesDto,
    ) {
        const { almacenId, fechaDesde, fechaHasta, busqueda, pagina = 1, limite = 15 } = filtros;

        const where: any = {
            usuarioId,
            tipoOperacion: { in: tiposOperacion },
        };

        if (almacenId) {
            await this.validarAccesoAlmacen(usuarioId, almacenId);
            where.almacenId = almacenId;
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

        const [total, operaciones] = await Promise.all([
            this.prisma.colabActividadInventario.count({ where }),
            this.prisma.colabActividadInventario.findMany({
                where,
                include: {
                    producto: { select: { nombre: true, sku: true } },
                    almacen: { select: { nombre: true, codigo: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        return {
            exito: true,
            datos: operaciones.map(op => this.formatearOperacion(op)),
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
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

    private async verificarAccesoInventario(usuarioId: number, almacenId?: number) {
        if (almacenId) {
            await this.validarAccesoAlmacen(usuarioId, almacenId);
        }

        const asignaciones = await this.prisma.colabAsignacionAlmacen.findMany({
            where: { usuarioId, esActiva: true },
            select: { almacenId: true },
        });

        if (asignaciones.length === 0) {
            throw new ForbiddenException('No tienes almacenes asignados');
        }

        return asignaciones;
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

    private formatearOperacion(op: any) {
        return {
            id: op.id.toString(),
            tipoOperacion: op.tipoOperacion,
            producto: op.producto?.nombre || 'N/A',
            sku: op.producto?.sku || '',
            cantidad: op.cantidad,
            cantidadAnterior: op.cantidadAnterior,
            cantidadNueva: op.cantidadNueva,
            almacen: op.almacen?.nombre || '',
            almacenCodigo: op.almacen?.codigo || '',
            motivo: op.motivo,
            notas: op.notas,
            documentoTipo: op.documentoTipo,
            documentoNumero: op.documentoNumero,
            estadoAprobacion: op.estadoAprobacion,
            fecha: op.creadoEn,
        };
    }

    private evaluarEstadoStock(stock: number, stockMinimo: number): string {
        if (stock <= 0) return 'agotado';
        if (stock <= stockMinimo) return 'bajo';
        return 'disponible';
    }
}
