import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Req,
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
import { Request } from 'express';
import { MiTurnoService } from './mi-turno.service';
import { RegistrarEntradaDto, RegistrarSalidaDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';

@ApiTags('Colaboradores - Mi Turno')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('colaborador/mi-turno')
export class MiTurnoController {
    constructor(private readonly miTurnoService: MiTurnoService) {}

    @Get('hoy')
    @ApiOperation({
        summary: 'Obtener turno de hoy',
        description: 'Retorna el turno programado del colaborador para el día actual',
    })
    @ApiResponse({ status: 200, description: 'Turno obtenido correctamente' })
    async obtenerTurnoHoy(@UsuarioActual('id') usuarioId: number) {
        return this.miTurnoService.obtenerTurnoHoy(usuarioId);
    }

    @Get('historial')
    @ApiOperation({
        summary: 'Obtener historial de turnos',
        description: 'Lista el historial de turnos del colaborador con paginación',
    })
    @ApiQuery({ name: 'pagina', required: false, type: Number })
    @ApiQuery({ name: 'limite', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Historial obtenido correctamente' })
    async obtenerHistorial(
        @UsuarioActual('id') usuarioId: number,
        @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
        @Query('limite', new DefaultValuePipe(10), ParseIntPipe) limite: number,
    ) {
        return this.miTurnoService.obtenerHistorialTurnos(usuarioId, pagina, limite);
    }

    @Get('resumen-semanal')
    @ApiOperation({
        summary: 'Obtener resumen semanal',
        description: 'Retorna el resumen de turnos de la semana actual con estadísticas',
    })
    @ApiResponse({ status: 200, description: 'Resumen obtenido correctamente' })
    async obtenerResumenSemanal(@UsuarioActual('id') usuarioId: number) {
        return this.miTurnoService.obtenerResumenSemanal(usuarioId);
    }

    @Post('entrada')
    @ApiOperation({
        summary: 'Registrar entrada',
        description: 'Registra la hora de entrada del colaborador al turno programado',
    })
    @ApiResponse({ status: 200, description: 'Entrada registrada correctamente' })
    @ApiResponse({ status: 404, description: 'No hay turno programado' })
    async registrarEntrada(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: RegistrarEntradaDto,
        @Req() request: Request,
    ) {
        const ip = request.ip || request.connection?.remoteAddress || '';
        return this.miTurnoService.registrarEntrada(usuarioId, ip, dto.notas);
    }

    @Post('salida')
    @ApiOperation({
        summary: 'Registrar salida',
        description: 'Registra la hora de salida del colaborador y finaliza el turno',
    })
    @ApiResponse({ status: 200, description: 'Salida registrada correctamente' })
    @ApiResponse({ status: 404, description: 'No hay turno en curso' })
    async registrarSalida(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: RegistrarSalidaDto,
        @Req() request: Request,
    ) {
        const ip = request.ip || request.connection?.remoteAddress || '';
        return this.miTurnoService.registrarSalida(usuarioId, ip, dto.notas);
    }

    @Get('actividad')
    @ApiOperation({
        summary: 'Obtener actividad del turno',
        description: 'Lista las operaciones de inventario realizadas durante el turno actual',
    })
    @ApiQuery({ name: 'turnoId', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Actividad obtenida correctamente' })
    async obtenerActividad(
        @UsuarioActual('id') usuarioId: number,
        @Query('turnoId') turnoId?: string,
    ) {
        const id = turnoId ? parseInt(turnoId, 10) : undefined;
        return this.miTurnoService.obtenerActividadTurno(usuarioId, id);
    }
}
