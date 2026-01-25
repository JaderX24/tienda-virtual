import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PedidosService, CrearPedidoDto, EstadoPedido } from './pedidos.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, UsuarioActual, ApiOperacionProtegida } from '../../common/decorators';
import { ParsearIdPipe } from '../../common/pipes';
import { ROLES } from '../../common/constants';

@ApiTags('Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
    constructor(private readonly pedidosService: PedidosService) {}

    @Post()
    @ApiOperacionProtegida('Crear pedido', 'Crea un nuevo pedido')
    @ApiResponse({ status: 201, description: 'Pedido creado' })
    async crear(@Body() datos: CrearPedidoDto) {
        return this.pedidosService.crear(datos);
    }

    @Get('mis-pedidos')
    @ApiOperacionProtegida('Mis pedidos', 'Obtiene los pedidos del cliente actual')
    @ApiResponse({ status: 200, description: 'Lista de pedidos' })
    async obtenerMisPedidos(
        @UsuarioActual('id') clienteId: number,
        @Query('pagina') pagina?: number,
        @Query('limite') limite?: number,
    ) {
        return this.pedidosService.obtenerPedidosCliente(clienteId, { pagina, limite });
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR)
    @ApiOperacionProtegida('Listar pedidos', 'Obtiene todos los pedidos')
    @ApiResponse({ status: 200, description: 'Lista de pedidos' })
    async obtenerTodos(
        @Query('estado') estado?: EstadoPedido,
        @Query('pagina') pagina?: number,
        @Query('limite') limite?: number,
    ) {
        return this.pedidosService.obtenerTodos({ estado, pagina, limite });
    }

    @Get(':id')
    @ApiOperacionProtegida('Obtener pedido', 'Obtiene un pedido por ID')
    @ApiResponse({ status: 200, description: 'Pedido encontrado' })
    @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.pedidosService.obtenerPorId(id);
    }

    @Put(':id/estado')
    @UseGuards(RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR)
    @ApiOperacionProtegida('Actualizar estado', 'Actualiza el estado de un pedido')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    async actualizarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body('estado') estado: EstadoPedido,
    ) {
        return this.pedidosService.actualizarEstado(id, estado);
    }

    @Post(':id/cancelar')
    @ApiOperacionProtegida('Cancelar pedido', 'Cancela un pedido')
    @ApiResponse({ status: 200, description: 'Pedido cancelado' })
    async cancelar(
        @Param('id', ParsearIdPipe) id: number,
        @Body('motivo') motivo: string,
    ) {
        return this.pedidosService.cancelar(id, motivo);
    }
}
