import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { 
    CrearUsuarioDto, 
    ActualizarUsuarioDto, 
    FiltroUsuariosDto,
    CambiarContrasenaDto 
} from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';
import { generarContrasenaSegura } from '../../../common/utils';
import { CorreoAdminService, ParametrosSeguridadService, CLAVES_PARAMETRO } from '../../../common/services';

@Injectable()
export class UsuariosService {
    private readonly logger = new Logger(UsuariosService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private correoService: CorreoAdminService,
        private parametrosSeguridad: ParametrosSeguridadService,
    ) {}

    async crear(crearUsuarioDto: CrearUsuarioDto) {
        const { correo, rolId } = crearUsuarioDto;

        const usuarioExistente = await this.prisma.usuario.findUnique({
            where: { correo },
        });

        if (usuarioExistente) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        let nombreRol: string | undefined;
        if (rolId) {
            const rolExiste = await this.prisma.rol.findUnique({
                where: { id: rolId },
            });

            if (!rolExiste) {
                throw new BadRequestException('El rol especificado no existe');
            }
            nombreRol = rolExiste.nombre;
        }

        const longitudContrasena = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.LONGITUD_CONTRASENA_GENERACION);
        const contrasenaGenerada = generarContrasenaSegura(longitudContrasena);
        const bcryptRounds = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.BCRYPT_SALT_ROUNDS);
        const contrasenaHash = await bcrypt.hash(contrasenaGenerada, bcryptRounds);

        const usuario = await this.prisma.usuario.create({
            data: {
                nombre: crearUsuarioDto.nombre,
                correo: crearUsuarioDto.correo,
                contrasenaHash,
                telefono: crearUsuarioDto.telefono,
                avatar: crearUsuarioDto.avatar,
                rolId: crearUsuarioDto.rolId,
                activo: true,
            },
            include: {
                rol: true,
            },
        });

        this.logger.log(`Usuario creado: ${usuario.correo}`);

        const urlFrontend = this.configService.get<string>('app.urlFrontend') || 'http://localhost:4200';
        const correoEnviado = await this.correoService.enviarBienvenidaUsuario({
            nombre: usuario.nombre,
            correo: usuario.correo,
            contrasena: contrasenaGenerada,
            nombreRol,
            urlAcceso: `${urlFrontend}/admin/inicio-sesion`,
        });

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            usuario: this.excluirCamposSensibles(usuario),
            correoEnviado,
        };
    }

    async obtenerTodos(filtros: FiltroUsuariosDto) {
        const { busqueda, rolId, activo, pagina = 1, limite = 10, ordenarPor, orden } = filtros;

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
            datos: usuarios.map(u => this.excluirCamposSensibles(u)),
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
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
                throw new ConflictException('El correo electrónico ya está registrado');
            }
        }

        if (actualizarUsuarioDto.rolId) {
            const rolExiste = await this.prisma.rol.findUnique({
                where: { id: actualizarUsuarioDto.rolId },
            });

            if (!rolExiste) {
                throw new BadRequestException('El rol especificado no existe');
            }
        }

        const usuarioActualizado = await this.prisma.usuario.update({
            where: { id },
            data: actualizarUsuarioDto,
            include: { rol: true },
        });

        this.logger.log(`Usuario actualizado: ${usuarioActualizado.correo}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            usuario: this.excluirCamposSensibles(usuarioActualizado),
        };
    }

    async cambiarContrasena(id: number, cambiarContrasenaDto: CambiarContrasenaDto) {
        const usuario = await this.prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new NotFoundException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        const bcryptRounds = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.BCRYPT_SALT_ROUNDS);
        const contrasenaHash = await bcrypt.hash(cambiarContrasenaDto.nuevaContrasena, bcryptRounds);

        await this.prisma.usuario.update({
            where: { id },
            data: { contrasenaHash },
        });

        await this.prisma.sesion.deleteMany({
            where: { usuarioId: id },
        });

        this.logger.log(`Contraseña cambiada para usuario ID: ${id}`);

        return { mensaje: MENSAJES_EXITO.CONTRASENA_CAMBIADA };
    }

    async cambiarEstado(id: number, activo: boolean) {
        const usuario = await this.prisma.usuario.findUnique({ where: { id } });

        if (!usuario) {
            throw new NotFoundException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        const usuarioActualizado = await this.prisma.usuario.update({
            where: { id },
            data: { activo },
            include: { rol: true },
        });

        if (!activo) {
            await this.prisma.sesion.deleteMany({
                where: { usuarioId: id },
            });
        }

        this.logger.log(`Estado de usuario ${id} cambiado a: ${activo ? 'activo' : 'inactivo'}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            usuario: this.excluirCamposSensibles(usuarioActualizado),
        };
    }

    async obtenerPorCorreo(correo: string) {
        return this.prisma.usuario.findUnique({
            where: { correo },
            include: { rol: true },
        });
    }

    private excluirCamposSensibles(usuario: Record<string, unknown>) {
        const { contrasenaHash, ...usuarioSinContrasena } = usuario;
        return usuarioSinContrasena;
    }
}
