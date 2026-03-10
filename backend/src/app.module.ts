import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import {
    appConfig,
    databaseConfig,
    jwtConfig,
    seguridadConfig,
    correoConfig,
    archivosConfig,
    validarVariablesEntorno,
} from './config';

import { PrismaModule } from './prisma';
import {
    FiltroExcepcionesGlobal,
    ManejadorExcepcionesAdmin,
    ManejadorExcepcionesColab,
} from './common/filters';
import {
    LoggingInterceptor,
    TransformadorRespuestaInterceptor,
    AuditoriaAdminInterceptor,
    ActividadSesionInterceptor,
} from './common/interceptors';
import {
    CorrelacionIdMiddleware,
    SanitizarHeadersMiddleware,
    ValidarContentTypeMiddleware,
    RegistroPeticionAdminMiddleware,
    RegistroPeticionColabMiddleware,
} from './common/middlewares';


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
            validate: validarVariablesEntorno,
            load: [
                appConfig,
                databaseConfig,
                jwtConfig,
                seguridadConfig,
                correoConfig,
                archivosConfig,
            ],
        }),

        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ([{
                ttl: configService.get<number>('seguridad.rateLimitTtl', 60) * 1000,
                limit: configService.get<number>('seguridad.rateLimitMax', 100),
            }]),
        }),

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
        ManejadorExcepcionesAdmin,
        ManejadorExcepcionesColab,
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
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditoriaAdminInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ActividadSesionInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Middlewares globales para todas las rutas
        consumer
            .apply(
                CorrelacionIdMiddleware,
                SanitizarHeadersMiddleware,
                ValidarContentTypeMiddleware,
            )
            .forRoutes('*');

        // Middlewares del portal administrativo
        consumer
            .apply(RegistroPeticionAdminMiddleware)
            .forRoutes('admin/*path');

        // Middlewares del portal de colaboradores
        consumer
            .apply(RegistroPeticionColabMiddleware)
            .forRoutes('colaborador/*path');
    }
}
