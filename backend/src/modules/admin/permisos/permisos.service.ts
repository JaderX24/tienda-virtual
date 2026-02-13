import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PermisosService {
    private readonly logger = new Logger(PermisosService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerTodos() {
        const permisos = await this.prisma.permiso.findMany({
            orderBy: [
                { modulo: 'asc' },
                { nombre: 'asc' },
            ],
        });

        return permisos;
    }

    async obtenerAgrupados() {
        const permisos = await this.prisma.permiso.findMany({
            orderBy: [
                { modulo: 'asc' },
                { nombre: 'asc' },
            ],
        });

        const agrupados = permisos.reduce((acc, permiso) => {
            if (!acc[permiso.modulo]) {
                acc[permiso.modulo] = [];
            }
            acc[permiso.modulo].push(permiso);
            return acc;
        }, {} as Record<string, typeof permisos>);

        return Object.entries(agrupados).map(([modulo, permisos]) => ({
            modulo,
            permisos,
        }));
    }

    async obtenerModulos() {
        const modulos = await this.prisma.permiso.findMany({
            select: { modulo: true },
            distinct: ['modulo'],
            orderBy: { modulo: 'asc' },
        });

        return modulos.map(m => m.modulo);
    }
}
