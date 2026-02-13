import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CrearColabPermisoDto,
    ActualizarColabPermisoDto,
    FiltroColabPermisosDto,
    AsignarPermisoDirectoDto,
} from './dto';
import { MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class ColabPermisosService {
    private readonly logger = new Logger(ColabPermisosService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerTodos(filtros: FiltroColabPermisosDto) {
        const {
            busqueda,
            moduloId,
            accion,
            esActivo,
            pagina = 1,
            limite = 20,
            ordenarPor = 'nombre',
            orden = 'asc',
        } = filtros;

        const where: Prisma.ColabPermisoWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { codigo: { contains: busqueda } },
                { descripcion: { contains: busqueda } },
            ];
        }

        if (moduloId) {
            where.moduloId = moduloId;
        }

        if (accion) {
            where.accion = accion;
        }

        if (esActivo !== undefined) {
            where.esActivo = esActivo;
        }

        const [permisos, total] = await Promise.all([
            this.prisma.colabPermiso.findMany({
                where,
                select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    descripcion: true,
                    accion: true,
                    esActivo: true,
                    creadoEn: true,
                    actualizadoEn: true,
                    modulo: {
                        select: {
                            id: true,
                            codigo: true,
                            nombre: true,
                            icono: true,
                        },
                    },
                    _count: {
                        select: {
                            rolesPermisos: true,
                            usuariosPermisos: true,
                        },
                    },
                },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: ordenarPor === 'creadoEn'
                    ? { creadoEn: orden }
                    : { [ordenarPor]: orden },
            }),
            this.prisma.colabPermiso.count({ where }),
        ]);

        return {
            datos: permisos,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerAgrupadosPorModulo() {
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
                        descripcion: true,
                        accion: true,
                        _count: {
                            select: {
                                rolesPermisos: true,
                                usuariosPermisos: true,
                            },
                        },
                    },
                    orderBy: { accion: 'asc' },
                },
            },
            orderBy: { orden: 'asc' },
        });

        return modulos.filter(m => m.permisos.length > 0);
    }

    async obtenerAccionesDisponibles() {
        const acciones = await this.prisma.colabPermiso.findMany({
            where: { esActivo: true },
            select: { accion: true },
            distinct: ['accion'],
            orderBy: { accion: 'asc' },
        });

        return acciones.map(a => a.accion);
    }

    async obtenerPorId(id: number) {
        const permiso = await this.prisma.colabPermiso.findUnique({
            where: { id },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                accion: true,
                esActivo: true,
                creadoEn: true,
                actualizadoEn: true,
                modulo: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        icono: true,
                    },
                },
                rolesPermisos: {
                    select: {
                        rol: {
                            select: {
                                id: true,
                                codigo: true,
                                nombre: true,
                                color: true,
                                esActivo: true,
                            },
                        },
                    },
                },
                usuariosPermisos: {
                    select: {
                        id: true,
                        tipo: true,
                        fechaInicio: true,
                        fechaFin: true,
                        motivo: true,
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

        if (!permiso) {
            throw new NotFoundException('Permiso de colaborador no encontrado');
        }

        return permiso;
    }

    async crear(dto: CrearColabPermisoDto) {
        const codigoExistente = await this.prisma.colabPermiso.findUnique({
            where: { codigo: dto.codigo },
        });

        if (codigoExistente) {
            throw new ConflictException('Ya existe un permiso con este código');
        }

        const modulo = await this.prisma.colabModulo.findUnique({
            where: { id: dto.moduloId },
        });

        if (!modulo) {
            throw new NotFoundException('El módulo especificado no existe');
        }

        const permiso = await this.prisma.colabPermiso.create({
            data: {
                codigo: dto.codigo,
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                moduloId: dto.moduloId,
                accion: dto.accion,
            },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                accion: true,
                esActivo: true,
                creadoEn: true,
                modulo: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    },
                },
            },
        });

        this.logger.log(`Permiso de colaborador creado: ${permiso.nombre} (${permiso.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            permiso,
        };
    }

    async actualizar(id: number, dto: ActualizarColabPermisoDto) {
        const permiso = await this.prisma.colabPermiso.findUnique({ where: { id } });

        if (!permiso) {
            throw new NotFoundException('Permiso de colaborador no encontrado');
        }

        if (dto.moduloId) {
            const modulo = await this.prisma.colabModulo.findUnique({
                where: { id: dto.moduloId },
            });

            if (!modulo) {
                throw new NotFoundException('El módulo especificado no existe');
            }
        }

        const datosActualizacion: Prisma.ColabPermisoUpdateInput = {};

        if (dto.nombre !== undefined) datosActualizacion.nombre = dto.nombre;
        if (dto.descripcion !== undefined) datosActualizacion.descripcion = dto.descripcion;
        if (dto.accion !== undefined) datosActualizacion.accion = dto.accion;
        if (dto.esActivo !== undefined) datosActualizacion.esActivo = dto.esActivo;

        if (dto.moduloId !== undefined) {
            datosActualizacion.modulo = { connect: { id: dto.moduloId } };
        }

        const permisoActualizado = await this.prisma.colabPermiso.update({
            where: { id },
            data: datosActualizacion,
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                accion: true,
                esActivo: true,
                actualizadoEn: true,
                modulo: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    },
                },
            },
        });

        this.logger.log(`Permiso de colaborador actualizado: ${permisoActualizado.nombre}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            permiso: permisoActualizado,
        };
    }

    async cambiarEstado(id: number, esActivo: boolean) {
        const permiso = await this.prisma.colabPermiso.findUnique({ where: { id } });

        if (!permiso) {
            throw new NotFoundException('Permiso de colaborador no encontrado');
        }

        const permisoActualizado = await this.prisma.colabPermiso.update({
            where: { id },
            data: { esActivo },
        });

        const estado = esActivo ? 'activado' : 'desactivado';
        this.logger.log(`Permiso ${permiso.nombre} ${estado}`);

        return {
            mensaje: `Permiso ${estado} exitosamente`,
            permiso: permisoActualizado,
        };
    }

    async eliminar(id: number) {
        const permiso = await this.prisma.colabPermiso.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        rolesPermisos: true,
                        usuariosPermisos: true,
                    },
                },
            },
        });

        if (!permiso) {
            throw new NotFoundException('Permiso de colaborador no encontrado');
        }

        const totalAsignaciones = permiso._count.rolesPermisos + permiso._count.usuariosPermisos;
        if (totalAsignaciones > 0) {
            throw new ConflictException(
                `No se puede eliminar el permiso porque está asignado a ${permiso._count.rolesPermisos} rol(es) y ${permiso._count.usuariosPermisos} usuario(s)`,
            );
        }

        await this.prisma.colabPermiso.delete({ where: { id } });

        this.logger.log(`Permiso de colaborador eliminado: ${permiso.nombre} (${permiso.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE,
        };
    }

    // =============================================
    // PERMISOS DIRECTOS DE UN COLABORADOR
    // =============================================

    async obtenerPermisosEfectivos(colaboradorId: number) {
        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id: colaboradorId },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        // Permisos heredados por roles activos
        const permisosRoles = await this.prisma.colabRolPermiso.findMany({
            where: {
                rol: {
                    esActivo: true,
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
                        descripcion: true,
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
                rol: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
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
                creadoEn: true,
                permiso: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        descripcion: true,
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

        // Consolidar permisos: heredados + otorgados - denegados
        const permisosHeredados = permisosRoles.map(rp => ({
            ...rp.permiso,
            origen: 'rol',
            rolOrigen: rp.rol,
        }));

        const otorgados = permisosDirectos
            .filter(pd => pd.tipo === 'otorgado')
            .map(pd => ({
                ...pd.permiso,
                origen: 'directo',
                asignacionId: pd.id,
                fechaInicio: pd.fechaInicio,
                fechaFin: pd.fechaFin,
                motivo: pd.motivo,
            }));

        const denegados = new Set(
            permisosDirectos
                .filter(pd => pd.tipo === 'denegado')
                .map(pd => pd.permiso.id),
        );

        const mapaPermisos = new Map<number, any>();
        [...permisosHeredados, ...otorgados].forEach(p => {
            if (!denegados.has(p.id)) {
                if (!mapaPermisos.has(p.id)) {
                    mapaPermisos.set(p.id, p);
                }
            }
        });

        return {
            colaboradorId,
            colaboradorNombre: `${colaborador.nombre} ${colaborador.apellido}`,
            permisosEfectivos: Array.from(mapaPermisos.values()),
            permisosHeredados: permisosHeredados.map(p => ({
                id: p.id,
                codigo: p.codigo,
                nombre: p.nombre,
                accion: p.accion,
                modulo: p.modulo,
                rolOrigen: p.rolOrigen,
            })),
            permisosDirectos: permisosDirectos.map(pd => ({
                asignacionId: pd.id,
                tipo: pd.tipo,
                fechaInicio: pd.fechaInicio,
                fechaFin: pd.fechaFin,
                motivo: pd.motivo,
                permiso: pd.permiso,
            })),
            permisosDenegados: permisosDirectos
                .filter(pd => pd.tipo === 'denegado')
                .map(pd => pd.permiso),
            totalEfectivos: mapaPermisos.size,
            totalHeredados: permisosHeredados.length,
            totalDirectos: permisosDirectos.length,
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

        if (!permiso.esActivo) {
            throw new ConflictException('No se puede asignar un permiso inactivo');
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
                        accion: true,
                        modulo: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(
            `Permiso ${permiso.codigo} (${dto.tipo || 'otorgado'}) asignado directamente al colaborador ${colaboradorId}`,
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
            mensaje: 'Permiso directo removido exitosamente',
        };
    }

    // =============================================
    // ESTADÍSTICAS
    // =============================================

    async obtenerEstadisticas() {
        const [
            totalPermisos,
            permisosActivos,
            totalModulos,
            permisosConRoles,
            permisosConUsuarios,
        ] = await Promise.all([
            this.prisma.colabPermiso.count(),
            this.prisma.colabPermiso.count({ where: { esActivo: true } }),
            this.prisma.colabModulo.count({ where: { esActivo: true } }),
            this.prisma.colabPermiso.count({
                where: { rolesPermisos: { some: {} } },
            }),
            this.prisma.colabPermiso.count({
                where: { usuariosPermisos: { some: {} } },
            }),
        ]);

        const permisosPorAccion = await this.prisma.colabPermiso.groupBy({
            by: ['accion'],
            where: { esActivo: true },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });

        const permisosPorModulo = await this.prisma.colabModulo.findMany({
            where: { esActivo: true },
            select: {
                id: true,
                nombre: true,
                icono: true,
                _count: {
                    select: { permisos: true },
                },
            },
            orderBy: { orden: 'asc' },
        });

        return {
            totalPermisos,
            permisosActivos,
            permisosInactivos: totalPermisos - permisosActivos,
            totalModulos,
            permisosConRoles,
            permisosSinRoles: totalPermisos - permisosConRoles,
            permisosConUsuariosDirectos: permisosConUsuarios,
            permisosPorAccion: permisosPorAccion.map(p => ({
                accion: p.accion,
                total: p._count.id,
            })),
            permisosPorModulo: permisosPorModulo.map(m => ({
                moduloId: m.id,
                nombre: m.nombre,
                icono: m.icono,
                totalPermisos: m._count.permisos,
            })),
        };
    }
}
