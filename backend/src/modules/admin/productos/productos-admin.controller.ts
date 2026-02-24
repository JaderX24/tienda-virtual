import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ProductosAdminService } from './productos-admin.service';
import {
    CrearProductoAdminDto,
    ActualizarProductoAdminDto,
    FiltroProductosAdminDto,
    CambiarEstadoProductoDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Productos')
@Controller('admin/productos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductosAdminController {
    constructor(private readonly productosService: ProductosAdminService) {}

    @Get('resumen')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Resumen de productos', 'Obtiene el resumen estadístico de productos')
    @ApiResponse({ status: 200, description: 'Resumen de productos' })
    async obtenerResumen() {
        return this.productosService.obtenerResumen();
    }

    @Get('categorias')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar categorías activas', 'Obtiene las categorías activas para selects')
    @ApiResponse({ status: 200, description: 'Lista de categorías activas' })
    async obtenerCategorias() {
        return this.productosService.obtenerCategoriasActivas();
    }

    @Get('marcas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar marcas activas', 'Obtiene las marcas activas para selects')
    @ApiResponse({ status: 200, description: 'Lista de marcas activas' })
    async obtenerMarcas() {
        return this.productosService.obtenerMarcasActivas();
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar productos', 'Obtiene la lista de productos con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de productos' })
    async obtenerTodos(@Query() filtros: FiltroProductosAdminDto) {
        return this.productosService.obtenerTodos(filtros);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener producto', 'Obtiene un producto por su ID')
    @ApiResponse({ status: 200, description: 'Producto encontrado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.productosService.obtenerPorId(id);
    }

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear producto', 'Crea un nuevo producto en el catálogo')
    @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe un producto con este SKU' })
    async crear(@Body() crearProductoDto: CrearProductoAdminDto) {
        return this.productosService.crear(crearProductoDto);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar producto', 'Actualiza los datos de un producto')
    @ApiResponse({ status: 200, description: 'Producto actualizado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    @ApiResponse({ status: 409, description: 'Ya existe un producto con este SKU' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarProductoDto: ActualizarProductoAdminDto,
    ) {
        return this.productosService.actualizar(id, actualizarProductoDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva un producto')
    @ApiResponse({ status: 200, description: 'Estado del producto actualizado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoProductoDto,
    ) {
        return this.productosService.cambiarEstado(id, cambiarEstadoDto.activo);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Eliminar producto', 'Elimina un producto (lógicamente)')
    @ApiResponse({ status: 200, description: 'Producto eliminado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.productosService.eliminar(id);
    }
}
