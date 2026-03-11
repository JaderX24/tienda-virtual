import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthAdminService } from '../auth/services/auth-admin.service';

interface TarjetaEstadistica {
    titulo: string;
    valor: number;
    prefijo?: string;
    sufijo?: string;
    esMoneda?: boolean;
    variacion: number;
    icono: string;
    color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    enlace?: string;
}

interface MetricaDelDia {
    titulo: string;
    actual: number;
    meta: number;
    porcentaje: number;
    icono: string;
    color: string;
}

interface AlertaActiva {
    id: number;
    tipo: 'urgente' | 'importante' | 'info';
    mensaje: string;
    icono: string;
    tiempo: string;
    accion?: string;
    enlace?: string;
}

interface ProductoPopular {
    id: number;
    nombre: string;
    imagen?: string;
    categoria: string;
    ventas: number;
    ingresos: number;
    stock: number;
}

interface MiEstadistica {
    titulo: string;
    valor: string | number;
    icono: string;
}

interface MiAcceso {
    id: number;
    dispositivo: string;
    fecha: string;
    icono: string;
    esActual: boolean;
}

@Component({
    selector: 'app-dashboard-admin',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './dashboard-admin.component.html',
    styleUrl: './dashboard-admin.component.scss'
})
export class DashboardAdminComponent implements OnInit {
    private authService = inject(AuthAdminService);
    
    usuario = this.authService.usuario;
    cargando = signal(true);
    fechaActual = new Date();
    
    tarjetasEstadisticas: TarjetaEstadistica[] = [
        {
            titulo: 'Ventas del Mes',
            valor: 125480,
            prefijo: 'L',
            esMoneda: true,
            variacion: 12.5,
            icono: 'bi-currency-dollar',
            color: 'success',
            enlace: '/admin/reportes/ventas'
        },
        {
            titulo: 'Pedidos Nuevos',
            valor: 148,
            variacion: 8.2,
            icono: 'bi-cart-check',
            color: 'primary',
            enlace: '/admin/pedidos'
        },
        {
            titulo: 'Clientes Activos',
            valor: 1024,
            variacion: 5.7,
            icono: 'bi-people',
            color: 'info',
            enlace: '/admin/clientes'
        },
        {
            titulo: 'Bajo Stock',
            valor: 23,
            variacion: -15.3,
            icono: 'bi-box-seam',
            color: 'warning',
            enlace: '/admin/inventario/alertas'
        }
    ];
    
    // Estado general del negocio
    estadoGeneral = {
        texto: 'Operando Normal',
        clase: 'estado-ok',
        icono: 'bi-check-circle-fill'
    };
    
    // Métricas del día con progreso
    metricasDelDia: MetricaDelDia[] = [
        {
            titulo: 'Pedidos Hoy',
            actual: 18,
            meta: 25,
            porcentaje: 72,
            icono: 'bi-bag-check',
            color: 'primary'
        },
        {
            titulo: 'Ventas del Día',
            actual: 8540,
            meta: 15000,
            porcentaje: 57,
            icono: 'bi-cash-stack',
            color: 'success'
        },
        {
            titulo: 'Visitas Web',
            actual: 342,
            meta: 500,
            porcentaje: 68,
            icono: 'bi-globe',
            color: 'info'
        },
        {
            titulo: 'Conversión',
            actual: 5.2,
            meta: 8,
            porcentaje: 65,
            icono: 'bi-funnel',
            color: 'warning'
        }
    ];
    
    // Alertas activas que requieren atención
    alertasActivas: AlertaActiva[] = [
        {
            id: 1,
            tipo: 'urgente',
            mensaje: '5 pedidos pendientes de confirmación',
            icono: 'bi-exclamation-circle-fill',
            tiempo: 'Hace 10 min',
            accion: 'Revisar',
            enlace: '/admin/pedidos?estado=pendiente'
        },
        {
            id: 2,
            tipo: 'importante',
            mensaje: '3 productos con stock crítico',
            icono: 'bi-box-seam',
            tiempo: 'Hace 1 hora',
            accion: 'Ver',
            enlace: '/admin/inventario/alertas'
        },
        {
            id: 3,
            tipo: 'info',
            mensaje: 'Nueva actualización disponible',
            icono: 'bi-arrow-clockwise',
            tiempo: 'Hace 2 horas'
        }
    ];
    
