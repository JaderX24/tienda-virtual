import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FiltroProveedoresEnvioDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class ProveedoresEnvioService {
    private readonly logger = new Logger(ProveedoresEnvioService.name);

    constructor(private prisma: PrismaService) {}

    private mapearProveedor(registro: any) {
        const servicios = Array.isArray(registro.servicios) ? registro.servicios : [];
        const zonasCobertura = Array.isArray(registro.zonasCobertura) ? registro.zonasCobertura : [];
        const departamentosCobertura = Array.isArray(registro.departamentosCobertura) ? registro.departamentosCobertura : [];

        return {
            id: registro.id,
            codigo: registro.codigo,
            nombre: registro.nombre,
            razonSocial: registro.razonSocial,
            rtn: registro.rtn,
            tipo: registro.tipo,
            descripcion: registro.descripcion,
            logoUrl: registro.logoUrl,
            sitioWeb: registro.sitioWeb,
            direccion: registro.direccion,
            ciudad: registro.ciudad,
            departamento: registro.departamento,
            pais: registro.pais,
            codigoPostal: registro.codigoPostal,
            telefonoPrincipal: registro.telefonoPrincipal,
            telefonoSecundario: registro.telefonoSecundario,
            correoGeneral: registro.correoGeneral,
            correoOperaciones: registro.correoOperaciones,
            servicios,
            zonasCobertura,
            departamentosCobertura,
            tiempoEntregaMinimo: registro.tiempoEntregaMinimo ?? 0,
            tiempoEntregaMaximo: registro.tiempoEntregaMaximo ?? 0,
            costoBase: registro.costoBase !== null && registro.costoBase !== undefined ? Number(registro.costoBase) : 0,
            costoKgAdicional: registro.costoKgAdicional !== null && registro.costoKgAdicional !== undefined ? Number(registro.costoKgAdicional) : 0,
            moneda: registro.moneda ?? null,
            capacidadDiaria: registro.capacidadDiaria,
            pesoMaximoPaquete: registro.pesoMaximoPaquete !== null && registro.pesoMaximoPaquete !== undefined ? Number(registro.pesoMaximoPaquete) : null,
            horarioAtencion: registro.horarioAtencion,
            soportaRastreo: registro.soportaRastreo ?? false,
            soportaSeguro: registro.soportaSeguro ?? false,
            soportaContraEntrega: registro.soportaContraEntrega ?? false,
            soportaDevolucion: registro.soportaDevolucion ?? false,
            soportaEntregaProgramada: registro.soportaEntregaProgramada ?? false,
            soportaRecogidaDomicilio: registro.soportaRecogidaDomicilio ?? false,
            urlRastreo: registro.urlRastreo,
            apiUrl: registro.apiUrl,
            tieneApiConfigurada: !!registro.apiUrl,
            calificacion: registro.calificacion !== null && registro.calificacion !== undefined ? Number(registro.calificacion) : 0,
            totalEnvios: registro.totalEnvios ?? 0,
            ordenPrioridad: registro.ordenPrioridad ?? 0,
            esActivo: registro.esActivo ?? true,
            esVisible: registro.esVisible ?? true,
            notas: registro.notas,
            creadoEn: registro.creadoEn,
            actualizadoEn: registro.actualizadoEn,
            contactos: registro.contactos?.map((c: any) => ({
                id: c.id,
                transportistaId: c.transportistaId,
                nombreCompleto: c.nombreCompleto,
                cargo: c.cargo,
                departamento: c.departamento,
                telefonoPrincipal: c.telefonoPrincipal,
                telefonoSecundario: c.telefonoSecundario,
                correo: c.correo,
                correoSecundario: c.correoSecundario,
                esPrincipal: c.esPrincipal ?? false,
                notas: c.notas,
                esActivo: c.activo ?? true,
                creadoEn: c.creadoEn,
                actualizadoEn: c.actualizadoEn,
            })) || [],
        };
    }

    async obtenerTodos(filtros: FiltroProveedoresEnvioDto) {
        const {
            busqueda, tipo, cobertura, esActivo, esVisible,
            pagina = 1, limite = 20, orden, direccion,
        } = filtros;

        const where: Prisma.TransportistaWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { codigo: { contains: busqueda } },
                { correoGeneral: { contains: busqueda } },
                { razonSocial: { contains: busqueda } },
            ];
        }

        if (tipo) {
            where.tipo = tipo;
        }

        if (esActivo !== undefined) {
            where.esActivo = esActivo;
        }

        if (esVisible !== undefined) {
            where.esVisible = esVisible;
        }

        const campoOrden = this.mapearCampoOrden(orden);

        const [proveedores, total] = await Promise.all([
            this.prisma.transportista.findMany({
                where,
                include: { contactos: { where: { activo: true } } },
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [campoOrden]: direccion || 'asc' },
            }),
            this.prisma.transportista.count({ where }),
        ]);

        return {
            datos: proveedores.map((p) => this.mapearProveedor(p)),
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerPorId(id: number) {
        const proveedor = await this.prisma.transportista.findUnique({
            where: { id },
            include: { contactos: { where: { activo: true } } },
        });

        if (!proveedor) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        return this.mapearProveedor(proveedor);
    }

    async crear(datos: any) {
        const existeCodigo = await this.prisma.transportista.findUnique({
            where: { codigo: datos.codigo },
        });

        if (existeCodigo) {
            throw new ConflictException('Ya existe un proveedor de envío con este código');
        }

        const proveedor = await this.prisma.$transaction(async (tx) => {
            const nuevoProveedor = await tx.transportista.create({
                data: {
                    codigo: datos.codigo,
                    nombre: datos.nombre,
                    razonSocial: datos.razonSocial,
                    rtn: datos.rtn,
                    tipo: datos.tipo,
                    descripcion: datos.descripcion,
                    logoUrl: datos.logoUrl,
                    sitioWeb: datos.sitioWeb,
                    direccion: datos.direccion,
                    ciudad: datos.ciudad,
                    departamento: datos.departamento,
                    pais: datos.pais ?? null,
                    codigoPostal: datos.codigoPostal,
                    telefonoPrincipal: datos.telefonoPrincipal,
                    telefonoSecundario: datos.telefonoSecundario,
                    correoGeneral: datos.correoGeneral,
                    correoOperaciones: datos.correoOperaciones,
                    servicios: datos.servicios ? (datos.servicios as Prisma.InputJsonValue) : Prisma.JsonNull,
                    zonasCobertura: datos.zonasCobertura ? (datos.zonasCobertura as Prisma.InputJsonValue) : Prisma.JsonNull,
                    departamentosCobertura: datos.departamentosCobertura ? (datos.departamentosCobertura as Prisma.InputJsonValue) : Prisma.JsonNull,
                    tiempoEntregaMinimo: datos.tiempoEntregaMinimo,
                    tiempoEntregaMaximo: datos.tiempoEntregaMaximo,
                    costoBase: datos.costoBase,
                    costoKgAdicional: datos.costoKgAdicional,
                    moneda: datos.moneda ?? null,
                    capacidadDiaria: datos.capacidadDiaria,
                    pesoMaximoPaquete: datos.pesoMaximoPaquete,
                    horarioAtencion: datos.horarioAtencion,
                    soportaRastreo: datos.soportaRastreo ?? false,
                    soportaSeguro: datos.soportaSeguro ?? false,
                    soportaContraEntrega: datos.soportaContraEntrega ?? false,
                    soportaDevolucion: datos.soportaDevolucion ?? false,
                    soportaEntregaProgramada: datos.soportaEntregaProgramada ?? false,
                    soportaRecogidaDomicilio: datos.soportaRecogidaDomicilio ?? false,
                    urlRastreo: datos.urlRastreo,
                    apiUrl: datos.apiUrl,
                    ordenPrioridad: datos.ordenPrioridad ?? 0,
                    esActivo: datos.esActivo ?? true,
                    esVisible: datos.esVisible ?? true,
                    notas: datos.notas,
                },
            });

            if (datos.contactos?.length > 0) {
                await tx.contactoTransportista.createMany({
                    data: datos.contactos.map((contacto: any) => ({
                        transportistaId: nuevoProveedor.id,
                        nombreCompleto: contacto.nombreCompleto,
                        cargo: contacto.cargo,
                        departamento: contacto.departamento,
                        telefonoPrincipal: contacto.telefonoPrincipal,
                        telefonoSecundario: contacto.telefonoSecundario,
                        correo: contacto.correo,
                        correoSecundario: contacto.correoSecundario,
                        esPrincipal: contacto.esPrincipal ?? false,
                        notas: contacto.notas,
                    })),
                });
            }

            return tx.transportista.findUnique({
                where: { id: nuevoProveedor.id },
                include: { contactos: true },
            });
        });

        this.logger.log(`Proveedor de envío creado: ${proveedor!.nombre} (${proveedor!.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            proveedor: this.mapearProveedor(proveedor),
        };
    }

    async actualizar(id: number, datos: any) {
        const proveedor = await this.prisma.transportista.findUnique({ where: { id } });

        if (!proveedor) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (datos.codigo && datos.codigo !== proveedor.codigo) {
            const existeCodigo = await this.prisma.transportista.findUnique({
                where: { codigo: datos.codigo },
            });
            if (existeCodigo) {
                throw new ConflictException('Ya existe un proveedor de envío con este código');
            }
        }

        const proveedorActualizado = await this.prisma.$transaction(async (tx) => {
            const datosActualizacion: Prisma.TransportistaUpdateInput = {};

            if (datos.codigo !== undefined) datosActualizacion.codigo = datos.codigo;
            if (datos.nombre !== undefined) datosActualizacion.nombre = datos.nombre;
            if (datos.razonSocial !== undefined) datosActualizacion.razonSocial = datos.razonSocial;
            if (datos.rtn !== undefined) datosActualizacion.rtn = datos.rtn;
            if (datos.tipo !== undefined) datosActualizacion.tipo = datos.tipo;
            if (datos.descripcion !== undefined) datosActualizacion.descripcion = datos.descripcion;
            if (datos.logoUrl !== undefined) datosActualizacion.logoUrl = datos.logoUrl;
            if (datos.sitioWeb !== undefined) datosActualizacion.sitioWeb = datos.sitioWeb;
            if (datos.direccion !== undefined) datosActualizacion.direccion = datos.direccion;
            if (datos.ciudad !== undefined) datosActualizacion.ciudad = datos.ciudad;
            if (datos.departamento !== undefined) datosActualizacion.departamento = datos.departamento;
            if (datos.pais !== undefined) datosActualizacion.pais = datos.pais;
            if (datos.codigoPostal !== undefined) datosActualizacion.codigoPostal = datos.codigoPostal;
            if (datos.telefonoPrincipal !== undefined) datosActualizacion.telefonoPrincipal = datos.telefonoPrincipal;
            if (datos.telefonoSecundario !== undefined) datosActualizacion.telefonoSecundario = datos.telefonoSecundario;
            if (datos.correoGeneral !== undefined) datosActualizacion.correoGeneral = datos.correoGeneral;
            if (datos.correoOperaciones !== undefined) datosActualizacion.correoOperaciones = datos.correoOperaciones;
            if (datos.tiempoEntregaMinimo !== undefined) datosActualizacion.tiempoEntregaMinimo = datos.tiempoEntregaMinimo;
            if (datos.tiempoEntregaMaximo !== undefined) datosActualizacion.tiempoEntregaMaximo = datos.tiempoEntregaMaximo;
            if (datos.costoBase !== undefined) datosActualizacion.costoBase = datos.costoBase;
            if (datos.costoKgAdicional !== undefined) datosActualizacion.costoKgAdicional = datos.costoKgAdicional;
            if (datos.moneda !== undefined) datosActualizacion.moneda = datos.moneda;
            if (datos.capacidadDiaria !== undefined) datosActualizacion.capacidadDiaria = datos.capacidadDiaria;
            if (datos.pesoMaximoPaquete !== undefined) datosActualizacion.pesoMaximoPaquete = datos.pesoMaximoPaquete;
            if (datos.horarioAtencion !== undefined) datosActualizacion.horarioAtencion = datos.horarioAtencion;
            if (datos.soportaRastreo !== undefined) datosActualizacion.soportaRastreo = datos.soportaRastreo;
            if (datos.soportaSeguro !== undefined) datosActualizacion.soportaSeguro = datos.soportaSeguro;
            if (datos.soportaContraEntrega !== undefined) datosActualizacion.soportaContraEntrega = datos.soportaContraEntrega;
            if (datos.soportaDevolucion !== undefined) datosActualizacion.soportaDevolucion = datos.soportaDevolucion;
            if (datos.soportaEntregaProgramada !== undefined) datosActualizacion.soportaEntregaProgramada = datos.soportaEntregaProgramada;
            if (datos.soportaRecogidaDomicilio !== undefined) datosActualizacion.soportaRecogidaDomicilio = datos.soportaRecogidaDomicilio;
            if (datos.urlRastreo !== undefined) datosActualizacion.urlRastreo = datos.urlRastreo;
            if (datos.apiUrl !== undefined) datosActualizacion.apiUrl = datos.apiUrl;
            if (datos.ordenPrioridad !== undefined) datosActualizacion.ordenPrioridad = datos.ordenPrioridad;
            if (datos.esActivo !== undefined) datosActualizacion.esActivo = datos.esActivo;
            if (datos.esVisible !== undefined) datosActualizacion.esVisible = datos.esVisible;
            if (datos.notas !== undefined) datosActualizacion.notas = datos.notas;

            if (datos.servicios !== undefined) {
                datosActualizacion.servicios = datos.servicios
                    ? (datos.servicios as Prisma.InputJsonValue)
                    : Prisma.JsonNull;
            }
            if (datos.zonasCobertura !== undefined) {
                datosActualizacion.zonasCobertura = datos.zonasCobertura
                    ? (datos.zonasCobertura as Prisma.InputJsonValue)
                    : Prisma.JsonNull;
            }
            if (datos.departamentosCobertura !== undefined) {
                datosActualizacion.departamentosCobertura = datos.departamentosCobertura
                    ? (datos.departamentosCobertura as Prisma.InputJsonValue)
                    : Prisma.JsonNull;
            }

            await tx.transportista.update({
                where: { id },
                data: datosActualizacion,
            });

            // Actualizar contactos si se proporcionan
            if (datos.contactos !== undefined) {
                await tx.contactoTransportista.updateMany({
                    where: { transportistaId: id },
                    data: { activo: false },
                });

                if (datos.contactos.length > 0) {
                    await tx.contactoTransportista.createMany({
                        data: datos.contactos.map((contacto: any) => ({
                            transportistaId: id,
                            nombreCompleto: contacto.nombreCompleto,
                            cargo: contacto.cargo,
                            departamento: contacto.departamento,
                            telefonoPrincipal: contacto.telefonoPrincipal,
                            telefonoSecundario: contacto.telefonoSecundario,
                            correo: contacto.correo,
                            correoSecundario: contacto.correoSecundario,
                            esPrincipal: contacto.esPrincipal ?? false,
                            notas: contacto.notas,
                        })),
                    });
                }
            }

            return tx.transportista.findUnique({
                where: { id },
                include: { contactos: { where: { activo: true } } },
            });
        });

        this.logger.log(`Proveedor actualizado: ${proveedorActualizado!.nombre} (${proveedorActualizado!.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            proveedor: this.mapearProveedor(proveedorActualizado),
        };
    }

    async cambiarEstado(id: number, esActivo: boolean) {
        const proveedor = await this.prisma.transportista.findUnique({ where: { id } });

        if (!proveedor) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        const proveedorActualizado = await this.prisma.transportista.update({
            where: { id },
            data: { esActivo },
            include: { contactos: { where: { activo: true } } },
        });

        this.logger.log(
            `Estado de proveedor ${proveedor.codigo} cambiado a: ${esActivo ? 'activo' : 'inactivo'}`,
        );

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            proveedor: this.mapearProveedor(proveedorActualizado),
        };
    }

    async cambiarVisibilidad(id: number, esVisible: boolean) {
        const proveedor = await this.prisma.transportista.findUnique({ where: { id } });

        if (!proveedor) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        const proveedorActualizado = await this.prisma.transportista.update({
            where: { id },
            data: { esVisible },
            include: { contactos: { where: { activo: true } } },
        });

        this.logger.log(
            `Visibilidad de proveedor ${proveedor.codigo} cambiada a: ${esVisible ? 'visible' : 'oculto'}`,
        );

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            proveedor: this.mapearProveedor(proveedorActualizado),
        };
    }

    async obtenerResumen() {
        const [total, activos, inactivos] = await Promise.all([
            this.prisma.transportista.count(),
            this.prisma.transportista.count({ where: { esActivo: true } }),
            this.prisma.transportista.count({ where: { esActivo: false } }),
        ]);

        const porTipoRaw = await this.prisma.transportista.groupBy({
            by: ['tipo'],
            _count: { id: true },
        });

        const porTipo = porTipoRaw.map((grupo) => ({
            tipo: grupo.tipo,
            cantidad: grupo._count.id,
        }));

        return {
            total,
            activos,
            inactivos,
            porTipo,
        };
    }

    // Contactos individuales
    async agregarContacto(proveedorId: number, datos: any) {
        const proveedor = await this.prisma.transportista.findUnique({ where: { id: proveedorId } });

        if (!proveedor) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (datos.esPrincipal) {
            await this.prisma.contactoTransportista.updateMany({
                where: { transportistaId: proveedorId, esPrincipal: true },
                data: { esPrincipal: false },
            });
        }

        const contacto = await this.prisma.contactoTransportista.create({
            data: {
                transportistaId: proveedorId,
                nombreCompleto: datos.nombreCompleto,
                cargo: datos.cargo,
                departamento: datos.departamento,
                telefonoPrincipal: datos.telefonoPrincipal,
                telefonoSecundario: datos.telefonoSecundario,
                correo: datos.correo,
                correoSecundario: datos.correoSecundario,
                esPrincipal: datos.esPrincipal ?? false,
                notas: datos.notas,
            },
        });

        this.logger.log(`Contacto agregado al proveedor ${proveedor.codigo}: ${contacto.nombreCompleto}`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            contacto,
        };
    }

    async actualizarContacto(proveedorId: number, contactoId: number, datos: any) {
        const contacto = await this.prisma.contactoTransportista.findFirst({
            where: { id: contactoId, transportistaId: proveedorId, activo: true },
        });

        if (!contacto) {
            throw new NotFoundException('Contacto no encontrado');
        }

        if (datos.esPrincipal) {
            await this.prisma.contactoTransportista.updateMany({
                where: { transportistaId: proveedorId, esPrincipal: true, id: { not: contactoId } },
                data: { esPrincipal: false },
            });
        }

        const contactoActualizado = await this.prisma.contactoTransportista.update({
            where: { id: contactoId },
            data: {
                nombreCompleto: datos.nombreCompleto,
                cargo: datos.cargo,
                departamento: datos.departamento,
                telefonoPrincipal: datos.telefonoPrincipal,
                telefonoSecundario: datos.telefonoSecundario,
                correo: datos.correo,
                correoSecundario: datos.correoSecundario,
                esPrincipal: datos.esPrincipal,
                notas: datos.notas,
            },
        });

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            contacto: contactoActualizado,
        };
    }

    async eliminarContacto(proveedorId: number, contactoId: number) {
        const contacto = await this.prisma.contactoTransportista.findFirst({
            where: { id: contactoId, transportistaId: proveedorId, activo: true },
        });

        if (!contacto) {
            throw new NotFoundException('Contacto no encontrado');
        }

        await this.prisma.contactoTransportista.update({
            where: { id: contactoId },
            data: { activo: false },
        });

        this.logger.log(`Contacto ${contacto.nombreCompleto} eliminado del proveedor ${proveedorId}`);

        return {
            mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE,
        };
    }

    private mapearCampoOrden(orden?: string): string {
        const mapaOrden: Record<string, string> = {
            nombre: 'nombre',
            codigo: 'codigo',
            tipo: 'tipo',
            prioridad: 'ordenPrioridad',
            fecha: 'creadoEn',
            calificacion: 'calificacion',
        };
        return mapaOrden[orden || ''] || 'ordenPrioridad';
    }
}
