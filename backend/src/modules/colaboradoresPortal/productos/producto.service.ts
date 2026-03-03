import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConsultarProductosDto, ConsultarMovimientosProductoDto } from './dto';

@Injectable()
export class ProductoColaboradorService {
    private readonly logger = new Logger(ProductoColaboradorService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerResumen() {
        const [totalProductos, productosActivos, agotados, stockBajo] = await Promise.all([
            this.prisma.producto.count(),
            this.prisma.producto.count({ where: { activo: true } }),
            this.prisma.producto.count({ where: { activo: true, stock: 0 } }),
            this.prisma.producto.count({
                where: {
                    activo: true,
                    stock: { gt: 0 },
                    stockMinimo: { gt: 0 },
                    AND: {
                        stock: { lte: this.prisma.producto.fields?.stockMinimo as any },
                    },
                },
            }).catch(() => 0),
        ]);

        // Calcular stock bajo de forma manual para evitar problemas con campo a campo
        const productosConStockBajo = await this.prisma.$queryRawUnsafe<{ total: bigint }[]>(
            `SELECT COUNT(*) as total FROM productos WHERE activo = 1 AND stock > 0 AND stock <= stock_minimo`,
        );

        const totalStockBajo = Number(productosConStockBajo[0]?.total ?? 0);

        return {
            exito: true,
            datos: {
                totalProductos,
                productosActivos,
                agotados,
                stockBajo: totalStockBajo,
                inactivos: totalProductos - productosActivos,
            },
        };
    }

    async obtenerProductos(filtros: ConsultarProductosDto) {
        const {
            busqueda,
            categoriaId,
            marcaId,
            estado,
            precioDesde,
            precioHasta,
            ordenarPor = 'nombre',
            ordenDireccion = 'asc',
            pagina = 1,
            limite = 15,
        } = filtros;

        const where: any = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { sku: { contains: busqueda } },
                { descripcionCorta: { contains: busqueda } },
            ];
        }

        if (categoriaId) {
            where.categoriaId = categoriaId;
        }

        if (marcaId) {
            where.marcaId = marcaId;
        }

        if (estado && estado !== 'todos') {
            if (estado === 'activo') {
                where.activo = true;
            } else if (estado === 'inactivo') {
                where.activo = false;
            } else if (estado === 'agotado') {
                where.activo = true;
                where.stock = 0;
            } else if (estado === 'stock_bajo') {
                where.activo = true;
                where.stock = { gt: 0 };
            }
        }

        if (precioDesde !== undefined || precioHasta !== undefined) {
            where.precio = {};
            if (precioDesde !== undefined) where.precio.gte = precioDesde;
            if (precioHasta !== undefined) where.precio.lte = precioHasta;
        }

        const campoOrden = this.obtenerCampoOrden(ordenarPor);
        const orderBy = { [campoOrden]: ordenDireccion };

