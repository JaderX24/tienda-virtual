import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../../prisma/prisma.service';
import { hashearToken } from '../../utils';

// Intervalo mínimo entre actualizaciones por sesión (60 segundos)
const INTERVALO_ACTUALIZACION_MS = 60 * 1000;

@Injectable()
export class ActividadSesionInterceptor implements NestInterceptor {
    private readonly logger = new Logger('ACTIVIDAD_COLABORADOR');
    private ultimaActualizacion: Map<string, number> = new Map();

    constructor(private readonly prisma: PrismaService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();

        // Solo interceptar rutas del portal de colaboradores
        if (!request.url?.startsWith('/colaborador')) {
            return next.handle();
        }

        return next.handle().pipe(
            tap({
                next: () => {
                    this.actualizarActividad(request).catch((error) => {
                        this.logger.warn(`Error al actualizar actividad de sesión: ${error.message}`);
                    });
                },
            }),
        );
    }

    private async actualizarActividad(request: any): Promise<void> {
        const authHeader = request.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) return;

        const token = authHeader.substring(7);
        const tokenHash = hashearToken(token);

        // Evitar actualizaciones excesivas a BD (máximo 1 vez por minuto por sesión)
        const ahora = Date.now();
        const ultimaVez = this.ultimaActualizacion.get(tokenHash) || 0;

        if (ahora - ultimaVez < INTERVALO_ACTUALIZACION_MS) return;

        this.ultimaActualizacion.set(tokenHash, ahora);

        await this.prisma.colabSesion.updateMany({
            where: {
                tokenHash,
                esActiva: true,
            },
            data: {
                ultimaActividad: new Date(),
            },
        });

        // Limpiar entradas viejas del caché para evitar fugas de memoria
        if (this.ultimaActualizacion.size > 1000) {
            const limite = ahora - INTERVALO_ACTUALIZACION_MS * 10;
            for (const [key, valor] of this.ultimaActualizacion.entries()) {
                if (valor < limite) {
                    this.ultimaActualizacion.delete(key);
                }
            }
        }
    }
}
