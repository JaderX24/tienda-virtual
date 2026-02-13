import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PrismaModule } from '../../../prisma';
import { CorreoService } from '../../../common/services';

@Module({
    imports: [PrismaModule],
    controllers: [UsuariosController],
    providers: [UsuariosService, CorreoService],
    exports: [UsuariosService],
})
export class UsuariosModule {}
