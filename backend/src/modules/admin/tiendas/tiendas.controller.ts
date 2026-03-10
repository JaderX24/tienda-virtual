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
import { TiendasService } from './tiendas.service';
import { FiltroTiendasDto, CambiarEstadoTiendaDto } from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Tiendas')
@Controller('admin/tiendas')
@UseGuards(JwtAdminGuard, RolesGuard)
export class TiendasController {
    constructor(private readonly tiendasService: TiendasService) {}

    @Get('resumen-estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Resumen de estadísticas', 'Obtiene el resumen de estadísticas de todas las tiendas')
    @ApiResponse({ status: 200, description: 'Resumen de estadísticas' })
    async obtenerResumenEstadisticas() {
        return this.tiendasService.obtenerResumenEstadisticas();
    }

    @Get('validar-rtn')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Validar RTN', 'Valida si un RTN ya está registrado')
    @ApiResponse({ status: 200, description: 'Resultado de validación' })
    async validarRtn(
        @Query('rtn') rtn: string,
        @Query('excluirId') excluirId?: string,
    ) {
        const idExcluir = excluirId ? parseInt(excluirId, 10) : undefined;
        return this.tiendasService.validarRtn(rtn, idExcluir);
    }

    @Get('opciones-formulario')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Opciones de formulario', 'Obtiene las opciones para los formularios de tiendas')
    @ApiResponse({ status: 200, description: 'Opciones de formulario' })
    async obtenerOpcionesFormulario() {
        return this.tiendasService.obtenerOpcionesFormulario();
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar tiendas', 'Obtiene la lista de tiendas con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de tiendas' })
    async obtenerTodas(@Query() filtros: FiltroTiendasDto) {
        return this.tiendasService.obtenerTodas(filtros);
    }

    @Get(':id/estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Estadísticas de tienda', 'Obtiene las estadísticas de una tienda')
    @ApiResponse({ status: 200, description: 'Estadísticas de la tienda' })
    @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
    async obtenerEstadisticas(@Param('id', ParsearIdPipe) id: number) {
        return this.tiendasService.obtenerEstadisticas(id);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener tienda', 'Obtiene una tienda por su ID')
    @ApiResponse({ status: 200, description: 'Tienda encontrada' })
    @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.tiendasService.obtenerPorId(id);
    }

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear tienda', 'Crea una nueva tienda en el sistema')
    @ApiResponse({ status: 201, description: 'Tienda creada exitosamente' })
    @ApiResponse({ status: 409, description: 'El RTN o correo ya está registrado' })
    async crear(@Body() crearTiendaDto: any) {
        return this.tiendasService.crear(crearTiendaDto);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar tienda', 'Actualiza los datos de una tienda')
    @ApiResponse({ status: 200, description: 'Tienda actualizada' })
    @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarTiendaDto: any,
    ) {
        return this.tiendasService.actualizar(id, actualizarTiendaDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva una tienda')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoTiendaDto,
    ) {
        return this.tiendasService.cambiarEstado(id, cambiarEstadoDto.activa);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Eliminar tienda', 'Elimina una tienda del sistema (soft delete)')
    @ApiResponse({ status: 200, description: 'Tienda eliminada' })
    @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.tiendasService.eliminar(id);
    }
}
