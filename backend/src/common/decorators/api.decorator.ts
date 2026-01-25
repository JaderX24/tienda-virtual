import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiOperacionProtegida(resumen: string, descripcion?: string) {
    return applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({ summary: resumen, description: descripcion }),
        ApiResponse({ status: 401, description: 'No autorizado' }),
        ApiResponse({ status: 403, description: 'Acceso denegado' }),
    );
}

export function ApiOperacionPublica(resumen: string, descripcion?: string) {
    return applyDecorators(
        ApiOperation({ summary: resumen, description: descripcion }),
    );
}

export function ApiRespuestaCreada(descripcion = 'Recurso creado exitosamente') {
    return ApiResponse({ status: 201, description: descripcion });
}

export function ApiRespuestaExitosa(descripcion = 'Operación exitosa') {
    return ApiResponse({ status: 200, description: descripcion });
}

export function ApiRespuestaNoEncontrado(descripcion = 'Recurso no encontrado') {
    return ApiResponse({ status: 404, description: descripcion });
}

export function ApiRespuestaValidacion(descripcion = 'Error de validación') {
    return ApiResponse({ status: 400, description: descripcion });
}
