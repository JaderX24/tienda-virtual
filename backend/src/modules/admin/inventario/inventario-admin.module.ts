import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { InventarioAdminController } from './inventario-admin.controller';
import { InventarioAdminService } from './inventario-admin.service';

@Module({
    imports: [PrismaModule],
    controllers: [InventarioAdminController],
    providers: [InventarioAdminService],
    exports: [InventarioAdminService],
})
export class InventarioAdminModule {}
