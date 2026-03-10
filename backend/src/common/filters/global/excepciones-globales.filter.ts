import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
    Inject,
    Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ThrottlerException } from '@nestjs/throttler';
import { MENSAJES_ERROR } from '../../constants/global/mensajes.constant';
import { ManejadorExcepcionesAdmin } from '../admin/excepciones-admin.filter';
import { ManejadorExcepcionesColab } from '../colaboradores/excepciones-colab.filter';

interface RespuestaError {
    exito: boolean;
    mensaje: string;
    codigo: string;
    timestamp: string;
    ruta: string;
    correlacionId?: string;
    errores?: string[];
}

@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
    private readonly logger = new Logger(FiltroExcepcionesGlobal.name);
    private readonly esProduccion: boolean;

    constructor(
        private readonly configService: ConfigService,
        @Optional() private readonly manejadorAdmin?: ManejadorExcepcionesAdmin,
        @Optional() private readonly manejadorColab?: ManejadorExcepcionesColab,
    ) {
        this.esProduccion = this.configService.get<string>('app.entorno') === 'produccion';
    }

    catch(excepcion: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const correlacionId = request.headers['x-correlacion-id'] as string;

        const { status, mensaje, codigo, errores } = this.procesarExcepcion(excepcion);

        this.registrarError(request, status, mensaje, excepcion, correlacionId);

        // Delegar al manejador del portal correspondiente
        this.delegarAPortal(request, status, excepcion);

        const respuestaError: RespuestaError = {
            exito: false,
            mensaje,
            codigo,
            timestamp: new Date().toISOString(),
            ruta: this.sanitizarRuta(request.url),
        };

        if (correlacionId) {
            respuestaError.correlacionId = correlacionId;
        }

        if (errores?.length) {
            respuestaError.errores = errores;
        }

        response.status(status).json(respuestaError);
    }

    private procesarExcepcion(excepcion: unknown): {
        status: number;
        mensaje: string;
        codigo: string;
        errores?: string[];
    } {
        // Errores de rate limiting (ThrottlerException)
        if (excepcion instanceof ThrottlerException) {
            return {
                status: HttpStatus.TOO_MANY_REQUESTS,
                mensaje: MENSAJES_ERROR.DEMASIADAS_SOLICITUDES,
                codigo: 'DEMASIADAS_SOLICITUDES',
            };
        }

        // Errores HTTP de NestJS
        if (excepcion instanceof HttpException) {
            return this.procesarHttpException(excepcion);
        }

        // Errores de Prisma (BD)
        if (excepcion instanceof Prisma.PrismaClientKnownRequestError) {
            return this.procesarErrorPrisma(excepcion);
        }

        if (excepcion instanceof Prisma.PrismaClientValidationError) {
            return {
                status: HttpStatus.BAD_REQUEST,
                mensaje: MENSAJES_ERROR.DATOS_INVALIDOS,
                codigo: 'ERROR_VALIDACION_BD',
            };
        }

        if (excepcion instanceof Prisma.PrismaClientInitializationError) {
            return {
                status: HttpStatus.SERVICE_UNAVAILABLE,
                mensaje: MENSAJES_ERROR.SERVICIO_NO_DISPONIBLE,
                codigo: 'SERVICIO_NO_DISPONIBLE',
            };
        }

        // Error genérico no controlado
        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            mensaje: MENSAJES_ERROR.ERROR_INTERNO,
            codigo: 'ERROR_INTERNO',
        };
    }

    private procesarHttpException(excepcion: HttpException): {
        status: number;
        mensaje: string;
        codigo: string;
        errores?: string[];
    } {
        const status = excepcion.getStatus();
        const respuestaExcepcion = excepcion.getResponse();
        let mensaje: string = MENSAJES_ERROR.ERROR_INTERNO;
        let codigo = 'ERROR_HTTP';
        let errores: string[] | undefined;

        if (typeof respuestaExcepcion === 'string') {
            mensaje = respuestaExcepcion;
        } else if (typeof respuestaExcepcion === 'object') {
            const respuestaObj = respuestaExcepcion as Record<string, unknown>;
            mensaje = (respuestaObj.message as string) || mensaje;
            codigo = (respuestaObj.error as string) || codigo;

            if (Array.isArray(respuestaObj.message)) {
                errores = respuestaObj.message;
                mensaje = MENSAJES_ERROR.DATOS_INVALIDOS;
            }
        }

        return {
            status,
            mensaje,
            codigo: this.obtenerCodigoError(status, codigo),
            errores,
        };
    }

    private procesarErrorPrisma(error: Prisma.PrismaClientKnownRequestError): {
        status: number;
        mensaje: string;
        codigo: string;
    } {
        const mapeoPrisma: Record<string, { status: number; mensaje: string; codigo: string }> = {
            P2002: {
                status: HttpStatus.CONFLICT,
                mensaje: 'El registro ya existe con los datos proporcionados',
                codigo: 'REGISTRO_DUPLICADO',
            },
            P2003: {
                status: HttpStatus.BAD_REQUEST,
                mensaje: 'Referencia a un registro que no existe',
                codigo: 'REFERENCIA_INVALIDA',
            },
            P2025: {
                status: HttpStatus.NOT_FOUND,
                mensaje: MENSAJES_ERROR.RECURSO_NO_ENCONTRADO,
                codigo: 'NO_ENCONTRADO',
            },
            P2014: {
                status: HttpStatus.BAD_REQUEST,
                mensaje: 'La operación viola una restricción de integridad',
                codigo: 'RESTRICCION_INTEGRIDAD',
            },
        };

        return mapeoPrisma[error.code] || {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            mensaje: MENSAJES_ERROR.ERROR_INTERNO,
            codigo: `ERROR_BD_${error.code}`,
        };
    }

    private registrarError(
        request: Request,
        status: number,
        mensaje: string,
        excepcion: unknown,
        correlacionId?: string,
    ): void {
        const contexto = `[${correlacionId || 'sin-id'}] ${request.method} ${request.url} - ${status}`;

        if (status >= 500) {
            this.logger.error(
                `${contexto} - ${mensaje}`,
                excepcion instanceof Error && !this.esProduccion ? excepcion.stack : undefined,
            );
        } else if (status >= 400) {
            this.logger.warn(`${contexto} - ${mensaje}`);
        }
    }

    private sanitizarRuta(url: string): string {
        // Remover query params que podrían contener datos sensibles
        const [ruta] = url.split('?');
        return ruta;
    }

    private delegarAPortal(request: Request, status: number, excepcion: unknown): void {
        const url = request.url || '';

        try {
            if (url.includes('/admin') && this.manejadorAdmin) {
                this.manejadorAdmin.manejar(request, status, excepcion);
            } else if (url.includes('/colaborador') && this.manejadorColab) {
                this.manejadorColab.manejar(request, status, excepcion);
            }
        } catch (error) {
            this.logger.warn(`Error en manejador de portal: ${error}`);
        }
    }

    private obtenerCodigoError(status: number, codigoDefault: string): string {
        const codigosHttp: Record<number, string> = {
            400: 'SOLICITUD_INVALIDA',
            401: 'NO_AUTORIZADO',
            403: 'ACCESO_DENEGADO',
            404: 'NO_ENCONTRADO',
            409: 'CONFLICTO',
            415: 'CONTENT_TYPE_NO_SOPORTADO',
            422: 'ENTIDAD_NO_PROCESABLE',
            429: 'DEMASIADAS_SOLICITUDES',
            500: 'ERROR_INTERNO',
            503: 'SERVICIO_NO_DISPONIBLE',
        };

        return codigosHttp[status] || codigoDefault;
    }
}
