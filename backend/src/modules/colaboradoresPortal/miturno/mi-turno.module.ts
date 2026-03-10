import { Module } from '@nestjs/common';
import { MiTurnoController } from './mi-turno.controller';
import { MiTurnoService } from './mi-turno.service';
import { PrismaModule } from '../../../prisma';
import { ParametrosSeguridadService } from '../../../common/services';

@Module({
    imports: [PrismaModule],
    controllers: [MiTurnoController],
    providers: [MiTurnoService, ParametrosSeguridadService],
    exports: [MiTurnoService],
})
export class MiTurnoModule {}
