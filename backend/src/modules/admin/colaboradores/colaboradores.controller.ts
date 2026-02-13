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
import { ColaboradoresService } from './colaboradores.service';
import {
    CrearColaboradorDto,
    ActualizarColaboradorDto,
    FiltroColaboradoresDto,
    CambiarEstadoColaboradorDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Colaboradores')
@Controller('admin/colaboradores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ColaboradoresController {
    constructor(private readonly colaboradoresService: ColaboradoresService) {}

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear colaborador', 'Crea un nuevo colaborador en el sistema')
    @ApiResponse({ status: 201, description: 'Colaborador creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El correo o código ya está registrado' })
    async crear(@Body() crearColaboradorDto: CrearColaboradorDto) {
        return this.colaboradoresService.crear(crearColaboradorDto);
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar colaboradores', 'Obtiene la lista de colaboradores con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de colaboradores' })
    async obtenerTodos(@Query() filtros: FiltroColaboradoresDto) {
        return this.colaboradoresService.obtenerTodos(filtros);
    }

    @Get('roles')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar roles de colaborador', 'Obtiene los roles disponibles para colaboradores')
    @ApiResponse({ status: 200, description: 'Lista de roles' })
    async obtenerRoles() {
        return this.colaboradoresService.obtenerRoles();
    }

    @Get('estadisticas')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Estadísticas de colaboradores', 'Obtiene estadísticas generales de colaboradores')
    @ApiResponse({ status: 200, description: 'Estadísticas de colaboradores' })
    async obtenerEstadisticas() {
        return this.colaboradoresService.obtenerEstadisticas();
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener colaborador', 'Obtiene un colaborador por su ID')
    @ApiResponse({ status: 200, description: 'Colaborador encontrado' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.colaboradoresService.obtenerPorId(id);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar colaborador', 'Actualiza los datos de un colaborador')
    @ApiResponse({ status: 200, description: 'Colaborador actualizado' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    @ApiResponse({ status: 409, description: 'El correo o identidad ya está registrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarColaboradorDto: ActualizarColaboradorDto,
    ) {
        return this.colaboradoresService.actualizar(id, actualizarColaboradorDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva un colaborador')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Colaborador no encontrado' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoColaboradorDto,
    ) {
        return this.colaboradoresService.cambiarEstado(
            id,
            cambiarEstadoDto.activo,
            cambiarEstadoDto.motivoInactivacion,
        );
    }

    @Post(':id/roles/:rolId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Asignar rol', 'Asigna un rol a un colaborador')
    @ApiResponse({ status: 201, description: 'Rol asignado exitosamente' })
    @ApiResponse({ status: 404, description: 'Colaborador o rol no encontrado' })
    @ApiResponse({ status: 409, description: 'El colaborador ya tiene este rol' })
    async asignarRol(
        @Param('id', ParsearIdPipe) id: number,
        @Param('rolId', ParsearIdPipe) rolId: number,
        @Body() body: { esPrincipal?: boolean },
    ) {
        return this.colaboradoresService.asignarRol(id, rolId, body.esPrincipal);
    }

    @Delete(':id/roles/:rolId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Remover rol', 'Remueve un rol de un colaborador')
    @ApiResponse({ status: 200, description: 'Rol removido exitosamente' })
    @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
    async removerRol(
        @Param('id', ParsearIdPipe) id: number,
        @Param('rolId', ParsearIdPipe) rolId: number,
    ) {
        return this.colaboradoresService.removerRol(id, rolId);
    }
}
