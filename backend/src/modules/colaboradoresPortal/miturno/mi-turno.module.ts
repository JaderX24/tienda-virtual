import { Module } from '@nestjs/common';
import { MiTurnoController } from './mi-turno.controller';
import { MiTurnoService } from './mi-turno.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [MiTurnoController],
    providers: [MiTurnoService],
    exports: [MiTurnoService],
})
export class MiTurnoModule {}
