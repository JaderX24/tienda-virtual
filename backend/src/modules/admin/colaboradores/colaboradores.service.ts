import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CorreoColaboradorService } from '../../../common/services';
import { ParametrosSeguridadService, CLAVES_PARAMETRO } from '../../../common/services';
import { generarContrasenaSegura } from '../../../common/utils';
import {
    CrearColaboradorDto,
    ActualizarColaboradorDto,
    FiltroColaboradoresDto,
} from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

// Campos que se excluyen al devolver un colaborador
const CAMPOS_SELECCION = {
    id: true,
    nombre: true,
    apellido: true,
    numeroIdentidad: true,
    fechaNacimiento: true,
    genero: true,
    correo: true,
    telefono: true,
    telefonoEmergencia: true,
    contactoEmergenciaNombre: true,
    codigoColaborador: true,
    cargo: true,
    fechaIngreso: true,
    fechaBaja: true,
    tipoContrato: true,
    empresaId: true,
    contrasenaTemporal: true,
    esActivo: true,
    esVerificado: true,
    verificadoEn: true,
    motivoInactivacion: true,
    requiere2fa: true,
    metodo2fa: true,
    accesoSoloIpConfiable: true,
    accesoSoloHorarioTurno: true,
    accesoSoloDispositivoRegistrado: true,
    maxSesionesSimultaneas: true,
    avatarUrl: true,
    ultimoAcceso: true,
    creadoEn: true,
    actualizadoEn: true,
    empresa: {
        select: {
            id: true,
            nombre: true,
        },
    },
    roles: {
        select: {
            id: true,
            esPrincipal: true,
            rol: {
                select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    esActivo: true,
                },
            },
        },
    },
    asignaciones: {
        where: { esActiva: true },
        select: {
            id: true,
            almacenId: true,
            nivelAcceso: true,
            zonaAsignada: true,
            esActiva: true,
            fechaInicio: true,
        },
    },
};

@Injectable()
export class ColaboradoresService {
    private readonly logger = new Logger(ColaboradoresService.name);

    constructor(
        private prisma: PrismaService,
        private correoService: CorreoColaboradorService,
        private configService: ConfigService,
        private parametrosSeguridad: ParametrosSeguridadService,
    ) {}

