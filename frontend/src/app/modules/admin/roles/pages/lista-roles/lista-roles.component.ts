import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../../services';
import { Rol, FiltrosRol } from '../../interfaces';
import { ToastService } from '../../../../../core/services';

@Component({
    selector: 'app-lista-roles',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './lista-roles.component.html',
    styleUrl: './lista-roles.component.scss'
})
export class ListaRolesComponent implements OnInit {
    private rolesService = inject(RolesService);
    private toastService = inject(ToastService);

    roles = signal<Rol[]>([]);
    cargando = signal(true);
    
    // Filtros
    busqueda = signal('');
    estadoSeleccionado = signal<boolean | null>(null);
    
    // Roles filtrados (filtrado local)
    rolesFiltrados = computed(() => {
        let lista = this.roles();
        
        const termino = this.busqueda().toLowerCase().trim();
        if (termino) {
            lista = lista.filter(rol =>
                rol.nombre.toLowerCase().includes(termino) ||
                rol.codigo.toLowerCase().includes(termino) ||
                rol.descripcion?.toLowerCase().includes(termino)
            );
        }
        
        const estado = this.estadoSeleccionado();
        if (estado !== null) {
            lista = lista.filter(rol => rol.activo === estado);
        }
        
        return lista;
    });
    
    // Modal
    rolSeleccionado = signal<Rol | null>(null);
    mostrarModalEstado = signal(false);
    procesando = signal(false);

    ngOnInit(): void {
        this.cargarRoles();
    }

    cargarRoles(): void {
        this.cargando.set(true);

        this.rolesService.obtenerRoles().subscribe({
            next: (roles) => {
                this.roles.set(roles);
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('Error al cargar los roles');
                this.cargando.set(false);
            }
        });
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.estadoSeleccionado.set(null);
    }

    abrirModalEstado(rol: Rol): void {
        this.rolSeleccionado.set(rol);
        this.mostrarModalEstado.set(true);
    }

    cerrarModalEstado(): void {
        this.mostrarModalEstado.set(false);
        this.rolSeleccionado.set(null);
    }

    confirmarCambioEstado(): void {
        const rol = this.rolSeleccionado();
        if (!rol) return;

        this.procesando.set(true);
        this.rolesService.cambiarEstado(rol.id, !rol.activo).subscribe({
            next: () => {
                this.toastService.success(`Rol ${!rol.activo ? 'activado' : 'desactivado'} correctamente`);
                this.cerrarModalEstado();
                this.cargarRoles();
                this.procesando.set(false);
            },
            error: () => {
                this.toastService.error('Error al cambiar el estado del rol');
                this.procesando.set(false);
            }
        });
    }

    formatearFecha(fecha: Date | string | undefined): string {
        if (!fecha) return 'Sin registro';
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    esRolProtegido(rol: Rol): boolean {
        const rolesProtegidos = ['super_admin', 'admin'];
        return rolesProtegidos.includes(rol.codigo);
    }
}
