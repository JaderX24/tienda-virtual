import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ParametrosMantenimientoService } from '../../services';
import { ParametroSistema } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';
import { EstadoVisualizacionService } from '../../../../../core/services/estado-visualizacion.service';

@Component({
    selector: 'app-parametros-mantenimiento',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './parametros-mantenimiento.component.html',
    styleUrls: ['./parametros-mantenimiento.component.scss']
})
export class ParametrosMantenimientoComponent implements OnInit {
    private parametrosService = inject(ParametrosMantenimientoService);
    private toastService = inject(ToastService);
    private estadoVisualizacion = inject(EstadoVisualizacionService);

    parametros = signal<ParametroSistema[]>([]);
    cargando = signal(true);
    guardando = signal(false);
    parametroEditando = signal<number | null>(null);
    valorTemporal = signal('');
    categoriaActiva = signal('');

    categorias = computed(() => {
        const lista = this.parametros();
        if (!Array.isArray(lista) || lista.length === 0) return [];

        const categoriasUnicas = [...new Set(lista.map(p => p.categoria))];
        return categoriasUnicas.map(clave => ({
            clave,
            nombre: clave.charAt(0).toUpperCase() + clave.slice(1),
            icono: this.estadoVisualizacion.obtenerIcono('categoria_parametro', clave)
        }));
    });

    versionSistema = computed(() => {
        const param = this.parametros().find(p => p.clave === 'version_sistema');
        return param?.valor || '-';
    });

    entornoSistema = computed(() => {
        const param = this.parametros().find(p => p.clave === 'entorno_sistema');
        return param?.valor || 'desarrollo';
    });

    ultimaActualizacion = computed(() => {
        const lista = this.parametros();
        if (!lista.length) return '-';
        const fechas = lista.map(p => new Date(p.actualizadoEn).getTime());
        const masReciente = new Date(Math.max(...fechas));
        return this.formatearFecha(masReciente);
    });

    parametrosFiltrados = computed(() => {
        const lista = this.parametros();
        if (!Array.isArray(lista)) return [];
        return lista.filter(p => p.categoria === this.categoriaActiva());
    });

    ngOnInit(): void {
        this.cargarParametros();
    }

    cargarParametros(): void {
        this.cargando.set(true);

        this.parametrosService.obtenerParametros().subscribe({
            next: (params) => {
                const lista = Array.isArray(params) ? params : [];
                this.parametros.set(lista);

                if (!this.categoriaActiva() && lista.length > 0) {
                    const categoriasUnicas = [...new Set(lista.map(p => p.categoria))];
                    this.categoriaActiva.set(categoriasUnicas[0]);
                }

                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('Error al cargar los parámetros del sistema');
                this.cargando.set(false);
            }
        });
    }

    cambiarCategoria(categoria: string): void {
        this.categoriaActiva.set(categoria);
        this.cancelarEdicion();
    }

    iniciarEdicion(parametro: ParametroSistema): void {
        if (!parametro.editable) {
            this.toastService.warning('Este parámetro no es editable');
            return;
        }
        this.parametroEditando.set(parametro.id);
        this.valorTemporal.set(parametro.valor);
    }

    cancelarEdicion(): void {
        this.parametroEditando.set(null);
        this.valorTemporal.set('');
    }

    guardarParametro(parametro: ParametroSistema): void {
        const nuevoValor = this.valorTemporal();

        if (!this.validarValor(parametro, nuevoValor)) {
            return;
        }

        this.guardando.set(true);

        this.parametrosService.actualizarParametro(parametro.id, { valor: nuevoValor }).subscribe({
            next: () => {
                this.toastService.success('Parámetro actualizado correctamente');
                this.cancelarEdicion();
                this.guardando.set(false);
                this.cargarParametros();
            },
            error: () => {
                this.toastService.error('Error al actualizar el parámetro');
                this.guardando.set(false);
            }
        });
    }

    toggleBooleano(parametro: ParametroSistema): void {
        if (!parametro.editable) {
            this.toastService.warning('Este parámetro no es editable');
            return;
        }

        const nuevoValor = parametro.valor === 'true' ? 'false' : 'true';

        this.guardando.set(true);
        this.parametrosService.actualizarParametro(parametro.id, { valor: nuevoValor }).subscribe({
            next: () => {
                this.toastService.success('Parámetro actualizado correctamente');
                this.guardando.set(false);
                this.cargarParametros();
            },
            error: () => {
                this.toastService.error('Error al actualizar el parámetro');
                this.guardando.set(false);
            }
        });
    }

    private validarValor(parametro: ParametroSistema, valor: string): boolean {
        if (!valor.trim()) {
            this.toastService.warning('El valor no puede estar vacío');
            return false;
        }

        if (parametro.tipo === 'numero') {
            const num = Number(valor);
            if (isNaN(num) || num < 0) {
                this.toastService.warning('Debe ingresar un número válido');
                return false;
            }
        }

        if (parametro.tipo === 'booleano') {
            if (valor !== 'true' && valor !== 'false') {
                this.toastService.warning('El valor debe ser "true" o "false"');
                return false;
            }
        }

        return true;
    }

    obtenerIconoTipo(tipo: string): string {
        return this.estadoVisualizacion.obtenerIcono('tipo_parametro', tipo);
    }

    formatearClave(clave: string): string {
        return clave.replace(/_/g, ' ').toLowerCase()
            .replace(/^\w/, c => c.toUpperCase());
    }

    formatearValorMostrar(parametro: ParametroSistema): string {
        if (parametro.tipo === 'booleano') {
            return parametro.valor === 'true' ? 'Activo' : 'Inactivo';
        }
        return parametro.valor;
    }

    formatearFecha(fecha: Date | string): string {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
