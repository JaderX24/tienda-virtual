import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PrismaModule } from '../../../prisma';

@Module({
    imports: [PrismaModule],
    controllers: [UsuariosController],
    providers: [UsuariosService],
    exports: [UsuariosService],
})
export class UsuariosModule {}
