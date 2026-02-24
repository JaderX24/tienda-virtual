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
import { MarcasAdminService } from './marcas-admin.service';
import {
    CrearMarcaDto,
    ActualizarMarcaDto,
    FiltroMarcaDto,
    CambiarEstadoMarcaDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Marcas')
@Controller('admin/marcas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarcasAdminController {
    constructor(private readonly marcasAdminService: MarcasAdminService) {}

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear marca', 'Crea una nueva marca en el sistema')
    @ApiResponse({ status: 201, description: 'Marca creada exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe una marca con este nombre' })
    async crear(@Body() crearMarcaDto: CrearMarcaDto) {
        return this.marcasAdminService.crear(crearMarcaDto);
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar marcas', 'Obtiene la lista de marcas con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de marcas' })
    async obtenerTodas(@Query() filtros: FiltroMarcaDto) {
        return this.marcasAdminService.obtenerTodas(filtros);
    }

    @Get('estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Estadísticas de marcas', 'Obtiene estadísticas generales de marcas')
    @ApiResponse({ status: 200, description: 'Estadísticas de marcas' })
    async obtenerEstadisticas() {
        return this.marcasAdminService.obtenerEstadisticas();
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener marca', 'Obtiene una marca por su ID')
    @ApiResponse({ status: 200, description: 'Marca encontrada' })
    @ApiResponse({ status: 404, description: 'Marca no encontrada' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.marcasAdminService.obtenerPorId(id);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar marca', 'Actualiza los datos de una marca')
    @ApiResponse({ status: 200, description: 'Marca actualizada' })
    @ApiResponse({ status: 404, description: 'Marca no encontrada' })
    @ApiResponse({ status: 409, description: 'Ya existe una marca con este nombre' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarMarcaDto: ActualizarMarcaDto,
    ) {
        return this.marcasAdminService.actualizar(id, actualizarMarcaDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva una marca')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Marca no encontrada' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoMarcaDto,
    ) {
        return this.marcasAdminService.cambiarEstado(id, cambiarEstadoDto.activa);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Eliminar marca', 'Elimina (desactiva) una marca')
    @ApiResponse({ status: 200, description: 'Marca eliminada' })
    @ApiResponse({ status: 404, description: 'Marca no encontrada' })
    @ApiResponse({ status: 400, description: 'La marca tiene productos asociados' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.marcasAdminService.eliminar(id);
    }
}
