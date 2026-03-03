import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { DashboardColaboradorService } from './dashboard-colaborador.service';
import { JwtAuthGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';

@ApiTags('Colaboradores - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('colaborador/dashboard')
export class DashboardColaboradorController {
    constructor(
        private readonly dashboardService: DashboardColaboradorService,
    ) {}

    @Get('resumen')
    @ApiOperation({
        summary: 'Obtener resumen del dashboard',
        description: 'Retorna las tarjetas de resumen con estadísticas del colaborador',
    })
    @ApiResponse({ status: 200, description: 'Resumen obtenido correctamente' })
    async obtenerResumen(@UsuarioActual('id') usuarioId: number) {
        return this.dashboardService.obtenerResumen(usuarioId);
    }

    @Get('actividad-reciente')
    @ApiOperation({
        summary: 'Obtener actividad reciente del colaborador',
        description: 'Lista las últimas actividades de inventario del colaborador',
    })
    @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Cantidad de actividades a retornar' })
    @ApiResponse({ status: 200, description: 'Actividades obtenidas correctamente' })
    async obtenerActividadReciente(
        @UsuarioActual('id') usuarioId: number,
        @Query('limite', new DefaultValuePipe(10), ParseIntPipe) limite: number,
    ) {
        return this.dashboardService.obtenerActividadReciente(usuarioId, limite);
    }

    @Get('tareas-dia')
    @ApiOperation({
        summary: 'Obtener tareas del día',
        description: 'Retorna los turnos y conteos programados para hoy',
    })
    @ApiResponse({ status: 200, description: 'Tareas obtenidas correctamente' })
    async obtenerTareasDia(@UsuarioActual('id') usuarioId: number) {
        return this.dashboardService.obtenerTareasDia(usuarioId);
    }

    @Get('turno-actual')
    @ApiOperation({
        summary: 'Obtener turno actual del colaborador',
        description: 'Retorna información del turno activo o próximo del día',
    })
    @ApiResponse({ status: 200, description: 'Turno obtenido correctamente' })
    async obtenerTurnoActual(@UsuarioActual('id') usuarioId: number) {
        return this.dashboardService.obtenerTurnoActual(usuarioId);
    }

    @Get('notificaciones')
    @ApiOperation({
        summary: 'Obtener notificaciones recientes',
        description: 'Lista las notificaciones más recientes del colaborador',
    })
    @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Cantidad de notificaciones a retornar' })
    @ApiResponse({ status: 200, description: 'Notificaciones obtenidas correctamente' })
    async obtenerNotificaciones(
        @UsuarioActual('id') usuarioId: number,
        @Query('limite', new DefaultValuePipe(5), ParseIntPipe) limite: number,
    ) {
        return this.dashboardService.obtenerNotificacionesRecientes(usuarioId, limite);
    }
}
