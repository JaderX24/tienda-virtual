import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FiltrosReporteDto, FiltrosExportarDto } from './dto';

@Injectable()
export class ReportesColaboradorService {
    private readonly logger = new Logger(ReportesColaboradorService.name);

    constructor(private prisma: PrismaService) {}

    async obtenerResumenInventario(filtros: FiltrosReporteDto) {
        const rangoFecha = this.construirRangoFecha(filtros.fechaDesde, filtros.fechaHasta);
        const filtroFecha = rangoFecha ? { creadoEn: rangoFecha } : {};

        const [
            totalProductos,
            productosActivos,
            agotados,
            totalEntradas,
            totalSalidas,
            valorInventarioResult,
            stockBajoResult,
        ] = await Promise.all([
            this.prisma.producto.count(),
            this.prisma.producto.count({ where: { activo: true } }),
            this.prisma.producto.count({ where: { activo: true, stock: 0 } }),
            this.prisma.colabActividadInventario.count({
                where: {
                    tipoOperacion: { in: ['entrada', 'recepcion', 'ajuste_positivo'] },
                    ...filtroFecha,
                },
            }),
            this.prisma.colabActividadInventario.count({
                where: {
                    tipoOperacion: { in: ['salida', 'despacho', 'ajuste_negativo'] },
                    ...filtroFecha,
                },
            }),
            this.prisma.$queryRawUnsafe<{ valor: any }[]>(
                `SELECT COALESCE(SUM(stock * precio), 0) as valor FROM productos WHERE activo = 1`,
            ),
            this.prisma.$queryRawUnsafe<{ total: bigint }[]>(
                `SELECT COUNT(*) as total FROM productos WHERE activo = 1 AND stock > 0 AND stock <= stock_minimo`,
            ),
        ]);

        const valorInventario = Number(valorInventarioResult[0]?.valor ?? 0);
        const totalStockBajo = Number(stockBajoResult[0]?.total ?? 0);

        const topProductos = await this.obtenerTopProductosMovidos(rangoFecha);

        return {
            exito: true,
            datos: {
                totalProductos,
                productosActivos,
                agotados,
                stockBajo: totalStockBajo,
                inactivos: totalProductos - productosActivos,
                totalEntradas,
                totalSalidas,
                valorInventario,
                topProductos,
            },
        };
    }

