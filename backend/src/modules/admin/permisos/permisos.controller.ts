import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PermisosService } from './permisos.service';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Permisos')
@Controller('admin/permisos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermisosController {
    constructor(private readonly permisosService: PermisosService) {}

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar permisos', 'Obtiene todos los permisos del sistema')
    @ApiResponse({ status: 200, description: 'Lista de permisos' })
    async obtenerTodos() {
        return this.permisosService.obtenerTodos();
    }

    @Get('agrupados')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar permisos agrupados', 'Obtiene permisos agrupados por módulo')
    @ApiResponse({ status: 200, description: 'Permisos agrupados por módulo' })
    async obtenerAgrupados() {
        return this.permisosService.obtenerAgrupados();
    }

    @Get('modulos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar módulos', 'Obtiene la lista de módulos disponibles')
    @ApiResponse({ status: 200, description: 'Lista de módulos' })
    async obtenerModulos() {
        return this.permisosService.obtenerModulos();
    }
}
