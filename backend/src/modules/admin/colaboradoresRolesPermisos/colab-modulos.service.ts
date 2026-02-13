import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrearColabModuloDto, ActualizarColabModuloDto } from './dto';
import { MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class ColabModulosService {
    private readonly logger = new Logger(ColabModulosService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerTodos(soloActivos = false) {
        const where: Prisma.ColabModuloWhereInput = {};

        if (soloActivos) {
            where.esActivo = true;
        }

        const modulos = await this.prisma.colabModulo.findMany({
            where,
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                icono: true,
                ruta: true,
                moduloPadreId: true,
                orden: true,
                esMenu: true,
                esActivo: true,
                creadoEn: true,
                actualizadoEn: true,
                moduloPadre: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    },
                },
                _count: {
                    select: {
                        permisos: true,
                        hijos: true,
                    },
                },
            },
            orderBy: { orden: 'asc' },
        });

        return modulos;
    }

    async obtenerArbol() {
        const modulos = await this.prisma.colabModulo.findMany({
            where: { esActivo: true, moduloPadreId: null },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                icono: true,
                ruta: true,
                orden: true,
                esMenu: true,
                esActivo: true,
                hijos: {
                    where: { esActivo: true },
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        descripcion: true,
                        icono: true,
                        ruta: true,
                        orden: true,
                        esMenu: true,
                        esActivo: true,
                        _count: {
                            select: { permisos: true },
                        },
                    },
                    orderBy: { orden: 'asc' },
                },
                _count: {
                    select: { permisos: true },
                },
            },
            orderBy: { orden: 'asc' },
        });

        return modulos;
    }

    async obtenerPorId(id: number) {
        const modulo = await this.prisma.colabModulo.findUnique({
            where: { id },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                icono: true,
                ruta: true,
                moduloPadreId: true,
                orden: true,
                esMenu: true,
                esActivo: true,
                creadoEn: true,
                actualizadoEn: true,
                moduloPadre: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    },
                },
                hijos: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        icono: true,
                        orden: true,
                        esActivo: true,
                    },
                    orderBy: { orden: 'asc' },
                },
                permisos: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        accion: true,
                        esActivo: true,
                    },
                    orderBy: { accion: 'asc' },
                },
            },
        });

        if (!modulo) {
            throw new NotFoundException('Módulo de colaborador no encontrado');
        }

        return modulo;
    }

    async crear(dto: CrearColabModuloDto) {
        const codigoExistente = await this.prisma.colabModulo.findUnique({
            where: { codigo: dto.codigo },
        });

        if (codigoExistente) {
            throw new ConflictException('Ya existe un módulo con este código');
        }

        if (dto.moduloPadreId) {
            const padre = await this.prisma.colabModulo.findUnique({
                where: { id: dto.moduloPadreId },
            });

            if (!padre) {
                throw new NotFoundException('El módulo padre especificado no existe');
            }
        }

        const modulo = await this.prisma.colabModulo.create({
            data: {
                codigo: dto.codigo,
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                icono: dto.icono,
                ruta: dto.ruta,
                moduloPadreId: dto.moduloPadreId,
                orden: dto.orden ?? 0,
                esMenu: dto.esMenu ?? true,
            },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                icono: true,
                ruta: true,
                moduloPadreId: true,
                orden: true,
                esMenu: true,
                esActivo: true,
                creadoEn: true,
            },
        });

        this.logger.log(`Módulo de colaborador creado: ${modulo.nombre} (${modulo.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            modulo,
        };
    }

    async actualizar(id: number, dto: ActualizarColabModuloDto) {
        const modulo = await this.prisma.colabModulo.findUnique({ where: { id } });

        if (!modulo) {
            throw new NotFoundException('Módulo de colaborador no encontrado');
        }

        if (dto.moduloPadreId !== undefined) {
            if (dto.moduloPadreId === id) {
                throw new BadRequestException('Un módulo no puede ser padre de sí mismo');
            }

            if (dto.moduloPadreId) {
                const padre = await this.prisma.colabModulo.findUnique({
                    where: { id: dto.moduloPadreId },
                });

                if (!padre) {
                    throw new NotFoundException('El módulo padre especificado no existe');
                }
            }
        }

        const datosActualizacion: Prisma.ColabModuloUpdateInput = {};

        if (dto.nombre !== undefined) datosActualizacion.nombre = dto.nombre;
        if (dto.descripcion !== undefined) datosActualizacion.descripcion = dto.descripcion;
        if (dto.icono !== undefined) datosActualizacion.icono = dto.icono;
        if (dto.ruta !== undefined) datosActualizacion.ruta = dto.ruta;
        if (dto.orden !== undefined) datosActualizacion.orden = dto.orden;
        if (dto.esMenu !== undefined) datosActualizacion.esMenu = dto.esMenu;
        if (dto.esActivo !== undefined) datosActualizacion.esActivo = dto.esActivo;

        if (dto.moduloPadreId !== undefined) {
            datosActualizacion.moduloPadre = dto.moduloPadreId
                ? { connect: { id: dto.moduloPadreId } }
                : { disconnect: true };
        }

        const moduloActualizado = await this.prisma.colabModulo.update({
            where: { id },
            data: datosActualizacion,
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                icono: true,
                ruta: true,
                moduloPadreId: true,
                orden: true,
                esMenu: true,
                esActivo: true,
                actualizadoEn: true,
            },
        });

        this.logger.log(`Módulo de colaborador actualizado: ${moduloActualizado.nombre}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            modulo: moduloActualizado,
        };
    }

    async cambiarEstado(id: number, esActivo: boolean) {
        const modulo = await this.prisma.colabModulo.findUnique({ where: { id } });

        if (!modulo) {
            throw new NotFoundException('Módulo de colaborador no encontrado');
        }

        const moduloActualizado = await this.prisma.colabModulo.update({
            where: { id },
            data: { esActivo },
        });

        const estado = esActivo ? 'activado' : 'desactivado';
        this.logger.log(`Módulo ${modulo.nombre} ${estado}`);

        return {
            mensaje: `Módulo ${estado} exitosamente`,
            modulo: moduloActualizado,
        };
    }

    async eliminar(id: number) {
        const modulo = await this.prisma.colabModulo.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        permisos: true,
                        hijos: true,
                    },
                },
            },
        });

        if (!modulo) {
            throw new NotFoundException('Módulo de colaborador no encontrado');
        }

        if (modulo._count.permisos > 0) {
            throw new ConflictException(
                `No se puede eliminar el módulo porque tiene ${modulo._count.permisos} permiso(s) asociado(s)`,
            );
        }

        if (modulo._count.hijos > 0) {
            throw new ConflictException(
                `No se puede eliminar el módulo porque tiene ${modulo._count.hijos} submódulo(s)`,
            );
        }

        await this.prisma.colabModulo.delete({ where: { id } });

        this.logger.log(`Módulo de colaborador eliminado: ${modulo.nombre} (${modulo.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE,
        };
    }
}
