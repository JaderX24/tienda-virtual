import { Component, EventEmitter, HostListener, inject, Input, Output, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthAdminService } from '../../auth/services/auth-admin.service';

interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    fecha: Date;
    leida: boolean;
    tipo: 'info' | 'warning' | 'success' | 'danger';
    icono: string;
}

interface Mensaje {
    id: number;
    remitente: string;
    avatar?: string;
    contenido: string;
    fecha: Date;
    leido: boolean;
}

@Component({
    selector: 'app-header-admin',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderAdminComponent {
    private authService = inject(AuthAdminService);
    private elementRef = inject(ElementRef);
    
    @Input() sidebarColapsado = false;
    @Output() toggleSidebar = new EventEmitter<void>();
    @Output() toggleSidebarMobile = new EventEmitter<void>();
    
    usuario = this.authService.usuario;
    
    mostrarNotificaciones = false;
    mostrarMensajes = false;
    mostrarPerfil = false;
    
    // Mensajes de ejemplo (en producción vendrían del backend)
    mensajes: Mensaje[] = [
        {
            id: 1,
            remitente: 'María García',
            contenido: 'Hola, tengo una consulta sobre mi pedido #4521',
            fecha: new Date(Date.now() - 1800000),
            leido: false
        },
        {
            id: 2,
            remitente: 'Carlos López',
            contenido: '¿Pueden verificar el estado de mi envío?',
            fecha: new Date(Date.now() - 5400000),
            leido: false
        },
        {
            id: 3,
            remitente: 'Ana Martínez',
            contenido: 'Gracias por la atención, excelente servicio',
            fecha: new Date(Date.now() - 86400000),
            leido: true
        }
    ];
    
    // Notificaciones de ejemplo (en producción vendrían del backend)
    notificaciones: Notificacion[] = [
        {
            id: 1,
            titulo: 'Nuevo pedido',
            mensaje: 'Se ha recibido un nuevo pedido #1234',
            fecha: new Date(),
            leida: false,
            tipo: 'success',
            icono: 'bi-cart-check'
        },
        {
            id: 2,
            titulo: 'Stock bajo',
            mensaje: 'El producto "Laptop HP" tiene stock bajo',
            fecha: new Date(Date.now() - 3600000),
            leida: false,
            tipo: 'warning',
            icono: 'bi-exclamation-triangle'
        },
        {
            id: 3,
            titulo: 'Nuevo usuario',
            mensaje: 'Un nuevo cliente se ha registrado',
            fecha: new Date(Date.now() - 7200000),
            leida: true,
            tipo: 'info',
            icono: 'bi-person-plus'
        }
    ];
    
    get notificacionesSinLeer(): number {
        return this.notificaciones.filter(n => !n.leida).length;
    }
    
    get mensajesSinLeer(): number {
        return this.mensajes.filter(m => !m.leido).length;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(evento: MouseEvent): void {
        const clickDentro = this.elementRef.nativeElement.contains(evento.target);
        if (!clickDentro) {
            this.cerrarDropdowns();
        }
    }
    
    alternarNotificaciones(): void {
        this.mostrarNotificaciones = !this.mostrarNotificaciones;
        this.mostrarMensajes = false;
        this.mostrarPerfil = false;
    }
    
    alternarMensajes(): void {
        this.mostrarMensajes = !this.mostrarMensajes;
        this.mostrarNotificaciones = false;
        this.mostrarPerfil = false;
    }
    
    alternarPerfil(): void {
        this.mostrarPerfil = !this.mostrarPerfil;
        this.mostrarNotificaciones = false;
        this.mostrarMensajes = false;
    }
    
    cerrarDropdowns(): void {
        this.mostrarNotificaciones = false;
        this.mostrarMensajes = false;
        this.mostrarPerfil = false;
    }
    
    marcarComoLeida(notificacion: Notificacion): void {
        notificacion.leida = true;
    }
    
    marcarTodasComoLeidas(): void {
        this.notificaciones.forEach(n => n.leida = true);
    }
    
    marcarMensajeComoLeido(mensaje: Mensaje): void {
        mensaje.leido = true;
    }
    
    marcarTodosMensajesComoLeidos(): void {
        this.mensajes.forEach(m => m.leido = true);
    }
    
    obtenerIniciales(nombre: string): string {
        return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    
    cerrarSesion(): void {
        this.cerrarDropdowns();
        this.authService.cerrarSesion().subscribe({
            next: () => {
                // La navegación se maneja en el servicio
            },
            error: () => {
                // El servicio también maneja el error y navega
            }
        });
    }
    
    obtenerTiempoRelativo(fecha: Date): string {
        const ahora = new Date();
        const diferencia = ahora.getTime() - fecha.getTime();
        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        const dias = Math.floor(diferencia / 86400000);
        
        if (minutos < 1) return 'Ahora mismo';
        if (minutos < 60) return `Hace ${minutos} min`;
        if (horas < 24) return `Hace ${horas} h`;
        return `Hace ${dias} d`;
    }
}
