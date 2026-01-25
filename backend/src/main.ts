import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configuracionSwagger } from './config';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const puerto = configService.get<number>('app.puerto') || 3000;
    const entorno = configService.get<string>('app.entorno') || 'desarrollo';
    const corsOrigen = configService.get<string>('seguridad.corsOrigen') || 'http://localhost:4200';

    app.use(helmet({
        contentSecurityPolicy: entorno === 'produccion',
        crossOriginEmbedderPolicy: entorno === 'produccion',
    }));

    app.enableCors({
        origin: corsOrigen,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Correlacion-Id'],
        credentials: true,
        maxAge: 86400,
    });

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: false,
        },
        validationError: {
            target: false,
            value: false,
        },
    }));

    if (entorno !== 'produccion') {
        const documento = SwaggerModule.createDocument(app, configuracionSwagger);
        SwaggerModule.setup('api/docs', app, documento, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
            },
        });
        logger.log(`Documentación Swagger disponible en: http://localhost:${puerto}/api/docs`);
    }

    await app.listen(puerto);

    logger.log(`🚀 Servidor iniciado en: http://localhost:${puerto}`);
    logger.log(`📝 Entorno: ${entorno}`);
    logger.log(`🔗 API Base URL: http://localhost:${puerto}/api/v1`);
}

bootstrap();
