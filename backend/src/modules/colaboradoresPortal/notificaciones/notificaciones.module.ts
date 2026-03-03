import { Module } from '@nestjs/common';
import { NotificacionesColaboradorController } from './notificaciones.controller';
import { NotificacionesColaboradorService } from './notificaciones.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [NotificacionesColaboradorController],
    providers: [NotificacionesColaboradorService],
    exports: [NotificacionesColaboradorService],
})
export class NotificacionesColaboradorModule {}
