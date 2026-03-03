import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { ProductoColaboradorService } from './producto.service';
import { ConsultarProductosDto, ConsultarMovimientosProductoDto } from './dto';

@Controller('colaborador/productos')
@UseGuards(JwtAuthGuard)
export class ProductoColaboradorController {
    constructor(private readonly productoService: ProductoColaboradorService) {}

    @Get('resumen')
    obtenerResumen() {
        return this.productoService.obtenerResumen();
    }

    @Get('categorias')
    obtenerCategorias() {
        return this.productoService.obtenerCategorias();
    }

    @Get('marcas')
    obtenerMarcas() {
        return this.productoService.obtenerMarcas();
    }

    @Get()
    obtenerProductos(@Query() filtros: ConsultarProductosDto) {
        return this.productoService.obtenerProductos(filtros);
    }

    @Get(':id')
    obtenerDetalle(@Param('id', ParseIntPipe) id: number) {
        return this.productoService.obtenerDetalleProducto(id);
    }

    @Get(':id/movimientos')
    obtenerMovimientos(
        @Param('id', ParseIntPipe) id: number,
        @Query() filtros: ConsultarMovimientosProductoDto,
    ) {
        return this.productoService.obtenerMovimientosProducto(id, filtros);
    }
}
