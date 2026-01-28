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

import { AuthModule } from './modules/auth';
import { ProductosModule } from './modules/productos';
import { CategoriasModule } from './modules/categorias';
import { InventarioModule } from './modules/inventario';
import { PedidosModule } from './modules/pedidos';
import { PagosModule } from './modules/pagos';
import { EnviosModule } from './modules/envios';
import { NotificacionesModule } from './modules/notificaciones';
import { AdminModule } from './modules/admin';

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

        AuthModule,
        ProductosModule,
        CategoriasModule,
        InventarioModule,
        PedidosModule,
        PagosModule,
        EnviosModule,
        NotificacionesModule,
        AdminModule,
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
