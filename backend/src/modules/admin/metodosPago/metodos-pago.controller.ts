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
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { MetodosPagoService } from './metodos-pago.service';
import {
    CrearPasarelaDto,
    ActualizarPasarelaDto,
    FiltroPasarelasDto,
    CambiarEstadoPasarelaDto,
    CambiarVisibilidadPasarelaDto,
    ActualizarOrdenDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles, ApiOperacionProtegida } from '../../../common/decorators';
import { ParsearIdPipe } from '../../../common/pipes';
import { ROLES } from '../../../common/constants';

@ApiTags('Admin - Métodos de Pago')
@Controller('admin/metodos-pago')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetodosPagoController {
    constructor(private readonly metodosPagoService: MetodosPagoService) {}

    @Get('resumen')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Resumen de pasarelas', 'Obtiene el resumen estadístico de las pasarelas de pago')
    @ApiResponse({ status: 200, description: 'Resumen de pasarelas de pago' })
    async obtenerResumen() {
        return this.metodosPagoService.obtenerResumen();
    }

    @Get()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Listar pasarelas', 'Obtiene la lista de pasarelas de pago con paginación y filtros')
    @ApiResponse({ status: 200, description: 'Lista de pasarelas de pago' })
    async obtenerTodas(@Query() filtros: FiltroPasarelasDto) {
        return this.metodosPagoService.obtenerTodas(filtros);
    }

    @Get(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE)
    @ApiOperacionProtegida('Obtener pasarela', 'Obtiene una pasarela de pago por su ID')
    @ApiResponse({ status: 200, description: 'Pasarela de pago encontrada' })
    @ApiResponse({ status: 404, description: 'Pasarela no encontrada' })
    async obtenerPorId(@Param('id', ParsearIdPipe) id: number) {
        return this.metodosPagoService.obtenerPorId(id);
    }

    @Post()
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Crear pasarela', 'Crea una nueva pasarela de pago en el sistema')
    @ApiResponse({ status: 201, description: 'Pasarela creada exitosamente' })
    @ApiResponse({ status: 409, description: 'Ya existe una pasarela con este código' })
    async crear(@Body() crearPasarelaDto: CrearPasarelaDto) {
        return this.metodosPagoService.crear(crearPasarelaDto);
    }

    @Patch('orden-prioridad')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar orden', 'Actualiza el orden de prioridad de las pasarelas')
    @ApiResponse({ status: 200, description: 'Orden de prioridad actualizado' })
    async actualizarOrdenPrioridad(@Body() actualizarOrdenDto: ActualizarOrdenDto) {
        return this.metodosPagoService.actualizarOrdenPrioridad(actualizarOrdenDto.pasarelas);
    }

    @Patch(':id')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Actualizar pasarela', 'Actualiza los datos de una pasarela de pago')
    @ApiResponse({ status: 200, description: 'Pasarela actualizada' })
    @ApiResponse({ status: 404, description: 'Pasarela no encontrada' })
    @ApiResponse({ status: 409, description: 'Ya existe una pasarela con este código' })
    async actualizar(
        @Param('id', ParsearIdPipe) id: number,
        @Body() actualizarPasarelaDto: ActualizarPasarelaDto,
    ) {
        return this.metodosPagoService.actualizar(id, actualizarPasarelaDto);
    }

    @Patch(':id/estado')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar estado', 'Activa o desactiva una pasarela de pago')
    @ApiResponse({ status: 200, description: 'Estado actualizado' })
    @ApiResponse({ status: 404, description: 'Pasarela no encontrada' })
    async cambiarEstado(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarEstadoDto: CambiarEstadoPasarelaDto,
    ) {
        return this.metodosPagoService.cambiarEstado(id, cambiarEstadoDto.esActivo);
    }

    @Patch(':id/visibilidad')
    @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
    @ApiOperacionProtegida('Cambiar visibilidad', 'Muestra u oculta una pasarela de pago al cliente')
    @ApiResponse({ status: 200, description: 'Visibilidad actualizada' })
    @ApiResponse({ status: 404, description: 'Pasarela no encontrada' })
    async cambiarVisibilidad(
        @Param('id', ParsearIdPipe) id: number,
        @Body() cambiarVisibilidadDto: CambiarVisibilidadPasarelaDto,
    ) {
        return this.metodosPagoService.cambiarVisibilidad(id, cambiarVisibilidadDto.esVisibleCliente);
    }
}
