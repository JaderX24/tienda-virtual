import { Module } from '@nestjs/common';
import { ParametrosMantenimientoController } from './parametros-mantenimiento.controller';
import { ParametrosMantenimientoService } from './parametros-mantenimiento.service';
import { PrismaModule } from '../../../prisma';
import { ParametrosSeguridadService } from '../../../common/services/global/parametros-seguridad.service';

@Module({
    imports: [PrismaModule],
    controllers: [ParametrosMantenimientoController],
    providers: [ParametrosMantenimientoService, ParametrosSeguridadService],
    exports: [ParametrosMantenimientoService],
})
export class ParametrosMantenimientoModule {}
