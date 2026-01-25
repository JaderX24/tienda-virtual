import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegistroDto, RefreshTokenDto, CambiarContrasenaDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { Publico, UsuarioActual, ApiOperacionPublica, ApiOperacionProtegida } from '../../common/decorators';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @Publico()
    @HttpCode(HttpStatus.OK)
    @ApiOperacionPublica('Iniciar sesión', 'Autentica un usuario con correo y contraseña')
    @ApiResponse({ status: 200, description: 'Login exitoso' })
    @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('registro')
    @Publico()
    @ApiOperacionPublica('Registrar nuevo usuario', 'Crea una nueva cuenta de usuario')
    @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
    @ApiResponse({ status: 409, description: 'El correo ya está registrado' })
    async registro(@Body() registroDto: RegistroDto) {
        return this.authService.registro(registroDto);
    }

    @Post('refresh')
    @Publico()
    @HttpCode(HttpStatus.OK)
    @ApiOperacionPublica('Actualizar token', 'Genera nuevos tokens usando el refresh token')
    @ApiResponse({ status: 200, description: 'Tokens actualizados' })
    @ApiResponse({ status: 401, description: 'Refresh token inválido' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Post('cambiar-contrasena')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperacionProtegida('Cambiar contraseña', 'Permite al usuario cambiar su contraseña')
    @ApiResponse({ status: 200, description: 'Contraseña cambiada exitosamente' })
    @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
    async cambiarContrasena(
        @UsuarioActual('id') usuarioId: number,
        @Body() cambiarContrasenaDto: CambiarContrasenaDto,
    ) {
        return this.authService.cambiarContrasena(usuarioId, cambiarContrasenaDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperacionProtegida('Cerrar sesión', 'Cierra la sesión del usuario')
    @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
    async logout(@UsuarioActual('id') usuarioId: number) {
        return this.authService.logout(usuarioId);
    }
}
