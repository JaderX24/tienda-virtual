import { Module } from '@nestjs/common';
import { DashboardColaboradorController } from './dashboard-colaborador.controller';
import { DashboardColaboradorService } from './dashboard-colaborador.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [DashboardColaboradorController],
    providers: [DashboardColaboradorService],
    exports: [DashboardColaboradorService],
})
export class DashboardColaboradorModule {}
