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
import { CategoriasAdminService } from './categorias-admin.service';
import {
    CrearCategoriaDto,
    ActualizarCategoriaDto,
    FiltroCategoriaDto,
    CambiarEstadoCategoriaDto,
} from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Categorías')
@Controller('admin/categorias')
@UseGuards(JwtAdminGuard, RolesGuard)
export class CategoriasAdminController {
    constructor(private readonly categoriasAdminService: CategoriasAdminService) {}

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear categoría', 'Crea una nueva categoría en el sistema')
    @ApiResponse({ status: 201, description: 'Categoría creada exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe una categoría con este nombre' })
    async crear(@Body() crearCategoriaDto: CrearCategoriaDto) {
        return this.categoriasAdminService.crear(crearCategoriaDto);
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar categorías', 'Obtiene la lista de categorías con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de categorías' })
    async obtenerTodas(@Query() filtros: FiltroCategoriaDto) {
        return this.categoriasAdminService.obtenerTodas(filtros);
    }

    @Get('arbol')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Árbol de categorías', 'Obtiene las categorías en estructura jerárquica')
    @ApiResponse({ status: 200, description: 'Árbol de categorías' })
    async obtenerArbol() {
        return this.categoriasAdminService.obtenerArbol();
    }

    @Get('estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Estadísticas de categorías', 'Obtiene estadísticas generales de categorías')
    @ApiResponse({ status: 200, description: 'Estadísticas de categorías' })
    async obtenerEstadisticas() {
        return this.categoriasAdminService.obtenerEstadisticas();
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener categoría', 'Obtiene una categoría por su ID')
    @ApiResponse({ status: 200, description: 'Categoría encontrada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.categoriasAdminService.obtenerPorId(id);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar categoría', 'Actualiza los datos de una categoría')
    @ApiResponse({ status: 200, description: 'Categoría actualizada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    @ApiResponse({ status: 409, description: 'Ya existe una categoría con este nombre' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarCategoriaDto: ActualizarCategoriaDto,
    ) {
        return this.categoriasAdminService.actualizar(id, actualizarCategoriaDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva una categoría')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoCategoriaDto,
    ) {
        return this.categoriasAdminService.cambiarEstado(id, cambiarEstadoDto.activa);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Eliminar categoría', 'Elimina (desactiva) una categoría')
    @ApiResponse({ status: 200, description: 'Categoría eliminada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    @ApiResponse({ status: 400, description: 'La categoría tiene productos o subcategorías asociadas' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.categoriasAdminService.eliminar(id);
    }
}
