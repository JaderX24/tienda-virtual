import {
    Controller,
    Get,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';
import { ReportesColaboradorService } from './reportes.service';
import { FiltrosReporteDto, FiltrosExportarDto } from './dto';

@Controller('colaborador/reportes')
@UseGuards(JwtAuthGuard)
export class ReportesColaboradorController {
    constructor(private readonly reportesService: ReportesColaboradorService) {}

    @Get('resumen')
    obtenerResumen(@Query() filtros: FiltrosReporteDto) {
        return this.reportesService.obtenerResumenInventario(filtros);
    }

    @Get('movimientos')
    obtenerMovimientos(@Query() filtros: FiltrosReporteDto) {
        return this.reportesService.obtenerMovimientos(filtros);
    }

    @Get('stock-critico')
    obtenerStockCritico(@Query() filtros: FiltrosReporteDto) {
        return this.reportesService.obtenerStockCritico(filtros);
    }

    @Get('mi-actividad')
    obtenerMiActividad(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: FiltrosReporteDto,
    ) {
        return this.reportesService.obtenerMiActividad(usuarioId, filtros);
    }

    @Get('movimientos-por-categoria')
    obtenerMovimientosPorCategoria(@Query() filtros: FiltrosReporteDto) {
        return this.reportesService.obtenerMovimientosPorCategoria(filtros);
    }

    @Get('exportar/movimientos')
    async exportarMovimientos(
        @Query() filtros: FiltrosExportarDto,
        @Res() res: Response,
    ) {
        const csv = await this.reportesService.exportarMovimientosCsv(filtros);
        const nombreArchivo = `movimientos_${this.obtenerFechaArchivo()}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.send(csv);
    }

    @Get('exportar/stock-critico')
    async exportarStockCritico(@Res() res: Response) {
        const csv = await this.reportesService.exportarStockCriticoCsv();
        const nombreArchivo = `stock_critico_${this.obtenerFechaArchivo()}.csv`;

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
