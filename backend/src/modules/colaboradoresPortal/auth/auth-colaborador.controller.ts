import {
    Controller,
    Post,
    Body,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
    Get,
    Delete,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthColaboradorService } from './auth-colaborador.service';
import { LoginColaboradorDto } from './dto';
import { JwtColaboradorGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';

@ApiTags('Colaboradores - Autenticación')
@Controller('colaborador/auth')
export class AuthColaboradorController {
    constructor(
        private readonly authService: AuthColaboradorService,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Iniciar sesión de colaborador',
        description: 'Autentica un colaborador y retorna tokens de acceso',
    })
    @ApiBody({ type: LoginColaboradorDto })
    @ApiResponse({
        status: 200,
        description: 'Inicio de sesión exitoso o fallido (ver campo exito)',
    })
    async login(@Body() loginDto: LoginColaboradorDto, @Req() request: Request) {
        const ip = request.ip || request.connection?.remoteAddress || '';
        const userAgent = request.headers['user-agent'];

        try {
            return await this.authService.login(loginDto, ip, userAgent);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return {
                    exito: false,
                    mensaje: error.message || 'Credenciales incorrectas',
                    codigo: 'CREDENCIALES_INVALIDAS',
                };
            }
            if (error instanceof BadRequestException) {
                const response = error.getResponse() as any;
                return {
                    exito: false,
                    mensaje: response.message || 'Datos inválidos',
                    codigo: 'SOLICITUD_INVALIDA',
                    errores: Array.isArray(response.message) ? response.message : [response.message],
                };
            }
            return {
                exito: false,
                mensaje: 'Error al procesar la solicitud',
                codigo: 'ERROR_INTERNO',
            };
        }
    }

    @Post('verificar-2fa')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verificar código 2FA',
        description: 'Verifica el código de doble factor durante el proceso de login',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                token2FA: { type: 'string' },
                codigo: { type: 'string', minLength: 6, maxLength: 6 },
            },
            required: ['token2FA', 'codigo'],
        },
    })
    async verificar2FA(
        @Body('token2FA') token2FA: string,
        @Body('codigo') codigo: string,
    ) {
        if (!token2FA || !codigo || codigo.length !== 6) {
            return {
                exito: false,
                mensaje: 'Datos de verificación inválidos',
                codigo: 'DATOS_INVALIDOS',
            };
        }

        try {
            return await this.authService.verificar2FA(token2FA, codigo);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return {
                    exito: false,
                    mensaje: error.message,
                    codigo: 'VERIFICACION_FALLIDA',
                };
            }
            return {
                exito: false,
                mensaje: 'Error al verificar el código',
                codigo: 'ERROR_INTERNO',
            };
        }
    }

    @Post('reenviar-2fa')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reenviar código 2FA por correo',
        description: 'Reenvía el código de verificación al correo del colaborador',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                token2FA: { type: 'string' },
            },
            required: ['token2FA'],
        },
    })
    async reenviarCodigo2FA(@Body('token2FA') token2FA: string) {
        if (!token2FA) {
            return { exito: false, mensaje: 'Token requerido' };
        }

        try {
            return await this.authService.reenviarCodigo2FA(token2FA);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return { exito: false, mensaje: error.message };
            }
            return { exito: false, mensaje: 'Error al reenviar el código' };
        }
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtColaboradorGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Cerrar sesión del colaborador',
        description: 'Invalida la sesión actual del colaborador',
    })
    @ApiResponse({
        status: 200,
        description: 'Sesión cerrada correctamente',
    })
    async logout(
        @UsuarioActual('id') usuarioId: number,
        @Req() request: Request,
    ) {
        const token = request.headers.authorization?.replace('Bearer ', '') || '';
        return this.authService.cerrarSesion(usuarioId, token);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refrescar token de acceso del colaborador',
        description: 'Obtiene un nuevo access token usando el refresh token',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                refreshToken: { type: 'string' },
            },
            required: ['refreshToken'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Token refrescado exitosamente',
    })
    async refrescarToken(@Body('refreshToken') refreshToken: string) {
        return this.authService.refrescarToken(refreshToken);
    }

    @Get('sesiones')
    @UseGuards(JwtColaboradorGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Obtener sesiones activas del colaborador',
        description: 'Lista todas las sesiones activas del colaborador actual',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de sesiones activas',
    })
    async obtenerSesiones(@UsuarioActual('id') usuarioId: number) {
        return this.authService.obtenerSesionesActivas(usuarioId);
    }

    @Delete('sesiones')
    @UseGuards(JwtColaboradorGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Cerrar todas las sesiones del colaborador',
        description: 'Invalida todas las sesiones activas del colaborador',
    })
    @ApiResponse({
        status: 200,
        description: 'Todas las sesiones cerradas',
    })
    async cerrarTodasLasSesiones(@UsuarioActual('id') usuarioId: number) {
        return this.authService.cerrarTodasLasSesiones(usuarioId);
    }
}
