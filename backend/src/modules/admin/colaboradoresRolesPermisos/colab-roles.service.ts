import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CrearColabRolDto,
    ActualizarColabRolDto,
    FiltroColabRolesDto,
    AsignarPermisosRolDto,
    AgregarPermisosRolDto,
    RemoverPermisosRolDto,
    AsignarRolUsuarioDto,
} from './dto';
import { MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class ColabRolesService {
    private readonly logger = new Logger(ColabRolesService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerTodos(filtros: FiltroColabRolesDto) {
        const {
            busqueda,
            esActivo,
            esSupervisor,
            pagina = 1,
            limite = 20,
            ordenarPor = 'nivelJerarquia',
            orden = 'desc',
        } = filtros;

        const where: Prisma.ColabRolWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { codigo: { contains: busqueda } },
                { descripcion: { contains: busqueda } },
            ];
        }

        if (esActivo !== undefined) {
            where.esActivo = esActivo;
        }

        if (esSupervisor !== undefined) {
            where.esSupervisor = esSupervisor;
        }

        const [roles, total] = await Promise.all([
            this.prisma.colabRol.findMany({
                where,
                select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    descripcion: true,
                    nivelJerarquia: true,
                    esSupervisor: true,
                    color: true,
                    esActivo: true,
                    creadoEn: true,
                    actualizadoEn: true,
                    _count: {
                        select: {
                            usuariosRoles: true,
                            rolesPermisos: true,
                        },
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [ordenarPor]: orden },
            }),
            this.prisma.colabRol.count({ where }),
        ]);

        return {
            datos: roles,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerPorId(id: number) {
        const rol = await this.prisma.colabRol.findUnique({
            where: { id },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                nivelJerarquia: true,
                esSupervisor: true,
                color: true,
                esActivo: true,
                creadoEn: true,
                actualizadoEn: true,
                rolesPermisos: {
                    select: {
                        id: true,
                        creadoEn: true,
                        permiso: {
                            select: {
                                id: true,
                                codigo: true,
                                nombre: true,
                                descripcion: true,
                                accion: true,
                                esActivo: true,
                                modulo: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        nombre: true,
                                        icono: true,
                                    },
                                },
                            },
                        },
                    },
                },
                usuariosRoles: {
                    select: {
                        id: true,
                        esPrincipal: true,
                        fechaInicio: true,
                        fechaFin: true,
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true,
                                correo: true,
                                codigoColaborador: true,
                                cargo: true,
                                esActivo: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        usuariosRoles: true,
                        rolesPermisos: true,
                    },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        return rol;
    }

    async crear(dto: CrearColabRolDto) {
        const codigoExistente = await this.prisma.colabRol.findUnique({
            where: { codigo: dto.codigo },
        });

        if (codigoExistente) {
            throw new ConflictException('Ya existe un rol de colaborador con este código');
        }

        // Si se proporcionan permisos iniciales, validar que existan
        if (dto.permisoIds && dto.permisoIds.length > 0) {
            const permisosExistentes = await this.prisma.colabPermiso.findMany({
                where: { id: { in: dto.permisoIds }, esActivo: true },
                select: { id: true },
            });

            const idsExistentes = permisosExistentes.map(p => p.id);
            const idsInvalidos = dto.permisoIds.filter(id => !idsExistentes.includes(id));

            if (idsInvalidos.length > 0) {
                throw new NotFoundException(
                    `Permisos no encontrados o inactivos: ${idsInvalidos.join(', ')}`,
                );
            }
        }

        const rol = await this.prisma.$transaction(async (tx) => {
            const nuevoRol = await tx.colabRol.create({
                data: {
                    codigo: dto.codigo,
                    nombre: dto.nombre,
                    descripcion: dto.descripcion,
                    nivelJerarquia: dto.nivelJerarquia ?? 0,
                    esSupervisor: dto.esSupervisor ?? false,
                    color: dto.color || '#6c757d',
                },
            });

            if (dto.permisoIds && dto.permisoIds.length > 0) {
                await tx.colabRolPermiso.createMany({
                    data: dto.permisoIds.map(permisoId => ({
                        rolId: nuevoRol.id,
                        permisoId,
                    })),
                    skipDuplicates: true,
                });
            }

            return tx.colabRol.findUniqueOrThrow({
                where: { id: nuevoRol.id },
                select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    descripcion: true,
                    nivelJerarquia: true,
                    esSupervisor: true,
                    color: true,
                    esActivo: true,
                    creadoEn: true,
                    _count: {
                        select: { rolesPermisos: true },
                    },
                },
            });
        });

        this.logger.log(`Rol de colaborador creado: ${rol.nombre} (${rol.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            rol,
        };
    }

    async actualizar(id: number, dto: ActualizarColabRolDto) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        const datosActualizacion: Prisma.ColabRolUpdateInput = {};

        if (dto.nombre !== undefined) datosActualizacion.nombre = dto.nombre;
        if (dto.descripcion !== undefined) datosActualizacion.descripcion = dto.descripcion;
        if (dto.nivelJerarquia !== undefined) datosActualizacion.nivelJerarquia = dto.nivelJerarquia;
        if (dto.esSupervisor !== undefined) datosActualizacion.esSupervisor = dto.esSupervisor;
        if (dto.color !== undefined) datosActualizacion.color = dto.color;
        if (dto.esActivo !== undefined) datosActualizacion.esActivo = dto.esActivo;

        const rolActualizado = await this.prisma.colabRol.update({
            where: { id },
            data: datosActualizacion,
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                nivelJerarquia: true,
                esSupervisor: true,
                color: true,
                esActivo: true,
                actualizadoEn: true,
            },
        });

        this.logger.log(`Rol de colaborador actualizado: ${rolActualizado.nombre}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            rol: rolActualizado,
        };
    }

    async eliminar(id: number) {
        const rol = await this.prisma.colabRol.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { usuariosRoles: true },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        if (rol._count.usuariosRoles > 0) {
            throw new ConflictException(
                `No se puede eliminar el rol porque tiene ${rol._count.usuariosRoles} colaborador(es) asignado(s)`,
            );
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.colabRolPermiso.deleteMany({ where: { rolId: id } });
            await tx.colabRol.delete({ where: { id } });
        });

        this.logger.log(`Rol de colaborador eliminado: ${rol.nombre} (${rol.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE,
        };
    }

    // =============================================
    // PERMISOS DE UN ROL
    // =============================================

    async obtenerPermisosDelRol(rolId: number) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        const rolesPermisos = await this.prisma.colabRolPermiso.findMany({
            where: { rolId },
            select: {
                id: true,
                creadoEn: true,
                permiso: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        descripcion: true,
                        accion: true,
                        esActivo: true,
                        modulo: {
                            select: {
                                id: true,
                                codigo: true,
                                nombre: true,
                                icono: true,
                            },
                        },
                    },
                },
            },
        });

        // Agrupar permisos por módulo
        const permisosPorModulo = new Map<number, { modulo: any; permisos: any[] }>();
        for (const rp of rolesPermisos) {
            const moduloId = rp.permiso.modulo.id;
            if (!permisosPorModulo.has(moduloId)) {
                permisosPorModulo.set(moduloId, {
                    modulo: rp.permiso.modulo,
                    permisos: [],
                });
            }
            permisosPorModulo.get(moduloId)!.permisos.push({
                id: rp.permiso.id,
                codigo: rp.permiso.codigo,
                nombre: rp.permiso.nombre,
                accion: rp.permiso.accion,
                esActivo: rp.permiso.esActivo,
                asignadoEn: rp.creadoEn,
            });
        }

        return {
            rolId,
            rolNombre: rol.nombre,
            totalPermisos: rolesPermisos.length,
            permisosPorModulo: Array.from(permisosPorModulo.values()),
        };
    }

    async asignarPermisos(rolId: number, dto: AsignarPermisosRolDto) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        if (dto.permisoIds.length > 0) {
            const permisosExistentes = await this.prisma.colabPermiso.findMany({
                where: { id: { in: dto.permisoIds }, esActivo: true },
                select: { id: true },
            });

            const idsExistentes = permisosExistentes.map(p => p.id);
            const idsInvalidos = dto.permisoIds.filter(id => !idsExistentes.includes(id));

            if (idsInvalidos.length > 0) {
                throw new NotFoundException(
                    `Permisos no encontrados o inactivos: ${idsInvalidos.join(', ')}`,
                );
            }
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.colabRolPermiso.deleteMany({ where: { rolId } });

            if (dto.permisoIds.length > 0) {
                await tx.colabRolPermiso.createMany({
                    data: dto.permisoIds.map(permisoId => ({
                        rolId,
                        permisoId,
                    })),
                    skipDuplicates: true,
                });
            }
        });

        this.logger.log(
            `Permisos reemplazados para rol ${rol.nombre}: ${dto.permisoIds.length} permisos`,
        );

        return {
            mensaje: 'Permisos del rol actualizados exitosamente',
            totalPermisos: dto.permisoIds.length,
        };
    }

    async agregarPermisos(rolId: number, dto: AgregarPermisosRolDto) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        const permisosExistentes = await this.prisma.colabPermiso.findMany({
            where: { id: { in: dto.permisoIds }, esActivo: true },
            select: { id: true },
        });

        const idsExistentes = permisosExistentes.map(p => p.id);
        const idsInvalidos = dto.permisoIds.filter(id => !idsExistentes.includes(id));

        if (idsInvalidos.length > 0) {
            throw new NotFoundException(
                `Permisos no encontrados o inactivos: ${idsInvalidos.join(', ')}`,
            );
        }

        const resultado = await this.prisma.colabRolPermiso.createMany({
            data: dto.permisoIds.map(permisoId => ({
                rolId,
                permisoId,
            })),
            skipDuplicates: true,
        });

        this.logger.log(
            `${resultado.count} permiso(s) agregado(s) al rol ${rol.nombre}`,
        );

        return {
            mensaje: `${resultado.count} permiso(s) agregado(s) exitosamente`,
            permisosAgregados: resultado.count,
        };
    }

    async removerPermisos(rolId: number, dto: RemoverPermisosRolDto) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        const resultado = await this.prisma.colabRolPermiso.deleteMany({
            where: {
                rolId,
                permisoId: { in: dto.permisoIds },
            },
        });

        this.logger.log(
            `${resultado.count} permiso(s) removido(s) del rol ${rol.nombre}`,
        );

        return {
            mensaje: `${resultado.count} permiso(s) removido(s) exitosamente`,
            permisosRemovidos: resultado.count,
        };
    }

    // =============================================
    // USUARIOS DEL ROL
    // =============================================

    async obtenerUsuariosDelRol(rolId: number) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        const usuariosRoles = await this.prisma.colabUsuarioRol.findMany({
            where: { rolId },
            select: {
                id: true,
                esPrincipal: true,
                fechaInicio: true,
                fechaFin: true,
                creadoEn: true,
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        correo: true,
                        codigoColaborador: true,
                        cargo: true,
                        esActivo: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { creadoEn: 'desc' },
        });

        return {
            rolId,
            rolNombre: rol.nombre,
            totalUsuarios: usuariosRoles.length,
            usuarios: usuariosRoles,
        };
    }

    async asignarUsuario(rolId: number, dto: AsignarRolUsuarioDto) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        if (!rol.esActivo) {
            throw new BadRequestException('No se puede asignar un rol inactivo');
        }

        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id: dto.usuarioId },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        const asignacionExistente = await this.prisma.colabUsuarioRol.findUnique({
            where: {
                usuarioId_rolId: {
                    usuarioId: dto.usuarioId,
                    rolId,
                },
            },
        });

        if (asignacionExistente) {
            throw new ConflictException('El colaborador ya tiene este rol asignado');
        }

        // Si se marca como principal, desmarcar otros roles principales
        if (dto.esPrincipal) {
            await this.prisma.colabUsuarioRol.updateMany({
                where: { usuarioId: dto.usuarioId, esPrincipal: true },
                data: { esPrincipal: false },
            });
        }

        const asignacion = await this.prisma.colabUsuarioRol.create({
            data: {
                usuarioId: dto.usuarioId,
                rolId,
                esPrincipal: dto.esPrincipal ?? false,
            },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        codigoColaborador: true,
                    },
                },
                rol: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    },
                },
            },
        });

        this.logger.log(
            `Rol ${rol.nombre} asignado al colaborador ${colaborador.nombre} ${colaborador.apellido}`,
        );

        return {
            mensaje: 'Rol asignado exitosamente',
            asignacion,
        };
    }

    async removerUsuario(rolId: number, usuarioId: number) {
        const asignacion = await this.prisma.colabUsuarioRol.findUnique({
            where: {
                usuarioId_rolId: {
                    usuarioId,
                    rolId,
                },
            },
        });

        if (!asignacion) {
            throw new NotFoundException('El colaborador no tiene este rol asignado');
        }

        await this.prisma.colabUsuarioRol.delete({
            where: { id: asignacion.id },
        });

        this.logger.log(`Rol ${rolId} removido del colaborador ${usuarioId}`);

        return {
            mensaje: 'Rol removido exitosamente',
        };
    }

    // =============================================
    // ESTADÍSTICAS
    // =============================================

    async obtenerEstadisticas() {
        const [
            totalRoles,
            rolesActivos,
            rolesConUsuarios,
            rolesSupervisor,
        ] = await Promise.all([
            this.prisma.colabRol.count(),
            this.prisma.colabRol.count({ where: { esActivo: true } }),
            this.prisma.colabRol.count({
                where: {
                    usuariosRoles: { some: {} },
                },
            }),
            this.prisma.colabRol.count({ where: { esSupervisor: true, esActivo: true } }),
        ]);

        const rolesConConteo = await this.prisma.colabRol.findMany({
            where: { esActivo: true },
            select: {
                id: true,
                nombre: true,
                color: true,
                _count: {
                    select: { usuariosRoles: true },
                },
            },
            orderBy: { nivelJerarquia: 'desc' },
        });

        return {
            totalRoles,
            rolesActivos,
            rolesInactivos: totalRoles - rolesActivos,
            rolesConUsuarios,
            rolesSinUsuarios: totalRoles - rolesConUsuarios,
            rolesSupervisor,
            distribucionUsuarios: rolesConConteo.map(r => ({
                rolId: r.id,
                nombre: r.nombre,
                color: r.color,
                totalUsuarios: r._count.usuariosRoles,
            })),
        };
    }
}
