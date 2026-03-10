import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Limpia headers potencialmente maliciosos o inyectados por el cliente
 * que podrían ser utilizados para ataques de spoofing o inyección.
 */

const HEADERS_PROHIBIDOS = [
    'x-powered-by',
    'x-aspnet-version',
    'x-aspnetmvc-version',
    'server',
];

const TAMANO_MAXIMO_HEADER = 8192;

@Injectable()
export class SanitizarHeadersMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        for (const header of HEADERS_PROHIBIDOS) {
            delete req.headers[header];
        }

        for (const [clave, valor] of Object.entries(req.headers)) {
            if (typeof valor === 'string' && valor.length > TAMANO_MAXIMO_HEADER) {
                delete req.headers[clave];
            }
        }

        // Remover headers de respuesta que revelan información del servidor
        res.removeHeader('X-Powered-By');

        next();
    }
}
