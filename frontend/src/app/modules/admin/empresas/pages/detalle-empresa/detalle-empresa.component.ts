import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmpresasService } from '../../services';
import {
    Empresa, EstadisticasEmpresa,
    TipoNegocio, PlanSuscripcion
} from '../../interfaces';
import { OpcionesCatalogoService, ToastService } from '../../../../../core/services';

@Component({
    selector: 'app-detalle-empresa',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './detalle-empresa.component.html',
    styleUrl: './detalle-empresa.component.scss'
})
export class DetalleEmpresaComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private empresasService = inject(EmpresasService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);
    private toastService = inject(ToastService);

    empresa = signal<Empresa | null>(null);
    estadisticas = signal<EstadisticasEmpresa | null>(null);
    cargando = signal(true);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarEmpresa(parseInt(id, 10));
            this.cargarEstadisticas(parseInt(id, 10));
        }
    }

    private cargarEmpresa(id: number): void {
        this.empresasService.obtenerEmpresaPorId(id).subscribe({
            next: (empresa) => {
                this.empresa.set(empresa);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.toastService.error('Error al cargar la empresa');
            }
        });
    }

    private cargarEstadisticas(id: number): void {
        this.empresasService.obtenerEstadisticas(id).subscribe({
            next: (stats) => this.estadisticas.set(stats),
            error: () => this.toastService.error('Error al cargar las estadísticas')
        });
    }

    irAEditar(): void {
        const emp = this.empresa();
        if (emp) this.router.navigate(['/admin/empresas', emp.id, 'editar']);
    }

    obtenerIniciales(nombre: string): string {
        return nombre.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
    }

    obtenerEtiquetaTipo(tipo: TipoNegocio): string {
        const encontrado = this.opcionesCatalogo.obtenerGrupo('tiposNegocio').find(t => t.valor === tipo);
        return encontrado ? encontrado.etiqueta : tipo;
    }

    obtenerEtiquetaPlan(plan?: PlanSuscripcion): string {
        if (!plan) return 'Sin plan';
        const encontrado = this.opcionesCatalogo.obtenerGrupo('planesSuscripcion').find(p => p.valor === plan);
        return encontrado ? encontrado.etiqueta : plan;
    }

    formatearFecha(fecha: Date | string | undefined): string {
        if (!fecha) return 'Sin fecha';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    formatearMoneda(monto: number): string {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL'
        }).format(monto);
    }
}
