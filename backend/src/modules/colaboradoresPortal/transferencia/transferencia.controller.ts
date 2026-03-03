import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';
import { TransferenciaService } from './transferencia.service';
import {
    CrearTransferenciaDto,
    ConsultarTransferenciasDto,
    ActualizarEstadoTransferenciaDto,
} from './dto';

@Controller('colaborador/transferencias')
@UseGuards(JwtAuthGuard)
export class TransferenciaController {
    constructor(private readonly transferenciaService: TransferenciaService) {}

    @Get('almacenes')
    obtenerAlmacenesDisponibles(@UsuarioActual('id') usuarioId: number) {
        return this.transferenciaService.obtenerAlmacenesDisponibles(usuarioId);
    }

    @Get()
    obtenerTransferencias(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: ConsultarTransferenciasDto,
    ) {
        return this.transferenciaService.obtenerTransferencias(usuarioId, filtros);
    }

    @Get(':id')
    obtenerDetalle(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
    ) {
        return this.transferenciaService.obtenerDetalle(usuarioId, id);
    }

    @Post()
    crearTransferencia(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: CrearTransferenciaDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0';
        return this.transferenciaService.crearTransferencia(usuarioId, dto, ip);
    }

    @Patch(':id/estado')
    actualizarEstado(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
        @Body() dto: ActualizarEstadoTransferenciaDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0';
        return this.transferenciaService.actualizarEstado(usuarioId, id, dto, ip);
    }
}
