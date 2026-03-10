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
import { ColabModulosService } from './colab-modulos.service';
import { CrearColabModuloDto, ActualizarColabModuloDto } from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Colaboradores RBAC - Módulos')
@Controller('admin/colab-rbac/modulos')
@UseGuards(JwtAdminGuard, RolesGuard)
export class ColabModulosController {
    constructor(private readonly colabModulosService: ColabModulosService) {}

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar módulos', 'Obtiene todos los módulos del portal de colaboradores')
    @ApiResponse({ status: 200, description: 'Lista de módulos' })
    async obtenerTodos(@Query('soloActivos') soloActivos?: string) {
        return this.colabModulosService.obtenerTodos(soloActivos === 'true');
    }

    @Get('arbol')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Árbol de módulos', 'Obtiene los módulos en estructura jerárquica')
    @ApiResponse({ status: 200, description: 'Árbol de módulos' })
    async obtenerArbol() {
        return this.colabModulosService.obtenerArbol();
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener módulo', 'Obtiene un módulo con sus permisos y submódulos')
    @ApiResponse({ status: 200, description: 'Módulo encontrado' })
    @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.colabModulosService.obtenerPorId(id);
    }

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear módulo', 'Crea un nuevo módulo para el portal de colaboradores')
    @ApiResponse({ status: 201, description: 'Módulo creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El código del módulo ya existe' })
    async crear(@Body() dto: CrearColabModuloDto) {
        return this.colabModulosService.crear(dto);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar módulo', 'Actualiza un módulo del portal de colaboradores')
    @ApiResponse({ status: 200, description: 'Módulo actualizado' })
    @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() dto: ActualizarColabModuloDto,
    ) {
        return this.colabModulosService.actualizar(id, dto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado módulo', 'Activa o desactiva un módulo')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body('esActivo') esActivo: boolean,
    ) {
        return this.colabModulosService.cambiarEstado(id, esActivo);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Eliminar módulo', 'Elimina un módulo (solo si no tiene permisos ni submódulos)')
    @ApiResponse({ status: 200, description: 'Módulo eliminado' })
    @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
    @ApiResponse({ status: 409, description: 'El módulo tiene permisos o submódulos asociados' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.colabModulosService.eliminar(id);
    }
}
