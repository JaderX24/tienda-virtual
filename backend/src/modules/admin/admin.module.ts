import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InicioSesionAdministrativoModule } from './auth/inicio-sesion-administrativo';
import { UsuariosModule } from './usuarios';
import { RolesModule } from './roles';
import { PermisosModule } from './permisos';
import { ParametrosMantenimientoModule } from './parametrosForAdminMantenimiento';
import { EmpresasModule } from './empresas/empresas.module';
import { TiendasModule } from './tiendas/tiendas.module';
import { MetodosPagoModule } from './metodosPago/metodos-pago.module';
import { ProveedoresEnvioModule } from './enviosProveedores/proveedores-envio.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { ColaboradoresRolesPermisosModule } from './colaboradoresRolesPermisos/colaboradores-roles-permisos.module';
import { ProductosAdminModule } from './productos/productos-admin.module';
import { InventarioAdminModule } from './inventario/inventario-admin.module';
import { CategoriasAdminModule } from './categoria/categorias-admin.module';
import { MarcasAdminModule } from './marcas/marcas-admin.module';
import { OpcionesModule } from './opciones';

@Module({
    imports: [
        InicioSesionAdministrativoModule,
        UsuariosModule,
        RolesModule,
        PermisosModule,
        ParametrosMantenimientoModule,
        EmpresasModule,
        TiendasModule,
        MetodosPagoModule,
        ProveedoresEnvioModule,
        ColaboradoresModule,
        ColaboradoresRolesPermisosModule,
        ProductosAdminModule,
        InventarioAdminModule,
        CategoriasAdminModule,
        MarcasAdminModule,
        OpcionesModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
