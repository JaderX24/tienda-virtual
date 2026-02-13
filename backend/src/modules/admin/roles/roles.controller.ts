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
import { RolesService } from './roles.service';
import { CrearRolDto, ActualizarRolDto, FiltroRolesDto, AsignarPermisosDto, CambiarEstadoRolDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Roles')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear rol', 'Crea un nuevo rol en el sistema')
    @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El código de rol ya existe' })
    async crear(@Body() crearRolDto: CrearRolDto) {
        return this.rolesService.crear(crearRolDto);
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar roles', 'Obtiene la lista de roles')
    @ApiResponse({ status: 200, description: 'Lista de roles' })
    async obtenerTodos(@Query() filtros: FiltroRolesDto) {
        return this.rolesService.obtenerTodos(filtros);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener rol', 'Obtiene un rol por su ID')
    @ApiResponse({ status: 200, description: 'Rol encontrado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.rolesService.obtenerPorId(id);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar rol', 'Actualiza los datos de un rol')
    @ApiResponse({ status: 200, description: 'Rol actualizado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarRolDto: ActualizarRolDto,
    ) {
        return this.rolesService.actualizar(id, actualizarRolDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado del rol', 'Activa o desactiva un rol')
    @ApiResponse({ status: 200, description: 'Estado del rol actualizado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    @ApiResponse({ status: 409, description: 'No se puede cambiar el estado de roles del sistema' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoRolDto,
    ) {
        return this.rolesService.cambiarEstado(id, cambiarEstadoDto.activo);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Eliminar rol', 'Elimina un rol del sistema')
    @ApiResponse({ status: 200, description: 'Rol eliminado' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    @ApiResponse({ status: 409, description: 'El rol tiene usuarios asignados' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.rolesService.eliminar(id);
    }

    @Get(':id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener permisos del rol', 'Obtiene los permisos asignados a un rol')
    @ApiResponse({ status: 200, description: 'Lista de permisos del rol' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async obtenerPermisos(@Param('id', ParsearIdPipe) id: number) {
        return this.rolesService.obtenerPermisos(id);
    }

    @Post(':id/permisos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Asignar permisos al rol', 'Asigna permisos a un rol')
    @ApiResponse({ status: 200, description: 'Permisos asignados correctamente' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado' })
    async asignarPermisos(
        @Param('id', ParsearIdPipe) id: number,
        @Body() asignarPermisosDto: AsignarPermisosDto,
    ) {
        return this.rolesService.asignarPermisos(id, asignarPermisosDto.permisoIds);
    }
}
