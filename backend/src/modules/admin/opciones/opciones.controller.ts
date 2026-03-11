import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminGuard } from '../../../common/guards';
import { OpcionesService } from './opciones.service';

@ApiTags('Opciones de Catálogos')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard)
@Controller('admin/opciones')
export class OpcionesController {
    constructor(private readonly opcionesService: OpcionesService) {}

    @Get()
    @ApiOperation({ summary: 'Obtener todos los catálogos agrupados' })
    async obtenerTodas() {
        return this.opcionesService.obtenerTodas();
    }

    @Get(':grupo')
    @ApiOperation({ summary: 'Obtener opciones de un catálogo específico' })
    async obtenerPorGrupo(@Param('grupo') grupo: string) {
        return this.opcionesService.obtenerPorGrupo(grupo);
    }
}
