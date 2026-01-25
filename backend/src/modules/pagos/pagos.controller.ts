import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PagosService, ProcesarPagoDto, EstadoPago } from './pagos.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../common/decorators';
import { ParsearIdPipe } from '../../common/pipes';
import { ROLES } from '../../common/constants';

@ApiTags('Pagos')
@Controller('pagos')
@UseGuards(JwtAuthGuard)
export class PagosController {
    constructor(private readonly pagosService: PagosService) {}

    @Post('procesar')
    @ApiOperacionProtegida('Procesar pago', 'Procesa el pago de un pedido')
    @ApiResponse({ status: 201, description: 'Pago procesado' })
    async procesarPago(@Body() datos: ProcesarPagoDto) {
        return this.pagosService.procesarPago(datos);
    }

    @Get('pedido/:pedidoId')
    @ApiOperacionProtegida('Obtener pago de pedido', 'Obtiene el pago asociado a un pedido')
    @ApiResponse({ status: 200, description: 'Pago encontrado' })
    async obtenerPagoPedido(@Param('pedidoId', ParsearIdPipe) pedidoId: number) {
        return this.pagosService.obtenerPagoPedido(pedidoId);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Historial de pagos', 'Obtiene el historial de pagos')
    @ApiResponse({ status: 200, description: 'Lista de pagos' })
    async obtenerHistorialPagos(
        @Query('estado') estado?: EstadoPago,
        @Query('pagina') pagina?: number,
        @Query('limite') limite?: number,
    ) {
        return this.pagosService.obtenerHistorialPagos({ estado, pagina, limite });
    }

    @Post(':id/reembolso')
    @UseGuards(RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Procesar reembolso', 'Procesa un reembolso')
    @ApiResponse({ status: 200, description: 'Reembolso procesado' })
    async procesarReembolso(
        @Param('id', ParsearIdPipe) id: number,
        @Body('motivo') motivo: string,
    ) {
        return this.pagosService.procesarReembolso(id, motivo);
    }
}
