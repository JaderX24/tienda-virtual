import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CategoriasService } from './categorias.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Publico, ApiOperacionProtegida, ApiOperacionPublica } from '../../common/decorators';
import { ParsearIdPipe } from '../../common/pipes';
import { ROLES } from '../../common/constants';

@ApiTags('Categorías')
@Controller('categorias')
export class CategoriasController {
    constructor(private readonly categoriasService: CategoriasService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear categoría', 'Crea una nueva categoría')
    @ApiResponse({ status: 201, description: 'Categoría creada' })
    async crear(@Body() datos: { nombre: string; descripcion?: string; categoriaPadreId?: number }) {
        return this.categoriasService.crear(datos);
    }

    @Get()
    @Publico()
    @ApiOperacionPublica('Listar categorías', 'Obtiene todas las categorías')
    @ApiResponse({ status: 200, description: 'Lista de categorías' })
    async obtenerTodas() {
        return this.categoriasService.obtenerTodas();
    }

    @Get('arbol')
    @Publico()
    @ApiOperacionPublica('Obtener árbol de categorías', 'Obtiene las categorías en estructura jerárquica')
    @ApiResponse({ status: 200, description: 'Árbol de categorías' })
    async obtenerArbol() {
        return this.categoriasService.obtenerArbol();
    }

    @Get(':id')
    @Publico()
    @ApiOperacionPublica('Obtener categoría', 'Obtiene una categoría por ID')
    @ApiResponse({ status: 200, description: 'Categoría encontrada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.categoriasService.obtenerPorId(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar categoría', 'Actualiza una categoría')
    @ApiResponse({ status: 200, description: 'Categoría actualizada' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() datos: { nombre?: string; descripcion?: string; activa?: boolean },
    ) {
        return this.categoriasService.actualizar(id, datos);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Eliminar categoría', 'Desactiva una categoría')
    @ApiResponse({ status: 200, description: 'Categoría eliminada' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.categoriasService.eliminar(id);
    }
}
