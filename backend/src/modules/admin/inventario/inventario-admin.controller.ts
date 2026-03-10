import {
    Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { InventarioAdminService } from './inventario-admin.service';
import { FiltroMovimientosDto, RegistrarMovimientoDto, AjustarStockDto, FiltroEstadisticasDto } from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida, UsuarioActual } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Inventario')
@Controller('admin/inventario')
@UseGuards(JwtAdminGuard, RolesGuard)
export class InventarioAdminController {
    constructor(private readonly inventarioService: InventarioAdminService) {}

    @Get('resumen')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Resumen de inventario', 'Obtiene el resumen estadístico del inventario')
    @ApiResponse({ status: 200, description: 'Resumen de inventario' })
    async obtenerResumen() {
        return this.inventarioService.obtenerResumen();
    }

    @Get('movimientos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Listar movimientos', 'Obtiene la lista de movimientos de inventario con filtros y paginación')
    @ApiResponse({ status: 200, description: 'Lista de movimientos de inventario' })
    async obtenerMovimientos(@Query() filtros: FiltroMovimientosDto) {
        return this.inventarioService.obtenerMovimientos(filtros);
    }

    @Post('movimientos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Registrar movimiento', 'Registra un nuevo movimiento de inventario')
    @ApiResponse({ status: 201, description: 'Movimiento registrado exitosamente' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    @ApiResponse({ status: 400, description: 'Stock insuficiente' })
    async registrarMovimiento(
        @Body() dto: RegistrarMovimientoDto,
        @UsuarioActual('id') usuarioId: number,
    ) {
        return this.inventarioService.registrarMovimiento(dto, usuarioId);
    }

    @Patch('productos/:id/ajuste')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Ajustar stock', 'Ajusta el stock de un producto específico')
    @ApiResponse({ status: 200, description: 'Stock ajustado exitosamente' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async ajustarStock(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: AjustarStockDto,
        @UsuarioActual('id') usuarioId: number,
    ) {
        return this.inventarioService.ajustarStock(id, dto, usuarioId);
    }

    @Get('estadisticas/por-tipo')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Movimientos por tipo', 'Obtiene la distribución de movimientos por tipo')
    @ApiResponse({ status: 200, description: 'Estadísticas de movimientos por tipo' })
    async obtenerPorTipo() {
        return this.inventarioService.obtenerEstadisticasPorTipo();
    }

    @Get('estadisticas/stock-critico')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Stock crítico', 'Obtiene los productos con stock bajo o sin stock')
    @ApiResponse({ status: 200, description: 'Productos con stock crítico' })
    async obtenerStockCritico() {
        return this.inventarioService.obtenerStockCritico();
    }

    @Get('estadisticas/por-dia')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Movimientos por día', 'Obtiene movimientos agrupados por día para gráficas')
    @ApiResponse({ status: 200, description: 'Movimientos por día' })
    async obtenerPorDia(@Query() filtros: FiltroEstadisticasDto) {
        return this.inventarioService.obtenerMovimientosPorDia(filtros.dias);
    }

    @Get('estadisticas/valor-categoria')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Valor por categoría', 'Obtiene el valor del inventario agrupado por categoría')
    @ApiResponse({ status: 200, description: 'Valor de inventario por categoría' })
    async obtenerValorCategoria() {
        return this.inventarioService.obtenerValorPorCategoria();
    }

    @Get('estadisticas/top-productos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.BODEGUERO)
    @ApiOperacionProtegida('Top productos', 'Obtiene los productos con mayor valor en inventario')
    @ApiResponse({ status: 200, description: 'Top productos por valor de inventario' })
    async obtenerTopProductos(@Query() filtros: FiltroEstadisticasDto) {
        return this.inventarioService.obtenerTopProductos(filtros.limite);
    }
}
