import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FiltroPasarelasDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class MetodosPagoService {
    private readonly logger = new Logger(MetodosPagoService.name);

    constructor(private prisma: PrismaService) {}

    private mapearPasarela(registro: any) {
        return {
            id: registro.id,
            codigo: registro.codigo,
            nombre: registro.nombre,
            descripcion: registro.descripcion,
            tipo: registro.tipo,
            proveedor: registro.proveedor,
            logoUrl: registro.logoUrl,
            urlDocumentacion: registro.urlDocumentacion,
            modoIntegracion: registro.modoIntegracion,
            urlApiSandbox: registro.urlApiSandbox,
            urlApiProduccion: registro.urlApiProduccion,
            versionApi: registro.versionApi,
            soportaTokenizacion: registro.soportaTokenizacion,
            soporta3ds: registro.soporta3ds,
            soportaReembolsos: registro.soportaReembolsos,
            soportaReembolsosParciales: registro.soportaReembolsosParciales,
            soportaSuscripciones: registro.soportaSuscripciones,
            soportaSplitPayment: registro.soportaSplitPayment,
            soportaPreautorizacion: registro.soportaPreautorizacion,
            soportaCapturaDiferida: registro.soportaCapturaDiferida,
            monedasSoportadas: registro.monedasSoportadas,
            montoMinimo: Number(registro.montoMinimo),
            montoMaximo: Number(registro.montoMaximo),
            ordenPrioridad: registro.ordenPrioridad,
            esActivo: registro.esActivo,
            esVisibleCliente: registro.esVisibleCliente,
            requiereConfiguracion: registro.requiereConfiguracion,
            creadoEn: registro.creadoEn,
            actualizadoEn: registro.actualizadoEn,
        };
    }

    async obtenerTodas(filtros: FiltroPasarelasDto) {
        const {
            busqueda, tipo, modoIntegracion, esActivo, esVisibleCliente,
            pagina = 1, limite = 20, orden, direccion,
        } = filtros;

        const where: Prisma.PagosPasarelaWhereInput = {};

        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda } },
                { codigo: { contains: busqueda } },
                { proveedor: { contains: busqueda } },
            ];
        }

        if (tipo) {
            where.tipo = tipo as any;
        }

        if (modoIntegracion) {
            where.modoIntegracion = modoIntegracion as any;
        }

        if (esActivo !== undefined) {
            where.esActivo = esActivo;
        }

        if (esVisibleCliente !== undefined) {
            where.esVisibleCliente = esVisibleCliente;
        }

        const campoOrden = this.mapearCampoOrden(orden);

        const [pasarelas, total] = await Promise.all([
            this.prisma.pagosPasarela.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [campoOrden]: direccion || 'asc' },
            }),
            this.prisma.pagosPasarela.count({ where }),
        ]);

        return {
            datos: pasarelas.map((p) => this.mapearPasarela(p)),
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
        };
    }

    async obtenerPorId(id: number) {
        const pasarela = await this.prisma.pagosPasarela.findUnique({
            where: { id },
        });

        if (!pasarela) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        return this.mapearPasarela(pasarela);
    }

    async crear(datos: any) {
        const existeCodigo = await this.prisma.pagosPasarela.findUnique({
            where: { codigo: datos.codigo },
        });

        if (existeCodigo) {
            throw new ConflictException('Ya existe una pasarela con este código');
        }

        const pasarela = await this.prisma.pagosPasarela.create({
            data: {
                codigo: datos.codigo,
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                tipo: datos.tipo,
                proveedor: datos.proveedor,
                logoUrl: datos.logoUrl,
                urlDocumentacion: datos.urlDocumentacion,
                modoIntegracion: datos.modoIntegracion,
                urlApiSandbox: datos.urlApiSandbox,
                urlApiProduccion: datos.urlApiProduccion,
                versionApi: datos.versionApi,
                soportaTokenizacion: datos.soportaTokenizacion ?? false,
                soporta3ds: datos.soporta3ds ?? false,
                soportaReembolsos: datos.soportaReembolsos ?? true,
                soportaReembolsosParciales: datos.soportaReembolsosParciales ?? false,
                soportaSuscripciones: datos.soportaSuscripciones ?? false,
                soportaSplitPayment: datos.soportaSplitPayment ?? false,
                soportaPreautorizacion: datos.soportaPreautorizacion ?? false,
                soportaCapturaDiferida: datos.soportaCapturaDiferida ?? false,
                monedasSoportadas: datos.monedasSoportadas
                    ? (datos.monedasSoportadas as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                montoMinimo: datos.montoMinimo ?? 1.00,
                montoMaximo: datos.montoMaximo ?? 999999.99,
                ordenPrioridad: datos.ordenPrioridad ?? 0,
                esActivo: datos.esActivo ?? true,
                esVisibleCliente: datos.esVisibleCliente ?? true,
                requiereConfiguracion: datos.requiereConfiguracion ?? true,
            },
        });

        this.logger.log(`Pasarela de pago creada: ${pasarela.nombre} (${pasarela.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            pasarela: this.mapearPasarela(pasarela),
        };
    }

    async actualizar(id: number, datos: any) {
        const pasarela = await this.prisma.pagosPasarela.findUnique({ where: { id } });

        if (!pasarela) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        if (datos.codigo && datos.codigo !== pasarela.codigo) {
            const existeCodigo = await this.prisma.pagosPasarela.findUnique({
                where: { codigo: datos.codigo },
            });
            if (existeCodigo) {
                throw new ConflictException('Ya existe una pasarela con este código');
            }
        }

        const datosActualizacion: Prisma.PagosPasarelaUpdateInput = {};

        if (datos.codigo !== undefined) datosActualizacion.codigo = datos.codigo;
        if (datos.nombre !== undefined) datosActualizacion.nombre = datos.nombre;
        if (datos.descripcion !== undefined) datosActualizacion.descripcion = datos.descripcion;
        if (datos.tipo !== undefined) datosActualizacion.tipo = datos.tipo;
        if (datos.proveedor !== undefined) datosActualizacion.proveedor = datos.proveedor;
        if (datos.logoUrl !== undefined) datosActualizacion.logoUrl = datos.logoUrl;
        if (datos.urlDocumentacion !== undefined) datosActualizacion.urlDocumentacion = datos.urlDocumentacion;
        if (datos.modoIntegracion !== undefined) datosActualizacion.modoIntegracion = datos.modoIntegracion;
        if (datos.urlApiSandbox !== undefined) datosActualizacion.urlApiSandbox = datos.urlApiSandbox;
        if (datos.urlApiProduccion !== undefined) datosActualizacion.urlApiProduccion = datos.urlApiProduccion;
        if (datos.versionApi !== undefined) datosActualizacion.versionApi = datos.versionApi;
        if (datos.soportaTokenizacion !== undefined) datosActualizacion.soportaTokenizacion = datos.soportaTokenizacion;
        if (datos.soporta3ds !== undefined) datosActualizacion.soporta3ds = datos.soporta3ds;
        if (datos.soportaReembolsos !== undefined) datosActualizacion.soportaReembolsos = datos.soportaReembolsos;
        if (datos.soportaReembolsosParciales !== undefined) datosActualizacion.soportaReembolsosParciales = datos.soportaReembolsosParciales;
        if (datos.soportaSuscripciones !== undefined) datosActualizacion.soportaSuscripciones = datos.soportaSuscripciones;
        if (datos.soportaSplitPayment !== undefined) datosActualizacion.soportaSplitPayment = datos.soportaSplitPayment;
        if (datos.soportaPreautorizacion !== undefined) datosActualizacion.soportaPreautorizacion = datos.soportaPreautorizacion;
        if (datos.soportaCapturaDiferida !== undefined) datosActualizacion.soportaCapturaDiferida = datos.soportaCapturaDiferida;

        if (datos.monedasSoportadas !== undefined) {
            datosActualizacion.monedasSoportadas = datos.monedasSoportadas
                ? (datos.monedasSoportadas as Prisma.InputJsonValue)
                : Prisma.JsonNull;
        }

        if (datos.montoMinimo !== undefined) datosActualizacion.montoMinimo = datos.montoMinimo;
        if (datos.montoMaximo !== undefined) datosActualizacion.montoMaximo = datos.montoMaximo;
        if (datos.ordenPrioridad !== undefined) datosActualizacion.ordenPrioridad = datos.ordenPrioridad;
        if (datos.esActivo !== undefined) datosActualizacion.esActivo = datos.esActivo;
        if (datos.esVisibleCliente !== undefined) datosActualizacion.esVisibleCliente = datos.esVisibleCliente;
        if (datos.requiereConfiguracion !== undefined) datosActualizacion.requiereConfiguracion = datos.requiereConfiguracion;

        const pasarelaActualizada = await this.prisma.pagosPasarela.update({
            where: { id },
            data: datosActualizacion,
        });

        this.logger.log(`Pasarela actualizada: ${pasarelaActualizada.nombre} (${pasarelaActualizada.codigo})`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            pasarela: this.mapearPasarela(pasarelaActualizada),
        };
    }

    async cambiarEstado(id: number, esActivo: boolean) {
        const pasarela = await this.prisma.pagosPasarela.findUnique({ where: { id } });

        if (!pasarela) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        const pasarelaActualizada = await this.prisma.pagosPasarela.update({
            where: { id },
            data: { esActivo },
        });

        this.logger.log(
            `Estado de pasarela ${pasarela.codigo} cambiado a: ${esActivo ? 'activa' : 'inactiva'}`,
        );

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            pasarela: this.mapearPasarela(pasarelaActualizada),
        };
    }

    async cambiarVisibilidad(id: number, esVisibleCliente: boolean) {
        const pasarela = await this.prisma.pagosPasarela.findUnique({ where: { id } });

        if (!pasarela) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        const pasarelaActualizada = await this.prisma.pagosPasarela.update({
            where: { id },
            data: { esVisibleCliente },
        });

        this.logger.log(
            `Visibilidad de pasarela ${pasarela.codigo} cambiada a: ${esVisibleCliente ? 'visible' : 'oculta'}`,
        );

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            pasarela: this.mapearPasarela(pasarelaActualizada),
        };
    }

    async actualizarOrdenPrioridad(pasarelas: { id: number; ordenPrioridad: number }[]) {
        await this.prisma.$transaction(
            pasarelas.map((item) =>
                this.prisma.pagosPasarela.update({
                    where: { id: item.id },
                    data: { ordenPrioridad: item.ordenPrioridad },
                }),
            ),
        );

        this.logger.log(`Orden de prioridad actualizado para ${pasarelas.length} pasarelas`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
        };
    }

    async obtenerResumen() {
        const [total, activas, inactivas] = await Promise.all([
            this.prisma.pagosPasarela.count(),
            this.prisma.pagosPasarela.count({ where: { esActivo: true } }),
            this.prisma.pagosPasarela.count({ where: { esActivo: false } }),
        ]);

        const porTipoRaw = await this.prisma.pagosPasarela.groupBy({
            by: ['tipo'],
            _count: { id: true },
        });

        const porTipo = porTipoRaw.map((grupo) => ({
            tipo: grupo.tipo,
            cantidad: grupo._count.id,
        }));

        return {
            total,
            activas,
            inactivas,
            porTipo,
        };
    }

    private mapearCampoOrden(orden?: string): string {
        const mapaOrden: Record<string, string> = {
            nombre: 'nombre',
            codigo: 'codigo',
            tipo: 'tipo',
            prioridad: 'ordenPrioridad',
            fecha: 'creadoEn',
        };
        return mapaOrden[orden || ''] || 'ordenPrioridad';
    }
}
