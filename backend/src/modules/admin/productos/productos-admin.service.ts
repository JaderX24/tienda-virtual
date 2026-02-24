import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CrearProductoAdminDto,
    ActualizarProductoAdminDto,
    FiltroProductosAdminDto,
} from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class ProductosAdminService {
    private readonly logger = new Logger(ProductosAdminService.name);

    constructor(private prisma: PrismaService) {}

    private mapearProducto(registro: any) {
        return {
            id: registro.id,
            nombre: registro.nombre,
            slug: registro.slug,
            sku: registro.sku,
            descripcionCorta: registro.descripcionCorta,
            descripcion: registro.descripcion,
            precio: Number(registro.precio),
            precioComparacion: registro.precioComparacion ? Number(registro.precioComparacion) : null,
            costo: registro.costo ? Number(registro.costo) : null,
            stock: registro.stock,
            stockMinimo: registro.stockMinimo,
            peso: registro.peso ? Number(registro.peso) : null,
            activo: registro.activo,
            destacado: registro.destacado,
            categoriaId: registro.categoriaId,
            marcaId: registro.marcaId,
            creadoEn: registro.creadoEn,
            actualizadoEn: registro.actualizadoEn,
            categoria: registro.categoria ? {
                id: registro.categoria.id,
                nombre: registro.categoria.nombre,
                slug: registro.categoria.slug,
                activa: registro.categoria.activa,
            } : null,
            marca: registro.marca ? {
                id: registro.marca.id,
                nombre: registro.marca.nombre,
                slug: registro.marca.slug,
                logo: registro.marca.logo,
                activa: registro.marca.activa,
            } : null,
            imagenes: registro.imagenes?.map((img: any) => ({
                id: img.id,
                url: img.url,
                altText: img.altText,
                orden: img.orden,
                esPrincipal: img.esPrincipal,
            })) || [],
        };
    }

    async obtenerTodos(filtros: FiltroProductosAdminDto) {
        const {
            busqueda,
            categoriaId,
            marcaId,
            precioMinimo,
            precioMaximo,
            activo,
            destacado,
            pagina = 1,
            limite = 20,
            ordenarPor,
            orden,
        } = filtros;

        const where: Prisma.ProductoWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { sku: { contains: busqueda } },
                { descripcionCorta: { contains: busqueda } },
            ];
        }

        if (categoriaId) where.categoriaId = categoriaId;
        if (marcaId) where.marcaId = marcaId;
        if (activo !== undefined) where.activo = activo;
        if (destacado !== undefined) where.destacado = destacado;

        if (precioMinimo !== undefined || precioMaximo !== undefined) {
            where.precio = {};
            if (precioMinimo !== undefined) {
                (where.precio as Prisma.DecimalFilter).gte = precioMinimo;
            }
            if (precioMaximo !== undefined) {
                (where.precio as Prisma.DecimalFilter).lte = precioMaximo;
            }
        }

        const campoOrden = this.mapearCampoOrden(ordenarPor);

        const [productos, total] = await Promise.all([
            this.prisma.producto.findMany({
                where,
                include: {
                    categoria: true,
                    marca: true,
                    imagenes: {
                        orderBy: { orden: 'asc' },
                        take: 1,
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [campoOrden]: orden || 'desc' },
            }),
            this.prisma.producto.count({ where }),
        ]);

        return {
            datos: productos.map((p) => this.mapearProducto(p)),
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerPorId(id: number) {
        const producto = await this.prisma.producto.findUnique({
            where: { id },
            include: {
                categoria: true,
                marca: true,
                imagenes: { orderBy: { orden: 'asc' } },
            },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        return this.mapearProducto(producto);
    }

    async crear(crearProductoDto: CrearProductoAdminDto) {
        const { etiquetas, ...datosProducto } = crearProductoDto;

        const productoExistente = await this.prisma.producto.findUnique({
            where: { sku: datosProducto.sku },
        });

        if (productoExistente) {
            throw new ConflictException('Ya existe un producto con este SKU');
        }

        await this.validarRelaciones(datosProducto.categoriaId, datosProducto.marcaId);

        const producto = await this.prisma.producto.create({
            data: {
                ...datosProducto,
                slug: this.generarSlug(datosProducto.nombre),
                activo: datosProducto.activo ?? true,
                destacado: datosProducto.destacado ?? false,
            },
            include: {
                categoria: true,
                marca: true,
            },
        });

        this.logger.log(`Producto creado: ${producto.nombre} (SKU: ${producto.sku})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            producto: this.mapearProducto(producto),
        };
    }

    async actualizar(id: number, actualizarProductoDto: ActualizarProductoAdminDto) {
        const producto = await this.prisma.producto.findUnique({ where: { id } });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        const { etiquetas, ...datosActualizacion } = actualizarProductoDto;

        if (datosActualizacion.sku && datosActualizacion.sku !== producto.sku) {
            const skuExistente = await this.prisma.producto.findUnique({
                where: { sku: datosActualizacion.sku },
            });

            if (skuExistente) {
                throw new ConflictException('Ya existe un producto con este SKU');
            }
        }

        if (datosActualizacion.categoriaId || datosActualizacion.marcaId) {
            await this.validarRelaciones(
                datosActualizacion.categoriaId || producto.categoriaId,
                datosActualizacion.marcaId ?? producto.marcaId,
            );
        }

        const datosFinales: Record<string, unknown> = { ...datosActualizacion };

        if (datosActualizacion.nombre) {
            datosFinales.slug = this.generarSlug(datosActualizacion.nombre);
        }

        const productoActualizado = await this.prisma.producto.update({
            where: { id },
            data: datosFinales,
            include: {
                categoria: true,
                marca: true,
            },
        });

        this.logger.log(`Producto actualizado: ${productoActualizado.nombre} (ID: ${id})`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            producto: this.mapearProducto(productoActualizado),
        };
    }

    async cambiarEstado(id: number, activo: boolean) {
        const producto = await this.prisma.producto.findUnique({ where: { id } });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        const productoActualizado = await this.prisma.producto.update({
            where: { id },
            data: { activo },
            include: {
                categoria: true,
                marca: true,
            },
        });

        const accion = activo ? 'activado' : 'desactivado';
        this.logger.log(`Producto ${accion}: ${productoActualizado.nombre} (ID: ${id})`);

        return {
            mensaje: `Producto ${accion} exitosamente`,
            producto: this.mapearProducto(productoActualizado),
        };
    }

    async eliminar(id: number) {
        const producto = await this.prisma.producto.findUnique({ where: { id } });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        await this.prisma.producto.update({
            where: { id },
            data: { activo: false },
        });

        this.logger.log(`Producto desactivado (eliminación lógica): ${producto.nombre} (ID: ${id})`);

        return { mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE };
    }

    async obtenerResumen() {
        const [total, activos, inactivos, sinStock, stockBajo, destacados] = await Promise.all([
            this.prisma.producto.count(),
            this.prisma.producto.count({ where: { activo: true } }),
            this.prisma.producto.count({ where: { activo: false } }),
            this.prisma.producto.count({ where: { stock: 0, activo: true } }),
            this.prisma.producto.count({
                where: {
                    activo: true,
                    stock: { gt: 0 },
                    AND: {
                        stock: { lte: this.prisma.producto.fields?.stockMinimo as any || 5 },
                    },
                },
            }).catch(() => 0),
            this.prisma.producto.count({ where: { destacado: true, activo: true } }),
        ]);

        return {
            total,
            activos,
            inactivos,
            sinStock,
            stockBajo,
            destacados,
        };
    }

    async obtenerCategoriasActivas() {
        return this.prisma.categoria.findMany({
            where: { activa: true },
            select: { id: true, nombre: true, slug: true },
            orderBy: { nombre: 'asc' },
        });
    }

    async obtenerMarcasActivas() {
        return this.prisma.marca.findMany({
            where: { activa: true },
            select: { id: true, nombre: true, slug: true, logo: true },
            orderBy: { nombre: 'asc' },
        });
    }

    private async validarRelaciones(categoriaId: number, marcaId?: number | null) {
        const categoria = await this.prisma.categoria.findUnique({
            where: { id: categoriaId },
        });

        if (!categoria) {
            throw new NotFoundException('La categoría seleccionada no existe');
        }

        if (!categoria.activa) {
            throw new ConflictException('La categoría seleccionada está inactiva');
        }

        if (marcaId) {
            const marca = await this.prisma.marca.findUnique({
                where: { id: marcaId },
            });

            if (!marca) {
                throw new NotFoundException('La marca seleccionada no existe');
            }

            if (!marca.activa) {
                throw new ConflictException('La marca seleccionada está inactiva');
            }
        }
    }

    private generarSlug(nombre: string): string {
        return nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    private mapearCampoOrden(campo?: string): string {
        const camposPermitidos: Record<string, string> = {
            nombre: 'nombre',
            precio: 'precio',
            stock: 'stock',
            creadoEn: 'creadoEn',
            actualizadoEn: 'actualizadoEn',
            sku: 'sku',
        };

        return camposPermitidos[campo || ''] || 'creadoEn';
    }
}
