import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../common/constants';

@Injectable()
export class CategoriasService {
    private readonly logger = new Logger(CategoriasService.name);

    constructor(private prisma: PrismaService) {}

    async crear(datos: { nombre: string; descripcion?: string; categoriaPadreId?: number }) {
        const categoriaExistente = await this.prisma.categoria.findFirst({
            where: { nombre: datos.nombre },
        });

        if (categoriaExistente) {
            throw new ConflictException('Ya existe una categoría con este nombre');
        }

        const categoria = await this.prisma.categoria.create({
            data: {
                ...datos,
                slug: this.generarSlug(datos.nombre),
                activa: true,
            },
        });

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            categoria,
        };
    }

    async obtenerTodas() {
        return this.prisma.categoria.findMany({
            where: { activa: true },
            include: {
                categoriaPadre: true,
                subcategorias: true,
            },
            orderBy: { nombre: 'asc' },
        });
    }

    async obtenerArbol() {
        const categorias = await this.prisma.categoria.findMany({
            where: { activa: true, categoriaPadreId: null },
            include: {
                subcategorias: {
                    where: { activa: true },
                    include: {
                        subcategorias: {
                            where: { activa: true },
                        },
                    },
                },
            },
            orderBy: { nombre: 'asc' },
        });

        return categorias;
    }

    async obtenerPorId(id: number) {
        const categoria = await this.prisma.categoria.findUnique({
            where: { id },
            include: {
                categoriaPadre: true,
                subcategorias: true,
            },
        });

        if (!categoria) {
            throw new NotFoundException('Categoría no encontrada');
        }

        return categoria;
    }

    async actualizar(id: number, datos: { nombre?: string; descripcion?: string; activa?: boolean }) {
        const categoria = await this.prisma.categoria.findUnique({ where: { id } });

        if (!categoria) {
            throw new NotFoundException('Categoría no encontrada');
        }

        const datosActualizacion: Record<string, unknown> = { ...datos };
        if (datos.nombre) {
            datosActualizacion.slug = this.generarSlug(datos.nombre);
        }

        const categoriaActualizada = await this.prisma.categoria.update({
            where: { id },
            data: datosActualizacion,
        });

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            categoria: categoriaActualizada,
        };
    }

    async eliminar(id: number) {
        const categoria = await this.prisma.categoria.findUnique({ where: { id } });

        if (!categoria) {
            throw new NotFoundException('Categoría no encontrada');
        }

        await this.prisma.categoria.update({
            where: { id },
            data: { activa: false },
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
