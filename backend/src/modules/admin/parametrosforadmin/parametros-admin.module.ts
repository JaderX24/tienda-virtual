import { Module } from '@nestjs/common';
import { ParametrosAdminController } from './parametros-admin.controller';
import { ParametrosAdminService } from './parametros-admin.service';
import { PrismaModule } from '../../../prisma';
import { ParametrosSeguridadService } from '../../../common/services/global/parametros-seguridad.service';

@Module({
    imports: [PrismaModule],
    controllers: [ParametrosAdminController],
    providers: [ParametrosAdminService, ParametrosSeguridadService],
    exports: [ParametrosAdminService],
})
export class ParametrosAdminModule {}
