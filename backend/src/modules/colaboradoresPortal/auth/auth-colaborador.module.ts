import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthColaboradorController } from './auth-colaborador.controller';
import { AuthColaboradorService } from './auth-colaborador.service';
import { DobleFactorService } from './doble-factor.service';
import { PrismaModule } from '../../../prisma';
import { JwtColaboradorStrategy } from '../../../common/strategies';
import { CorreoColaboradorService, CorreoService, ParametrosSeguridadService } from '../../../common/services';

@Module({
    imports: [
        PrismaModule,
        PassportModule.register({ defaultStrategy: 'jwt-colaborador' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.colabAccessSecret'),
                signOptions: {
                    expiresIn: configService.get<string>('jwt.colabAccessExpiracion'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthColaboradorController],
    providers: [
        AuthColaboradorService,
        DobleFactorService,
        CorreoColaboradorService,
        CorreoService,
        ParametrosSeguridadService,
        JwtColaboradorStrategy,
    ],
    exports: [AuthColaboradorService, DobleFactorService, PassportModule, JwtColaboradorStrategy],
})
export class AuthColaboradorModule {}
