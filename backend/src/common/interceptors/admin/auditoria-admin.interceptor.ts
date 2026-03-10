import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const METODOS_MUTACION = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditoriaAdminInterceptor implements NestInterceptor {
    private readonly logger = new Logger('AUDITORIA_ADMIN');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip, body } = request;

        // Solo interceptar rutas del portal administrativo
        if (!url.startsWith('/admin')) {
            return next.handle();
        }

        if (!METODOS_MUTACION.includes(method)) {
            return next.handle();
        }

        const usuario = request.user;
        const inicio = Date.now();
        const controlador = context.getClass().name;
        const handler = context.getHandler().name;

        return next.handle().pipe(
            tap({
                next: () => {
                    const duracion = Date.now() - inicio;
                    const response = context.switchToHttp().getResponse();

                    this.logger.log(
                        JSON.stringify({
                            tipo: 'OPERACION_ADMIN',
                            metodo: method,
                            ruta: url,
                            controlador,
                            handler,
                            usuarioId: usuario?.id || null,
                            correo: usuario?.correo || null,
                            rol: usuario?.rol || null,
                            ip,
                            codigo: response.statusCode,
                            duracion: `${duracion}ms`,
                            cuerpo: this.sanitizarCuerpo(body),
                            fecha: new Date().toISOString(),
                        }),
                    );
                },
                error: (error) => {
                    const duracion = Date.now() - inicio;

                    this.logger.warn(
                        JSON.stringify({
                            tipo: 'ERROR_OPERACION_ADMIN',
                            metodo: method,
                            ruta: url,
                            controlador,
                            handler,
                            usuarioId: usuario?.id || null,
                            correo: usuario?.correo || null,
                            rol: usuario?.rol || null,
                            ip,
                            error: error.message,
                            codigo: error.status || 500,
                            duracion: `${duracion}ms`,
                            fecha: new Date().toISOString(),
                        }),
                    );
                },
            }),
        );
    }

    // Elimina campos sensibles del cuerpo antes de registrar
    private sanitizarCuerpo(cuerpo: Record<string, unknown>): Record<string, unknown> | null {
        if (!cuerpo || typeof cuerpo !== 'object') return null;

        const CAMPOS_SENSIBLES = [
            'contrasena', 'password', 'token', 'refreshToken',
            'secret', 'clave', 'tarjeta', 'cvv', 'pin',
        ];

        const cuerpoLimpio = { ...cuerpo };
        for (const campo of CAMPOS_SENSIBLES) {
            if (campo in cuerpoLimpio) {
                cuerpoLimpio[campo] = '***REDACTADO***';
            }
        }

        return cuerpoLimpio;
    }
}
