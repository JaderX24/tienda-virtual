import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CrearColabRolDto,
    ActualizarColabRolDto,
    AsignarPermisosRolDto,
    AsignarPermisoDirectoDto,
} from './dto';

@Injectable()
export class ColabRolesPermisosService {
    private readonly logger = new Logger(ColabRolesPermisosService.name);

    constructor(private prisma: PrismaService) {}

    // =============================================
    // MÓDULOS
    // =============================================

    async obtenerModulos() {
        return this.prisma.colabModulo.findMany({
            where: { esActivo: true },
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
            },
            orderBy: { orden: 'asc' },
        });
    }

    // =============================================
    // PERMISOS
    // =============================================

    async obtenerPermisos(moduloId?: number) {
        const where: Prisma.ColabPermisoWhereInput = { esActivo: true };

        if (moduloId) {
            where.moduloId = moduloId;
        }

        return this.prisma.colabPermiso.findMany({
            where,
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
            orderBy: [
                { modulo: { orden: 'asc' } },
                { accion: 'asc' },
            ],
        });
    }

    async obtenerPermisosAgrupadosPorModulo() {
        const modulos = await this.prisma.colabModulo.findMany({
            where: { esActivo: true },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                icono: true,
                orden: true,
                permisos: {
                    where: { esActivo: true },
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        accion: true,
                    },
                    orderBy: { accion: 'asc' },
                },
            },
            orderBy: { orden: 'asc' },
        });

        return modulos.filter(m => m.permisos.length > 0);
    }

    // =============================================
    // ROLES
    // =============================================

    async obtenerRoles() {
        return this.prisma.colabRol.findMany({
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
                    select: {
                        usuariosRoles: true,
                        rolesPermisos: true,
                    },
                },
            },
            orderBy: { nivelJerarquia: 'desc' },
        });
    }

    async obtenerRolPorId(id: number) {
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
                rolesPermisos: {
                    select: {
                        id: true,
                        permiso: {
                            select: {
                                id: true,
                                codigo: true,
                                nombre: true,
                                accion: true,
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
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true,
                                codigoColaborador: true,
                                esActivo: true,
                            },
                        },
                    },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        return rol;
    }

    async crearRol(dto: CrearColabRolDto) {
        const codigoExistente = await this.prisma.colabRol.findUnique({
            where: { codigo: dto.codigo },
        });

        if (codigoExistente) {
            throw new ConflictException('Ya existe un rol con este código');
        }

        const rol = await this.prisma.colabRol.create({
            data: {
                codigo: dto.codigo,
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                nivelJerarquia: dto.nivelJerarquia ?? 0,
                esSupervisor: dto.esSupervisor ?? false,
                color: dto.color || '#6c757d',
            },
        });

        this.logger.log(`Rol de colaborador creado: ${rol.nombre} (${rol.codigo})`);

        return {
            mensaje: 'Rol creado exitosamente',
            rol,
        };
    }

    async actualizarRol(id: number, dto: ActualizarColabRolDto) {
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
        });

        this.logger.log(`Rol de colaborador actualizado: ${rolActualizado.nombre}`);

        return {
            mensaje: 'Rol actualizado exitosamente',
            rol: rolActualizado,
        };
    }

    // =============================================
    // PERMISOS DE ROL
    // =============================================

    async obtenerPermisosDeRol(rolId: number) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        const rolesPermisos = await this.prisma.colabRolPermiso.findMany({
            where: { rolId },
            select: {
                id: true,
                permiso: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        accion: true,
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

        return rolesPermisos.map(rp => rp.permiso);
    }

    async asignarPermisosARol(rolId: number, dto: AsignarPermisosRolDto) {
        const rol = await this.prisma.colabRol.findUnique({ where: { id: rolId } });

        if (!rol) {
            throw new NotFoundException('Rol de colaborador no encontrado');
        }

        // Validar que todos los permisos existan
        const permisosExistentes = await this.prisma.colabPermiso.findMany({
            where: { id: { in: dto.permisoIds }, esActivo: true },
            select: { id: true },
        });

        const idsExistentes = permisosExistentes.map(p => p.id);
        const idsInvalidos = dto.permisoIds.filter(id => !idsExistentes.includes(id));

        if (idsInvalidos.length > 0) {
            throw new NotFoundException(`Permisos no encontrados: ${idsInvalidos.join(', ')}`);
        }

        // Reemplazar todos los permisos del rol en una transacción
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
            `Permisos actualizados para rol ${rol.nombre}: ${dto.permisoIds.length} permisos asignados`,
        );

        return {
            mensaje: 'Permisos del rol actualizados exitosamente',
            totalPermisos: dto.permisoIds.length,
        };
    }

    // =============================================
    // PERMISOS DIRECTOS DE COLABORADOR
    // =============================================

    async obtenerPermisosDeColaborador(colaboradorId: number) {
        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id: colaboradorId },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        // Permisos heredados por roles
        const permisosRoles = await this.prisma.colabRolPermiso.findMany({
            where: {
                rol: {
                    usuariosRoles: {
                        some: {
                            usuarioId: colaboradorId,
                            OR: [
                                { fechaFin: null },
                                { fechaFin: { gte: new Date() } },
                            ],
                        },
                    },
                },
            },
            select: {
                permiso: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        accion: true,
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

        // Permisos directos del colaborador
        const permisosDirectos = await this.prisma.colabUsuarioPermiso.findMany({
            where: {
                usuarioId: colaboradorId,
                OR: [
                    { fechaFin: null },
                    { fechaFin: { gte: new Date() } },
                ],
            },
            select: {
                id: true,
                tipo: true,
                fechaInicio: true,
                fechaFin: true,
                motivo: true,
                permiso: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        accion: true,
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

        // Consolidar permisos: heredados + otorgados directos - denegados directos
        const permisosHeredados = permisosRoles.map(rp => rp.permiso);
        const otorgados = permisosDirectos
            .filter(pd => pd.tipo === 'otorgado')
            .map(pd => pd.permiso);
        const denegados = new Set(
            permisosDirectos
                .filter(pd => pd.tipo === 'denegado')
                .map(pd => pd.permiso.id),
        );

        // Unificar permisos heredados + otorgados y eliminar denegados
        const mapaPermisos = new Map<number, typeof permisosHeredados[0]>();
        [...permisosHeredados, ...otorgados].forEach(p => {
            if (!denegados.has(p.id)) {
                mapaPermisos.set(p.id, p);
            }
        });

        return {
            permisosEfectivos: Array.from(mapaPermisos.values()),
            permisosHeredados,
            permisosDirectos: permisosDirectos.map(pd => ({
                ...pd.permiso,
                tipo: pd.tipo,
                fechaInicio: pd.fechaInicio,
                fechaFin: pd.fechaFin,
                motivo: pd.motivo,
                asignacionId: pd.id,
            })),
            totalEfectivos: mapaPermisos.size,
        };
    }

    async asignarPermisoDirecto(colaboradorId: number, dto: AsignarPermisoDirectoDto) {
        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id: colaboradorId },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        const permiso = await this.prisma.colabPermiso.findUnique({
            where: { id: dto.permisoId },
        });

        if (!permiso) {
            throw new NotFoundException('Permiso no encontrado');
        }

        const existente = await this.prisma.colabUsuarioPermiso.findUnique({
            where: {
                usuarioId_permisoId: {
                    usuarioId: colaboradorId,
                    permisoId: dto.permisoId,
                },
            },
        });

        if (existente) {
            throw new ConflictException('El colaborador ya tiene este permiso asignado directamente');
        }

        const asignacion = await this.prisma.colabUsuarioPermiso.create({
            data: {
                usuarioId: colaboradorId,
                permisoId: dto.permisoId,
                tipo: dto.tipo || 'otorgado',
                fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
                motivo: dto.motivo,
            },
            include: {
                permiso: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    },
                },
            },
        });

        this.logger.log(
            `Permiso ${permiso.codigo} (${dto.tipo || 'otorgado'}) asignado al colaborador ${colaboradorId}`,
        );

        return {
            mensaje: 'Permiso asignado exitosamente',
            asignacion,
        };
    }

    async removerPermisoDirecto(colaboradorId: number, permisoId: number) {
        const asignacion = await this.prisma.colabUsuarioPermiso.findUnique({
            where: {
                usuarioId_permisoId: {
                    usuarioId: colaboradorId,
                    permisoId,
                },
            },
        });

        if (!asignacion) {
            throw new NotFoundException('El colaborador no tiene este permiso asignado directamente');
        }

        await this.prisma.colabUsuarioPermiso.delete({
            where: { id: asignacion.id },
        });

        this.logger.log(`Permiso directo ${permisoId} removido del colaborador ${colaboradorId}`);

        return {
            mensaje: 'Permiso removido exitosamente',
        };
    }
}
