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
import { ProveedoresEnvioService } from './proveedores-envio.service';
import {
    CrearProveedorEnvioDto,
    ActualizarProveedorEnvioDto,
    FiltroProveedoresEnvioDto,
    CambiarEstadoProveedorDto,
    CambiarVisibilidadProveedorDto,
    CrearContactoProveedorDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Proveedores de Envío')
@Controller('admin/proveedores-envio')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProveedoresEnvioController {
    constructor(private readonly proveedoresService: ProveedoresEnvioService) {}

    @Get('resumen')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Resumen de proveedores', 'Obtiene el resumen estadístico de los proveedores de envío')
    @ApiResponse({ status: 200, description: 'Resumen de proveedores de envío' })
    async obtenerResumen() {
        return this.proveedoresService.obtenerResumen();
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar proveedores', 'Obtiene la lista de proveedores de envío con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de proveedores de envío' })
    async obtenerTodos(@Query() filtros: FiltroProveedoresEnvioDto) {
        return this.proveedoresService.obtenerTodos(filtros);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener proveedor', 'Obtiene un proveedor de envío por su ID')
    @ApiResponse({ status: 200, description: 'Proveedor de envío encontrado' })
    @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.proveedoresService.obtenerPorId(id);
    }

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear proveedor', 'Crea un nuevo proveedor de envío en el sistema')
    @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe un proveedor con este código' })
    async crear(@Body() crearProveedorDto: CrearProveedorEnvioDto) {
        return this.proveedoresService.crear(crearProveedorDto);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar proveedor', 'Actualiza los datos de un proveedor de envío')
    @ApiResponse({ status: 200, description: 'Proveedor actualizado' })
    @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
    @ApiResponse({ status: 409, description: 'Ya existe un proveedor con este código' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarProveedorDto: ActualizarProveedorEnvioDto,
    ) {
        return this.proveedoresService.actualizar(id, actualizarProveedorDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva un proveedor de envío')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoProveedorDto,
    ) {
        return this.proveedoresService.cambiarEstado(id, cambiarEstadoDto.esActivo);
    }

    @Patch(':id/visibilidad')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar visibilidad', 'Muestra u oculta un proveedor de envío al cliente')
    @ApiResponse({ status: 200, description: 'Visibilidad actualizada' })
    @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
    async cambiarVisibilidad(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarVisibilidadDto: CambiarVisibilidadProveedorDto,
    ) {
        return this.proveedoresService.cambiarVisibilidad(id, cambiarVisibilidadDto.esVisible);
    }

    // Endpoints de contactos
    @Post(':id/contactos')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Agregar contacto', 'Agrega una persona de contacto al proveedor')
    @ApiResponse({ status: 201, description: 'Contacto agregado exitosamente' })
    @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
    async agregarContacto(
        @Param('id', ParsearIdPipe) id: number,
        @Body() contactoDto: CrearContactoProveedorDto,
    ) {
        return this.proveedoresService.agregarContacto(id, contactoDto);
    }

    @Patch(':id/contactos/:contactoId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar contacto', 'Actualiza los datos de un contacto del proveedor')
    @ApiResponse({ status: 200, description: 'Contacto actualizado' })
    @ApiResponse({ status: 404, description: 'Contacto no encontrado' })
    async actualizarContacto(
        @Param('id', ParsearIdPipe) id: number,
        @Param('contactoId', ParsearIdPipe) contactoId: number,
        @Body() contactoDto: CrearContactoProveedorDto,
    ) {
        return this.proveedoresService.actualizarContacto(id, contactoId, contactoDto);
    }

    @Delete(':id/contactos/:contactoId')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Eliminar contacto', 'Elimina una persona de contacto del proveedor')
    @ApiResponse({ status: 200, description: 'Contacto eliminado' })
    @ApiResponse({ status: 404, description: 'Contacto no encontrado' })
    async eliminarContacto(
        @Param('id', ParsearIdPipe) id: number,
        @Param('contactoId', ParsearIdPipe) contactoId: number,
    ) {
        return this.proveedoresService.eliminarContacto(id, contactoId);
    }
}
