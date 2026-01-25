import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearProductoDto, ActualizarProductoDto, FiltroProductosDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../common/constants';

@Injectable()
export class ProductosService {
    private readonly logger = new Logger(ProductosService.name);

    constructor(private prisma: PrismaService) {}

    async crear(crearProductoDto: CrearProductoDto) {
        const { sku, etiquetas, ...datosProducto } = crearProductoDto;

        const productoExistente = await this.prisma.producto.findUnique({
            where: { sku },
        });

        if (productoExistente) {
            throw new ConflictException('Ya existe un producto con este SKU');
        }

        const producto = await this.prisma.producto.create({
            data: {
                ...datosProducto,
                sku,
                slug: this.generarSlug(datosProducto.nombre),
            },
            include: {
                categoria: true,
                marca: true,
            },
        });

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            producto,
        };
    }

    async obtenerTodos(filtros: FiltroProductosDto) {
        const {
            busqueda,
            categoriaId,
            marcaId,
            precioMinimo,
            precioMaximo,
            conStock,
            activo,
            pagina = 1,
            limite = 20,
            ordenarPor,
            orden,
        } = filtros;

        const where: Record<string, unknown> = {};

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

        if (precioMinimo !== undefined || precioMaximo !== undefined) {
            where.precio = {};
            if (precioMinimo !== undefined) (where.precio as Record<string, number>).gte = precioMinimo;
            if (precioMaximo !== undefined) (where.precio as Record<string, number>).lte = precioMaximo;
        }

        const [productos, total] = await Promise.all([
            this.prisma.producto.findMany({
                where,
                include: {
                    categoria: true,
                    marca: true,
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [ordenarPor || 'creadoEn']: orden || 'desc' },
            }),
            this.prisma.producto.count({ where }),
        ]);

        return {
            datos: productos,
            meta: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerPorId(id: number) {
        const producto = await this.prisma.producto.findUnique({
            where: { id },
            include: {
                categoria: true,
                marca: true,
            },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        return producto;
    }

    async obtenerPorSlug(slug: string) {
        const producto = await this.prisma.producto.findUnique({
            where: { slug },
            include: {
                categoria: true,
                marca: true,
            },
        });

        if (!producto) {
            throw new NotFoundException(MENSAJES_ERROR.PRODUCTO_NO_ENCONTRADO);
        }

        return producto;
    }

    async actualizar(id: number, actualizarProductoDto: ActualizarProductoDto) {
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

        if (datosActualizacion.nombre) {
            (datosActualizacion as Record<string, unknown>).slug = this.generarSlug(datosActualizacion.nombre);
        }

        const productoActualizado = await this.prisma.producto.update({
            where: { id },
            data: datosActualizacion,
            include: {
                categoria: true,
                marca: true,
            },
        });

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            producto: productoActualizado,
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

        return { mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE };
    }

    private generarSlug(nombre: string): string {
        return nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
