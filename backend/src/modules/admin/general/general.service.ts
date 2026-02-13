import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrearParametroDto, ActualizarParametroDto, FiltroParametrosDto } from './dto';

@Injectable()
export class GeneralService {
    private readonly logger = new Logger(GeneralService.name);

    constructor(private prisma: PrismaService) {}

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
            data: {
                clave,
                valor,
                tipo,
                categoria,
                descripcion,
                editable,
            },
        });

        this.logger.log(`Parámetro creado: ${parametro.clave}`);

        return {
            mensaje: 'Parámetro creado exitosamente',
            datos: parametro,
        };
    }

    async obtenerTodos(filtros: FiltroParametrosDto) {
        const { categoria, tipo } = filtros;

        const where: Record<string, unknown> = {};

        if (categoria) {
            where.categoria = categoria;
        }

        if (tipo) {
            where.tipo = tipo;
        }

        const parametros = await this.prisma.parametroSistema.findMany({
            where,
            orderBy: [
                { categoria: 'asc' },
                { clave: 'asc' },
            ],
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

    async actualizar(id: number, actualizarParametroDto: ActualizarParametroDto) {
        const parametro = await this.prisma.parametroSistema.findUnique({ 
            where: { id } 
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

        this.logger.log(`Parámetro actualizado: ${parametroActualizado.clave}`);

        return {
            mensaje: 'Parámetro actualizado exitosamente',
            datos: parametroActualizado,
        };
    }

    async eliminar(id: number) {
        const parametro = await this.prisma.parametroSistema.findUnique({ 
            where: { id } 
        });

        if (!parametro) {
            throw new NotFoundException('Parámetro no encontrado');
        }

        if (!parametro.editable) {
            throw new ConflictException('Este parámetro no se puede eliminar');
        }

        await this.prisma.parametroSistema.delete({ where: { id } });

        this.logger.log(`Parámetro eliminado: ${parametro.clave}`);

        return {
            mensaje: 'Parámetro eliminado exitosamente',
        };
    }

    async obtenerValor(clave: string): Promise<string | null> {
        const parametro = await this.prisma.parametroSistema.findUnique({
            where: { clave },
        });

        return parametro?.valor || null;
    }

    async obtenerValorNumero(clave: string): Promise<number | null> {
        const valor = await this.obtenerValor(clave);
        if (!valor) return null;
        const numero = Number(valor);
        return isNaN(numero) ? null : numero;
    }

    async obtenerValorBooleano(clave: string): Promise<boolean> {
        const valor = await this.obtenerValor(clave);
        return valor === 'true';
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

    async inicializarParametrosPorDefecto() {
        const parametrosPorDefecto = [
            {
                clave: 'TIEMPO_EXPIRACION_TOKEN',
                valor: '15',
                tipo: 'numero',
                categoria: 'seguridad',
                descripcion: 'Tiempo de expiración del token de acceso en minutos',
                editable: true,
            },
            {
                clave: 'TIEMPO_EXPIRACION_REFRESH_TOKEN',
                valor: '7',
                tipo: 'numero',
                categoria: 'seguridad',
                descripcion: 'Tiempo de expiración del refresh token en días',
                editable: true,
            },
            {
                clave: 'MAXIMO_SESIONES_USUARIO',
                valor: '3',
                tipo: 'numero',
                categoria: 'seguridad',
                descripcion: 'Número máximo de sesiones simultáneas por usuario',
                editable: true,
            },
            {
                clave: 'INTENTOS_MAXIMOS_LOGIN',
                valor: '5',
                tipo: 'numero',
                categoria: 'seguridad',
                descripcion: 'Intentos máximos de inicio de sesión antes de bloqueo',
                editable: true,
            },
            {
                clave: 'TIEMPO_BLOQUEO_MINUTOS',
                valor: '15',
                tipo: 'numero',
                categoria: 'seguridad',
                descripcion: 'Tiempo de bloqueo de cuenta en minutos',
                editable: true,
            },
            {
                clave: 'LONGITUD_MINIMA_CONTRASENA',
                valor: '12',
                tipo: 'numero',
                categoria: 'seguridad',
                descripcion: 'Longitud mínima requerida para contraseñas',
                editable: true,
            },
            {
                clave: 'TAMANO_MAXIMO_ARCHIVO_MB',
                valor: '5',
                tipo: 'numero',
                categoria: 'archivos',
                descripcion: 'Tamaño máximo de archivo permitido en MB',
                editable: true,
            },
            {
                clave: 'EXTENSIONES_PERMITIDAS',
                valor: 'jpg,jpeg,png,webp,pdf',
                tipo: 'texto',
                categoria: 'archivos',
                descripcion: 'Extensiones de archivo permitidas (separadas por coma)',
                editable: true,
            },
            {
                clave: 'NIVEL_LOG',
                valor: 'info',
                tipo: 'texto',
                categoria: 'sistema',
                descripcion: 'Nivel de detalle de los logs del sistema',
                editable: true,
            },
            {
                clave: 'DIAS_RETENCION_LOGS',
                valor: '30',
                tipo: 'numero',
                categoria: 'sistema',
                descripcion: 'Días de retención de logs antes de eliminarlos',
                editable: true,
            },
            {
                clave: 'MODO_MANTENIMIENTO',
                valor: 'false',
                tipo: 'booleano',
                categoria: 'sistema',
                descripcion: 'Activa o desactiva el modo mantenimiento',
                editable: true,
            },
            {
                clave: 'SMTP_ACTIVO',
                valor: 'false',
                tipo: 'booleano',
                categoria: 'correo',
                descripcion: 'Indica si el envío de correos está activo',
                editable: false,
            },
        ];

        let creados = 0;
        let existentes = 0;

        for (const param of parametrosPorDefecto) {
            const existe = await this.prisma.parametroSistema.findUnique({
                where: { clave: param.clave },
            });

            if (!existe) {
                await this.prisma.parametroSistema.create({ data: param });
                creados++;
            } else {
                existentes++;
            }
        }

        this.logger.log(`Parámetros inicializados: ${creados} creados, ${existentes} ya existían`);

        return {
            mensaje: 'Parámetros inicializados',
            datos: { creados, existentes },
        };
    }

    private validarValorPorTipo(valor: string, tipo: string): void {
        switch (tipo) {
            case 'numero':
                const num = Number(valor);
                if (isNaN(num)) {
                    throw new BadRequestException('El valor debe ser un número válido');
                }
                break;
            case 'booleano':
                if (valor !== 'true' && valor !== 'false') {
                    throw new BadRequestException('El valor debe ser "true" o "false"');
                }
                break;
            case 'json':
                try {
                    JSON.parse(valor);
                } catch {
                    throw new BadRequestException('El valor debe ser un JSON válido');
                }
                break;
        }
    }
}
