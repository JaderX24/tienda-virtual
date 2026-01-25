import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CrearProductoDto, ActualizarProductoDto, FiltroProductosDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Publico, ApiOperacionProtegida, ApiOperacionPublica } from '../../common/decorators';
import { ParsearIdPipe } from '../../common/pipes';
import { ROLES } from '../../common/constants';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
    constructor(private readonly productosService: ProductosService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Crear producto', 'Crea un nuevo producto en el catálogo')
    @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe un producto con este SKU' })
    async crear(@Body() crearProductoDto: CrearProductoDto) {
        return this.productosService.crear(crearProductoDto);
    }

    @Get()
    @Publico()
    @ApiOperacionPublica('Listar productos', 'Obtiene la lista de productos con filtros y paginación')
    @ApiResponse({ status: 200, description: 'Lista de productos' })
    async obtenerTodos(@Query() filtros: FiltroProductosDto) {
        return this.productosService.obtenerTodos(filtros);
    }

    @Get(':id')
    @Publico()
    @ApiOperacionPublica('Obtener producto por ID', 'Obtiene un producto por su ID')
    @ApiResponse({ status: 200, description: 'Producto encontrado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.productosService.obtenerPorId(id);
    }

    @Get('slug/:slug')
    @Publico()
    @ApiOperacionPublica('Obtener producto por slug', 'Obtiene un producto por su slug')
    @ApiResponse({ status: 200, description: 'Producto encontrado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async obtenerPorSlug(@Param('slug') slug: string) {
        return this.productosService.obtenerPorSlug(slug);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Actualizar producto', 'Actualiza los datos de un producto')
    @ApiResponse({ status: 200, description: 'Producto actualizado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarProductoDto: ActualizarProductoDto,
    ) {
        return this.productosService.actualizar(id, actualizarProductoDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Eliminar producto', 'Desactiva un producto del catálogo')
    @ApiResponse({ status: 200, description: 'Producto eliminado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.productosService.eliminar(id);
    }
}
