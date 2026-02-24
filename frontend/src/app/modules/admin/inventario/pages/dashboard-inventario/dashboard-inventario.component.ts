import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../../services';
import {
    ResumenInventario,
    MovimientoPorTipo,
    ProductoStockCritico,
    MovimientoPorDia,
    ValorPorCategoria,
    TopProducto
} from '../../interfaces';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-dashboard-inventario',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard-inventario.component.html',
    styleUrl: './dashboard-inventario.component.scss'
})
export class DashboardInventarioComponent implements OnInit, AfterViewInit, OnDestroy {
    private inventarioService = inject(InventarioService);
    private dpr = Math.min(window.devicePixelRatio || 1, 2);

    cargando = signal(true);
    resumen = signal<ResumenInventario | null>(null);
    movimientosPorTipo = signal<MovimientoPorTipo[]>([]);
    productosStockCritico = signal<ProductoStockCritico[]>([]);
    movimientosPorDia = signal<MovimientoPorDia[]>([]);
    valorPorCategoria = signal<ValorPorCategoria[]>([]);
    topProductos = signal<TopProducto[]>([]);

    @ViewChild('graficaLineas', { static: false }) canvasLineas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('graficaBarras', { static: false }) canvasBarras!: ElementRef<HTMLCanvasElement>;
    @ViewChild('graficaDonut', { static: false }) canvasDonut!: ElementRef<HTMLCanvasElement>;
    @ViewChild('graficaBarrasH', { static: false }) canvasBarrasH!: ElementRef<HTMLCanvasElement>;
    @ViewChild('graficaArea', { static: false }) canvasArea!: ElementRef<HTMLCanvasElement>;

    private observadorResize: ResizeObserver | null = null;
    private tiempoResize: any;

    ngOnInit(): void {
        this.cargarDatos();
    }

    ngAfterViewInit(): void {
        this.observadorResize = new ResizeObserver(() => {
            clearTimeout(this.tiempoResize);
            this.tiempoResize = setTimeout(() => this.dibujarGraficas(), 150);
        });

        const contenedor = this.canvasLineas?.nativeElement?.parentElement?.parentElement;
        if (contenedor) this.observadorResize.observe(contenedor);
    }

    ngOnDestroy(): void {
        clearTimeout(this.tiempoResize);
        this.observadorResize?.disconnect();
    }

    cargarDatos(): void {
        this.cargando.set(true);

        forkJoin({
            resumen: this.inventarioService.obtenerResumen(),
            porTipo: this.inventarioService.obtenerMovimientosPorTipo(),
            stockCritico: this.inventarioService.obtenerProductosStockCritico(),
            porDia: this.inventarioService.obtenerMovimientosPorDia(30),
            porCategoria: this.inventarioService.obtenerValorPorCategoria(),
            topProductos: this.inventarioService.obtenerTopProductos(8),
        }).subscribe({
            next: (datos) => {
                this.resumen.set(datos.resumen);
                this.movimientosPorTipo.set(datos.porTipo);
                this.productosStockCritico.set(datos.stockCritico);
                this.movimientosPorDia.set(datos.porDia);
                this.valorPorCategoria.set(datos.porCategoria);
                this.topProductos.set(datos.topProductos);
                this.cargando.set(false);
                setTimeout(() => this.dibujarGraficas(), 100);
            },
            error: () => {
                this.cargando.set(false);
                this.cargarDatosDemo();
                setTimeout(() => this.dibujarGraficas(), 100);
            }
        });
    }

    private cargarDatosDemo(): void {
        this.resumen.set({
            totalProductos: 584,
            productosActivos: 512,
            sinStock: 23,
            stockBajo: 47,
            valorTotalInventario: 2450000,
            valorTotalCosto: 1680000,
            totalMovimientosHoy: 34,
            totalMovimientosSemana: 187,
            totalMovimientosMes: 685,
        });
    }

    dibujarGraficas(): void {
        this.dibujarGraficaLineas();
        this.dibujarGraficaBarras();
        this.dibujarGraficaDonut();
        this.dibujarGraficaBarrasHorizontales();
        this.dibujarGraficaArea();
    }

