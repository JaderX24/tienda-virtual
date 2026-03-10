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
import { ParametrosAdminService } from './parametros-admin.service';
import { CrearParametroDto, ActualizarParametroDto, FiltroParametrosDto } from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Parámetros del Sistema')
@Controller('admin/parametros')
@UseGuards(JwtAdminGuard, RolesGuard)
export class ParametrosAdminController {
    constructor(private readonly parametrosAdminService: ParametrosAdminService) {}

    @Post()
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Crear parámetro', 'Crea un nuevo parámetro del sistema')
    @ApiResponse({ status: 201, description: 'Parámetro creado exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe un parámetro con esta clave' })
    async crear(@Body() crearParametroDto: CrearParametroDto) {
        return this.parametrosAdminService.crear(crearParametroDto);
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar parámetros', 'Obtiene la lista de parámetros del sistema')
    @ApiResponse({ status: 200, description: 'Lista de parámetros' })
    async obtenerTodos(@Query() filtros: FiltroParametrosDto) {
        return this.parametrosAdminService.obtenerTodos(filtros);
    }

    @Get('categoria/:categoria')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener por categoría', 'Obtiene parámetros por categoría')
    @ApiResponse({ status: 200, description: 'Lista de parámetros de la categoría' })
    async obtenerPorCategoria(@Param('categoria') categoria: string) {
        return this.parametrosAdminService.obtenerPorCategoria(categoria);
    }

    @Get('clave/:clave')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener por clave', 'Obtiene un parámetro por su clave')
    @ApiResponse({ status: 200, description: 'Parámetro encontrado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    async obtenerPorClave(@Param('clave') clave: string) {
        return this.parametrosAdminService.obtenerPorClave(clave);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener parámetro', 'Obtiene un parámetro por su ID')
    @ApiResponse({ status: 200, description: 'Parámetro encontrado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.parametrosAdminService.obtenerPorId(id);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar parámetro', 'Actualiza un parámetro del sistema')
    @ApiResponse({ status: 200, description: 'Parámetro actualizado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    @ApiResponse({ status: 409, description: 'El parámetro no es editable' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarParametroDto: ActualizarParametroDto,
    ) {
        return this.parametrosAdminService.actualizar(id, actualizarParametroDto);
    }

    @Delete(':id')
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Eliminar parámetro', 'Elimina un parámetro del sistema')
    @ApiResponse({ status: 200, description: 'Parámetro eliminado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    @ApiResponse({ status: 409, description: 'El parámetro no se puede eliminar' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.parametrosAdminService.eliminar(id);
    }
}
