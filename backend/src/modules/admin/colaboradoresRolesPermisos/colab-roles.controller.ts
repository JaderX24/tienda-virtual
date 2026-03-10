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
import { ColabRolesService } from './colab-roles.service';
import {
    CrearColabRolDto,
    ActualizarColabRolDto,
    FiltroColabRolesDto,
    AsignarPermisosRolDto,
    AgregarPermisosRolDto,
    RemoverPermisosRolDto,
    AsignarRolUsuarioDto,
} from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Colaboradores RBAC - Roles')
@Controller('admin/colab-rbac/roles')
@UseGuards(JwtAdminGuard, RolesGuard)
export class ColabRolesController {
    constructor(private readonly colabRolesService: ColabRolesService) {}

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar roles', 'Obtiene los roles del portal de colaboradores con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de roles' })
    async obtenerTodos(@Query() filtros: FiltroColabRolesDto) {
        return this.colabRolesService.obtenerTodos(filtros);
    }

    @Get('estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Estadísticas de roles', 'Obtiene estadísticas generales de los roles de colaboradores')
    @ApiResponse({ status: 200, description: 'Estadísticas de roles' })
    async obtenerEstadisticas() {
        return this.colabRolesService.obtenerEstadisticas();
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener rol', 'Obtiene un rol con sus permisos y colaboradores asignados')
    @ApiResponse({ status: 200, description: 'Rol encontrado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.colabRolesService.obtenerPorId(id);
    }

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear rol', 'Crea un nuevo rol para el portal de colaboradores')
    @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El código de rol ya existe' })
    async crear(@Body() dto: CrearColabRolDto) {
        return this.colabRolesService.crear(dto);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar rol', 'Actualiza un rol del portal de colaboradores')
    @ApiResponse({ status: 200, description: 'Rol actualizado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: ActualizarColabRolDto,
    ) {
        return this.colabRolesService.actualizar(id, dto);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Eliminar rol', 'Elimina un rol (solo si no tiene colaboradores asignados)')
    @ApiResponse({ status: 200, description: 'Rol eliminado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    @ApiResponse({ status: 409, description: 'El rol tiene colaboradores asignados' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.colabRolesService.eliminar(id);
    }

    // =============================================
    // PERMISOS DEL ROL
    // =============================================

    @Get(':id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Permisos del rol', 'Obtiene los permisos asignados a un rol agrupados por módulo')
    @ApiResponse({ status: 200, description: 'Permisos del rol' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async obtenerPermisosDelRol(@Param('id', ParsearIdPipe) id: number) {
        return this.colabRolesService.obtenerPermisosDelRol(id);
    }

    @Post(':id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Asignar permisos', 'Reemplaza todos los permisos de un rol')
    @ApiResponse({ status: 200, description: 'Permisos actualizados' })
    @ApiResponse({ status: 404, description: 'Rol o permiso no encontrado' })
    async asignarPermisos(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: AsignarPermisosRolDto,
    ) {
        return this.colabRolesService.asignarPermisos(id, dto);
    }

    @Post(':id/permisos/agregar')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Agregar permisos', 'Agrega permisos a un rol sin eliminar los existentes')
    @ApiResponse({ status: 200, description: 'Permisos agregados' })
    @ApiResponse({ status: 404, description: 'Rol o permiso no encontrado' })
    async agregarPermisos(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: AgregarPermisosRolDto,
    ) {
        return this.colabRolesService.agregarPermisos(id, dto);
    }

    @Post(':id/permisos/remover')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Remover permisos', 'Remueve permisos específicos de un rol')
    @ApiResponse({ status: 200, description: 'Permisos removidos' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async removerPermisos(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: RemoverPermisosRolDto,
    ) {
        return this.colabRolesService.removerPermisos(id, dto);
    }

    // =============================================
    // USUARIOS DEL ROL
    // =============================================

    @Get(':id/usuarios')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Usuarios del rol', 'Obtiene los colaboradores asignados a un rol')
    @ApiResponse({ status: 200, description: 'Usuarios del rol' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async obtenerUsuariosDelRol(@Param('id', ParsearIdPipe) id: number) {
        return this.colabRolesService.obtenerUsuariosDelRol(id);
    }

    @Post(':id/usuarios')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Asignar usuario a rol', 'Asigna un colaborador a este rol')
    @ApiResponse({ status: 201, description: 'Usuario asignado exitosamente' })
    @ApiResponse({ status: 404, description: 'Rol o colaborador no encontrado' })
    @ApiResponse({ status: 409, description: 'El colaborador ya tiene este rol' })
    async asignarUsuario(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: AsignarRolUsuarioDto,
    ) {
        return this.colabRolesService.asignarUsuario(id, dto);
    }

    @Delete(':id/usuarios/:usuarioId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Remover usuario de rol', 'Remueve un colaborador de este rol')
    @ApiResponse({ status: 200, description: 'Usuario removido exitosamente' })
    @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
    async removerUsuario(
        @Param('id', ParsearIdPipe) id: number,
        @Param('usuarioId', ParsearIdPipe) usuarioId: number,
    ) {
        return this.colabRolesService.removerUsuario(id, usuarioId);
    }
}
