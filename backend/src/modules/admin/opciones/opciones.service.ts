import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface OpcionCatalogo {
    id: number;
    grupo: string;
    valor: string;
    etiqueta: string;
    descripcion: string | null;
    orden: number;
}

@Injectable()
export class OpcionesService {
    private readonly logger = new Logger(OpcionesService.name);
    private cache = new Map<string, { datos: OpcionCatalogo[]; expira: number }>();
    private readonly TTL_MS = 5 * 60 * 1000;

    constructor(private readonly prisma: PrismaService) {}

    async obtenerTodas(): Promise<Record<string, OpcionCatalogo[]>> {
        const catalogos = await this.prisma.catalogo.findMany({
            where: { activo: true },
            orderBy: [{ grupo: 'asc' }, { orden: 'asc' }],
            select: {
                id: true,
                grupo: true,
                valor: true,
                etiqueta: true,
                descripcion: true,
                orden: true,
            },
        });

        const agrupados: Record<string, OpcionCatalogo[]> = {};
        for (const catalogo of catalogos) {
            if (!agrupados[catalogo.grupo]) {
                agrupados[catalogo.grupo] = [];
            }
            agrupados[catalogo.grupo].push(catalogo);
        }

        return agrupados;
    }

    async obtenerPorGrupo(grupo: string): Promise<OpcionCatalogo[]> {
        const ahora = Date.now();
        const enCache = this.cache.get(grupo);

        if (enCache && enCache.expira > ahora) {
            return enCache.datos;
        }

        const opciones = await this.prisma.catalogo.findMany({
            where: { grupo, activo: true },
            orderBy: { orden: 'asc' },
            select: {
                id: true,
                grupo: true,
                valor: true,
                etiqueta: true,
                descripcion: true,
                orden: true,
            },
        });

        this.cache.set(grupo, { datos: opciones, expira: ahora + this.TTL_MS });
        return opciones;
    }

    async obtenerValoresDeGrupo(grupo: string): Promise<string[]> {
        const opciones = await this.obtenerPorGrupo(grupo);
        return opciones.map((o) => o.valor);
    }

    limpiarCache(): void {
        this.cache.clear();
        this.logger.log('Caché de catálogos limpiada');
    }
}
