import { Module } from '@nestjs/common';
import { ConteoController } from './conteo.controller';
import { ConteoService } from './conteo.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [ConteoController],
    providers: [ConteoService],
    exports: [ConteoService],
})
export class ConteoColaboradorModule {}
