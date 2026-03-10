import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtColaboradorGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';
import { InventarioService } from './inventario.service';
import {
    ConsultarStockDto,
    ConsultarOperacionesDto,
    CrearEntradaDto,
    CrearSalidaDto,
} from './dto';

@Controller('colaborador/inventario')
@UseGuards(JwtColaboradorGuard)
export class InventarioController {
    constructor(private readonly inventarioService: InventarioService) {}

    @Get('almacenes')
    obtenerAlmacenes(@UsuarioActual('id') usuarioId: number) {
        return this.inventarioService.obtenerAlmacenesAsignados(usuarioId);
    }

    @Get('productos/buscar')
    buscarProductos(
        @Query('busqueda') busqueda?: string,
        @Query('limite') limite?: string,
    ) {
        return this.inventarioService.buscarProductos(
            busqueda,
            limite ? parseInt(limite, 10) : 15,
        );
    }

    @Get('stock')
    obtenerStock(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: ConsultarStockDto,
    ) {
        return this.inventarioService.obtenerStockGeneral(usuarioId, filtros);
    }

    @Get('entradas')
    obtenerEntradas(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: ConsultarOperacionesDto,
    ) {
        return this.inventarioService.obtenerEntradas(usuarioId, filtros);
    }

    @Post('entradas')
    crearEntrada(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: CrearEntradaDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0';
        return this.inventarioService.crearEntrada(usuarioId, dto, ip);
    }

    @Get('salidas')
    obtenerSalidas(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: ConsultarOperacionesDto,
    ) {
        return this.inventarioService.obtenerSalidas(usuarioId, filtros);
    }

    @Post('salidas')
    crearSalida(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: CrearSalidaDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0';
        return this.inventarioService.crearSalida(usuarioId, dto, ip);
    }
}
