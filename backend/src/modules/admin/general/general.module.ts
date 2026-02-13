import { Module } from '@nestjs/common';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [GeneralController],
    providers: [GeneralService],
    exports: [GeneralService],
})
export class GeneralModule {}
