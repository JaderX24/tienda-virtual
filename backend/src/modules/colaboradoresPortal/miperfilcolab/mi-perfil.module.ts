import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma';
import { MiPerfilColaboradorController } from './mi-perfil.controller';
import { MiPerfilColaboradorService } from './mi-perfil.service';
import { AuthColaboradorModule } from '../auth/auth-colaborador.module';
import { ParametrosSeguridadService } from '../../../common/services';

@Module({
    imports: [PrismaModule, AuthColaboradorModule],
    controllers: [MiPerfilColaboradorController],
    providers: [MiPerfilColaboradorService, ParametrosSeguridadService],
})
export class MiPerfilColaboradorModule {}
