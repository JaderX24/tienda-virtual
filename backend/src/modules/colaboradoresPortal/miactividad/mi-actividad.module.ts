import { Module } from '@nestjs/common';
import { MiActividadColaboradorController } from './mi-actividad.controller';
import { MiActividadColaboradorService } from './mi-actividad.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [MiActividadColaboradorController],
    providers: [MiActividadColaboradorService],
    exports: [MiActividadColaboradorService],
})
export class MiActividadColaboradorModule {}
