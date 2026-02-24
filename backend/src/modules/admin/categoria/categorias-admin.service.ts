import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrearCategoriaDto, ActualizarCategoriaDto, FiltroCategoriaDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class CategoriasAdminService {
    private readonly logger = new Logger(CategoriasAdminService.name);

    constructor(private prisma: PrismaService) {}

    async crear(crearCategoriaDto: CrearCategoriaDto) {
        const { nombre, categoriaPadreId } = crearCategoriaDto;

        const categoriaExistente = await this.prisma.categoria.findFirst({
            where: { nombre },
        });

        if (categoriaExistente) {
            throw new ConflictException('Ya existe una categoría con este nombre');
        }

        if (categoriaPadreId) {
            const padre = await this.prisma.categoria.findUnique({
                where: { id: categoriaPadreId },
            });
            if (!padre) {
                throw new NotFoundException('La categoría padre no existe');
            }
        }

        const categoria = await this.prisma.categoria.create({
            data: {
                nombre: crearCategoriaDto.nombre,
                slug: this.generarSlug(crearCategoriaDto.nombre),
                descripcion: crearCategoriaDto.descripcion,
                imagen: crearCategoriaDto.imagen,
                categoriaPadreId: crearCategoriaDto.categoriaPadreId,
                orden: crearCategoriaDto.orden ?? 0,
                activa: crearCategoriaDto.activa ?? true,
            },
            include: {
                categoriaPadre: true,
                subcategorias: true,
            },
        });

        this.logger.log(`Categoría creada: ${categoria.nombre} (ID: ${categoria.id})`);

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            categoria,
        };
    }

    async obtenerTodas(filtros: FiltroCategoriaDto) {
        const {
            busqueda,
            activa,
            soloRaiz,
            categoriaPadreId,
            pagina = 1,
            limite = 20,
            ordenarPor = 'creadoEn',
            orden = 'desc',
        } = filtros;

        const where: Prisma.CategoriaWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { slug: { contains: busqueda } },
            ];
        }

        if (activa !== undefined) {
            where.activa = activa;
        }

        if (soloRaiz) {
            where.categoriaPadreId = null;
        } else if (categoriaPadreId) {
            where.categoriaPadreId = categoriaPadreId;
        }

        const [categorias, total] = await Promise.all([
            this.prisma.categoria.findMany({
                where,
                include: {
                    categoriaPadre: {
                        select: { id: true, nombre: true, slug: true },
                    },
                    subcategorias: {
                        select: { id: true, nombre: true, slug: true, activa: true },
                    },
                    _count: {
                        select: { productos: true },
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [ordenarPor]: orden },
            }),
            this.prisma.categoria.count({ where }),
        ]);

        return {
            datos: categorias,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerArbol() {
        const categorias = await this.prisma.categoria.findMany({
            where: { categoriaPadreId: null },
            include: {
                subcategorias: {
                    include: {
                        subcategorias: {
                            select: { id: true, nombre: true, slug: true, activa: true, orden: true },
                        },
                        _count: { select: { productos: true } },
                    },
                    orderBy: { orden: 'asc' },
                },
                _count: { select: { productos: true } },
            },
            orderBy: { orden: 'asc' },
        });

        return categorias;
    }

    async obtenerPorId(id: number) {
        const categoria = await this.prisma.categoria.findUnique({
            where: { id },
            include: {
                categoriaPadre: {
                    select: { id: true, nombre: true, slug: true },
                },
                subcategorias: {
                    select: { id: true, nombre: true, slug: true, activa: true, orden: true },
                    orderBy: { orden: 'asc' },
                },
                _count: {
                    select: { productos: true },
                },
            },
        });

        if (!categoria) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        return categoria;
    }

    async actualizar(id: number, actualizarCategoriaDto: ActualizarCategoriaDto) {
        const categoria = await this.prisma.categoria.findUnique({ where: { id } });

        if (!categoria) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (actualizarCategoriaDto.nombre && actualizarCategoriaDto.nombre !== categoria.nombre) {
            const duplicada = await this.prisma.categoria.findFirst({
                where: {
                    nombre: actualizarCategoriaDto.nombre,
                    id: { not: id },
                },
            });
            if (duplicada) {
                throw new ConflictException('Ya existe una categoría con este nombre');
            }
        }

        if (actualizarCategoriaDto.categoriaPadreId) {
            if (actualizarCategoriaDto.categoriaPadreId === id) {
                throw new BadRequestException('Una categoría no puede ser su propia categoría padre');
            }

            const padre = await this.prisma.categoria.findUnique({
                where: { id: actualizarCategoriaDto.categoriaPadreId },
            });
            if (!padre) {
                throw new NotFoundException('La categoría padre no existe');
            }

            // Verificar que no se cree un ciclo
            const esCiclo = await this.verificarCiclo(id, actualizarCategoriaDto.categoriaPadreId);
            if (esCiclo) {
                throw new BadRequestException('No se puede asignar como padre una subcategoría propia');
            }
        }

        const datosActualizacion: Record<string, unknown> = {};

        if (actualizarCategoriaDto.nombre !== undefined) {
            datosActualizacion.nombre = actualizarCategoriaDto.nombre;
            datosActualizacion.slug = this.generarSlug(actualizarCategoriaDto.nombre);
        }
        if (actualizarCategoriaDto.descripcion !== undefined) {
            datosActualizacion.descripcion = actualizarCategoriaDto.descripcion;
        }
        if (actualizarCategoriaDto.imagen !== undefined) {
            datosActualizacion.imagen = actualizarCategoriaDto.imagen;
        }
        if (actualizarCategoriaDto.categoriaPadreId !== undefined) {
            datosActualizacion.categoriaPadreId = actualizarCategoriaDto.categoriaPadreId;
        }
        if (actualizarCategoriaDto.orden !== undefined) {
            datosActualizacion.orden = actualizarCategoriaDto.orden;
        }
        if (actualizarCategoriaDto.activa !== undefined) {
            datosActualizacion.activa = actualizarCategoriaDto.activa;
        }

        const categoriaActualizada = await this.prisma.categoria.update({
            where: { id },
            data: datosActualizacion,
            include: {
                categoriaPadre: {
                    select: { id: true, nombre: true, slug: true },
                },
                subcategorias: {
                    select: { id: true, nombre: true, slug: true, activa: true },
                },
            },
        });

        this.logger.log(`Categoría actualizada: ${categoriaActualizada.nombre} (ID: ${id})`);

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            categoria: categoriaActualizada,
        };
    }

    async cambiarEstado(id: number, activa: boolean) {
        const categoria = await this.prisma.categoria.findUnique({
            where: { id },
            include: { subcategorias: { select: { id: true } } },
        });

        if (!categoria) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        // Si se desactiva, también desactivar subcategorías
        if (!activa && categoria.subcategorias.length > 0) {
            await this.prisma.categoria.updateMany({
                where: {
                    categoriaPadreId: id,
                },
                data: { activa: false },
            });

            this.logger.log(
                `Subcategorías desactivadas por desactivación de padre (ID: ${id}): ${categoria.subcategorias.length}`,
            );
        }

        const categoriaActualizada = await this.prisma.categoria.update({
            where: { id },
            data: { activa },
        });

        this.logger.log(
            `Estado de categoría cambiado: ${categoriaActualizada.nombre} → ${activa ? 'activa' : 'inactiva'}`,
        );

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            categoria: categoriaActualizada,
        };
    }

    async eliminar(id: number) {
        const categoria = await this.prisma.categoria.findUnique({
            where: { id },
            include: {
                subcategorias: { select: { id: true } },
                _count: { select: { productos: true } },
            },
        });

        if (!categoria) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (categoria._count.productos > 0) {
            throw new BadRequestException(
                `No se puede eliminar: la categoría tiene ${categoria._count.productos} producto(s) asociado(s)`,
            );
        }

        if (categoria.subcategorias.length > 0) {
            throw new BadRequestException(
                `No se puede eliminar: la categoría tiene ${categoria.subcategorias.length} subcategoría(s)`,
            );
        }

        await this.prisma.categoria.update({
            where: { id },
            data: { activa: false },
        });

        this.logger.log(`Categoría eliminada (soft delete): ${categoria.nombre} (ID: ${id})`);

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE,
        };
    }

    async obtenerEstadisticas() {
        const [totalCategorias, categoriasActivas, categoriasInactivas, categoriasRaiz, categoriasConProductos] =
            await Promise.all([
                this.prisma.categoria.count(),
                this.prisma.categoria.count({ where: { activa: true } }),
                this.prisma.categoria.count({ where: { activa: false } }),
                this.prisma.categoria.count({ where: { categoriaPadreId: null } }),
                this.prisma.categoria.count({
                    where: { productos: { some: {} } },
                }),
            ]);

        return {
            totalCategorias,
            categoriasActivas,
            categoriasInactivas,
            categoriasRaiz,
            categoriasConProductos,
            categoriasSinProductos: totalCategorias - categoriasConProductos,
        };
    }

    private async verificarCiclo(categoriaId: number, nuevoPadreId: number): Promise<boolean> {
        let padreActualId: number | null = nuevoPadreId;

        while (padreActualId !== null) {
            if (padreActualId === categoriaId) {
                return true;
            }

            const resultado: { categoriaPadreId: number | null } | null =
                await this.prisma.categoria.findUnique({
                    where: { id: padreActualId },
                    select: { categoriaPadreId: true },
                });

            padreActualId = resultado?.categoriaPadreId ?? null;
        }

        return false;
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
