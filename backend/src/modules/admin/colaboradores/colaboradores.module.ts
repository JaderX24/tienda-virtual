import { Module } from '@nestjs/common';
import { ColaboradoresController } from './colaboradores.controller';
import { ColaboradoresService } from './colaboradores.service';
import { ColabRolesPermisosController } from './colab-roles-permisos.controller';
import { ColabRolesPermisosService } from './colab-roles-permisos.service';
import { PrismaModule } from '../../../prisma';
import { CorreoService } from '../../../common/services';

@Module({
    imports: [PrismaModule],
    controllers: [ColaboradoresController, ColabRolesPermisosController],
    providers: [ColaboradoresService, ColabRolesPermisosService, CorreoService],
    exports: [ColaboradoresService, ColabRolesPermisosService],
})
export class ColaboradoresModule {}
