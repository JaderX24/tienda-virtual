import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import {
    CrearEmpresaDto,
    ActualizarEmpresaDto,
    FiltroEmpresasDto,
    CambiarEstadoEmpresaDto,
} from './dto';
import { JwtAdminGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Empresas')
@Controller('admin/empresas')
@UseGuards(JwtAdminGuard, RolesGuard)
export class EmpresasController {
    constructor(private readonly empresasService: EmpresasService) {}

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear empresa', 'Crea una nueva empresa en el sistema')
    @ApiResponse({ status: 201, description: 'Empresa creada exitosamente' })
    @ApiResponse({ status: 409, description: 'El RTN o correo ya está registrado' })
    async crear(@Body() crearEmpresaDto: CrearEmpresaDto) {
        return this.empresasService.crear(crearEmpresaDto);
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar empresas', 'Obtiene la lista de empresas con paginación')
    @ApiResponse({ status: 200, description: 'Lista de empresas' })
    async obtenerTodas(@Query() filtros: FiltroEmpresasDto) {
        return this.empresasService.obtenerTodas(filtros);
    }

    @Get(':id/estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Estadísticas de empresa', 'Obtiene las estadísticas de una empresa')
    @ApiResponse({ status: 200, description: 'Estadísticas de la empresa' })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    async obtenerEstadisticas(@Param('id', ParsearIdPipe) id: number) {
        return this.empresasService.obtenerEstadisticas(id);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener empresa', 'Obtiene una empresa por su ID')
    @ApiResponse({ status: 200, description: 'Empresa encontrada' })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.empresasService.obtenerPorId(id);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar empresa', 'Actualiza los datos de una empresa')
    @ApiResponse({ status: 200, description: 'Empresa actualizada' })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    @ApiResponse({ status: 409, description: 'El RTN o correo ya está registrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarEmpresaDto: ActualizarEmpresaDto,
    ) {
        return this.empresasService.actualizar(id, actualizarEmpresaDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva una empresa')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoEmpresaDto,
    ) {
        return this.empresasService.cambiarEstado(id, cambiarEstadoDto.activa);
    }
}
