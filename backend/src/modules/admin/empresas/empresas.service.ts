import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrearEmpresaDto, ActualizarEmpresaDto, FiltroEmpresasDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class EmpresasService {
    private readonly logger = new Logger(EmpresasService.name);

    constructor(private prisma: PrismaService) {}

    async crear(crearEmpresaDto: CrearEmpresaDto) {
        const { rtn, correo } = crearEmpresaDto;

        const empresaConRtn = await this.prisma.empresa.findUnique({
            where: { rtn },
        });

        if (empresaConRtn) {
            throw new ConflictException('Ya existe una empresa con este RTN');
        }

        const empresaConCorreo = await this.prisma.empresa.findUnique({
            where: { correo },
        });

        if (empresaConCorreo) {
            throw new ConflictException('Ya existe una empresa con este correo electrónico');
        }

        const empresa = await this.prisma.empresa.create({
            data: {
                nombre: crearEmpresaDto.nombre,
                rtn: crearEmpresaDto.rtn,
                nit: crearEmpresaDto.nit,
                correo: crearEmpresaDto.correo,
                telefono: crearEmpresaDto.telefono,
                celular: crearEmpresaDto.celular,
                tipoNegocio: crearEmpresaDto.tipoNegocio,
                descripcion: crearEmpresaDto.descripcion,
                pais: crearEmpresaDto.pais,
                departamento: crearEmpresaDto.departamento,
                ciudad: crearEmpresaDto.ciudad,
                codigoPostal: crearEmpresaDto.codigoPostal,
                direccion: crearEmpresaDto.direccion,
                logo: crearEmpresaDto.logo,
                sitioWeb: crearEmpresaDto.sitioWeb,
                redesSociales: crearEmpresaDto.redesSociales
                    ? (crearEmpresaDto.redesSociales as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                representanteLegal: crearEmpresaDto.representanteLegal,
                planSuscripcion: crearEmpresaDto.planSuscripcion,
                moneda: crearEmpresaDto.moneda,
                zonaHoraria: crearEmpresaDto.zonaHoraria,
                cantidadEmpleados: crearEmpresaDto.cantidadEmpleados,
                activa: true,
            },
        });

        this.logger.log(`Empresa creada: ${empresa.nombre} (RTN: ${empresa.rtn})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            empresa,
        };
    }

    async obtenerTodas(filtros: FiltroEmpresasDto) {
        const {
            busqueda, tipoNegocio, planSuscripcion, activa,
            pagina = 1, limite = 20, ordenarPor, orden,
        } = filtros;

        const where: Prisma.EmpresaWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { correo: { contains: busqueda } },
                { rtn: { contains: busqueda } },
            ];
        }

        if (tipoNegocio) {
            where.tipoNegocio = tipoNegocio;
        }

        if (planSuscripcion) {
            where.planSuscripcion = planSuscripcion;
        }

        if (activa !== undefined) {
            where.activa = activa;
        }

        const [empresas, total] = await Promise.all([
            this.prisma.empresa.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [ordenarPor || 'creadoEn']: orden || 'desc' },
            }),
            this.prisma.empresa.count({ where }),
        ]);

        return {
            datos: empresas,
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerPorId(id: number) {
        const empresa = await this.prisma.empresa.findUnique({
            where: { id },
        });

        if (!empresa) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        return empresa;
    }

    async actualizar(id: number, actualizarEmpresaDto: ActualizarEmpresaDto) {
        const empresa = await this.prisma.empresa.findUnique({ where: { id } });

        if (!empresa) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (actualizarEmpresaDto.rtn && actualizarEmpresaDto.rtn !== empresa.rtn) {
            const rtnExistente = await this.prisma.empresa.findUnique({
                where: { rtn: actualizarEmpresaDto.rtn },
            });

            if (rtnExistente) {
                throw new ConflictException('Ya existe una empresa con este RTN');
            }
        }

        if (actualizarEmpresaDto.correo && actualizarEmpresaDto.correo !== empresa.correo) {
            const correoExistente = await this.prisma.empresa.findUnique({
                where: { correo: actualizarEmpresaDto.correo },
            });

            if (correoExistente) {
                throw new ConflictException('Ya existe una empresa con este correo electrónico');
            }
        }

        const datosActualizacion: Prisma.EmpresaUpdateInput = {};

        if (actualizarEmpresaDto.nombre !== undefined) datosActualizacion.nombre = actualizarEmpresaDto.nombre;
        if (actualizarEmpresaDto.rtn !== undefined) datosActualizacion.rtn = actualizarEmpresaDto.rtn;
        if (actualizarEmpresaDto.nit !== undefined) datosActualizacion.nit = actualizarEmpresaDto.nit;
        if (actualizarEmpresaDto.correo !== undefined) datosActualizacion.correo = actualizarEmpresaDto.correo;
        if (actualizarEmpresaDto.telefono !== undefined) datosActualizacion.telefono = actualizarEmpresaDto.telefono;
        if (actualizarEmpresaDto.celular !== undefined) datosActualizacion.celular = actualizarEmpresaDto.celular;
        if (actualizarEmpresaDto.tipoNegocio !== undefined) datosActualizacion.tipoNegocio = actualizarEmpresaDto.tipoNegocio;
        if (actualizarEmpresaDto.descripcion !== undefined) datosActualizacion.descripcion = actualizarEmpresaDto.descripcion;
        if (actualizarEmpresaDto.pais !== undefined) datosActualizacion.pais = actualizarEmpresaDto.pais;
        if (actualizarEmpresaDto.departamento !== undefined) datosActualizacion.departamento = actualizarEmpresaDto.departamento;
        if (actualizarEmpresaDto.ciudad !== undefined) datosActualizacion.ciudad = actualizarEmpresaDto.ciudad;
        if (actualizarEmpresaDto.codigoPostal !== undefined) datosActualizacion.codigoPostal = actualizarEmpresaDto.codigoPostal;
        if (actualizarEmpresaDto.direccion !== undefined) datosActualizacion.direccion = actualizarEmpresaDto.direccion;
        if (actualizarEmpresaDto.logo !== undefined) datosActualizacion.logo = actualizarEmpresaDto.logo;
        if (actualizarEmpresaDto.sitioWeb !== undefined) datosActualizacion.sitioWeb = actualizarEmpresaDto.sitioWeb;
        if (actualizarEmpresaDto.redesSociales !== undefined) {
            datosActualizacion.redesSociales = actualizarEmpresaDto.redesSociales as Prisma.InputJsonValue;
        }
        if (actualizarEmpresaDto.representanteLegal !== undefined) datosActualizacion.representanteLegal = actualizarEmpresaDto.representanteLegal;
        if (actualizarEmpresaDto.planSuscripcion !== undefined) datosActualizacion.planSuscripcion = actualizarEmpresaDto.planSuscripcion;
        if (actualizarEmpresaDto.moneda !== undefined) datosActualizacion.moneda = actualizarEmpresaDto.moneda;
        if (actualizarEmpresaDto.zonaHoraria !== undefined) datosActualizacion.zonaHoraria = actualizarEmpresaDto.zonaHoraria;
        if (actualizarEmpresaDto.cantidadEmpleados !== undefined) datosActualizacion.cantidadEmpleados = actualizarEmpresaDto.cantidadEmpleados;
        if (actualizarEmpresaDto.activa !== undefined) datosActualizacion.activa = actualizarEmpresaDto.activa;

        const empresaActualizada = await this.prisma.empresa.update({
            where: { id },
            data: datosActualizacion,
        });

        this.logger.log(`Empresa actualizada: ${empresaActualizada.nombre}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            empresa: empresaActualizada,
        };
    }

    async cambiarEstado(id: number, activa: boolean) {
        const empresa = await this.prisma.empresa.findUnique({ where: { id } });

        if (!empresa) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        const empresaActualizada = await this.prisma.empresa.update({
            where: { id },
            data: { activa },
        });

        this.logger.log(`Estado de empresa ${id} cambiado a: ${activa ? 'activa' : 'inactiva'}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            empresa: empresaActualizada,
        };
    }

    async obtenerEstadisticas(id: number) {
        const empresa = await this.prisma.empresa.findUnique({ where: { id } });

        if (!empresa) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        return {
            totalProductos: 0,
            totalPedidos: 0,
            totalVentas: 0,
            totalUsuarios: 0,
        };
    }
}
