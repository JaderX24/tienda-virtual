import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthColaboradorController } from './auth-colaborador.controller';
import { AuthColaboradorService } from './auth-colaborador.service';
import { PrismaModule } from '../../../prisma';
import { JwtStrategy } from '../../../common/strategies';

@Module({
    imports: [
        PrismaModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
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
    controllers: [AuthColaboradorController],
    providers: [AuthColaboradorService, JwtStrategy],
    exports: [AuthColaboradorService, PassportModule, JwtStrategy],
})
export class AuthColaboradorModule {}
