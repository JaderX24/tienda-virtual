import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InicioSesionAdministrativoModule } from './auth/inicio-sesion-administrativo';
import { UsuariosModule } from './usuarios';
import { RolesModule } from './roles';

@Module({
    imports: [
        InicioSesionAdministrativoModule,
        UsuariosModule,
        RolesModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
