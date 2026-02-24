import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ProductosAdminController } from './productos-admin.controller';
import { ProductosAdminService } from './productos-admin.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProductosAdminController],
    providers: [ProductosAdminService],
    exports: [ProductosAdminService],
})
export class ProductosAdminModule {}
