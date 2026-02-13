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
import { GeneralService } from './general.service';
import { CrearParametroDto, ActualizarParametroDto, FiltroParametrosDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Configuración General')
@Controller('admin/general')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeneralController {
    constructor(private readonly generalService: GeneralService) {}

    @Post('parametros')
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Crear parámetro', 'Crea un nuevo parámetro del sistema')
    @ApiResponse({ status: 201, description: 'Parámetro creado exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe un parámetro con esta clave' })
    async crear(@Body() crearParametroDto: CrearParametroDto) {
        return this.generalService.crear(crearParametroDto);
    }

    @Get('parametros')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Listar parámetros', 'Obtiene la lista de parámetros del sistema')
    @ApiResponse({ status: 200, description: 'Lista de parámetros' })
    async obtenerTodos(@Query() filtros: FiltroParametrosDto) {
        return this.generalService.obtenerTodos(filtros);
    }

    @Get('parametros/categoria/:categoria')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener por categoría', 'Obtiene parámetros por categoría')
    @ApiResponse({ status: 200, description: 'Lista de parámetros de la categoría' })
    async obtenerPorCategoria(@Param('categoria') categoria: string) {
        return this.generalService.obtenerPorCategoria(categoria);
    }

    @Get('parametros/clave/:clave')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener por clave', 'Obtiene un parámetro por su clave')
    @ApiResponse({ status: 200, description: 'Parámetro encontrado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    async obtenerPorClave(@Param('clave') clave: string) {
        return this.generalService.obtenerPorClave(clave);
    }

    @Get('parametros/:id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Obtener parámetro', 'Obtiene un parámetro por su ID')
    @ApiResponse({ status: 200, description: 'Parámetro encontrado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.generalService.obtenerPorId(id);
    }

    @Patch('parametros/:id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar parámetro', 'Actualiza un parámetro del sistema')
    @ApiResponse({ status: 200, description: 'Parámetro actualizado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    @ApiResponse({ status: 409, description: 'El parámetro no es editable' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarParametroDto: ActualizarParametroDto,
    ) {
        return this.generalService.actualizar(id, actualizarParametroDto);
    }

    @Delete('parametros/:id')
    @Roles(ROLES.SUPER_ADMIN)
    @ApiOperacionProtegida('Eliminar parámetro', 'Elimina un parámetro del sistema')
    @ApiResponse({ status: 200, description: 'Parámetro eliminado' })
    @ApiResponse({ status: 404, description: 'Parámetro no encontrado' })
    @ApiResponse({ status: 409, description: 'El parámetro no se puede eliminar' })
    async eliminar(@Param('id', ParsearIdPipe) id: number) {
        return this.generalService.eliminar(id);
    }

    @Post('parametros/inicializar')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Inicializar parámetros', 'Inicializa los parámetros por defecto del sistema')
    @ApiResponse({ status: 200, description: 'Parámetros inicializados' })
    async inicializarParametros() {
        return this.generalService.inicializarParametrosPorDefecto();
    }
}
