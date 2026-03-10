import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request } from 'express';

/**
 * Manejador de excepciones para el portal administrativo.
 * Registra eventos de seguridad (acceso denegado, no autorizado)
 * con contexto de auditoría para rutas /admin/*.
 */
@Injectable()
export class ManejadorExcepcionesAdmin {
    private readonly logger = new Logger('EXCEPCIONES_ADMIN');

    manejar(request: Request, status: number, excepcion: unknown): void {
        if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
            const usuario = request['user'] as { id?: number; correo?: string } | undefined;
            const correlacionId = request.headers['x-correlacion-id'] || 'sin-id';

            this.logger.warn(
                `[${correlacionId}] SEGURIDAD_ADMIN: ${request.method} ${request.url} - ` +
                `Status: ${status} - Usuario: ${usuario?.id || 'anónimo'} - IP: ${request.ip}`,
            );
        }

        if (status >= 500) {
            const correlacionId = request.headers['x-correlacion-id'] || 'sin-id';
            this.logger.error(
                `[${correlacionId}] ERROR_CRITICO_ADMIN: ${request.method} ${request.url} - ` +
                `Status: ${status} - IP: ${request.ip}`,
            );
        }
    }
}
