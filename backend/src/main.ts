import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configuracionSwagger } from './config';
import { SanitizarHtmlPipe } from './common/pipes';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    // Permite inyección de dependencias en validadores de class-validator
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    const configService = app.get(ConfigService);
    const puerto = configService.get<number>('app.puerto')!;
    const entorno = configService.get<string>('app.entorno')!;
    const corsOrigenRaw = configService.get<string>('seguridad.corsOrigen')!;
    const corsOrigen = corsOrigenRaw.includes(',') ? corsOrigenRaw.split(',').map(o => o.trim()) : corsOrigenRaw;

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

    app.useGlobalPipes(
        new SanitizarHtmlPipe(),
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            validationError: {
                target: false,
                value: false,
            },
        }),
    );

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

    await app.listen(puerto, '0.0.0.0');

    logger.log(`🚀 Servidor iniciado en: http://localhost:${puerto}`);
    logger.log(`📝 Entorno: ${entorno}`);
    logger.log(`🔗 API Base URL: http://localhost:${puerto}/api/v1`);
}

bootstrap();
