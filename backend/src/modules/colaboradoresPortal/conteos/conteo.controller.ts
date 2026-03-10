import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtColaboradorGuard } from '../../../common/guards';
import { UsuarioActual } from '../../../common/decorators';
import { ConteoService } from './conteo.service';
import {
    CrearConteoDto,
    ConsultarConteosDto,
    RegistrarDetalleConteoDto,
    RegistrarDetallesLoteDto,
    ActualizarEstadoConteoDto,
} from './dto';

@Controller('colaborador/conteos')
@UseGuards(JwtColaboradorGuard)
export class ConteoController {
    constructor(private readonly conteoService: ConteoService) {}

    @Get('resumen')
    obtenerResumen(@UsuarioActual('id') usuarioId: number) {
        return this.conteoService.obtenerResumen(usuarioId);
    }

    @Get('almacenes')
    obtenerAlmacenes(@UsuarioActual('id') usuarioId: number) {
        return this.conteoService.obtenerAlmacenesDisponibles(usuarioId);
    }

    @Get('categorias')
    obtenerCategorias() {
        return this.conteoService.obtenerCategorias();
    }

    @Get()
    obtenerConteos(
        @UsuarioActual('id') usuarioId: number,
        @Query() filtros: ConsultarConteosDto,
    ) {
        return this.conteoService.obtenerConteos(usuarioId, filtros);
    }

    @Get(':id')
    obtenerDetalle(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
    ) {
        return this.conteoService.obtenerDetalle(usuarioId, id);
    }

    @Get(':id/productos')
    obtenerProductosParaConteo(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
    ) {
        return this.conteoService.obtenerProductosParaConteo(usuarioId, id);
    }

    @Post()
    crearConteo(
        @UsuarioActual('id') usuarioId: number,
        @Body() dto: CrearConteoDto,
    ) {
        return this.conteoService.crearConteo(usuarioId, dto);
    }

    @Post(':id/detalles')
    registrarDetalle(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
        @Body() dto: RegistrarDetalleConteoDto,
    ) {
        return this.conteoService.registrarDetalle(usuarioId, id, dto);
    }

    @Post(':id/detalles/lote')
    registrarDetallesLote(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
        @Body() dto: RegistrarDetallesLoteDto,
    ) {
        return this.conteoService.registrarDetallesLote(usuarioId, id, dto);
    }

    @Patch(':id/estado')
    actualizarEstado(
        @UsuarioActual('id') usuarioId: number,
        @Param('id') id: string,
        @Body() dto: ActualizarEstadoConteoDto,
    ) {
        return this.conteoService.actualizarEstado(usuarioId, id, dto);
    }
}
