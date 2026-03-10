import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const TIPOS_CONTENIDO_PERMITIDOS = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
];

@Injectable()
export class ValidarContentTypeMiddleware implements NestMiddleware {
    private readonly logger = new Logger('CONTENT_TYPE');

    use(req: Request, res: Response, next: NextFunction): void {
        // Solo validar en métodos que envían body
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.headers['content-type'] || '';

            const esValido = TIPOS_CONTENIDO_PERMITIDOS.some(
                (tipo) => contentType.toLowerCase().startsWith(tipo),
            );

            if (!esValido && contentType) {
                this.logger.warn(
                    `Content-Type no permitido: ${contentType} - ${req.method} ${req.url} - IP: ${req.ip}`,
                );
                res.status(415).json({
                    exito: false,
                    mensaje: 'Tipo de contenido no soportado',
                    codigo: 'CONTENT_TYPE_NO_SOPORTADO',
                });
                return;
            }
        }

        next();
    }
}
