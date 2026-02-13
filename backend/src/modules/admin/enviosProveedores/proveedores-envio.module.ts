import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ProveedoresEnvioController } from './proveedores-envio.controller';
import { ProveedoresEnvioService } from './proveedores-envio.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProveedoresEnvioController],
    providers: [ProveedoresEnvioService],
    exports: [ProveedoresEnvioService],
})
export class ProveedoresEnvioModule {}
