import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma';
import { MiPerfilColaboradorController } from './mi-perfil.controller';
import { MiPerfilColaboradorService } from './mi-perfil.service';

@Module({
    imports: [PrismaModule],
    controllers: [MiPerfilColaboradorController],
    providers: [MiPerfilColaboradorService],
})
export class MiPerfilColaboradorModule {}
