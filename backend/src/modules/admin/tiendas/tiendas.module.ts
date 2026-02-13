import { Module } from '@nestjs/common';
import { TiendasController } from './tiendas.controller';
import { TiendasService } from './tiendas.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [TiendasController],
    providers: [TiendasService],
    exports: [TiendasService],
})
export class TiendasModule {}
