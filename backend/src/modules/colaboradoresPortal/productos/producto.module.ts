import { Module } from '@nestjs/common';
import { ProductoColaboradorController } from './producto.controller';
import { ProductoColaboradorService } from './producto.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [ProductoColaboradorController],
    providers: [ProductoColaboradorService],
    exports: [ProductoColaboradorService],
})
export class ProductoColaboradorModule {}
