import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAdminGuard, RolesGuard } from '../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../common/decorators';
import { ROLES } from '../../common/constants';

@ApiTags('Administración')
@Controller('admin')
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('estadisticas')
    @ApiOperacionProtegida('Estadísticas generales', 'Obtiene estadísticas del sistema')
    @ApiResponse({ status: 200, description: 'Estadísticas del sistema' })
    async obtenerEstadisticasGenerales() {
        return this.adminService.obtenerEstadisticasGenerales();
    }

    @Get('ventas')
    @ApiOperacionProtegida('Ventas por período', 'Obtiene ventas en un rango de fechas')
    @ApiResponse({ status: 200, description: 'Reporte de ventas' })
    async obtenerVentasPorPeriodo(
        @Query('inicio') inicio: string,
        @Query('fin') fin: string,
    ) {
        return this.adminService.obtenerVentasPorPeriodo(new Date(inicio), new Date(fin));
    }

    @Get('productos-mas-vendidos')
    @ApiOperacionProtegida('Productos más vendidos', 'Lista los productos más vendidos')
    @ApiResponse({ status: 200, description: 'Lista de productos más vendidos' })
    async obtenerProductosMasVendidos(@Query('limite') limite?: number) {
        return this.adminService.obtenerProductosMasVendidos(limite);
    }

    @Get('pedidos-recientes')
    @ApiOperacionProtegida('Pedidos recientes', 'Lista los pedidos más recientes')
    @ApiResponse({ status: 200, description: 'Lista de pedidos recientes' })
    async obtenerPedidosRecientes(@Query('limite') limite?: number) {
        return this.adminService.obtenerPedidosRecientes(limite);
    }

    @Get('usuarios-recientes')
    @ApiOperacionProtegida('Usuarios recientes', 'Lista los usuarios registrados recientemente')
    @ApiResponse({ status: 200, description: 'Lista de usuarios recientes' })
    async obtenerUsuariosRecientes(@Query('limite') limite?: number) {
        return this.adminService.obtenerUsuariosRecientes(limite);
    }
}
