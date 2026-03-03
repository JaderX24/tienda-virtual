import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import {
    appConfig,
    databaseConfig,
    jwtConfig,
    seguridadConfig,
    correoConfig,
    archivosConfig,
} from './config';

import { PrismaModule } from './prisma';
import { FiltroExcepcionesGlobal } from './common/filters';
import { LoggingInterceptor, TransformadorRespuestaInterceptor } from './common/interceptors';
import { CorrelacionIdMiddleware } from './common/middlewares';
import { JwtAuthGuard } from './common/guards';

import { AdminModule } from './modules/admin';
import { AuthColaboradorModule } from './modules/colaboradoresPortal/auth';
import { DashboardColaboradorModule } from './modules/colaboradoresPortal/dashboard';
import { MiTurnoModule } from './modules/colaboradoresPortal/miturno';
import { InventarioColaboradorModule } from './modules/colaboradoresPortal/inventario';
import { TransferenciaColaboradorModule } from './modules/colaboradoresPortal/transferencia';
import { ConteoColaboradorModule } from './modules/colaboradoresPortal/conteos';
import { ProductoColaboradorModule } from './modules/colaboradoresPortal/productos';
import { ReportesColaboradorModule } from './modules/colaboradoresPortal/reportes';
import { MiActividadColaboradorModule } from './modules/colaboradoresPortal/miactividad';
import { NotificacionesColaboradorModule } from './modules/colaboradoresPortal/notificaciones';
import { MiPerfilColaboradorModule } from './modules/colaboradoresPortal/miperfilcolab';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            cache: true,
            load: [
                appConfig,
                databaseConfig,
                jwtConfig,
                seguridadConfig,
                correoConfig,
                archivosConfig,
            ],
        }),

        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),

        PrismaModule,

        AdminModule,
        AuthColaboradorModule,
        DashboardColaboradorModule,
        MiTurnoModule,
        InventarioColaboradorModule,
        TransferenciaColaboradorModule,
        ConteoColaboradorModule,
        ProductoColaboradorModule,
        ReportesColaboradorModule,
        MiActividadColaboradorModule,
        NotificacionesColaboradorModule,
        MiPerfilColaboradorModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_FILTER,
            useClass: FiltroExcepcionesGlobal,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformadorRespuestaInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CorrelacionIdMiddleware).forRoutes('*');
    }
}
