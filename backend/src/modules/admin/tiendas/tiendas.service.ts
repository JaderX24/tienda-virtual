import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FiltroTiendasDto } from './dto';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';

@Injectable()
export class TiendasService {
    private readonly logger = new Logger(TiendasService.name);

    constructor(private prisma: PrismaService) {}

    // Transforma un registro de Empresa al formato Tienda que espera el frontend
    private mapearATienda(empresa: any) {
        return {
            id: empresa.id,
            nombre: empresa.nombre,
            nombreComercial: empresa.nombre,
            rtn: empresa.rtn,
            nit: empresa.nit,
            correo: empresa.correo,
            telefono: empresa.telefono,
            celular: empresa.celular,
            tipoTienda: 'tienda_virtual',
            estado: empresa.activa ? 'activa' : 'inactiva',
            ubicacion: {
                direccion: empresa.direccion || '',
                departamento: empresa.departamento || '',
                ciudad: empresa.ciudad || '',
                codigoPostal: empresa.codigoPostal || '',
                pais: empresa.pais || 'HN',
                latitud: null,
                longitud: null,
                referenciasUbicacion: null,
            },
            logo: empresa.logo,
            sitioWeb: empresa.sitioWeb,
            tipoNegocio: empresa.tipoNegocio,
            descripcion: empresa.descripcion,
            redesSociales: empresa.redesSociales || {},
            representanteLegal: empresa.representanteLegal,
            planSuscripcion: empresa.planSuscripcion || 'basico',
            moneda: empresa.moneda || 'HNL',
            zonaHoraria: empresa.zonaHoraria || 'America/Tegucigalpa',
            cantidadEmpleados: empresa.cantidadEmpleados,
            horarioAtencion: null,
            configuracion: {
                permitePedidosOnline: true,
                permitePagosOnline: true,
                permitePedidosDomicilio: false,
                metodosPagoAceptados: ['efectivo', 'tarjeta'],
            },
            estadisticas: null,
            activa: empresa.activa,
            creadoEn: empresa.creadoEn,
            actualizadoEn: empresa.actualizadoEn,
        };
    }

