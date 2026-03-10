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
import { ColabRolesPermisosService } from './colab-roles-permisos.service';
import {
    CrearColabRolDto,
    ActualizarColabRolDto,
    AsignarPermisosRolDto,
    AsignarPermisoDirectoDto,
} from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Colaboradores RBAC')
@Controller('admin/colaboradores')
@UseGuards(JwtAdminGuard, RolesGuard)
export class ColabRolesPermisosController {
    constructor(
        private readonly colabRolesPermisosService: ColabRolesPermisosService,
    ) {}

    // =============================================
    // MÓDULOS DEL PORTAL
    // =============================================

    @Get('portal/modulos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar módulos del portal', 'Obtiene los módulos disponibles del portal de colaboradores')
    @ApiResponse({ status: 200, description: 'Lista de módulos' })
    async obtenerModulos() {
        return this.colabRolesPermisosService.obtenerModulos();
    }

    // =============================================
    // PERMISOS DEL PORTAL
    // =============================================

    @Get('portal/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar permisos del portal', 'Obtiene todos los permisos del portal de colaboradores')
    @ApiResponse({ status: 200, description: 'Lista de permisos' })
    async obtenerPermisos(@Query('moduloId') moduloId?: number) {
        return this.colabRolesPermisosService.obtenerPermisos(
            moduloId ? Number(moduloId) : undefined,
        );
    }

    @Get('portal/permisos/agrupados')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Permisos agrupados', 'Obtiene permisos agrupados por módulo')
    @ApiResponse({ status: 200, description: 'Permisos agrupados por módulo' })
    async obtenerPermisosAgrupados() {
        return this.colabRolesPermisosService.obtenerPermisosAgrupadosPorModulo();
    }

    // =============================================
    // ROLES DEL PORTAL
    // =============================================

    @Get('portal/roles')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar roles del portal', 'Obtiene los roles del portal de colaboradores con conteo de usuarios y permisos')
    @ApiResponse({ status: 200, description: 'Lista de roles' })
    async obtenerRoles() {
        return this.colabRolesPermisosService.obtenerRoles();
    }

    @Get('portal/roles/:id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Detalle de rol', 'Obtiene un rol con sus permisos y colaboradores asignados')
    @ApiResponse({ status: 200, description: 'Rol encontrado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async obtenerRolPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.colabRolesPermisosService.obtenerRolPorId(id);
    }

    @Post('portal/roles')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear rol del portal', 'Crea un nuevo rol para el portal de colaboradores')
    @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El código de rol ya existe' })
    async crearRol(@Body() dto: CrearColabRolDto) {
        return this.colabRolesPermisosService.crearRol(dto);
    }

    @Patch('portal/roles/:id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar rol del portal', 'Actualiza un rol del portal de colaboradores')
    @ApiResponse({ status: 200, description: 'Rol actualizado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async actualizarRol(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: ActualizarColabRolDto,
    ) {
        return this.colabRolesPermisosService.actualizarRol(id, dto);
    }

    // =============================================
    // PERMISOS DE UN ROL
    // =============================================

    @Get('portal/roles/:id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Permisos del rol', 'Obtiene los permisos asignados a un rol')
    @ApiResponse({ status: 200, description: 'Lista de permisos del rol' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async obtenerPermisosDeRol(@Param('id', ParsearIdPipe) id: number) {
        return this.colabRolesPermisosService.obtenerPermisosDeRol(id);
    }

    @Post('portal/roles/:id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Asignar permisos a rol', 'Reemplaza todos los permisos de un rol')
    @ApiResponse({ status: 200, description: 'Permisos actualizados' })
    @ApiResponse({ status: 404, description: 'Rol o permiso no encontrado' })
    async asignarPermisosARol(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: AsignarPermisosRolDto,
    ) {
        return this.colabRolesPermisosService.asignarPermisosARol(id, dto);
    }

    // =============================================
    // PERMISOS DIRECTOS DE UN COLABORADOR
    // =============================================

    @Get(':id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Permisos del colaborador', 'Obtiene los permisos efectivos de un colaborador (heredados + directos)')
    @ApiResponse({ status: 200, description: 'Permisos del colaborador' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async obtenerPermisosDeColaborador(@Param('id', ParsearIdPipe) id: number) {
        return this.colabRolesPermisosService.obtenerPermisosDeColaborador(id);
    }

    @Post(':id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Asignar permiso directo', 'Asigna un permiso directamente a un colaborador (independiente del rol)')
    @ApiResponse({ status: 201, description: 'Permiso asignado' })
    @ApiResponse({ status: 404, description: 'Colaborador o permiso no encontrado' })
    @ApiResponse({ status: 409, description: 'El permiso ya está asignado' })
    async asignarPermisoDirecto(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: AsignarPermisoDirectoDto,
    ) {
        return this.colabRolesPermisosService.asignarPermisoDirecto(id, dto);
    }

    @Delete(':id/permisos/:permisoId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Remover permiso directo', 'Remueve un permiso directo de un colaborador')
    @ApiResponse({ status: 200, description: 'Permiso removido' })
    @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
    async removerPermisoDirecto(
        @Param('id', ParsearIdPipe) id: number,
        @Param('permisoId', ParsearIdPipe) permisoId: number,
    ) {
        return this.colabRolesPermisosService.removerPermisoDirecto(id, permisoId);
    }
}