    async crear(crearColaboradorDto: CrearColaboradorDto) {
        const { correo, codigoColaborador, numeroIdentidad } = crearColaboradorDto;

        const correoExistente = await this.prisma.colabUsuario.findUnique({
            where: { correo },
        });

        if (correoExistente) {
            throw new ConflictException('Ya existe un colaborador con este correo electrónico');
        }

        const codigoExistente = await this.prisma.colabUsuario.findUnique({
            where: { codigoColaborador },
        });

        if (codigoExistente) {
            throw new ConflictException('Ya existe un colaborador con este código');
        }

        if (numeroIdentidad) {
            const identidadExistente = await this.prisma.colabUsuario.findUnique({
                where: { numeroIdentidad },
            });

            if (identidadExistente) {
                throw new ConflictException('Ya existe un colaborador con este número de identidad');
            }
        }

        if (crearColaboradorDto.empresaId) {
            const empresa = await this.prisma.empresa.findUnique({
                where: { id: crearColaboradorDto.empresaId },
            });

            if (!empresa) {
                throw new NotFoundException('La empresa especificada no existe');
            }
        }

        // Generar contraseña temporal segura (crypto.randomInt)
        const longitudContrasena = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.LONGITUD_CONTRASENA_GENERACION);
        const contrasenaTemporal = generarContrasenaSegura(longitudContrasena);
        const bcryptRounds = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.BCRYPT_SALT_ROUNDS);
        const contrasenaHash = await bcrypt.hash(contrasenaTemporal, bcryptRounds);

        const colaborador = await this.prisma.colabUsuario.create({
            data: {
                nombre: crearColaboradorDto.nombre,
                apellido: crearColaboradorDto.apellido,
                correo: crearColaboradorDto.correo,
                codigoColaborador: crearColaboradorDto.codigoColaborador,
                numeroIdentidad: crearColaboradorDto.numeroIdentidad,
                fechaNacimiento: crearColaboradorDto.fechaNacimiento
                    ? new Date(crearColaboradorDto.fechaNacimiento)
                    : undefined,
                genero: crearColaboradorDto.genero || 'no_especificado',
                telefono: crearColaboradorDto.telefono,
                telefonoEmergencia: crearColaboradorDto.telefonoEmergencia,
                contactoEmergenciaNombre: crearColaboradorDto.contactoEmergenciaNombre,
                cargo: crearColaboradorDto.cargo,
                fechaIngreso: crearColaboradorDto.fechaIngreso
                    ? new Date(crearColaboradorDto.fechaIngreso)
                    : new Date(),
                tipoContrato: crearColaboradorDto.tipoContrato,
                empresaId: crearColaboradorDto.empresaId,
                contrasenaHash,
                contrasenaTemporal: true,
                requiere2fa: crearColaboradorDto.requiere2fa ?? false,
                metodo2fa: crearColaboradorDto.metodo2fa || 'ninguno',
                accesoSoloHorarioTurno: crearColaboradorDto.accesoSoloHorarioTurno ?? false,
                maxSesionesSimultaneas: crearColaboradorDto.maxSesionesSimultaneas ?? 1,
                esActivo: true,
            },
            select: CAMPOS_SELECCION,
        });

        this.logger.log(
            `Colaborador creado: ${colaborador.nombre} ${colaborador.apellido} (${colaborador.codigoColaborador})`,
        );

        // Obtener nombre del rol principal si tiene roles asignados
        const nombreRol = colaborador.roles?.length > 0
            ? colaborador.roles.find(r => r.esPrincipal)?.rol.nombre || colaborador.roles[0]?.rol.nombre
            : undefined;

        const urlFrontend = this.configService.get<string>('app.urlFrontend') || 'http://localhost:4200';

        const correoEnviado = await this.correoService.enviarBienvenidaColaborador({
            nombre: `${colaborador.nombre} ${colaborador.apellido}`,
            correo: colaborador.correo,
            contrasena: contrasenaTemporal,
            nombreRol,
            urlAcceso: `${urlFrontend}/colaborador/login`,
        });

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            colaborador,
            correoEnviado,
        };
    }

    async obtenerTodos(filtros: FiltroColaboradoresDto) {
        const {
            busqueda, empresaId, tipoContrato, activo, almacenId,
            pagina = 1, limite = 20, ordenarPor, orden,
        } = filtros;

        const where: Prisma.ColabUsuarioWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { apellido: { contains: busqueda } },
                { correo: { contains: busqueda } },
                { codigoColaborador: { contains: busqueda } },
                { cargo: { contains: busqueda } },
            ];
        }

        if (empresaId) {
            where.empresaId = empresaId;
        }

        if (tipoContrato) {
            where.tipoContrato = tipoContrato;
        }

        if (activo !== undefined) {
            where.esActivo = activo;
        }

        if (almacenId) {
            where.asignaciones = {
                some: {
                    almacenId,
                    esActiva: true,
                },
            };
        }

        const campoOrden = this.obtenerCampoOrden(ordenarPor);

        const [colaboradores, total] = await Promise.all([
            this.prisma.colabUsuario.findMany({
                where,
                select: CAMPOS_SELECCION,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [campoOrden]: orden || 'desc' },
            }),
            this.prisma.colabUsuario.count({ where }),
        ]);

        return {
            datos: colaboradores,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerPorId(id: number) {
        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id },
            select: CAMPOS_SELECCION,
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        return colaborador;
    }

    async actualizar(id: number, actualizarDto: ActualizarColaboradorDto) {
        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        if (actualizarDto.correo && actualizarDto.correo !== colaborador.correo) {
            const correoExistente = await this.prisma.colabUsuario.findUnique({
                where: { correo: actualizarDto.correo },
            });

            if (correoExistente) {
                throw new ConflictException('Ya existe un colaborador con este correo electrónico');
            }
        }

        if (actualizarDto.numeroIdentidad && actualizarDto.numeroIdentidad !== colaborador.numeroIdentidad) {
            const identidadExistente = await this.prisma.colabUsuario.findUnique({
                where: { numeroIdentidad: actualizarDto.numeroIdentidad },
            });

            if (identidadExistente) {
                throw new ConflictException('Ya existe un colaborador con este número de identidad');
            }
        }

        if (actualizarDto.empresaId) {
            const empresa = await this.prisma.empresa.findUnique({
                where: { id: actualizarDto.empresaId },
            });

            if (!empresa) {
                throw new NotFoundException('La empresa especificada no existe');
            }
        }

        const datosActualizacion: Prisma.ColabUsuarioUpdateInput = {};

        if (actualizarDto.nombre !== undefined) datosActualizacion.nombre = actualizarDto.nombre;
        if (actualizarDto.apellido !== undefined) datosActualizacion.apellido = actualizarDto.apellido;
        if (actualizarDto.correo !== undefined) datosActualizacion.correo = actualizarDto.correo;
        if (actualizarDto.numeroIdentidad !== undefined) datosActualizacion.numeroIdentidad = actualizarDto.numeroIdentidad;
        if (actualizarDto.fechaNacimiento !== undefined) datosActualizacion.fechaNacimiento = new Date(actualizarDto.fechaNacimiento);
        if (actualizarDto.genero !== undefined) datosActualizacion.genero = actualizarDto.genero;
        if (actualizarDto.telefono !== undefined) datosActualizacion.telefono = actualizarDto.telefono;
        if (actualizarDto.telefonoEmergencia !== undefined) datosActualizacion.telefonoEmergencia = actualizarDto.telefonoEmergencia;
        if (actualizarDto.contactoEmergenciaNombre !== undefined) datosActualizacion.contactoEmergenciaNombre = actualizarDto.contactoEmergenciaNombre;
        if (actualizarDto.cargo !== undefined) datosActualizacion.cargo = actualizarDto.cargo;
        if (actualizarDto.fechaIngreso !== undefined) datosActualizacion.fechaIngreso = new Date(actualizarDto.fechaIngreso);
        if (actualizarDto.fechaBaja !== undefined) datosActualizacion.fechaBaja = new Date(actualizarDto.fechaBaja);
        if (actualizarDto.tipoContrato !== undefined) datosActualizacion.tipoContrato = actualizarDto.tipoContrato;
        if (actualizarDto.empresaId !== undefined) datosActualizacion.empresa = { connect: { id: actualizarDto.empresaId } };
        if (actualizarDto.motivoInactivacion !== undefined) datosActualizacion.motivoInactivacion = actualizarDto.motivoInactivacion;
        if (actualizarDto.requiere2fa !== undefined) datosActualizacion.requiere2fa = actualizarDto.requiere2fa;
        if (actualizarDto.metodo2fa !== undefined) datosActualizacion.metodo2fa = actualizarDto.metodo2fa;
        if (actualizarDto.accesoSoloIpConfiable !== undefined) datosActualizacion.accesoSoloIpConfiable = actualizarDto.accesoSoloIpConfiable;
        if (actualizarDto.accesoSoloHorarioTurno !== undefined) datosActualizacion.accesoSoloHorarioTurno = actualizarDto.accesoSoloHorarioTurno;
        if (actualizarDto.accesoSoloDispositivoRegistrado !== undefined) datosActualizacion.accesoSoloDispositivoRegistrado = actualizarDto.accesoSoloDispositivoRegistrado;
        if (actualizarDto.maxSesionesSimultaneas !== undefined) datosActualizacion.maxSesionesSimultaneas = actualizarDto.maxSesionesSimultaneas;

        const colaboradorActualizado = await this.prisma.colabUsuario.update({
            where: { id },
            data: datosActualizacion,
            select: CAMPOS_SELECCION,
        });

        this.logger.log(
            `Colaborador actualizado: ${colaboradorActualizado.nombre} ${colaboradorActualizado.apellido}`,
        );

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            colaborador: colaboradorActualizado,
        };
    }

    async cambiarEstado(id: number, activo: boolean, motivoInactivacion?: string) {
        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        const datosActualizacion: Prisma.ColabUsuarioUpdateInput = {
            esActivo: activo,
        };

        if (!activo) {
            datosActualizacion.motivoInactivacion = motivoInactivacion || null;
            datosActualizacion.inactivadoEn = new Date();
        } else {
            datosActualizacion.motivoInactivacion = null;
            datosActualizacion.inactivadoEn = null;
        }

        const colaboradorActualizado = await this.prisma.colabUsuario.update({
            where: { id },
            data: datosActualizacion,
            select: CAMPOS_SELECCION,
        });

        this.logger.log(
            `Estado de colaborador ${id} cambiado a: ${activo ? 'activo' : 'inactivo'}`,
        );

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            colaborador: colaboradorActualizado,
        };
    }

    async obtenerRoles() {
        const roles = await this.prisma.colabRol.findMany({
            where: { esActivo: true },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                nivelJerarquia: true,
                esSupervisor: true,
                color: true,
                esActivo: true,
            },
            orderBy: { nivelJerarquia: 'desc' },
        });

        return roles;
    }

    async asignarRol(colaboradorId: number, rolId: number, esPrincipal: boolean = false) {
        const colaborador = await this.prisma.colabUsuario.findUnique({
            where: { id: colaboradorId },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        const rol = await this.prisma.colabRol.findUnique({
            where: { id: rolId },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        const asignacionExistente = await this.prisma.colabUsuarioRol.findUnique({
            where: {
                usuarioId_rolId: {
                    usuarioId: colaboradorId,
                    rolId,
                },
            },
        });

        if (asignacionExistente) {
            throw new ConflictException('El colaborador ya tiene este rol asignado');
        }

        if (esPrincipal) {
            await this.prisma.colabUsuarioRol.updateMany({
                where: { usuarioId: colaboradorId, esPrincipal: true },
                data: { esPrincipal: false },
            });
        }

        const asignacion = await this.prisma.colabUsuarioRol.create({
            data: {
                usuarioId: colaboradorId,
                rolId,
                esPrincipal,
                fechaInicio: new Date(),
            },
            include: {
                rol: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        esActivo: true,
                    },
                },
            },
        });

        this.logger.log(`Rol ${rol.nombre} asignado al colaborador ${colaboradorId}`);

        return {
            mensaje: 'Rol asignado exitosamente',
            asignacion,
        };
    }

    async removerRol(colaboradorId: number, rolId: number) {
        const asignacion = await this.prisma.colabUsuarioRol.findUnique({
            where: {
                usuarioId_rolId: {
                    usuarioId: colaboradorId,
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

        this.logger.log(`Rol ${rolId} removido del colaborador ${colaboradorId}`);

        return {
            mensaje: 'Rol removido exitosamente',
        };
    }

    async obtenerEstadisticas() {
        const [
            totalColaboradores,
            totalActivos,
            totalInactivos,
            porTipoContrato,
        ] = await Promise.all([
            this.prisma.colabUsuario.count(),
            this.prisma.colabUsuario.count({ where: { esActivo: true } }),
            this.prisma.colabUsuario.count({ where: { esActivo: false } }),
            this.prisma.colabUsuario.groupBy({
                by: ['tipoContrato'],
                _count: { id: true },
            }),
        ]);

        return {
            totalColaboradores,
            totalActivos,
            totalInactivos,
            porTipoContrato: porTipoContrato.map(item => ({
                tipo: item.tipoContrato,
                cantidad: item._count.id,
            })),
        };
    }

    private obtenerCampoOrden(campo?: string): string {
        const camposPermitidos: Record<string, string> = {
            nombre: 'nombre',
            apellido: 'apellido',
            correo: 'correo',
            cargo: 'cargo',
            tipoContrato: 'tipoContrato',
            fechaIngreso: 'fechaIngreso',
            ultimoAcceso: 'ultimoAcceso',
            creadoEn: 'creadoEn',
        };

        return camposPermitidos[campo || ''] || 'creadoEn';
    }
}
