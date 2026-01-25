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
import { InventarioService, MovimientoInventario } from './inventario.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, UsuarioActual, ApiOperacionProtegida } from '../../common/decorators';
import { ParsearIdPipe } from '../../common/pipes';
import { ROLES } from '../../common/constants';

@ApiTags('Inventario')
@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
    constructor(private readonly inventarioService: InventarioService) {}

    @Get('producto/:id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Obtener stock de producto', 'Obtiene el stock actual de un producto')
    @ApiResponse({ status: 200, description: 'Stock del producto' })
    async obtenerStockProducto(@Param('id', ParsearIdPipe) id: number) {
        return this.inventarioService.obtenerStockProducto(id);
    }

    @Post('movimiento')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Registrar movimiento', 'Registra un movimiento de inventario')
    @ApiResponse({ status: 201, description: 'Movimiento registrado' })
    async registrarMovimiento(
        @Body() datos: Omit<MovimientoInventario, 'usuarioId'>,
        @UsuarioActual('id') usuarioId: number,
    ) {
        return this.inventarioService.registrarMovimiento({
            ...datos,
            usuarioId,
        });
    }

    @Get('movimientos/:productoId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Obtener movimientos', 'Obtiene el historial de movimientos de un producto')
    @ApiResponse({ status: 200, description: 'Lista de movimientos' })
    async obtenerMovimientos(
        @Param('productoId', ParsearIdPipe) productoId: number,
        @Query('pagina') pagina?: number,
        @Query('limite') limite?: number,
    ) {
        return this.inventarioService.obtenerMovimientos(productoId, { pagina, limite });
    }

    @Get('stock-bajo')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Productos con stock bajo', 'Lista productos con stock bajo')
    @ApiResponse({ status: 200, description: 'Productos con stock bajo' })
    async obtenerProductosStockBajo() {
        return this.inventarioService.obtenerProductosStockBajo();
    }

    @Get('disponibilidad/:productoId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO, ROLES.VENDEDOR)
    @ApiOperacionProtegida('Verificar disponibilidad', 'Verifica si hay stock disponible')
    @ApiResponse({ status: 200, description: 'Estado de disponibilidad' })
    async verificarDisponibilidad(
        @Param('productoId', ParsearIdPipe) productoId: number,
        @Query('cantidad') cantidad: number,
    ) {
        return this.inventarioService.verificarDisponibilidad(productoId, cantidad);
    }
}