    productosPopulares: ProductoPopular[] = [
        {
            id: 1,
            nombre: 'Laptop HP Pavilion 15',
            categoria: 'Computadoras',
            ventas: 45,
            ingresos: 67500,
            stock: 12
        },
        {
            id: 2,
            nombre: 'iPhone 15 Pro Max',
            categoria: 'Celulares',
            ventas: 38,
            ingresos: 152000,
            stock: 8
        },
        {
            id: 3,
            nombre: 'Samsung Galaxy Watch 6',
            categoria: 'Wearables',
            ventas: 32,
            ingresos: 12800,
            stock: 25
        },
        {
            id: 4,
            nombre: 'Audífonos Sony WH-1000XM5',
            categoria: 'Audio',
            ventas: 28,
            ingresos: 11200,
            stock: 15
        },
        {
            id: 5,
            nombre: 'Monitor LG UltraWide 34"',
            categoria: 'Monitores',
            ventas: 22,
            ingresos: 19800,
            stock: 6
        }
    ];
    
    // Mis estadísticas personales
    misEstadisticas: MiEstadistica[] = [
        { titulo: 'Mis Productos', valor: 48, icono: 'bi-box-seam' },
        { titulo: 'Mis Ventas', valor: 156, icono: 'bi-bag-check' },
        { titulo: 'Días Activo', valor: 45, icono: 'bi-calendar-check' }
    ];
    
    // Mis accesos recientes
    misAccesosRecientes: MiAcceso[] = [
        {
            id: 1,
            dispositivo: 'Chrome - Windows',
            fecha: 'Ahora mismo',
            icono: 'bi-laptop',
            esActual: true
        },
        {
            id: 2,
            dispositivo: 'Safari - iPhone',
            fecha: 'Ayer, 18:30',
            icono: 'bi-phone',
            esActual: false
        },
        {
            id: 3,
            dispositivo: 'Chrome - Android',
            fecha: '25 Ene, 09:15',
            icono: 'bi-tablet',
            esActual: false
        }
    ];
    
    ngOnInit(): void {
        setTimeout(() => {
            this.cargando.set(false);
        }, 300);
    }
    
    obtenerSaludo(): string {
        const hora = new Date().getHours();
        if (hora < 12) return 'Buenos días';
        if (hora < 18) return 'Buenas tardes';
        return 'Buenas noches';
    }
    

    
    formatearValorTarjeta(tarjeta: TarjetaEstadistica): string {
        const valor = tarjeta.valor;
        let resultado = '';
        
        if (tarjeta.esMoneda) {
            if (valor >= 1000000) {
                resultado = (valor / 1000000).toFixed(1) + 'M';
            } else if (valor >= 10000) {
                resultado = (valor / 1000).toFixed(1) + 'K';
            } else {
                resultado = valor.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        } else {
            if (valor >= 1000000) {
                resultado = (valor / 1000000).toFixed(1) + 'M';
            } else if (valor >= 10000) {
                resultado = (valor / 1000).toFixed(1) + 'K';
            } else {
                resultado = valor.toLocaleString('es-HN');
            }
        }
        
        return resultado;
    }
    
    formatearMoneda(valor: number): string {
        return `L ${valor.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    formatearFechaRelativa(fecha: Date): string {
        const ahora = new Date();
        const diferencia = ahora.getTime() - fecha.getTime();
        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        
        if (minutos < 1) return 'Ahora mismo';
        if (minutos < 60) return `Hace ${minutos} min`;
        if (horas < 24) return `Hace ${horas} h`;
        return fecha.toLocaleDateString('es-HN');
    }
    
    obtenerColorStock(stock: number): string {
        if (stock <= 5) return 'text-danger';
        if (stock <= 15) return 'text-warning';
        return 'text-success';
    }
    
    obtenerInicialCliente(nombre: string): string {
        return nombre.charAt(0).toUpperCase();
    }
}
