import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InicioSesionAdministrativoController } from './inicio-sesion-administrativo.controller';
import { InicioSesionAdministrativoService } from './inicio-sesion-administrativo.service';
import { PrismaModule } from '../../../../prisma';
import { JwtAdminStrategy } from '../../../../common/strategies';
import { ParametrosSeguridadService } from '../../../../common/services';
import { AdminModulosModule } from '../../layout/sidebar/admin-modulos.module';

@Module({
    imports: [
        PrismaModule,
        AdminModulosModule,
        PassportModule.register({ defaultStrategy: 'jwt-admin' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.adminAccessSecret'),
                signOptions: {
                    expiresIn: configService.get<string>('jwt.adminAccessExpiracion'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [InicioSesionAdministrativoController],
    providers: [InicioSesionAdministrativoService, JwtAdminStrategy, ParametrosSeguridadService],
    exports: [InicioSesionAdministrativoService, PassportModule, JwtAdminStrategy],
})
export class InicioSesionAdministrativoModule {}
