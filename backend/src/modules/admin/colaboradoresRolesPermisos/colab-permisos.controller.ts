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
import { ColabPermisosService } from './colab-permisos.service';
import {
    CrearColabPermisoDto,
    ActualizarColabPermisoDto,
    FiltroColabPermisosDto,
    AsignarPermisoDirectoDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Colaboradores RBAC - Permisos')
@Controller('admin/colab-rbac/permisos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ColabPermisosController {
    constructor(private readonly colabPermisosService: ColabPermisosService) {}

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar permisos', 'Obtiene los permisos del portal de colaboradores con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de permisos' })
    async obtenerTodos(@Query() filtros: FiltroColabPermisosDto) {
        return this.colabPermisosService.obtenerTodos(filtros);
    }

    @Get('agrupados')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Permisos agrupados', 'Obtiene los permisos agrupados por módulo')
    @ApiResponse({ status: 200, description: 'Permisos agrupados por módulo' })
    async obtenerAgrupadosPorModulo() {
        return this.colabPermisosService.obtenerAgrupadosPorModulo();
    }

    @Get('acciones')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Acciones disponibles', 'Obtiene las acciones de permisos disponibles')
    @ApiResponse({ status: 200, description: 'Lista de acciones' })
    async obtenerAccionesDisponibles() {
        return this.colabPermisosService.obtenerAccionesDisponibles();
    }

    @Get('estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Estadísticas de permisos', 'Obtiene estadísticas generales de los permisos')
    @ApiResponse({ status: 200, description: 'Estadísticas de permisos' })
    async obtenerEstadisticas() {
        return this.colabPermisosService.obtenerEstadisticas();
    }

    @Get('usuario/:usuarioId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Permisos del colaborador', 'Obtiene los permisos efectivos de un colaborador (heredados + directos - denegados)')
    @ApiResponse({ status: 200, description: 'Permisos del colaborador' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async obtenerPermisosEfectivos(@Param('usuarioId', ParsearIdPipe) usuarioId: number) {
        return this.colabPermisosService.obtenerPermisosEfectivos(usuarioId);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener permiso', 'Obtiene un permiso con sus roles y usuarios asociados')
    @ApiResponse({ status: 200, description: 'Permiso encontrado' })
    @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.colabPermisosService.obtenerPorId(id);
    }

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear permiso', 'Crea un nuevo permiso para el portal de colaboradores')
    @ApiResponse({ status: 201, description: 'Permiso creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El código de permiso ya existe' })
    @ApiResponse({ status: 404, description: 'El módulo especificado no existe' })
    async crear(@Body() dto: CrearColabPermisoDto) {
        return this.colabPermisosService.crear(dto);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar permiso', 'Actualiza un permiso del portal de colaboradores')
    @ApiResponse({ status: 200, description: 'Permiso actualizado' })
    @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: ActualizarColabPermisoDto,
    ) {
        return this.colabPermisosService.actualizar(id, dto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado permiso', 'Activa o desactiva un permiso')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body('esActivo') esActivo: boolean,
    ) {
        return this.colabPermisosService.cambiarEstado(id, esActivo);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Eliminar permiso', 'Elimina un permiso (solo si no tiene asignaciones)')
    @ApiResponse({ status: 200, description: 'Permiso eliminado' })
    @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
    @ApiResponse({ status: 409, description: 'El permiso tiene asignaciones activas' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.colabPermisosService.eliminar(id);
    }

    // =============================================
    // PERMISOS DIRECTOS POR COLABORADOR
    // =============================================

    @Post('usuario/:usuarioId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Asignar permiso directo', 'Asigna un permiso directamente a un colaborador (independiente de roles)')
    @ApiResponse({ status: 201, description: 'Permiso asignado' })
    @ApiResponse({ status: 404, description: 'Colaborador o permiso no encontrado' })
    @ApiResponse({ status: 409, description: 'El permiso ya está asignado directamente' })
    async asignarPermisoDirecto(
        @Param('usuarioId', ParsearIdPipe) usuarioId: number,
        @Body() dto: AsignarPermisoDirectoDto,
    ) {
        return this.colabPermisosService.asignarPermisoDirecto(usuarioId, dto);
    }

    @Delete('usuario/:usuarioId/:permisoId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Remover permiso directo', 'Remueve un permiso directo de un colaborador')
    @ApiResponse({ status: 200, description: 'Permiso removido' })
    @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
    async removerPermisoDirecto(
        @Param('usuarioId', ParsearIdPipe) usuarioId: number,
        @Param('permisoId', ParsearIdPipe) permisoId: number,
    ) {
        return this.colabPermisosService.removerPermisoDirecto(usuarioId, permisoId);
    }
}
