import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MENSAJES_ERROR } from '../constants/mensajes.constant';

interface RespuestaError {
    exito: boolean;
    mensaje: string;
    codigo: string;
    timestamp: string;
    ruta: string;
    errores?: string[];
}

@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
    private readonly logger = new Logger(FiltroExcepcionesGlobal.name);

    catch(excepcion: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let mensaje: string = MENSAJES_ERROR.ERROR_INTERNO;
        let codigo = 'ERROR_INTERNO';
        let errores: string[] | undefined;

        if (excepcion instanceof HttpException) {
            status = excepcion.getStatus();
            const respuestaExcepcion = excepcion.getResponse();

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
        }

        // Registrar error técnico (sin datos sensibles)
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${mensaje}`,
            excepcion instanceof Error ? excepcion.stack : undefined,
        );

        const respuestaError: RespuestaError = {
            exito: false,
            mensaje,
            codigo: this.obtenerCodigoError(status, codigo),
            timestamp: new Date().toISOString(),
            ruta: request.url,
        };

        if (errores) {
            respuestaError.errores = errores;
        }

        response.status(status).json(respuestaError);
    }

    private obtenerCodigoError(status: number, codigoDefault: string): string {
        const codigosHttp: Record<number, string> = {
            400: 'SOLICITUD_INVALIDA',
            401: 'NO_AUTORIZADO',
            403: 'ACCESO_DENEGADO',
            404: 'NO_ENCONTRADO',
            409: 'CONFLICTO',
            422: 'ENTIDAD_NO_PROCESABLE',
            429: 'DEMASIADAS_SOLICITUDES',
            500: 'ERROR_INTERNO',
            503: 'SERVICIO_NO_DISPONIBLE',
        };

        return codigosHttp[status] || codigoDefault;
    }
}
