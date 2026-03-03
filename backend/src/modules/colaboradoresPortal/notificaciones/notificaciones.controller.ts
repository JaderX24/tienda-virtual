import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';
import { NotificacionesColaboradorService } from './notificaciones.service';
import { FiltrosNotificacionesDto, MarcarLeidasDto } from './dto';

@Controller('colaborador/notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesColaboradorController {
    constructor(private readonly notificacionesService: NotificacionesColaboradorService) {}

    @Get()
    obtenerNotificaciones(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosNotificacionesDto,
    ) {
        return this.notificacionesService.obtenerNotificaciones(usuarioId, filtros);
    }

    @Get('recientes')
    obtenerRecientes(@UsuarioActual('id') usuarioId: number) {
        return this.notificacionesService.obtenerRecientes(usuarioId);
    }

    @Get('contador')
    obtenerContador(@UsuarioActual('id') usuarioId: number) {
        return this.notificacionesService.obtenerContadorSinLeer(usuarioId);
    }

    @Patch('marcar-todas-leidas')
    marcarTodasComoLeidas(@UsuarioActual('id') usuarioId: number) {
        return this.notificacionesService.marcarTodasComoLeidas(usuarioId);
    }

    @Patch('marcar-leidas')
    marcarSeleccionadasComoLeidas(
        @UsuarioActual('id') usuarioId: number,
        @Body() body: MarcarLeidasDto,
    ) {
        return this.notificacionesService.marcarSeleccionadasComoLeidas(usuarioId, body.ids || []);
    }

    @Patch('archivar-leidas')
    archivarTodasLeidas(@UsuarioActual('id') usuarioId: number) {
        return this.notificacionesService.archivarTodasLeidas(usuarioId);
    }

    @Patch(':id/leer')
    marcarComoLeida(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
    ) {
        return this.notificacionesService.marcarComoLeida(usuarioId, BigInt(id));
    }

    @Patch(':id/archivar')
    archivarNotificacion(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
    ) {
        return this.notificacionesService.archivarNotificacion(usuarioId, BigInt(id));
    }

    @Delete(':id')
    eliminarNotificacion(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
    ) {
        return this.notificacionesService.eliminarNotificacion(usuarioId, BigInt(id));
    }
}
