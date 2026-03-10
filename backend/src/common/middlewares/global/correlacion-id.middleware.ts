import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const HEADER_CORRELACION = 'x-correlacion-id';

@Injectable()
export class CorrelacionIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const correlacionId = (req.headers[HEADER_CORRELACION] as string) || this.generarId();

        req.headers[HEADER_CORRELACION] = correlacionId;
        res.setHeader(HEADER_CORRELACION, correlacionId);

        next();
    }

    private generarId(): string {
        return crypto.randomUUID();
    }
}
