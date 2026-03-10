import {
    Controller,
    Get,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtColaboradorGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';
import { MiActividadColaboradorService } from './mi-actividad.service';
import {
    FiltrosMiActividadDto,
    FiltrosBitacoraDto,
    FiltrosOperacionesDto,
} from './dto';

@Controller('colaborador/mi-actividad')
@UseGuards(JwtColaboradorGuard)
export class MiActividadColaboradorController {
    constructor(private readonly miActividadService: MiActividadColaboradorService) {}

    @Get('resumen')
    obtenerResumen(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosMiActividadDto,
    ) {
        return this.miActividadService.obtenerResumen(usuarioId, filtros);
    }

    @Get('bitacora')
    obtenerBitacora(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosBitacoraDto,
    ) {
        return this.miActividadService.obtenerBitacora(usuarioId, filtros);
    }

    @Get('operaciones')
    obtenerOperaciones(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosOperacionesDto,
    ) {
        return this.miActividadService.obtenerOperacionesInventario(usuarioId, filtros);
    }

    @Get('sesiones')
    obtenerSesiones(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosMiActividadDto,
    ) {
        return this.miActividadService.obtenerSesiones(usuarioId, filtros);
    }

    @Get('timeline')
    obtenerTimeline(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosMiActividadDto,
    ) {
        return this.miActividadService.obtenerTimeline(usuarioId, filtros);
    }

    @Get('exportar/bitacora')
    async exportarBitacora(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosBitacoraDto,
        @Res() res: Response,
    ) {
        const csv = await this.miActividadService.exportarBitacoraCsv(usuarioId, filtros);
        const nombreArchivo = `bitacora_${this.obtenerFechaArchivo()}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.send(csv);
    }

    @Get('exportar/operaciones')
    async exportarOperaciones(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosOperacionesDto,
        @Res() res: Response,
    ) {
        const csv = await this.miActividadService.exportarOperacionesCsv(usuarioId, filtros);
        const nombreArchivo = `operaciones_${this.obtenerFechaArchivo()}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.send(csv);
    }

    private obtenerFechaArchivo(): string {
        const ahora = new Date();
        const dia = String(ahora.getDate()).padStart(2, '0');
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const anio = ahora.getFullYear();
        return `${dia}-${mes}-${anio}`;
    }
}
