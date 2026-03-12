import { Module } from '@nestjs/common';
import { AdminModulosService } from './admin-modulos.service';
import { AdminModulosController } from './admin-modulos.controller';
import { PrismaModule } from '../../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminModulosController],
    providers: [AdminModulosService],
    exports: [AdminModulosService],
})
export class AdminModulosModule {}
