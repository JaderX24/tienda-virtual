import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParametrosSeguridadService } from '../../../common/services';
import { CrearParametroDto, ActualizarParametroDto, FiltroParametrosDto } from './dto';

@Injectable()
export class ParametrosMantenimientoService {
    private readonly logger = new Logger(ParametrosMantenimientoService.name);

    constructor(
        private prisma: PrismaService,
        private parametrosSeguridad: ParametrosSeguridadService,
    ) {}

    async crear(crearParametroDto: CrearParametroDto) {
        const { clave, valor, tipo, categoria, descripcion, editable = true } = crearParametroDto;

        const parametroExistente = await this.prisma.parametroSistema.findUnique({
            where: { clave },
        });

        if (parametroExistente) {
            throw new ConflictException('Ya existe un parámetro con esta clave');
        }

        this.validarValorPorTipo(valor, tipo);

        const parametro = await this.prisma.parametroSistema.create({
            data: { clave, valor, tipo, categoria, descripcion, editable },
        });

        this.logger.log(`Parámetro creado: ${parametro.clave}`);

        return {
            mensaje: 'Parámetro creado exitosamente',
            datos: parametro,
        };
    }

    async obtenerTodos(filtros: FiltroParametrosDto) {
        const where: Record<string, unknown> = {};

        if (filtros.categoria) {
            where.categoria = filtros.categoria;
        }

        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }

        const parametros = await this.prisma.parametroSistema.findMany({
            where,
            orderBy: [{ categoria: 'asc' }, { clave: 'asc' }],
        });

        return {
            mensaje: 'Parámetros obtenidos exitosamente',
            datos: parametros,
        };
    }

    async obtenerPorId(id: number) {
        const parametro = await this.prisma.parametroSistema.findUnique({
            where: { id },
        });

        if (!parametro) {
            throw new NotFoundException('Parámetro no encontrado');
        }

        return {
            mensaje: 'Parámetro obtenido exitosamente',
            datos: parametro,
        };
    }

    async obtenerPorClave(clave: string) {
        const parametro = await this.prisma.parametroSistema.findUnique({
            where: { clave },
        });

        if (!parametro) {
            throw new NotFoundException(`Parámetro con clave '${clave}' no encontrado`);
        }

        return {
            mensaje: 'Parámetro obtenido exitosamente',
            datos: parametro,
        };
    }

    async obtenerPorCategoria(categoria: string) {
        const parametros = await this.prisma.parametroSistema.findMany({
            where: { categoria },
            orderBy: { clave: 'asc' },
        });

        return {
            mensaje: 'Parámetros obtenidos exitosamente',
            datos: parametros,
        };
    }

    async actualizar(id: number, actualizarParametroDto: ActualizarParametroDto) {
        const parametro = await this.prisma.parametroSistema.findUnique({
            where: { id },
        });

        if (!parametro) {
            throw new NotFoundException('Parámetro no encontrado');
        }

        if (!parametro.editable) {
            throw new ConflictException('Este parámetro no es editable');
        }

        if (actualizarParametroDto.valor) {
            const tipoValidar = actualizarParametroDto.tipo || parametro.tipo;
            this.validarValorPorTipo(actualizarParametroDto.valor, tipoValidar);
        }

        const parametroActualizado = await this.prisma.parametroSistema.update({
            where: { id },
            data: actualizarParametroDto,
        });

        this.parametrosSeguridad.limpiarCache();
        this.logger.log(`Parámetro actualizado: ${parametroActualizado.clave}`);

        return {
            mensaje: 'Parámetro actualizado exitosamente',
            datos: parametroActualizado,
        };
    }

    async eliminar(id: number) {
        const parametro = await this.prisma.parametroSistema.findUnique({
            where: { id },
        });

        if (!parametro) {
            throw new NotFoundException('Parámetro no encontrado');
        }

        if (!parametro.editable) {
            throw new ConflictException('Este parámetro no se puede eliminar');
        }

        await this.prisma.parametroSistema.delete({ where: { id } });

        this.parametrosSeguridad.limpiarCache();
        this.logger.log(`Parámetro eliminado: ${parametro.clave}`);

        return {
            mensaje: 'Parámetro eliminado exitosamente',
        };
    }

    private validarValorPorTipo(valor: string, tipo: string): void {
        if (tipo === 'numero') {
            const num = Number(valor);
            if (isNaN(num)) {
                throw new BadRequestException('El valor debe ser un número válido');
            }
        } else if (tipo === 'booleano') {
            if (valor !== 'true' && valor !== 'false') {
                throw new BadRequestException('El valor debe ser "true" o "false"');
            }
        } else if (tipo === 'json') {
            try {
                JSON.parse(valor);
            } catch {
                throw new BadRequestException('El valor debe ser un JSON válido');
            }
        }
    }
}
