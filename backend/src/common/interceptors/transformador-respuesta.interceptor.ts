import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RespuestaEstandar<T> {
    exito: boolean;
    mensaje?: string;
    datos: T;
    meta?: {
        total?: number;
        pagina?: number;
        limite?: number;
        totalPaginas?: number;
    };
}

@Injectable()
export class TransformadorRespuestaInterceptor<T>
    implements NestInterceptor<T, RespuestaEstandar<T>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<RespuestaEstandar<T>> {
        return next.handle().pipe(
            map((datos) => {
                // Si ya tiene el formato estándar, retornarlo
                if (datos && typeof datos === 'object' && 'exito' in datos) {
                    return datos;
                }

                // Formatear respuesta estándar
                return {
                    exito: true,
                    datos,
                };
            }),
        );
    }
}
