import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';
import { MiPerfilColaboradorService } from './mi-perfil.service';
import {
    ActualizarPerfilDto,
    CambiarContrasenaDto,
    ActualizarPreferenciasDto,
    ActualizarSeguridadDto,
} from './dto';

@Controller('colaborador/mi-perfil')
@UseGuards(JwtAuthGuard)
export class MiPerfilColaboradorController {
    constructor(private readonly miPerfilService: MiPerfilColaboradorService) {}

    @Get()
    obtenerPerfil(@UsuarioActual('id') usuarioId: number) {
        return this.miPerfilService.obtenerPerfil(usuarioId);
    }

    @Get('seguridad/resumen')
    obtenerResumenSeguridad(@UsuarioActual('id') usuarioId: number) {
        return this.miPerfilService.obtenerResumenSeguridad(usuarioId);
    }

    @Get('sesiones')
    obtenerSesionesActivas(@UsuarioActual('id') usuarioId: number) {
        return this.miPerfilService.obtenerSesionesActivas(usuarioId);
    }

    @Get('dispositivos')
    obtenerDispositivos(@UsuarioActual('id') usuarioId: number) {
        return this.miPerfilService.obtenerDispositivos(usuarioId);
    }

    @Get('preferencias')
    obtenerPreferencias(@UsuarioActual('id') usuarioId: number) {
        return this.miPerfilService.obtenerPreferencias(usuarioId);
    }

    @Patch('informacion')
    actualizarPerfil(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: ActualizarPerfilDto,
    ) {
        return this.miPerfilService.actualizarPerfil(usuarioId, dto);
    }

    @Patch('contrasena')
    cambiarContrasena(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: CambiarContrasenaDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket?.remoteAddress;
        return this.miPerfilService.cambiarContrasena(usuarioId, dto, ip);
    }

    @Patch('preferencias')
    actualizarPreferencias(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: ActualizarPreferenciasDto,
    ) {
        return this.miPerfilService.actualizarPreferencias(usuarioId, dto);
    }

    @Patch('seguridad')
    actualizarSeguridad(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: ActualizarSeguridadDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket?.remoteAddress;
        return this.miPerfilService.actualizarSeguridad(usuarioId, dto, ip);
    }

    @Delete('sesiones/:id')
    cerrarSesion(
        @UsuarioActual('id') usuarioId: number,
        @Param('id', ParseIntPipe) sesionId: number,
    ) {
        return this.miPerfilService.cerrarSesion(usuarioId, sesionId);
    }

    @Delete('sesiones')
    cerrarTodasLasSesiones(@UsuarioActual('id') usuarioId: number) {
        return this.miPerfilService.cerrarTodasLasSesiones(usuarioId);
    }

    @Delete('dispositivos/:id')
    eliminarDispositivo(
        @UsuarioActual('id') usuarioId: number,
        @Param('id', ParseIntPipe) dispositivoId: number,
    ) {
        return this.miPerfilService.eliminarDispositivo(usuarioId, dispositivoId);
    }
}
