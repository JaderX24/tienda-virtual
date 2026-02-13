import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MetodosPagoController } from './metodos-pago.controller';
import { MetodosPagoService } from './metodos-pago.service';

@Module({
    imports: [PrismaModule],
    controllers: [MetodosPagoController],
    providers: [MetodosPagoService],
    exports: [MetodosPagoService],
})
export class MetodosPagoModule {}
