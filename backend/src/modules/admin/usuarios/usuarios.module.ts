import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PrismaModule } from '../../../prisma';
import { CorreoAdminService, CorreoService, ParametrosSeguridadService } from '../../../common/services';

@Module({
    imports: [PrismaModule],
    controllers: [UsuariosController],
    providers: [UsuariosService, CorreoAdminService, CorreoService, ParametrosSeguridadService],
    exports: [UsuariosService],
})
export class UsuariosModule {}
