import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma';
import { ColabModulosController } from './colab-modulos.controller';
import { ColabModulosService } from './colab-modulos.service';
import { ColabRolesController } from './colab-roles.controller';
import { ColabRolesService } from './colab-roles.service';
import { ColabPermisosController } from './colab-permisos.controller';
import { ColabPermisosService } from './colab-permisos.service';

@Module({
    imports: [PrismaModule],
    controllers: [
        ColabModulosController,
        ColabRolesController,
        ColabPermisosController,
    ],
    providers: [
        ColabModulosService,
        ColabRolesService,
        ColabPermisosService,
    ],
    exports: [
        ColabModulosService,
        ColabRolesService,
        ColabPermisosService,
    ],
})
export class ColaboradoresRolesPermisosModule {}
