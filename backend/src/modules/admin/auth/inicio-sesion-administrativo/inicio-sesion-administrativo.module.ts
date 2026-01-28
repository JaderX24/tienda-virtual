import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InicioSesionAdministrativoController } from './inicio-sesion-administrativo.controller';
import { InicioSesionAdministrativoService } from './inicio-sesion-administrativo.service';
import { PrismaModule } from '../../../../prisma';

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.accessSecret'),
                signOptions: {
                    expiresIn: configService.get<string>('jwt.accessExpiracion') || '15m',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [InicioSesionAdministrativoController],
    providers: [InicioSesionAdministrativoService],
    exports: [InicioSesionAdministrativoService],
})
export class InicioSesionAdministrativoModule {}
