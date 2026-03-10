import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrearMarcaDto, ActualizarMarcaDto, FiltroMarcaDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';
import { generarSlug } from '../../../common/utils';

@Injectable()
export class MarcasAdminService {
    private readonly logger = new Logger(MarcasAdminService.name);

    constructor(private prisma: PrismaService) {}

    async crear(crearMarcaDto: CrearMarcaDto) {
        const marcaExistente = await this.prisma.marca.findFirst({
            where: { nombre: crearMarcaDto.nombre },
        });

        if (marcaExistente) {
            throw new ConflictException('Ya existe una marca con este nombre');
        }

        const marca = await this.prisma.marca.create({
            data: {
                nombre: crearMarcaDto.nombre,
                slug: generarSlug(crearMarcaDto.nombre),
                descripcion: crearMarcaDto.descripcion,
                logo: crearMarcaDto.logo,
                activa: crearMarcaDto.activa ?? true,
            },
        });

        this.logger.log(`Marca creada: ${marca.nombre} (ID: ${marca.id})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            marca,
        };
    }

    async obtenerTodas(filtros: FiltroMarcaDto) {
        const {
            busqueda,
            activa,
            pagina = 1,
            limite = 20,
            ordenarPor = 'creadoEn',
            orden = 'desc',
        } = filtros;

        const where: Prisma.MarcaWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { slug: { contains: busqueda } },
            ];
        }

        if (activa !== undefined) {
            where.activa = activa;
        }

        const [marcas, total] = await Promise.all([
            this.prisma.marca.findMany({
                where,
                include: {
                    _count: {
                        select: { productos: true },
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [ordenarPor]: orden },
            }),
            this.prisma.marca.count({ where }),
        ]);

        return {
            datos: marcas,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerPorId(id: number) {
        const marca = await this.prisma.marca.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { productos: true },
                },
            },
        });

        if (!marca) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        return marca;
    }

    async actualizar(id: number, actualizarMarcaDto: ActualizarMarcaDto) {
        const marca = await this.prisma.marca.findUnique({ where: { id } });

        if (!marca) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (actualizarMarcaDto.nombre && actualizarMarcaDto.nombre !== marca.nombre) {
            const duplicada = await this.prisma.marca.findFirst({
                where: {
                    nombre: actualizarMarcaDto.nombre,
                    id: { not: id },
                },
            });
            if (duplicada) {
                throw new ConflictException('Ya existe una marca con este nombre');
            }
        }

        const datosActualizacion: Record<string, unknown> = {};

        if (actualizarMarcaDto.nombre !== undefined) {
            datosActualizacion.nombre = actualizarMarcaDto.nombre;
            datosActualizacion.slug = generarSlug(actualizarMarcaDto.nombre);
        }
        if (actualizarMarcaDto.descripcion !== undefined) {
            datosActualizacion.descripcion = actualizarMarcaDto.descripcion;
        }
        if (actualizarMarcaDto.logo !== undefined) {
            datosActualizacion.logo = actualizarMarcaDto.logo;
        }
        if (actualizarMarcaDto.activa !== undefined) {
            datosActualizacion.activa = actualizarMarcaDto.activa;
        }

        const marcaActualizada = await this.prisma.marca.update({
            where: { id },
            data: datosActualizacion,
        });

        this.logger.log(`Marca actualizada: ${marcaActualizada.nombre} (ID: ${id})`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            marca: marcaActualizada,
        };
    }

    async cambiarEstado(id: number, activa: boolean) {
        const marca = await this.prisma.marca.findUnique({ where: { id } });

        if (!marca) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        const marcaActualizada = await this.prisma.marca.update({
            where: { id },
            data: { activa },
        });

        this.logger.log(
            `Estado de marca cambiado: ${marcaActualizada.nombre} → ${activa ? 'activa' : 'inactiva'}`,
        );

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            marca: marcaActualizada,
        };
    }

    async eliminar(id: number) {
        const marca = await this.prisma.marca.findUnique({
            where: { id },
            include: {
                _count: { select: { productos: true } },
            },
        });

        if (!marca) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (marca._count.productos > 0) {
            throw new BadRequestException(
                `No se puede eliminar: la marca tiene ${marca._count.productos} producto(s) asociado(s)`,
            );
        }

        await this.prisma.marca.update({
            where: { id },
            data: { activa: false },
        });

        this.logger.log(`Marca eliminada (soft delete): ${marca.nombre} (ID: ${id})`);

        return {
            mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE,
        };
    }

    async obtenerEstadisticas() {
        const [totalMarcas, marcasActivas, marcasInactivas, marcasConProductos] =
            await Promise.all([
                this.prisma.marca.count(),
                this.prisma.marca.count({ where: { activa: true } }),
                this.prisma.marca.count({ where: { activa: false } }),
                this.prisma.marca.count({
                    where: { productos: { some: {} } },
                }),
            ]);

        return {
            totalMarcas,
            marcasActivas,
            marcasInactivas,
            marcasConProductos,
            marcasSinProductos: totalMarcas - marcasConProductos,
        };
    }
}