        const [total, productos] = await Promise.all([
            this.prisma.producto.count({ where }),
            this.prisma.producto.findMany({
                where,
                include: {
                    categoria: { select: { id: true, nombre: true } },
                    marca: { select: { id: true, nombre: true } },
                    imagenes: {
                        where: { esPrincipal: true },
                        select: { url: true, altText: true },
                        take: 1,
                    },
                },
                orderBy,
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        // Filtro adicional para stock_bajo (comparar stock con stockMinimo)
        let datos = productos.map(p => this.formatearProductoLista(p));

        if (estado === 'stock_bajo') {
            datos = datos.filter(p => p.stock <= p.stockMinimo && p.stock > 0);
        }

        return {
            exito: true,
            datos,
            paginacion: {
                pagina,
                limite,
                total: estado === 'stock_bajo' ? datos.length : total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerDetalleProducto(productoId: number) {
        const producto = await this.prisma.producto.findUnique({
            where: { id: productoId },
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true,
                        categoriaPadre: { select: { id: true, nombre: true } },
                    },
                },
                marca: { select: { id: true, nombre: true, logo: true } },
                imagenes: {
                    select: { id: true, url: true, altText: true, orden: true, esPrincipal: true },
                    orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }],
                },
            },
        });

        if (!producto) {
            throw new NotFoundException('Producto no encontrado');
        }

        const estadoStock = this.determinarEstadoStock(producto.stock, producto.stockMinimo);

        const ultimosMovimientos = await this.prisma.movimientoInventario.findMany({
            where: { productoId: producto.id },
            include: {
                usuario: { select: { nombre: true } },
            },
            orderBy: { creadoEn: 'desc' },
            take: 10,
        });

        const margenGanancia = producto.costo
            ? ((Number(producto.precio) - Number(producto.costo)) / Number(producto.precio)) * 100
            : null;

        return {
            exito: true,
            datos: {
                id: producto.id,
                nombre: producto.nombre,
                sku: producto.sku,
                slug: producto.slug,
                descripcionCorta: producto.descripcionCorta,
                descripcion: producto.descripcion,
                precio: Number(producto.precio),
                precioComparacion: producto.precioComparacion ? Number(producto.precioComparacion) : null,
                costo: producto.costo ? Number(producto.costo) : null,
                margenGanancia: margenGanancia ? Math.round(margenGanancia * 100) / 100 : null,
                stock: producto.stock,
                stockMinimo: producto.stockMinimo,
                estadoStock,
                peso: producto.peso ? Number(producto.peso) : null,
                activo: producto.activo,
                destacado: producto.destacado,
                categoria: producto.categoria
                    ? {
                        id: producto.categoria.id,
                        nombre: producto.categoria.nombre,
                        padre: producto.categoria.categoriaPadre
                            ? { id: producto.categoria.categoriaPadre.id, nombre: producto.categoria.categoriaPadre.nombre }
                            : null,
                    }
                    : null,
                marca: producto.marca
                    ? { id: producto.marca.id, nombre: producto.marca.nombre, logo: producto.marca.logo }
                    : null,
                imagenes: producto.imagenes.map(img => ({
                    id: img.id,
                    url: img.url,
                    altText: img.altText,
                    esPrincipal: img.esPrincipal,
                })),
                ultimosMovimientos: ultimosMovimientos.map(m => ({
                    id: m.id,
                    tipo: m.tipoMovimiento,
                    cantidad: m.cantidad,
                    stockAnterior: m.stockAnterior,
                    stockNuevo: m.stockNuevo,
                    motivo: m.motivo,
                    usuario: m.usuario.nombre,
                    fecha: m.creadoEn,
                })),
                creadoEn: producto.creadoEn,
                actualizadoEn: producto.actualizadoEn,
            },
        };
    }

    async obtenerMovimientosProducto(productoId: number, filtros: ConsultarMovimientosProductoDto) {
        const { pagina = 1, limite = 15, tipoMovimiento } = filtros;

        const producto = await this.prisma.producto.findUnique({
            where: { id: productoId },
            select: { id: true },
        });

        if (!producto) {
            throw new NotFoundException('Producto no encontrado');
        }

        const where: any = { productoId };
        if (tipoMovimiento) {
            where.tipoMovimiento = tipoMovimiento;
        }

        const [total, movimientos] = await Promise.all([
            this.prisma.movimientoInventario.count({ where }),
            this.prisma.movimientoInventario.findMany({
                where,
                include: {
                    usuario: { select: { nombre: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        return {
            exito: true,
            datos: movimientos.map(m => ({
                id: m.id,
                tipo: m.tipoMovimiento,
                cantidad: m.cantidad,
                stockAnterior: m.stockAnterior,
                stockNuevo: m.stockNuevo,
                motivo: m.motivo,
                usuario: m.usuario.nombre,
                fecha: m.creadoEn,
            })),
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerCategorias() {
        const categorias = await this.prisma.categoria.findMany({
            where: { activa: true },
            select: {
                id: true,
                nombre: true,
                categoriaPadreId: true,
                _count: { select: { productos: true } },
            },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        });

        return {
            exito: true,
            datos: categorias.map(c => ({
                id: c.id,
                nombre: c.nombre,
                categoriaPadreId: c.categoriaPadreId,
                totalProductos: c._count.productos,
            })),
        };
    }

    async obtenerMarcas() {
        const marcas = await this.prisma.marca.findMany({
            where: { activa: true },
            select: {
                id: true,
                nombre: true,
                logo: true,
                _count: { select: { productos: true } },
            },
            orderBy: { nombre: 'asc' },
        });

        return {
            exito: true,
            datos: marcas.map(m => ({
                id: m.id,
                nombre: m.nombre,
                logo: m.logo,
                totalProductos: m._count.productos,
            })),
        };
    }

    private formatearProductoLista(producto: any) {
        const imagenPrincipal = producto.imagenes?.[0] || null;

        return {
            id: producto.id,
            nombre: producto.nombre,
            sku: producto.sku,
            descripcionCorta: producto.descripcionCorta,
            precio: Number(producto.precio),
            precioComparacion: producto.precioComparacion ? Number(producto.precioComparacion) : null,
            costo: producto.costo ? Number(producto.costo) : null,
            stock: producto.stock,
            stockMinimo: producto.stockMinimo,
            estadoStock: this.determinarEstadoStock(producto.stock, producto.stockMinimo),
            activo: producto.activo,
            destacado: producto.destacado,
            categoria: producto.categoria?.nombre || 'Sin categoría',
            categoriaId: producto.categoria?.id || null,
            marca: producto.marca?.nombre || null,
            marcaId: producto.marca?.id || null,
            imagen: imagenPrincipal?.url || null,
        };
    }

    private determinarEstadoStock(stock: number, stockMinimo: number): string {
        if (stock <= 0) return 'agotado';
        if (stock <= stockMinimo) return 'bajo';
        return 'disponible';
    }

    private obtenerCampoOrden(campo: string): string {
        const mapa: Record<string, string> = {
            nombre: 'nombre',
            precio: 'precio',
            stock: 'stock',
            sku: 'sku',
            creadoEn: 'creadoEn',
        };
        return mapa[campo] || 'nombre';
    }
}
