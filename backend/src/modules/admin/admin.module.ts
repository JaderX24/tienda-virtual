import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InicioSesionAdministrativoModule } from './auth/inicio-sesion-administrativo';
import { UsuariosModule } from './usuarios';
import { RolesModule } from './roles';
import { PermisosModule } from './permisos';
import { GeneralModule } from './general';
import { EmpresasModule } from './empresas/empresas.module';
import { TiendasModule } from './tiendas/tiendas.module';
import { MetodosPagoModule } from './metodosPago/metodos-pago.module';
import { ProveedoresEnvioModule } from './enviosProveedores/proveedores-envio.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { ColaboradoresRolesPermisosModule } from './colaboradoresRolesPermisos/colaboradores-roles-permisos.module';

@Module({
    imports: [
        InicioSesionAdministrativoModule,
        UsuariosModule,
        RolesModule,
        PermisosModule,
        GeneralModule,
        EmpresasModule,
        TiendasModule,
        MetodosPagoModule,
        ProveedoresEnvioModule,
        ColaboradoresModule,
        ColaboradoresRolesPermisosModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
