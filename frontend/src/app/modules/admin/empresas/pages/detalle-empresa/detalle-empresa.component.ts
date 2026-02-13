import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmpresasService } from '../../services';
import {
    Empresa, EstadisticasEmpresa,
    TipoNegocio, PlanSuscripcion, RangoEmpleados
} from '../../interfaces';

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

    empresa = signal<Empresa | null>(null);
    estadisticas = signal<EstadisticasEmpresa | null>(null);
    cargando = signal(true);

    private tiposNegocio: Record<string, string> = {
        [TipoNegocio.TIENDA_ROPA]: 'Tienda de Ropa',
        [TipoNegocio.RESTAURANTE]: 'Restaurante',
        [TipoNegocio.SUPERMERCADO]: 'Supermercado',
        [TipoNegocio.FARMACIA]: 'Farmacia',
        [TipoNegocio.TECNOLOGIA]: 'Tecnologia',
        [TipoNegocio.FERRETERIA]: 'Ferreteria',
        [TipoNegocio.LIBRERIA]: 'Libreria',
        [TipoNegocio.SERVICIOS]: 'Servicios',
        [TipoNegocio.MAYORISTA]: 'Mayorista',
        [TipoNegocio.OTRO]: 'Otro'
    };

    private planesSuscripcion: Record<string, string> = {
        [PlanSuscripcion.BASICO]: 'Basico',
        [PlanSuscripcion.PROFESIONAL]: 'Profesional',
        [PlanSuscripcion.EMPRESARIAL]: 'Empresarial',
        [PlanSuscripcion.PREMIUM]: 'Premium'
    };

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
                this.empresa.set(this.empresaMock);
                this.cargando.set(false);
            }
        });
    }

    private cargarEstadisticas(id: number): void {
        this.empresasService.obtenerEstadisticas(id).subscribe({
            next: (stats) => this.estadisticas.set(stats),
            error: () => this.estadisticas.set(this.estadisticasMock)
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
        return this.tiposNegocio[tipo] || tipo;
    }

    obtenerEtiquetaPlan(plan?: PlanSuscripcion): string {
        if (!plan) return 'Sin plan';
        return this.planesSuscripcion[plan] || plan;
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

    private empresaMock: Empresa = {
        id: 1, nombre: 'Supermercados La Colonia', rtn: '0801-1990-000001',
        nit: 'NIT-001234', correo: 'admin@lacolonia.hn', telefono: '+504 2233-4455',
        celular: '+504 9988-7766', tipoNegocio: TipoNegocio.SUPERMERCADO,
        planSuscripcion: PlanSuscripcion.EMPRESARIAL, descripcion: 'Cadena de supermercados lider en Honduras',
        representanteLegal: 'Carlos Eduardo Mendoza', activa: true,
        departamento: 'Francisco Morazan', ciudad: 'Tegucigalpa', pais: 'HN',
        direccion: 'Boulevard Morazan, Torre 1, Piso 5', codigoPostal: '11101',
        moneda: 'HNL', zonaHoraria: 'America/Tegucigalpa',
        cantidadEmpleados: RangoEmpleados.CIEN_UNO_QUINIENTOS,
        sitioWeb: 'https://www.lacolonia.hn',
        redesSociales: { facebook: 'LaColoniaHN', instagram: '@lacolonia_hn', whatsapp: '+50499887766' },
        creadoEn: new Date('2024-01-15'), actualizadoEn: new Date()
    };

    private estadisticasMock: EstadisticasEmpresa = {
        totalProductos: 156,
        totalPedidos: 1234,
        totalVentas: 245000,
        totalUsuarios: 8
    };
}
