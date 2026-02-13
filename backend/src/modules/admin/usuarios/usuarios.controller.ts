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
import { UsuariosService } from './usuarios.service';
import { 
    CrearUsuarioDto, 
    ActualizarUsuarioDto, 
    FiltroUsuariosDto,
    CambiarContrasenaDto,
    CambiarEstadoDto 
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida, UsuarioActual } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Usuarios')
@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear usuario', 'Crea un nuevo usuario en el sistema')
    @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El correo ya está registrado' })
    async crear(@Body() crearUsuarioDto: CrearUsuarioDto) {
        return this.usuariosService.crear(crearUsuarioDto);
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar usuarios', 'Obtiene la lista de usuarios con paginación')
    @ApiResponse({ status: 200, description: 'Lista de usuarios' })
    async obtenerTodos(@Query() filtros: FiltroUsuariosDto) {
        return this.usuariosService.obtenerTodos(filtros);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener usuario', 'Obtiene un usuario por su ID')
    @ApiResponse({ status: 200, description: 'Usuario encontrado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.usuariosService.obtenerPorId(id);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar usuario', 'Actualiza los datos de un usuario')
    @ApiResponse({ status: 200, description: 'Usuario actualizado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarUsuarioDto: ActualizarUsuarioDto,
    ) {
        return this.usuariosService.actualizar(id, actualizarUsuarioDto);
    }

    @Patch(':id/contrasena')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar contraseña', 'Cambia la contraseña de un usuario')
    @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async cambiarContrasena(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarContrasenaDto: CambiarContrasenaDto,
    ) {
        return this.usuariosService.cambiarContrasena(id, cambiarContrasenaDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva un usuario')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoDto,
    ) {
        return this.usuariosService.cambiarEstado(id, cambiarEstadoDto.activo);
    }
}
