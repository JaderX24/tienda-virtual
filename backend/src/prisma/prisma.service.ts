import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
            errorFormat: 'colorless',
        });
    }

    async onModuleInit() {
        this.logger.log('Conectando a la base de datos...');
        await this.$connect();
        this.logger.log('Conexión a la base de datos establecida');
    }

    async onModuleDestroy() {
        this.logger.log('Desconectando de la base de datos...');
        await this.$disconnect();
        this.logger.log('Desconexión de la base de datos completada');
    }

    async limpiarBaseDatos() {
        if (process.env.ENTORNO === 'produccion') {
            throw new Error('No se puede limpiar la base de datos en producción');
        }
        
        const nombresModelos = Reflect.ownKeys(this).filter(
            (key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
        );

        return Promise.all(
            nombresModelos.map((nombreModelo) => {
                const modelo = (this as Record<string, unknown>)[nombreModelo as string];
                if (modelo && typeof modelo === 'object' && 'deleteMany' in modelo) {
                    return (modelo as { deleteMany: () => Promise<unknown> }).deleteMany();
                }
                return Promise.resolve();
            }),
        );
    }
}
