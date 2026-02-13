import { Module } from '@nestjs/common';
import { PermisosController } from './permisos.controller';
import { PermisosService } from './permisos.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PermisosController],
    providers: [PermisosService],
    exports: [PermisosService],
})
export class PermisosModule {}
