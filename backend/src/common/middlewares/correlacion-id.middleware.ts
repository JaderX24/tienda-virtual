import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorrelacionIdMiddleware implements NestMiddleware {
    private readonly logger = new Logger(CorrelacionIdMiddleware.name);

    use(req: Request, res: Response, next: NextFunction): void {
        const correlacionId = req.headers['x-correlacion-id'] || this.generarId();
        
        req.headers['x-correlacion-id'] = correlacionId as string;
        res.setHeader('x-correlacion-id', correlacionId);

        next();
    }

    private generarId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
