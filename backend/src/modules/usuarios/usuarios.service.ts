import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearUsuarioDto, ActualizarUsuarioDto, FiltroUsuariosDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../common/constants';

@Injectable()
export class UsuariosService {
    private readonly logger = new Logger(UsuariosService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    async crear(crearUsuarioDto: CrearUsuarioDto) {
        const { correo, contrasena, nombre, telefono, rolId } = crearUsuarioDto;

        const usuarioExistente = await this.prisma.usuario.findUnique({
            where: { correo },
        });

        if (usuarioExistente) {
            throw new ConflictException(MENSAJES_ERROR.USUARIO_YA_EXISTE);
        }

        const bcryptRounds = this.configService.get<number>('seguridad.bcryptRounds') || 12;
        const contrasenaHash = await bcrypt.hash(contrasena, bcryptRounds);

        const usuario = await this.prisma.usuario.create({
            data: {
                nombre,
                correo,
                contrasenaHash,
                telefono,
                rolId,
                activo: true,
            },
            include: {
                rol: true,
            },
        });

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            usuario: this.excluirCamposSensibles(usuario),
        };
    }

    async obtenerTodos(filtros: FiltroUsuariosDto) {
        const { busqueda, rolId, activo, pagina = 1, limite = 20, ordenarPor, orden } = filtros;

        const where: Record<string, unknown> = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { correo: { contains: busqueda } },
            ];
        }

        if (rolId) {
            where.rolId = rolId;
        }

        if (activo !== undefined) {
            where.activo = activo;
        }

        const [usuarios, total] = await Promise.all([
            this.prisma.usuario.findMany({
                where,
                include: { rol: true },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [ordenarPor || 'creadoEn']: orden || 'desc' },
            }),
            this.prisma.usuario.count({ where }),
        ]);

        return {
            datos: usuarios.map(this.excluirCamposSensibles),
            meta: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerPorId(id: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: { rol: true },
        });

        if (!usuario) {
            throw new NotFoundException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        return this.excluirCamposSensibles(usuario);
    }

    async actualizar(id: number, actualizarUsuarioDto: ActualizarUsuarioDto) {
        const usuario = await this.prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new NotFoundException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        if (actualizarUsuarioDto.correo && actualizarUsuarioDto.correo !== usuario.correo) {
            const correoExistente = await this.prisma.usuario.findUnique({
                where: { correo: actualizarUsuarioDto.correo },
            });

            if (correoExistente) {
                throw new ConflictException(MENSAJES_ERROR.USUARIO_YA_EXISTE);
            }
        }

        const usuarioActualizado = await this.prisma.usuario.update({
            where: { id },
            data: actualizarUsuarioDto,
            include: { rol: true },
        });

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            usuario: this.excluirCamposSensibles(usuarioActualizado),
        };
    }

    async eliminar(id: number) {
        const usuario = await this.prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new NotFoundException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        await this.prisma.usuario.update({
            where: { id },
            data: { activo: false },
        });

        return { mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE };
    }

    private excluirCamposSensibles(usuario: Record<string, unknown>) {
        const { contrasenaHash, ...usuarioSinContrasena } = usuario;
        return usuarioSinContrasena;
    }
}
