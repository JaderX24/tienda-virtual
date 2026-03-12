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
    ForbiddenException,
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
import { InicioSesionAdministrativoService } from './inicio-sesion-administrativo.service';
import { LoginAdminDto, RespuestaLoginAdminDto, RespuestaErrorLoginDto } from './dto';
import { JwtAdminGuard } from '../../../../common/guards';
import { UsuarioActual } from '../../../../common/decorators';

@ApiTags('Admin - Autenticación')
@Controller('admin/auth')
export class InicioSesionAdministrativoController {
    constructor(
        private readonly authService: InicioSesionAdministrativoService,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Iniciar sesión administrativa',
        description: 'Autentica un usuario administrativo y retorna tokens de acceso',
    })
    @ApiBody({ type: LoginAdminDto })
    @ApiResponse({
        status: 200,
        description: 'Inicio de sesión exitoso o fallido (ver campo exito)',
        type: RespuestaLoginAdminDto,
    })
    async login(@Body() loginDto: LoginAdminDto, @Req() request: Request) {
        const ip = request.ip || request.connection?.remoteAddress;
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
            if (error instanceof ForbiddenException) {
                return {
                    exito: false,
                    mensaje: error.message || 'No tiene permisos para acceder',
                    codigo: 'ACCESO_DENEGADO',
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

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAdminGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Cerrar sesión',
        description: 'Invalida la sesión actual del usuario',
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

    @Get('perfil')
    @UseGuards(JwtAdminGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Obtener perfil actualizado',
        description: 'Retorna los datos del usuario, permisos actualizados y menú dinámico filtrado por permisos',
    })
    @ApiResponse({
        status: 200,
        description: 'Perfil con permisos y menú actualizados',
    })
    async obtenerPerfil(@UsuarioActual('id') usuarioId: number) {
        return this.authService.obtenerPerfil(usuarioId);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refrescar token de acceso',
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
    @ApiResponse({
        status: 401,
        description: 'Token de refresco inválido o expirado',
    })
    async refrescarToken(@Body('refreshToken') refreshToken: string) {
        return this.authService.refrescarToken(refreshToken);
    }

    @Get('sesiones')
    @UseGuards(JwtAdminGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Obtener sesiones activas',
        description: 'Lista todas las sesiones activas del usuario actual',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de sesiones activas',
    })
    async obtenerSesiones(@UsuarioActual('id') usuarioId: number) {
        return this.authService.obtenerSesionesActivas(usuarioId);
    }

    @Delete('sesiones')
    @UseGuards(JwtAdminGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Cerrar todas las sesiones',
        description: 'Invalida todas las sesiones activas del usuario',
    })
    @ApiResponse({
        status: 200,
        description: 'Todas las sesiones cerradas',
    })
    async cerrarTodasLasSesiones(@UsuarioActual('id') usuarioId: number) {
        return this.authService.cerrarTodasLasSesiones(usuarioId);
    }
}
