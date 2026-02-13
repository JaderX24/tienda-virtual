import { Module } from '@nestjs/common';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [EmpresasController],
    providers: [EmpresasService],
    exports: [EmpresasService],
})
export class EmpresasModule {}
