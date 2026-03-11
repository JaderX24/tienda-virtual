import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services';
import { Usuario, Rol, FiltrosUsuario } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-lista-usuarios',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-usuarios.component.html',
    styleUrl: './lista-usuarios.component.scss'
})
export class ListaUsuariosComponent implements OnInit {
    private usuariosService = inject(UsuariosService);
    private toastService = inject(ToastService);

    usuarios = signal<Usuario[]>([]);
    roles = signal<Rol[]>([]);
    cargando = signal(true);
    
    // Filtros
    busqueda = signal('');
    rolSeleccionado = signal<number | null>(null);
    estadoSeleccionado = signal<boolean | null>(null);
    
    // Paginación
    paginaActual = signal(1);
    limite = signal(10);
    totalUsuarios = signal(0);
    
    totalPaginas = computed(() => Math.ceil(this.totalUsuarios() / this.limite()));
    
    // Modal
    usuarioSeleccionado = signal<Usuario | null>(null);
    mostrarModalEstado = signal(false);
    procesando = signal(false);

    ngOnInit(): void {
        this.cargarRoles();
        this.cargarUsuarios();
    }

    cargarUsuarios(): void {
        this.cargando.set(true);
        
        const filtros: FiltrosUsuario = {
            pagina: this.paginaActual(),
            limite: this.limite(),
            busqueda: this.busqueda() || undefined,
            rolId: this.rolSeleccionado() || undefined,
            activo: this.estadoSeleccionado() ?? undefined
        };

        this.usuariosService.obtenerUsuarios(filtros).subscribe({
            next: (respuesta) => {
                this.usuarios.set(respuesta.datos);
                this.totalUsuarios.set(respuesta.total);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.toastService.error('Error al cargar los usuarios');
            }
        });
    }

    cargarRoles(): void {
        this.usuariosService.obtenerRoles().subscribe({
            next: (roles) => {
                if (Array.isArray(roles)) {
                    this.roles.set(roles);
                }
            },
            error: () => this.toastService.error('Error al cargar los roles')
        });
    }

    buscar(): void {
        this.paginaActual.set(1);
        this.cargarUsuarios();
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.rolSeleccionado.set(null);
        this.estadoSeleccionado.set(null);
        this.paginaActual.set(1);
        this.cargarUsuarios();
    }

    cambiarPagina(pagina: number): void {
        if (pagina >= 1 && pagina <= this.totalPaginas()) {
            this.paginaActual.set(pagina);
            this.cargarUsuarios();
        }
    }

    abrirModalEstado(usuario: Usuario): void {
        this.usuarioSeleccionado.set(usuario);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.usuarioSeleccionado.set(null);
    }

    confirmarCambioEstado(): void {
        const usuario = this.usuarioSeleccionado();
        if (!usuario) return;

        this.procesando.set(true);
        this.usuariosService.cambiarEstado(usuario.id, !usuario.activo).subscribe({
            next: () => {
                this.cerrarModalEstado();
                this.cargarUsuarios();
                this.procesando.set(false);
            },
            error: () => {
                this.procesando.set(false);
            }
        });
    }

    obtenerIniciales(nombre: string): string {
        return nombre
            .split(' ')
            .map(palabra => palabra.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    formatearFecha(fecha: Date | string | undefined): string {
        if (!fecha) return 'Nunca';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    obtenerPaginas(): number[] {
        const total = this.totalPaginas();
        const actual = this.paginaActual();
        const paginas: number[] = [];
        
        let inicio = Math.max(1, actual - 2);
        let fin = Math.min(total, actual + 2);
        
        if (actual <= 3) {
            fin = Math.min(5, total);
        }
        if (actual >= total - 2) {
            inicio = Math.max(1, total - 4);
        }
        
        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }
        
        return paginas;
    }
}
