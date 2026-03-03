import { Module } from '@nestjs/common';
import { ReportesColaboradorController } from './reportes.controller';
import { ReportesColaboradorService } from './reportes.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [ReportesColaboradorController],
    providers: [ReportesColaboradorService],
    exports: [ReportesColaboradorService],
})
export class ReportesColaboradorModule {}
