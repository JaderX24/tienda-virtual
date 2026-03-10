import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Registra las peticiones entrantes al portal de colaboradores
 * con datos relevantes para trazabilidad de sesiones.
 */
@Injectable()
export class RegistroPeticionColabMiddleware implements NestMiddleware {
    private readonly logger = new Logger('PETICION_COLABORADOR');

    use(req: Request, res: Response, next: NextFunction): void {
        if (!req.url?.startsWith('/api/v1/colaborador')) {
            return next();
        }

        const inicio = Date.now();
        const correlacionId = req.headers['x-correlacion-id'] || 'sin-id';

        res.on('finish', () => {
            const duracion = Date.now() - inicio;
            const nivel = res.statusCode >= 400 ? 'warn' : 'log';

            this.logger[nivel](
                `[${correlacionId}] ${req.method} ${req.url} ${res.statusCode} - ${duracion}ms - IP: ${req.ip}`,
            );
        });

        next();
    }
}
