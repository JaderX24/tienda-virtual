import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface ModuloMenu {
    id: string;
    titulo: string;
    icono: string;
    ruta?: string;
    permisos?: string[];
    hijos?: ModuloMenu[];
}

export interface SeccionMenu {
    titulo: string;
    items: ModuloMenu[];
}

@Injectable()
export class AdminModulosService {
    constructor(private prisma: PrismaService) {}

    async obtenerMenuPorPermisos(permisosUsuario: string[]): Promise<SeccionMenu[]> {
        const modulos = await this.prisma.adminModulo.findMany({
            where: {
                esActivo: true,
                esMenu: true,
            },
            include: {
                hijos: {
                    where: { esActivo: true, esMenu: true },
                    include: {
                        permisos: { select: { codigo: true } },
                    },
                    orderBy: { orden: 'asc' },
                },
                permisos: { select: { codigo: true } },
            },
            orderBy: { orden: 'asc' },
        });

        const modulosPadre = modulos.filter(m => !m.moduloPadreId);

        const itemsFiltrados: ModuloMenu[] = [];

        for (const modulo of modulosPadre) {
            const permisosModulo = modulo.permisos.map(p => p.codigo);
            const tieneHijos = modulo.hijos && modulo.hijos.length > 0;

            if (tieneHijos) {
                const hijosFiltrados = modulo.hijos
                    .filter(hijo => {
                        const permisosHijo = hijo.permisos.map(p => p.codigo);
                        if (permisosHijo.length === 0) return true;
                        return permisosHijo.some(p => permisosUsuario.includes(p));
                    })
                    .map(hijo => ({
                        id: hijo.codigo,
                        titulo: hijo.nombre,
                        icono: hijo.icono || '',
                        ruta: hijo.ruta || undefined,
                        permisos: hijo.permisos.map(p => p.codigo),
                    }));

                if (hijosFiltrados.length > 0) {
                    itemsFiltrados.push({
                        id: modulo.codigo,
                        titulo: modulo.nombre,
                        icono: modulo.icono || '',
                        ruta: modulo.ruta || undefined,
                        permisos: permisosModulo,
                        hijos: hijosFiltrados,
                    });
                }
            } else {
                if (permisosModulo.length === 0 || permisosModulo.some(p => permisosUsuario.includes(p))) {
                    itemsFiltrados.push({
                        id: modulo.codigo,
                        titulo: modulo.nombre,
                        icono: modulo.icono || '',
                        ruta: modulo.ruta || undefined,
                        permisos: permisosModulo,
                    });
                }
            }
        }

        const secciones: SeccionMenu[] = [];
        if (itemsFiltrados.length > 0) {
            const dashboard = itemsFiltrados.filter(i => i.id === 'dashboard');
            const resto = itemsFiltrados.filter(i => i.id !== 'dashboard');

            if (dashboard.length > 0) {
                secciones.push({ titulo: 'Principal', items: dashboard });
            }
            if (resto.length > 0) {
                secciones.push({ titulo: 'Gestión', items: resto });
            }
        }

        return secciones;
    }
}