    async obtenerTodas(filtros: FiltroTiendasDto) {
        const {
            busqueda, tipoNegocio, planSuscripcion, estado, departamento,
            ciudad, activa, pagina = 1, limite = 20, orden, direccion,
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

        if (departamento) {
            where.departamento = { contains: departamento };
        }

        if (ciudad) {
            where.ciudad = { contains: ciudad };
        }

        if (activa !== undefined) {
            where.activa = activa;
        }

        if (estado) {
            if (estado === 'activa') {
                where.activa = true;
            } else if (estado === 'inactiva') {
                where.activa = false;
            }
        }

        const campoOrden = this.mapearCampoOrden(orden);

        const [empresas, total] = await Promise.all([
            this.prisma.empresa.findMany({
                where,
                skip: (pagina - 1) * limite,
                take: limite,
                orderBy: { [campoOrden]: direccion || 'desc' },
            }),
            this.prisma.empresa.count({ where }),
        ]);

        return {
            datos: empresas.map((e) => this.mapearATienda(e)),
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

        return this.mapearATienda(empresa);
    }

    async crear(datos: any) {
        const { rtn, correo } = datos;

        if (rtn) {
            const existeRtn = await this.prisma.empresa.findUnique({ where: { rtn } });
            if (existeRtn) {
                throw new ConflictException('Ya existe una tienda con este RTN');
            }
        }

        if (correo) {
            const existeCorreo = await this.prisma.empresa.findUnique({ where: { correo } });
            if (existeCorreo) {
                throw new ConflictException('Ya existe una tienda con este correo electrónico');
            }
        }

        const empresa = await this.prisma.empresa.create({
            data: {
                nombre: datos.nombre,
                rtn: datos.rtn,
                nit: datos.nit,
                correo: datos.correo,
                telefono: datos.telefono,
                celular: datos.celular,
                tipoNegocio: datos.tipoNegocio || 'otro',
                descripcion: datos.descripcion,
                pais: datos.ubicacion?.pais || 'HN',
                departamento: datos.ubicacion?.departamento,
                ciudad: datos.ubicacion?.ciudad,
                codigoPostal: datos.ubicacion?.codigoPostal,
                direccion: datos.ubicacion?.direccion,
                logo: datos.logo,
                sitioWeb: datos.sitioWeb,
                redesSociales: datos.redesSociales
                    ? (datos.redesSociales as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                representanteLegal: datos.representanteLegal,
                planSuscripcion: datos.planSuscripcion || 'basico',
                moneda: 'HNL',
                zonaHoraria: 'America/Tegucigalpa',
                cantidadEmpleados: datos.cantidadEmpleados,
                activa: true,
            },
        });

        this.logger.log(`Tienda creada: ${empresa.nombre} (RTN: ${empresa.rtn})`);

        return {
            mensaje: MENSAJES_EXITO.CREADO_EXITOSAMENTE,
            tienda: this.mapearATienda(empresa),
        };
    }

    async actualizar(id: number, datos: any) {
        const empresa = await this.prisma.empresa.findUnique({ where: { id } });

        if (!empresa) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        const datosActualizacion: Prisma.EmpresaUpdateInput = {};

        if (datos.nombre !== undefined) datosActualizacion.nombre = datos.nombre;
        if (datos.correo !== undefined) datosActualizacion.correo = datos.correo;
        if (datos.telefono !== undefined) datosActualizacion.telefono = datos.telefono;
        if (datos.celular !== undefined) datosActualizacion.celular = datos.celular;
        if (datos.tipoNegocio !== undefined) datosActualizacion.tipoNegocio = datos.tipoNegocio;
        if (datos.descripcion !== undefined) datosActualizacion.descripcion = datos.descripcion;
        if (datos.logo !== undefined) datosActualizacion.logo = datos.logo;
        if (datos.sitioWeb !== undefined) datosActualizacion.sitioWeb = datos.sitioWeb;
        if (datos.representanteLegal !== undefined) datosActualizacion.representanteLegal = datos.representanteLegal;
        if (datos.planSuscripcion !== undefined) datosActualizacion.planSuscripcion = datos.planSuscripcion;
        if (datos.cantidadEmpleados !== undefined) datosActualizacion.cantidadEmpleados = datos.cantidadEmpleados;
        if (datos.activa !== undefined) datosActualizacion.activa = datos.activa;

        if (datos.ubicacion) {
            if (datos.ubicacion.direccion !== undefined) datosActualizacion.direccion = datos.ubicacion.direccion;
            if (datos.ubicacion.departamento !== undefined) datosActualizacion.departamento = datos.ubicacion.departamento;
            if (datos.ubicacion.ciudad !== undefined) datosActualizacion.ciudad = datos.ubicacion.ciudad;
            if (datos.ubicacion.codigoPostal !== undefined) datosActualizacion.codigoPostal = datos.ubicacion.codigoPostal;
            if (datos.ubicacion.pais !== undefined) datosActualizacion.pais = datos.ubicacion.pais;
        }

        if (datos.redesSociales !== undefined) {
            datosActualizacion.redesSociales = datos.redesSociales as Prisma.InputJsonValue;
        }

        const empresaActualizada = await this.prisma.empresa.update({
            where: { id },
            data: datosActualizacion,
        });

        this.logger.log(`Tienda actualizada: ${empresaActualizada.nombre}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            tienda: this.mapearATienda(empresaActualizada),
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

        this.logger.log(`Estado de tienda ${id} cambiado a: ${activa ? 'activa' : 'inactiva'}`);

        return {
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
            tienda: this.mapearATienda(empresaActualizada),
        };
    }

    async eliminar(id: number) {
        const empresa = await this.prisma.empresa.findUnique({ where: { id } });

        if (!empresa) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        await this.prisma.empresa.update({
            where: { id },
            data: { activa: false },
        });

        this.logger.log(`Tienda eliminada (soft delete): ${empresa.nombre}`);

        return {
            mensaje: MENSAJES_EXITO.ELIMINADO_EXITOSAMENTE,
        };
    }

    async obtenerEstadisticas(id: number) {
        const empresa = await this.prisma.empresa.findUnique({ where: { id } });

        if (!empresa) {
            throw new NotFoundException(MENSAJES_ERROR.RECURSO_NO_ENCONTRADO);
        }

        return {
            pedidosDelMes: 0,
            ventasDelMes: 0,
            clientesActivos: 0,
            productosActivos: 0,
            stockBajo: 0,
            valoracionPromedio: 0,
            ultimaVenta: null,
        };
    }

    async obtenerResumenEstadisticas() {
        const [total, activas, inactivas] = await Promise.all([
            this.prisma.empresa.count(),
            this.prisma.empresa.count({ where: { activa: true } }),
            this.prisma.empresa.count({ where: { activa: false } }),
        ]);

        // Agrupar por departamento
        const empresasPorDepartamento = await this.prisma.empresa.groupBy({
            by: ['departamento'],
            _count: { id: true },
            where: { departamento: { not: null } },
        });

        const tiendaPorDepartamento = empresasPorDepartamento.map((e) => ({
            departamento: e.departamento || 'Sin definir',
            cantidad: e._count.id,
        }));

        // Agrupar por plan
        const empresasPorPlan = await this.prisma.empresa.groupBy({
            by: ['planSuscripcion'],
            _count: { id: true },
            where: { planSuscripcion: { not: null } },
        });

        const ventasPorPlan = empresasPorPlan.map((e) => ({
            plan: e.planSuscripcion || 'Sin plan',
            ventas: 0,
        }));

        return {
            totalTiendas: total,
            tiendasActivas: activas,
            tiendasInactivas: inactivas,
            ventasMesActual: 0,
            crecimientoVentas: 0,
            tiendaPorDepartamento,
            ventasPorPlan,
        };
    }

    async validarRtn(rtn: string, excluirId?: number) {
        const where: Prisma.EmpresaWhereInput = { rtn };

        if (excluirId) {
            where.id = { not: excluirId };
        }

        const existe = await this.prisma.empresa.findFirst({ where });

        return {
            valido: !existe,
            mensaje: existe ? 'El RTN ya está registrado' : undefined,
        };
    }

    async obtenerOpcionesFormulario() {
        return {
            tiposTienda: [
                { valor: 'tienda_fisica', etiqueta: 'Tienda Física' },
                { valor: 'tienda_virtual', etiqueta: 'Tienda Virtual' },
                { valor: 'tienda_hibrida', etiqueta: 'Tienda Híbrida' },
                { valor: 'quiosco', etiqueta: 'Quiosco' },
                { valor: 'sucursal', etiqueta: 'Sucursal' },
                { valor: 'franquicia', etiqueta: 'Franquicia' },
                { valor: 'popup_store', etiqueta: 'Pop-up Store' },
                { valor: 'outlet', etiqueta: 'Outlet' },
            ],
            tiposNegocio: [
                { valor: 'tienda_ropa', etiqueta: 'Tienda de Ropa' },
                { valor: 'restaurante', etiqueta: 'Restaurante' },
                { valor: 'supermercado', etiqueta: 'Supermercado' },
                { valor: 'farmacia', etiqueta: 'Farmacia' },
                { valor: 'tecnologia', etiqueta: 'Tecnología' },
                { valor: 'ferreteria', etiqueta: 'Ferretería' },
                { valor: 'libreria', etiqueta: 'Librería' },
                { valor: 'servicios', etiqueta: 'Servicios' },
                { valor: 'mayorista', etiqueta: 'Mayorista' },
                { valor: 'otro', etiqueta: 'Otro' },
            ],
            planes: [
                { valor: 'basico', etiqueta: 'Básico' },
                { valor: 'profesional', etiqueta: 'Profesional' },
                { valor: 'empresarial', etiqueta: 'Empresarial' },
                { valor: 'premium', etiqueta: 'Premium' },
            ],
            rangoEmpleados: [
                { valor: '1-5', etiqueta: '1-5 empleados' },
                { valor: '6-20', etiqueta: '6-20 empleados' },
                { valor: '21-50', etiqueta: '21-50 empleados' },
                { valor: '51-100', etiqueta: '51-100 empleados' },
                { valor: '101-500', etiqueta: '101-500 empleados' },
                { valor: '500+', etiqueta: 'Más de 500 empleados' },
            ],
            departamentos: [
                { valor: 'Francisco Morazán', etiqueta: 'Francisco Morazán' },
                { valor: 'Cortés', etiqueta: 'Cortés' },
                { valor: 'Atlántida', etiqueta: 'Atlántida' },
                { valor: 'Choluteca', etiqueta: 'Choluteca' },
                { valor: 'Comayagua', etiqueta: 'Comayagua' },
                { valor: 'Copán', etiqueta: 'Copán' },
                { valor: 'El Paraíso', etiqueta: 'El Paraíso' },
                { valor: 'Gracias a Dios', etiqueta: 'Gracias a Dios' },
                { valor: 'Intibucá', etiqueta: 'Intibucá' },
                { valor: 'Islas de la Bahía', etiqueta: 'Islas de la Bahía' },
                { valor: 'La Paz', etiqueta: 'La Paz' },
                { valor: 'Lempira', etiqueta: 'Lempira' },
                { valor: 'Ocotepeque', etiqueta: 'Ocotepeque' },
                { valor: 'Olancho', etiqueta: 'Olancho' },
                { valor: 'Santa Bárbara', etiqueta: 'Santa Bárbara' },
                { valor: 'Valle', etiqueta: 'Valle' },
                { valor: 'Yoro', etiqueta: 'Yoro' },
                { valor: 'Colón', etiqueta: 'Colón' },
            ],
            paises: [
                { valor: 'HN', etiqueta: 'Honduras' },
            ],
        };
    }

    private mapearCampoOrden(orden?: string): string {
        const mapaOrden: Record<string, string> = {
            nombre: 'nombre',
            fecha: 'creadoEn',
            ventas: 'creadoEn',
            pedidos: 'creadoEn',
        };
        return mapaOrden[orden || ''] || 'creadoEn';
    }
}