    async obtenerMovimientos(filtros: FiltrosReporteDto) {
        const {
            fechaDesde,
            fechaHasta,
            almacenId,
            categoriaId,
            tipoOperacion,
            busqueda,
            pagina = 1,
            limite = 20,
        } = filtros;

        const where: any = {};

        const rangoFecha = this.construirRangoFecha(fechaDesde, fechaHasta);
        if (rangoFecha) where.creadoEn = rangoFecha;
        if (almacenId) where.almacenId = almacenId;
        if (tipoOperacion) where.tipoOperacion = tipoOperacion;

        if (categoriaId) {
            where.producto = { categoriaId };
        }

        if (busqueda) {
            where.producto = {
                ...where.producto,
                OR: [
                    { nombre: { contains: busqueda } },
                    { sku: { contains: busqueda } },
                ],
            };
        }

        const [total, movimientos] = await Promise.all([
            this.prisma.colabActividadInventario.count({ where }),
            this.prisma.colabActividadInventario.findMany({
                where,
                include: {
                    producto: { select: { nombre: true, sku: true } },
                    almacen: { select: { nombre: true, codigo: true } },
                    usuario: { select: { nombre: true, apellido: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        return {
            exito: true,
            datos: movimientos.map(m => this.formatearMovimiento(m)),
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerStockCritico(filtros: FiltrosReporteDto) {
        const { categoriaId, busqueda, pagina = 1, limite = 20 } = filtros;

        const where: any = {
            activo: true,
            OR: [
                { stock: 0 },
                { stock: { gt: 0 } },
            ],
        };

        if (categoriaId) where.categoriaId = categoriaId;

        if (busqueda) {
            where.AND = [
                {
                    OR: [
                        { nombre: { contains: busqueda } },
                        { sku: { contains: busqueda } },
                    ],
                },
            ];
        }

        // Obtener productos y filtrar en memoria los de stock bajo
        const todosProductos = await this.prisma.producto.findMany({
            where: { activo: true, ...(categoriaId ? { categoriaId } : {}), ...(busqueda ? { OR: [{ nombre: { contains: busqueda } }, { sku: { contains: busqueda } }] } : {}) },
            include: {
                categoria: { select: { nombre: true } },
                marca: { select: { nombre: true } },
                imagenes: {
                    where: { esPrincipal: true },
                    select: { url: true },
                    take: 1,
                },
            },
            orderBy: { stock: 'asc' },
        });

        // Filtrar solo los que tienen stock crítico (agotado o por debajo del mínimo)
        const productosCriticos = todosProductos.filter(
            p => p.stock <= p.stockMinimo,
        );

        const total = productosCriticos.length;
        const paginados = productosCriticos.slice((pagina - 1) * limite, pagina * limite);

        return {
            exito: true,
            datos: paginados.map(p => ({
                id: p.id,
                nombre: p.nombre,
                sku: p.sku,
                stock: p.stock,
                stockMinimo: p.stockMinimo,
                diferencia: p.stock - p.stockMinimo,
                precio: Number(p.precio),
                estado: p.stock <= 0 ? 'agotado' : 'bajo',
                categoria: p.categoria?.nombre || 'Sin categoría',
                marca: p.marca?.nombre || null,
                imagen: p.imagenes[0]?.url || null,
            })),
            resumen: {
                totalAgotados: productosCriticos.filter(p => p.stock <= 0).length,
                totalStockBajo: productosCriticos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length,
            },
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }

    async obtenerMiActividad(usuarioId: number, filtros: FiltrosReporteDto) {
        const { fechaDesde, fechaHasta, pagina = 1, limite = 20 } = filtros;

        const rangoFecha = this.construirRangoFecha(fechaDesde, fechaHasta);
        const filtroFecha = rangoFecha ? { creadoEn: rangoFecha } : {};

        const where: any = { usuarioId, ...filtroFecha };

        const [
            totalOperaciones,
            entradas,
            salidas,
            ajustes,
            operaciones,
        ] = await Promise.all([
            this.prisma.colabActividadInventario.count({ where }),
            this.prisma.colabActividadInventario.count({
                where: { ...where, tipoOperacion: { in: ['entrada', 'recepcion', 'ajuste_positivo'] } },
            }),
            this.prisma.colabActividadInventario.count({
                where: { ...where, tipoOperacion: { in: ['salida', 'despacho', 'ajuste_negativo'] } },
            }),
            this.prisma.colabActividadInventario.count({
                where: { ...where, tipoOperacion: { in: ['ajuste_positivo', 'ajuste_negativo'] } },
            }),
            this.prisma.colabActividadInventario.findMany({
                where,
                include: {
                    producto: { select: { nombre: true, sku: true } },
                    almacen: { select: { nombre: true, codigo: true } },
                },
                orderBy: { creadoEn: 'desc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);

        // Conteos realizados por el usuario
        const conteosRealizados = await this.prisma.colabConteoInventarioDetalle.count({
            where: { contadoPor: usuarioId, ...(rangoFecha ? { fechaConteo: rangoFecha } : {}) },
        });

        return {
            exito: true,
            datos: {
                resumen: {
                    totalOperaciones,
                    entradas,
                    salidas,
                    ajustes,
                    conteosRealizados,
                },
                operaciones: operaciones.map(op => this.formatearMovimiento(op)),
            },
            paginacion: {
                pagina,
                limite,
                total: totalOperaciones,
                totalPaginas: Math.ceil(totalOperaciones / limite),
            },
        };
    }

    async obtenerMovimientosPorCategoria(filtros: FiltrosReporteDto) {
        const { fechaDesde, fechaHasta } = filtros;

        let filtroFechaSQL = '';
        const parametros: any[] = [];

        if (fechaDesde) {
            filtroFechaSQL += ' AND cai.creado_en >= ?';
            parametros.push(new Date(fechaDesde));
        }
        if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            hasta.setDate(hasta.getDate() + 1);
            filtroFechaSQL += ' AND cai.creado_en < ?';
            parametros.push(hasta);
        }

        const resultado = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT
                c.id as categoriaId,
                c.nombre as categoria,
                COUNT(*) as totalMovimientos,
                SUM(CASE WHEN cai.tipo_operacion IN ('entrada','recepcion','ajuste_positivo') THEN 1 ELSE 0 END) as entradas,
                SUM(CASE WHEN cai.tipo_operacion IN ('salida','despacho','ajuste_negativo') THEN 1 ELSE 0 END) as salidas,
                SUM(CASE WHEN cai.tipo_operacion IN ('entrada','recepcion','ajuste_positivo') THEN cai.cantidad ELSE 0 END) as unidadesEntrada,
                SUM(CASE WHEN cai.tipo_operacion IN ('salida','despacho','ajuste_negativo') THEN cai.cantidad ELSE 0 END) as unidadesSalida
            FROM colab_actividad_inventario cai
            INNER JOIN productos p ON p.id = cai.producto_id
            INNER JOIN categorias c ON c.id = p.categoria_id
            WHERE 1=1 ${filtroFechaSQL}
            GROUP BY c.id, c.nombre
            ORDER BY totalMovimientos DESC`,
            ...parametros,
        );

        return {
            exito: true,
            datos: resultado.map(r => ({
                categoriaId: Number(r.categoriaId),
                categoria: r.categoria,
                totalMovimientos: Number(r.totalMovimientos),
                entradas: Number(r.entradas),
                salidas: Number(r.salidas),
                unidadesEntrada: Number(r.unidadesEntrada),
                unidadesSalida: Number(r.unidadesSalida),
            })),
        };
    }

    async exportarMovimientosCsv(filtros: FiltrosExportarDto): Promise<string> {
        const { fechaDesde, fechaHasta, almacenId, tipoOperacion } = filtros;

        const where: any = {};
        const rangoFecha = this.construirRangoFecha(fechaDesde, fechaHasta);
        if (rangoFecha) where.creadoEn = rangoFecha;
        if (almacenId) where.almacenId = almacenId;
        if (tipoOperacion) where.tipoOperacion = tipoOperacion;

        const movimientos = await this.prisma.colabActividadInventario.findMany({
            where,
            include: {
                producto: { select: { nombre: true, sku: true } },
                almacen: { select: { nombre: true, codigo: true } },
                usuario: { select: { nombre: true, apellido: true } },
            },
            orderBy: { creadoEn: 'desc' },
            take: 5000,
        });

        const encabezados = [
            'Fecha',
            'Tipo Operación',
            'Producto',
            'SKU',
            'Cantidad',
            'Stock Anterior',
            'Stock Nuevo',
            'Almacén',
            'Colaborador',
            'Motivo',
            'Documento',
        ];

        const filas = movimientos.map(m => [
            this.formatearFechaCsv(m.creadoEn),
            this.traducirTipoOperacion(m.tipoOperacion),
            `"${(m.producto?.nombre || '').replace(/"/g, '""')}"`,
            m.producto?.sku || '',
            m.cantidad.toString(),
            m.cantidadAnterior.toString(),
            m.cantidadNueva.toString(),
            `"${(m.almacen?.nombre || '').replace(/"/g, '""')}"`,
            `"${(m.usuario?.nombre || '')} ${(m.usuario?.apellido || '')}".trim()`,
            `"${(m.motivo || '').replace(/"/g, '""')}"`,
            m.documentoNumero || '',
        ]);

        const bom = '\uFEFF';
        return bom + [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    }

    async exportarStockCriticoCsv(): Promise<string> {
        const productos = await this.prisma.producto.findMany({
            where: { activo: true },
            include: {
                categoria: { select: { nombre: true } },
                marca: { select: { nombre: true } },
            },
            orderBy: { stock: 'asc' },
        });

        const criticos = productos.filter(p => p.stock <= p.stockMinimo);

        const encabezados = [
            'Producto',
            'SKU',
            'Stock Actual',
            'Stock Mínimo',
            'Diferencia',
            'Estado',
            'Precio',
            'Categoría',
            'Marca',
        ];

        const filas = criticos.map(p => [
            `"${p.nombre.replace(/"/g, '""')}"`,
            p.sku,
            p.stock.toString(),
            p.stockMinimo.toString(),
            (p.stock - p.stockMinimo).toString(),
            p.stock <= 0 ? 'Agotado' : 'Stock Bajo',
            Number(p.precio).toFixed(2),
            `"${(p.categoria?.nombre || 'Sin categoría').replace(/"/g, '""')}"`,
            `"${(p.marca?.nombre || '').replace(/"/g, '""')}"`,
        ]);

        const bom = '\uFEFF';
        return bom + [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    }

    // Métodos privados

    private async obtenerTopProductosMovidos(rangoFecha: any) {
        let filtroFechaSQL = '';
        const parametros: any[] = [];

        if (rangoFecha) {
            if (rangoFecha.gte) {
                filtroFechaSQL += ' AND cai.creado_en >= ?';
                parametros.push(rangoFecha.gte);
            }
            if (rangoFecha.lt) {
                filtroFechaSQL += ' AND cai.creado_en < ?';
                parametros.push(rangoFecha.lt);
            }
        }

        const resultado = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT
                p.id,
                p.nombre,
                p.sku,
                COUNT(*) as totalMovimientos,
                SUM(cai.cantidad) as totalUnidades
            FROM colab_actividad_inventario cai
            INNER JOIN productos p ON p.id = cai.producto_id
            WHERE 1=1 ${filtroFechaSQL}
            GROUP BY p.id, p.nombre, p.sku
            ORDER BY totalMovimientos DESC
            LIMIT 10`,
            ...parametros,
        );

        return resultado.map(r => ({
            id: r.id,
            nombre: r.nombre,
            sku: r.sku,
            totalMovimientos: Number(r.totalMovimientos),
            totalUnidades: Number(r.totalUnidades),
        }));
    }

    private construirRangoFecha(fechaDesde?: string, fechaHasta?: string) {
        if (!fechaDesde && !fechaHasta) return null;

        const rango: any = {};
        if (fechaDesde) rango.gte = new Date(fechaDesde);
        if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            hasta.setDate(hasta.getDate() + 1);
            rango.lt = hasta;
        }

        return rango;
    }

    private formatearMovimiento(m: any) {
        return {
            id: m.id.toString(),
            tipoOperacion: m.tipoOperacion,
            tipoOperacionTexto: this.traducirTipoOperacion(m.tipoOperacion),
            producto: m.producto?.nombre || 'N/A',
            sku: m.producto?.sku || '',
            cantidad: m.cantidad,
            cantidadAnterior: m.cantidadAnterior,
            cantidadNueva: m.cantidadNueva,
            almacen: m.almacen?.nombre || '',
            almacenCodigo: m.almacen?.codigo || '',
            colaborador: m.usuario
                ? `${m.usuario.nombre} ${m.usuario.apellido}`.trim()
                : '',
            motivo: m.motivo,
            notas: m.notas,
            documentoTipo: m.documentoTipo,
            documentoNumero: m.documentoNumero,
            estadoAprobacion: m.estadoAprobacion,
            fecha: m.creadoEn,
        };
    }

    private traducirTipoOperacion(tipo: string): string {
        const traducciones: Record<string, string> = {
            entrada: 'Entrada',
            salida: 'Salida',
            recepcion: 'Recepción',
            despacho: 'Despacho',
            ajuste_positivo: 'Ajuste (+)',
            ajuste_negativo: 'Ajuste (-)',
            transferencia: 'Transferencia',
        };
        return traducciones[tipo] || tipo;
    }

    private formatearFechaCsv(fecha: Date): string {
        const d = new Date(fecha);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${anio} ${hora}:${min}`;
    }
}
