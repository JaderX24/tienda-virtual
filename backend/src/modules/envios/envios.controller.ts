import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { EnviosService, EstadoEnvio } from './envios.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Publico, ApiOperacionProtegida, ApiOperacionPublica } from '../../common/decorators';
import { ParsearIdPipe } from '../../common/pipes';
import { ROLES } from '../../common/constants';

@ApiTags('Envíos')
@Controller('envios')
export class EnviosController {
    constructor(private readonly enviosService: EnviosService) {}

    @Post('pedido/:pedidoId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Crear envío', 'Crea un envío para un pedido')
    @ApiResponse({ status: 201, description: 'Envío creado' })
    async crearEnvio(
        @Param('pedidoId', ParsearIdPipe) pedidoId: number,
        @Body() datos: { transportistaId?: number; costoEnvio: number },
    ) {
        return this.enviosService.crearEnvio(pedidoId, datos);
    }

    @Get('pedido/:pedidoId')
    @UseGuards(JwtAuthGuard)
    @ApiOperacionProtegida('Obtener envío de pedido', 'Obtiene el envío de un pedido')
    @ApiResponse({ status: 200, description: 'Envío encontrado' })
    async obtenerEnvioPedido(@Param('pedidoId', ParsearIdPipe) pedidoId: number) {
        return this.enviosService.obtenerEnvioPedido(pedidoId);
    }

    @Put(':id/estado')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Actualizar estado de envío', 'Actualiza el estado de un envío')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    async actualizarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() datos: { estado: EstadoEnvio; ubicacion?: string; notas?: string },
    ) {
        return this.enviosService.actualizarEstado(id, datos.estado, datos.ubicacion, datos.notas);
    }

    @Get('rastrear/:numeroGuia')
    @Publico()
    @ApiOperacionPublica('Rastrear envío', 'Rastrea un envío por número de guía')
    @ApiResponse({ status: 200, description: 'Información de seguimiento' })
    async obtenerSeguimiento(@Param('numeroGuia') numeroGuia: string) {
        return this.enviosService.obtenerSeguimiento(numeroGuia);
    }

    @Get('pendientes')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Envíos pendientes', 'Lista envíos pendientes de entrega')
    @ApiResponse({ status: 200, description: 'Lista de envíos pendientes' })
    async obtenerEnviosPendientes() {
        return this.enviosService.obtenerEnviosPendientes();
    }
}