    // Prepara canvas con resolución HiDPI y retorna dimensiones lógicas
    private prepararCanvas(canvas: HTMLCanvasElement, altoLogico: number): { ctx: CanvasRenderingContext2D; ancho: number; alto: number } | null {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const rect = canvas.parentElement!.getBoundingClientRect();
        const ancho = rect.width;
        const alto = altoLogico;
        canvas.width = ancho * this.dpr;
        canvas.height = alto * this.dpr;
        canvas.style.width = `${ancho}px`;
        canvas.style.height = `${alto}px`;
        ctx.scale(this.dpr, this.dpr);
        ctx.clearRect(0, 0, ancho, alto);
        return { ctx, ancho, alto };
    }

    // Dibuja mensaje de "sin datos" centrado en el canvas
    private dibujarEstadoVacio(ctx: CanvasRenderingContext2D, ancho: number, alto: number, icono: string, mensaje: string): void {
        ctx.save();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '48px "Bootstrap Icons"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icono, ancho / 2, alto / 2 - 16);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(mensaje, ancho / 2, alto / 2 + 28);
        ctx.restore();
    }

    // Verifica si un arreglo de datos numéricos es todo ceros
    private todosCeros(datos: number[]): boolean {
        return datos.every(v => v === 0);
    }

    // Dibuja grilla horizontal con etiquetas del eje Y
    private dibujarGrilla(ctx: CanvasRenderingContext2D, padding: any, ancho: number, maxValor: number, pasos: number, formatoLabel?: (v: number) => string): void {
        const areaAlto = padding.alto || 0;
        ctx.save();
        for (let i = 0; i <= pasos; i++) {
            const y = padding.top + (areaAlto / pasos) * i;
            ctx.strokeStyle = i === pasos ? '#cbd5e1' : '#f1f5f9';
            ctx.lineWidth = i === pasos ? 1 : 0.8;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(ancho - padding.right, y);
            ctx.stroke();

            const valor = maxValor - (maxValor / pasos) * i;
            const label = formatoLabel ? formatoLabel(valor) : Math.round(valor).toString();
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, padding.left - 10, y);
        }
        ctx.restore();
    }

    // Genera puntos de una curva suave usando interpolación cúbica monótona
    private generarPuntosCurva(valores: number[], padding: any, escalaX: number, escalaY: number, areaAlto: number): { x: number; y: number }[] {
        return valores.map((v, i) => ({
            x: padding.left + i * escalaX,
            y: padding.top + areaAlto - v * escalaY,
        }));
    }

    // Dibuja una curva suave con interpolación bezier entre puntos
    private trazarCurvaSuave(ctx: CanvasRenderingContext2D, puntos: { x: number; y: number }[]): void {
        if (puntos.length < 2) return;
        ctx.moveTo(puntos[0].x, puntos[0].y);
        if (puntos.length === 2) {
            ctx.lineTo(puntos[1].x, puntos[1].y);
            return;
        }
        for (let i = 0; i < puntos.length - 1; i++) {
            const p0 = puntos[Math.max(0, i - 1)];
            const p1 = puntos[i];
            const p2 = puntos[i + 1];
            const p3 = puntos[Math.min(puntos.length - 1, i + 2)];
            const tension = 0.35;
            const cp1x = p1.x + (p2.x - p0.x) * tension;
            const cp1y = p1.y + (p2.y - p0.y) * tension;
            const cp2x = p2.x - (p3.x - p1.x) * tension;
            const cp2y = p2.y - (p3.y - p1.y) * tension;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
    }

    // === GRÁFICA DE LÍNEAS ===
    private dibujarGraficaLineas(): void {
        const canvas = this.canvasLineas?.nativeElement;
        if (!canvas) return;
        const setup = this.prepararCanvas(canvas, 380);
        if (!setup) return;
        const { ctx, ancho, alto } = setup;

        const datos = this.movimientosPorDia();
        const tieneData = datos.length > 0 && !this.todosCeros(datos.flatMap(d => [d.entradas, d.salidas, d.ajustes]));

        if (!tieneData) {
            this.dibujarEstadoVacio(ctx, ancho, alto, '\uf3c5', 'Sin movimientos de inventario registrados');
            return;
        }

        const padding = { top: 25, right: 20, bottom: 52, left: 50 };
        const areaAncho = ancho - padding.left - padding.right;
        const areaAlto = alto - padding.top - padding.bottom;
        const paddingConAlto = { ...padding, alto: areaAlto };

        const valoresMax = datos.flatMap(d => [d.entradas, d.salidas, d.ajustes]);
        const maxValor = Math.max(...valoresMax) * 1.15 || 10;
        const escalaX = areaAncho / (datos.length - 1);
        const escalaY = areaAlto / maxValor;

        this.dibujarGrilla(ctx, paddingConAlto, ancho, maxValor, 5);

        // Etiquetas eje X
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const intervaloX = Math.ceil(datos.length / 7);
        datos.forEach((d, i) => {
            if (i % intervaloX === 0 || i === datos.length - 1) {
                const x = padding.left + i * escalaX;
                const partes = d.fecha.split('-');
                ctx.fillText(`${partes[2]}/${partes[1]}`, x, alto - padding.bottom + 8);
            }
        });
        ctx.restore();

        // Dibujar series con relleno degradado + curva suave
        const series = [
            { valores: datos.map(d => d.entradas), color: '#10b981', colorFill: 'rgba(16, 185, 129, 0.12)', label: 'Entradas' },
            { valores: datos.map(d => d.salidas), color: '#ef4444', colorFill: 'rgba(239, 68, 68, 0.08)', label: 'Salidas' },
            { valores: datos.map(d => d.ajustes), color: '#f59e0b', colorFill: 'rgba(245, 158, 11, 0.08)', label: 'Ajustes' },
        ];

        series.forEach(serie => {
            const puntos = this.generarPuntosCurva(serie.valores, padding, escalaX, escalaY, areaAlto);

            // Relleno degradado bajo la curva
            ctx.save();
            ctx.beginPath();
            this.trazarCurvaSuave(ctx, puntos);
            ctx.lineTo(puntos[puntos.length - 1].x, padding.top + areaAlto);
            ctx.lineTo(puntos[0].x, padding.top + areaAlto);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + areaAlto);
            grad.addColorStop(0, serie.colorFill);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();

            // Línea curva con sombra
            ctx.save();
            ctx.shadowColor = serie.color + '40';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;
            ctx.beginPath();
            ctx.strokeStyle = serie.color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            this.trazarCurvaSuave(ctx, puntos);
            ctx.stroke();
            ctx.restore();

            // Puntos solo cada N posiciones para no saturar
            const intervaloPuntos = datos.length > 15 ? 3 : 1;
            puntos.forEach((p, i) => {
                if (i % intervaloPuntos !== 0 && i !== puntos.length - 1) return;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = serie.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        });

        // Leyenda elegante
        ctx.save();
        const leyendaY = alto - 14;
        let leyendaX = padding.left;
        series.forEach(s => {
            ctx.beginPath();
            ctx.arc(leyendaX + 5, leyendaY, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.fill();
            ctx.fillStyle = '#475569';
            ctx.font = '500 11.5px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.label, leyendaX + 14, leyendaY);
            leyendaX += ctx.measureText(s.label).width + 32;
        });
        ctx.restore();
    }

    // === GRÁFICA DONUT ===
    private dibujarGraficaDonut(): void {
        const canvas = this.canvasDonut?.nativeElement;
        if (!canvas) return;
        const setup = this.prepararCanvas(canvas, 320);
        if (!setup) return;
        const { ctx, ancho, alto } = setup;

        const datos = this.movimientosPorTipo();
        const total = datos.reduce((s, d) => s + d.cantidad, 0);

        if (datos.length === 0 || total === 0) {
            this.dibujarEstadoVacio(ctx, ancho, alto, '\uf200', 'Sin movimientos registrados');
            return;
        }

        const centroX = Math.min(ancho * 0.35, 160);
        const centroY = alto / 2;
        const radioMax = Math.min(centroX - 20, (alto / 2) - 20);
        const radio = radioMax;
        const radioInterno = radio * 0.58;
        const separacion = 0.02;

        const colores = [
            { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
            { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
            { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
            { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
            { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.3)' },
        ];

        // Sombra del donut
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(centroX, centroY, radio, 0, Math.PI * 2);
        ctx.arc(centroX, centroY, radioInterno, 0, Math.PI * 2, true);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.restore();

        let anguloInicio = -Math.PI / 2;
        datos.forEach((d, i) => {
            const anguloBarre = (d.cantidad / total) * Math.PI * 2;
            const anguloMedio = anguloInicio + anguloBarre / 2;
            const desplX = Math.cos(anguloMedio) * (separacion * radio);
            const desplY = Math.sin(anguloMedio) * (separacion * radio);

            ctx.save();
            ctx.shadowColor = colores[i % colores.length].glow;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(centroX + desplX, centroY + desplY, radio - 1, anguloInicio, anguloInicio + anguloBarre);
            ctx.arc(centroX + desplX, centroY + desplY, radioInterno + 1, anguloInicio + anguloBarre, anguloInicio, true);
            ctx.closePath();
            ctx.fillStyle = colores[i % colores.length].fill;
            ctx.fill();
            ctx.restore();

            anguloInicio += anguloBarre;
        });

        // Centro blanco
        ctx.beginPath();
        ctx.arc(centroX, centroY, radioInterno, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Texto central
        ctx.fillStyle = '#1e293b';
        ctx.font = `bold ${Math.max(20, radio * 0.28)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.formatearNumeroCorto(total), centroX, centroY - 6);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 ${Math.max(10, radio * 0.11)}px system-ui, -apple-system, sans-serif`;
        ctx.fillText('Total mov.', centroX, centroY + 14);

        // Leyenda a la derecha
        const leyendaStartX = centroX + radio + 30;
        const leyendaStartY = (alto - datos.length * 46) / 2 + 10;
        datos.forEach((d, i) => {
            const ly = leyendaStartY + i * 46;
            ctx.beginPath();
            ctx.roundRect(leyendaStartX, ly, 10, 10, 3);
            ctx.fillStyle = colores[i % colores.length].fill;
            ctx.fill();

            const etiqueta = d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1);
            ctx.fillStyle = '#1e293b';
            ctx.font = '600 12.5px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(etiqueta, leyendaStartX + 18, ly - 1);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px system-ui, -apple-system, sans-serif';
            ctx.fillText(`${this.formatearNumeroCorto(d.cantidad)}  ·  ${d.porcentaje}%`, leyendaStartX + 18, ly + 16);
        });
    }

    // === GRÁFICA DE BARRAS ===
    private dibujarGraficaBarras(): void {
        const canvas = this.canvasBarras?.nativeElement;
        if (!canvas) return;
        const setup = this.prepararCanvas(canvas, 380);
        if (!setup) return;
        const { ctx, ancho, alto } = setup;

        const datos = this.topProductos();
        if (datos.length === 0 || datos.every(d => d.valorInventario === 0)) {
            this.dibujarEstadoVacio(ctx, ancho, alto, '\uf080', 'Sin productos en inventario');
            return;
        }

        const padding = { top: 20, right: 20, bottom: 72, left: 58 };
        const areaAncho = ancho - padding.left - padding.right;
        const areaAlto = alto - padding.top - padding.bottom;
        const paddingConAlto = { ...padding, alto: areaAlto };

        const maxValor = Math.max(...datos.map(d => d.valorInventario)) * 1.12 || 10;
        const anchoBandaTotal = areaAncho / datos.length;
        const anchoBarra = Math.min(anchoBandaTotal * 0.55, 48);
        const escalaY = areaAlto / maxValor;

        this.dibujarGrilla(ctx, paddingConAlto, ancho, maxValor, 5, v => `L ${(v / 1000).toFixed(0)}k`);

        const coloresBarra = [
            ['#6366f1', '#818cf8'], ['#3b82f6', '#60a5fa'], ['#8b5cf6', '#a78bfa'],
            ['#06b6d4', '#22d3ee'], ['#10b981', '#34d399'], ['#f59e0b', '#fbbf24'],
            ['#ec4899', '#f472b6'], ['#6366f1', '#818cf8'],
        ];

        datos.forEach((d, i) => {
            const cx = padding.left + anchoBandaTotal * i + anchoBandaTotal / 2;
            const x = cx - anchoBarra / 2;
            const altoBarra = Math.max(d.valorInventario * escalaY, 2);
            const y = padding.top + areaAlto - altoBarra;
            const colors = coloresBarra[i % coloresBarra.length];

            // Sombra
            ctx.save();
            ctx.shadowColor = colors[0] + '25';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;

            const grad = ctx.createLinearGradient(x, y, x, padding.top + areaAlto);
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1]);
            ctx.fillStyle = grad;
            this.dibujarRectRedondeado(ctx, x, y, anchoBarra, altoBarra, 6);
            ctx.restore();

            // Brillo superior
            ctx.save();
            const brilloGrad = ctx.createLinearGradient(x, y, x, y + altoBarra * 0.3);
            brilloGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
            brilloGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = brilloGrad;
            this.dibujarRectRedondeado(ctx, x, y, anchoBarra, Math.min(altoBarra, altoBarra * 0.4), 6);
            ctx.restore();

            // Valor encima
            ctx.save();
            ctx.fillStyle = colors[0];
            ctx.font = 'bold 10.5px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`L ${(d.valorInventario / 1000).toFixed(0)}k`, cx, y - 6);
            ctx.restore();

            // Label inferior rotado
            ctx.save();
            ctx.fillStyle = '#64748b';
            ctx.font = '10px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.translate(cx, padding.top + areaAlto + 10);
            ctx.rotate(-Math.PI / 6);
            const sku = d.nombre.length > 14 ? d.nombre.substring(0, 14) + '...' : d.nombre;
            ctx.fillText(sku, 0, 0);
            ctx.restore();
        });
    }

    // === GRÁFICA DE BARRAS HORIZONTALES ===
    private dibujarGraficaBarrasHorizontales(): void {
        const canvas = this.canvasBarrasH?.nativeElement;
        if (!canvas) return;
        const setup = this.prepararCanvas(canvas, 340);
        if (!setup) return;
        const { ctx, ancho, alto } = setup;

        const datos = this.valorPorCategoria();
        if (datos.length === 0 || datos.every(d => d.valorInventario === 0)) {
            this.dibujarEstadoVacio(ctx, ancho, alto, '\uf1e0', 'Sin categorías con inventario');
            return;
        }

        const padding = { top: 15, right: 24, bottom: 15, left: 100 };
        const areaAncho = ancho - padding.left - padding.right;
        const areaAlto = alto - padding.top - padding.bottom;
        const maxValor = Math.max(...datos.map(d => d.valorInventario)) * 1.08 || 10;
        const alturaBandaTotal = areaAlto / datos.length;
        const alturaBarra = Math.min(alturaBandaTotal * 0.55, 28);

        const colores = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

        datos.forEach((d, i) => {
            const cy = padding.top + alturaBandaTotal * i + alturaBandaTotal / 2;
            const y = cy - alturaBarra / 2;
            const anchoBarra = Math.max((d.valorInventario / maxValor) * areaAncho, 4);
            const color = colores[i % colores.length];

            // Label categoría
            ctx.save();
            ctx.fillStyle = '#334155';
            ctx.font = '600 12px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.categoria, padding.left - 12, cy);
            ctx.restore();

            // Fondo de la barra
            ctx.save();
            ctx.fillStyle = '#f1f5f9';
            this.dibujarRectRedondeado(ctx, padding.left, y, areaAncho, alturaBarra, alturaBarra / 2);
            ctx.restore();

            // Barra con degradado y sombra
            ctx.save();
            ctx.shadowColor = color + '30';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            const grad = ctx.createLinearGradient(padding.left, y, padding.left + anchoBarra, y);
            grad.addColorStop(0, color);
            grad.addColorStop(1, color + 'CC');
            ctx.fillStyle = grad;
            this.dibujarRectRedondeado(ctx, padding.left, y, anchoBarra, alturaBarra, alturaBarra / 2);
            ctx.restore();

            // Brillo superior
            ctx.save();
            const brilloGrad = ctx.createLinearGradient(padding.left, y, padding.left, y + alturaBarra * 0.45);
            brilloGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
            brilloGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = brilloGrad;
            this.dibujarRectRedondeado(ctx, padding.left, y, anchoBarra, alturaBarra * 0.5, alturaBarra / 2);
            ctx.restore();

            // Valor a la derecha dentro o fuera
            ctx.save();
            const textoValor = `L ${(d.valorInventario / 1000).toFixed(0)}k  (${d.porcentaje}%)`;
            ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
            const anchoTexto = ctx.measureText(textoValor).width;
            if (anchoBarra > anchoTexto + 20) {
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(textoValor, padding.left + anchoBarra - 8, cy);
            } else {
                ctx.fillStyle = '#64748b';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(textoValor, padding.left + anchoBarra + 8, cy);
            }
            ctx.restore();
        });
    }

    // === GRÁFICA DE ÁREA ===
    private dibujarGraficaArea(): void {
        const canvas = this.canvasArea?.nativeElement;
        if (!canvas) return;
        const setup = this.prepararCanvas(canvas, 300);
        if (!setup) return;
        const { ctx, ancho, alto } = setup;

        const datos = this.movimientosPorDia();
        const tieneData = datos.length > 0 && !this.todosCeros(datos.flatMap(d => [d.entradas, d.salidas]));

        if (!tieneData) {
            this.dibujarEstadoVacio(ctx, ancho, alto, '\uf201', 'Sin tendencia de inventario');
            return;
        }

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const areaAncho = ancho - padding.left - padding.right;
        const areaAlto = alto - padding.top - padding.bottom;

        let acumulado = 0;
        const valoresAcumulados = datos.map(d => {
            acumulado += (d.entradas - d.salidas);
            return acumulado;
        });

        const minVal = Math.min(0, ...valoresAcumulados);
        const maxVal = Math.max(1, ...valoresAcumulados);
        const rango = maxVal - minVal || 1;
        const escalaX = areaAncho / (datos.length - 1);
        const margen = rango * 0.1;
        const escalaY = areaAlto / (rango + margen * 2);
        const offsetY = minVal - margen;

        // Grilla
        const paddingConAlto = { ...padding, alto: areaAlto };
        const maxGrilla = maxVal + margen;
        this.dibujarGrilla(ctx, paddingConAlto, ancho, maxGrilla, 4, v => Math.round(v).toString());

        const puntos = valoresAcumulados.map((v, i) => ({
            x: padding.left + i * escalaX,
            y: padding.top + areaAlto - (v - offsetY) * escalaY,
        }));

        // Relleno de área
        ctx.save();
        ctx.beginPath();
        this.trazarCurvaSuave(ctx, puntos);
        ctx.lineTo(puntos[puntos.length - 1].x, padding.top + areaAlto);
        ctx.lineTo(puntos[0].x, padding.top + areaAlto);
        ctx.closePath();
        const gradArea = ctx.createLinearGradient(0, padding.top, 0, padding.top + areaAlto);
        gradArea.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
        gradArea.addColorStop(0.6, 'rgba(99, 102, 241, 0.06)');
        gradArea.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = gradArea;
        ctx.fill();
        ctx.restore();

        // Línea con sombra
        ctx.save();
        ctx.shadowColor = 'rgba(99, 102, 241, 0.35)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        this.trazarCurvaSuave(ctx, puntos);
        ctx.stroke();
        ctx.restore();

        // Punto final destacado
        if (puntos.length > 0) {
            const ultimo = puntos[puntos.length - 1];
            ctx.beginPath();
            ctx.arc(ultimo.x, ultimo.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ultimo.x, ultimo.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        // Labels eje X
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const intervaloArea = Math.ceil(datos.length / 6);
        datos.forEach((d, i) => {
            if (i % intervaloArea === 0 || i === datos.length - 1) {
                const x = padding.left + i * escalaX;
                const partes = d.fecha.split('-');
                ctx.fillText(`${partes[2]}/${partes[1]}`, x, alto - padding.bottom + 8);
            }
        });
        ctx.restore();
    }

    // Utilitario para rect con esquinas redondeadas
    private dibujarRectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number, radio: number): void {
        if (ancho <= 0 || alto <= 0) return;
        radio = Math.min(radio, ancho / 2, alto / 2);
        ctx.beginPath();
        ctx.moveTo(x + radio, y);
        ctx.lineTo(x + ancho - radio, y);
        ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
        ctx.lineTo(x + ancho, y + alto - radio);
        ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto);
        ctx.lineTo(x + radio, y + alto);
        ctx.quadraticCurveTo(x, y + alto, x, y + alto - radio);
        ctx.lineTo(x, y + radio);
        ctx.quadraticCurveTo(x, y, x + radio, y);
        ctx.closePath();
        ctx.fill();
    }

    formatearMoneda(valor: number): string {
        return this.inventarioService.formatearPrecio(valor);
    }

    formatearNumero(valor: number): string {
        return new Intl.NumberFormat('es-HN').format(valor);
    }

    formatearNumeroCorto(valor: number): string {
        if (valor >= 1000000) return `${(valor / 1000000).toFixed(1)}M`;
        if (valor >= 1000) return `${(valor / 1000).toFixed(0)}k`;
        return valor.toString();
    }

    calcularMargen(): number {
        const r = this.resumen();
        if (!r || !r.valorTotalInventario) return 0;
        return Math.round(((r.valorTotalInventario - r.valorTotalCosto) / r.valorTotalInventario) * 100);
    }

    obtenerColorEstado(estado: string): string {
        return estado === 'sin-stock' ? '#ef4444' : '#f59e0b';
    }

    obtenerIconoEstado(estado: string): string {
        return estado === 'sin-stock' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill';
    }
}
