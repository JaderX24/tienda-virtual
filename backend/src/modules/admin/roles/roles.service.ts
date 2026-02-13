import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrearRolDto, ActualizarRolDto, FiltroRolesDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class RolesService {
    private readonly logger = new Logger(RolesService.name);

    constructor(private prisma: PrismaService) {}

    async crear(crearRolDto: CrearRolDto) {
        const { codigo, nombre, descripcion, activo = true } = crearRolDto;

        const rolExistente = await this.prisma.rol.findUnique({
            where: { codigo },
        });

        if (rolExistente) {
            throw new ConflictException('Ya existe un rol con este código');
        }

        const rol = await this.prisma.rol.create({
            data: {
                codigo,
                nombre,
                descripcion,
                activo,
            },
        });

        this.logger.log(`Rol creado: ${rol.codigo}`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            rol,
        };
    }

    async obtenerTodos(filtros: FiltroRolesDto) {
        const { activo } = filtros;

        const where: Record<string, unknown> = {};

        if (activo !== undefined) {
            where.activo = activo;
        }

        const roles = await this.prisma.rol.findMany({
            where,
            include: {
                _count: {
                    select: { usuarios: true },
                },
            },
            orderBy: { nombre: 'asc' },
        });

        return roles.map(rol => ({
            ...rol,
            cantidadUsuarios: rol._count.usuarios,
            _count: undefined,
        }));
    }

    async obtenerPorId(id: number) {
        const rol = await this.prisma.rol.findUnique({
            where: { id },
            include: {
                permisos: {
                    include: { permiso: true },
                },
                _count: {
                    select: { usuarios: true },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        return {
            ...rol,
            cantidadUsuarios: rol._count.usuarios,
            permisos: rol.permisos.map(rp => rp.permiso),
            _count: undefined,
        };
    }

    async obtenerPermisos(id: number) {
        const rol = await this.prisma.rol.findUnique({
            where: { id },
            include: {
                permisos: {
                    include: { permiso: true },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        return rol.permisos.map(rp => rp.permiso);
    }

    async cambiarEstado(id: number, activo: boolean) {
        const rol = await this.prisma.rol.findUnique({ where: { id } });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        const rolesProtegidos = ['super_admin', 'admin'];
        if (rolesProtegidos.includes(rol.codigo)) {
            throw new ConflictException('No se puede cambiar el estado de roles del sistema');
        }

        const rolActualizado = await this.prisma.rol.update({
            where: { id },
            data: { activo },
        });

        this.logger.log(`Estado de rol cambiado: ${rol.codigo} -> ${activo ? 'activo' : 'inactivo'}`);

        return {
            mensaje: activo ? 'Rol activado correctamente' : 'Rol desactivado correctamente',
            rol: rolActualizado,
        };
    }

    async actualizar(id: number, actualizarRolDto: ActualizarRolDto) {
        const rol = await this.prisma.rol.findUnique({ where: { id } });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        if (actualizarRolDto.codigo && actualizarRolDto.codigo !== rol.codigo) {
            const codigoExistente = await this.prisma.rol.findUnique({
                where: { codigo: actualizarRolDto.codigo },
            });

            if (codigoExistente) {
                throw new ConflictException('Ya existe un rol con este código');
            }
        }

        const rolActualizado = await this.prisma.rol.update({
            where: { id },
            data: actualizarRolDto,
        });

        this.logger.log(`Rol actualizado: ${rolActualizado.codigo}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            rol: rolActualizado,
        };
    }

    async eliminar(id: number) {
        const rol = await this.prisma.rol.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { usuarios: true },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        if (rol._count.usuarios > 0) {
            throw new ConflictException(
                `No se puede eliminar el rol porque tiene ${rol._count.usuarios} usuarios asignados`,
            );
        }

        // Eliminar permisos asociados primero
        await this.prisma.rolPermiso.deleteMany({
            where: { rolId: id },
        });

        // Eliminar el rol
        await this.prisma.rol.delete({
            where: { id },
        });

        this.logger.log(`Rol eliminado: ${rol.codigo}`);

        return { mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE };
    }

    async asignarPermisos(id: number, permisoIds: number[]) {
        const rol = await this.prisma.rol.findUnique({ where: { id } });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        // Eliminar permisos actuales
        await this.prisma.rolPermiso.deleteMany({
            where: { rolId: id },
        });

        // Asignar nuevos permisos
        if (permisoIds.length > 0) {
            await this.prisma.rolPermiso.createMany({
                data: permisoIds.map(permisoId => ({
                    rolId: id,
                    permisoId,
                })),
            });
        }

        this.logger.log(`Permisos actualizados para rol: ${rol.codigo}`);

        return { mensaje: 'Permisos actualizados correctamente' };
    }
}
