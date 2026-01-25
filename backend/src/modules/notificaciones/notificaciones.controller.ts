import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../../common/guards';
import { UsuarioActual, ApiOperacionProtegida } from '../../common/decorators';
import { ParsearIdPipe } from '../../common/pipes';

@ApiTags('Notificaciones')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
    constructor(private readonly notificacionesService: NotificacionesService) {}

    @Get()
    @ApiOperacionProtegida('Mis notificaciones', 'Obtiene las notificaciones del usuario')
    @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
    async obtenerMisNotificaciones(
        @UsuarioActual('id') usuarioId: number,
        @Query('soloNoLeidas') soloNoLeidas?: boolean,
        @Query('pagina') pagina?: number,
        @Query('limite') limite?: number,
    ) {
        return this.notificacionesService.obtenerPorUsuario(usuarioId, { soloNoLeidas, pagina, limite });
    }

    @Get('contador')
    @ApiOperacionProtegida('Contar no leídas', 'Cuenta las notificaciones no leídas')
    @ApiResponse({ status: 200, description: 'Cantidad de no leídas' })
    async contarNoLeidas(@UsuarioActual('id') usuarioId: number) {
        return this.notificacionesService.contarNoLeidas(usuarioId);
    }

    @Post(':id/leer')
    @ApiOperacionProtegida('Marcar como leída', 'Marca una notificación como leída')
    @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
    async marcarComoLeida(
        @Param('id', ParsearIdPipe) id: number,
        @UsuarioActual('id') usuarioId: number,
    ) {
        return this.notificacionesService.marcarComoLeida(id, usuarioId);
    }

    @Post('leer-todas')
    @ApiOperacionProtegida('Marcar todas como leídas', 'Marca todas las notificaciones como leídas')
    @ApiResponse({ status: 200, description: 'Notificaciones marcadas como leídas' })
    async marcarTodasComoLeidas(@UsuarioActual('id') usuarioId: number) {
        return this.notificacionesService.marcarTodasComoLeidas(usuarioId);
    }

    @Delete(':id')
    @ApiOperacionProtegida('Eliminar notificación', 'Elimina una notificación')
    @ApiResponse({ status: 200, description: 'Notificación eliminada' })
    async eliminar(
        @Param('id', ParsearIdPipe) id: number,
        @UsuarioActual('id') usuarioId: number,
    ) {
        return this.notificacionesService.eliminar(id, usuarioId);
    }
}
