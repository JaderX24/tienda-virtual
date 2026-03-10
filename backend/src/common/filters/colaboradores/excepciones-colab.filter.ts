import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Manejador de excepciones para el portal de colaboradores.
 * Registra eventos de seguridad en colabBitacoraSeguridad
 * para rutas /colaborador/*.
 */
@Injectable()
export class ManejadorExcepcionesColab {
    private readonly logger = new Logger('EXCEPCIONES_COLABORADOR');

    constructor(private readonly prisma: PrismaService) {}

    manejar(request: Request, status: number, excepcion: unknown): void {
        if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
            this.registrarEventoSeguridad(request, status).catch((error) => {
                this.logger.warn(`Error al registrar bitácora colab: ${error.message}`);
            });
        }

        if (status >= 500) {
            const correlacionId = request.headers['x-correlacion-id'] || 'sin-id';
            this.logger.error(
                `[${correlacionId}] ERROR_CRITICO_COLAB: ${request.method} ${request.url} - ` +
                `Status: ${status} - IP: ${request.ip}`,
            );
        }
    }

    private async registrarEventoSeguridad(
        request: Request,
        status: number,
    ): Promise<void> {
        const usuario = request['user'] as { id?: number } | undefined;
        const correlacionId = request.headers['x-correlacion-id'] || 'sin-id';

        const tipoEvento = status === HttpStatus.UNAUTHORIZED
            ? 'ACCESO_NO_AUTORIZADO'
            : 'ACCESO_DENEGADO';

        this.logger.warn(
            `[${correlacionId}] SEGURIDAD_COLAB: ${request.method} ${request.url} - ` +
            `Status: ${status} - Usuario: ${usuario?.id || 'anónimo'} - IP: ${request.ip}`,
        );

        try {
            await this.prisma.colabBitacoraSeguridad.create({
                data: {
                    usuarioId: usuario?.id ?? null,
                    tipoEvento,
                    descripcion: `${request.method} ${request.url}`,
                    ipAddress: request.ip || 'desconocida',
                    userAgent: request.get('user-agent') || 'desconocido',
                    severidad: 'warn',
                },
            });
        } catch (error) {
            this.logger.error(`Error al guardar bitácora de seguridad colab: ${error}`);
        }
    }
}
