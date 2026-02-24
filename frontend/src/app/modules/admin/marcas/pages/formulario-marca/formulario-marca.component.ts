import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MarcasService } from '../../services';
import { Marca, CrearMarcaDto, ActualizarMarcaDto } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-formulario-marca',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-marca.component.html',
    styleUrl: './formulario-marca.component.scss'
})
export class FormularioMarcaComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private marcasService = inject(MarcasService);
    private toastService = inject(ToastService);

    formulario!: FormGroup;
    cargando = signal(true);
    guardando = signal(false);

    marcaId = signal<number | null>(null);
    marca = signal<Marca | null>(null);

    esEdicion = computed(() => this.marcaId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Marca' : 'Nueva Marca');

    ngOnInit(): void {
        this.inicializarFormulario();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.marcaId.set(parseInt(id, 10));
            this.cargarMarca();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            descripcion: ['', [Validators.maxLength(500)]],
            logo: ['', [Validators.maxLength(500)]],
            activa: [true]
        });
    }

    private cargarMarca(): void {
        const id = this.marcaId();
        if (!id) return;

        this.marcasService.obtenerPorId(id).subscribe({
            next: (marca) => {
                this.marca.set(marca);
                this.formulario.patchValue({
                    nombre: marca.nombre,
                    descripcion: marca.descripcion || '',
                    logo: marca.logo || '',
                    activa: marca.activa
                });
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('No se pudo cargar la marca');
                this.cargando.set(false);
            }
        });
    }

    guardar(): void {
        if (this.guardando()) return;

        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            this.toastService.warning('Revisa los campos marcados en rojo');
            return;
        }

        this.guardando.set(true);
        const valores = this.formulario.value;

        if (this.esEdicion()) {
            this.actualizarMarca(valores);
        } else {
            this.crearMarca(valores);
        }
    }

    private crearMarca(valores: Record<string, unknown>): void {
        const datos: CrearMarcaDto = {
            nombre: valores['nombre'] as string,
            descripcion: (valores['descripcion'] as string) || undefined,
            logo: (valores['logo'] as string) || undefined,
        };

        this.marcasService.crear(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Marca creada exitosamente');
                this.router.navigate(['/admin/marcas']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private actualizarMarca(valores: Record<string, unknown>): void {
        const id = this.marcaId();
        if (!id) return;

        const datos: ActualizarMarcaDto = {
            nombre: valores['nombre'] as string,
            descripcion: (valores['descripcion'] as string) || undefined,
            logo: (valores['logo'] as string) || undefined,
            activa: valores['activa'] as boolean,
        };

        this.marcasService.actualizar(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Marca actualizada exitosamente');
                this.router.navigate(['/admin/marcas']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private procesarError(err: { error?: { message?: string | string[]; mensaje?: string } }): void {
        this.guardando.set(false);
        let mensaje = 'Error al procesar la solicitud. Intente nuevamente.';

        if (err?.error?.message) {
            mensaje = Array.isArray(err.error.message)
                ? err.error.message.join(', ')
                : err.error.message;
        } else if (err?.error?.mensaje) {
            mensaje = err.error.mensaje;
        }

        this.toastService.error(mensaje);
    }

    cancelar(): void {
        this.router.navigate(['/admin/marcas']);
    }

    tieneError(campo: string): boolean {
        const control = this.formulario.get(campo);
        return !!(control && control.invalid && control.touched);
    }

    obtenerError(campo: string): string {
        const control = this.formulario.get(campo);
        if (!control || !control.errors) return '';

        const errores = control.errors;
        if (errores['required']) return 'Este campo es obligatorio';
        if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres`;
        if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres`;
        return 'Campo inválido';
    }

    obtenerIniciales(nombre: string): string {
        if (!nombre) return '';
        return nombre.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
    }
}
