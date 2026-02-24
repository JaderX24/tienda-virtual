import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoriasService } from '../../services';
import { Categoria, CrearCategoriaDto, ActualizarCategoriaDto } from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-formulario-categoria',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-categoria.component.html',
    styleUrl: './formulario-categoria.component.scss'
})
export class FormularioCategoriaComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private categoriasService = inject(CategoriasService);
    private toastService = inject(ToastService);

    formulario!: FormGroup;
    cargando = signal(true);
    guardando = signal(false);

    categoriaId = signal<number | null>(null);
    categoria = signal<Categoria | null>(null);
    categoriasPadre = signal<Categoria[]>([]);

    esEdicion = computed(() => this.categoriaId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Categoría' : 'Nueva Categoría');

    ngOnInit(): void {
        this.inicializarFormulario();
        this.cargarCategoriasPadre();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.categoriaId.set(parseInt(id, 10));
            this.cargarCategoria();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            descripcion: ['', [Validators.maxLength(500)]],
            categoriaPadreId: [null],
            activa: [true]
        });
    }

    private cargarCategoriasPadre(): void {
        this.categoriasService.obtenerTodas().subscribe({
            next: (categorias) => {
                this.categoriasPadre.set(categorias.filter(c => !c.categoriaPadreId));
            },
            error: () => {}
        });
    }

    private cargarCategoria(): void {
        const id = this.categoriaId();
        if (!id) return;

        this.categoriasService.obtenerPorId(id).subscribe({
            next: (categoria) => {
                this.categoria.set(categoria);
                this.formulario.patchValue({
                    nombre: categoria.nombre,
                    descripcion: categoria.descripcion || '',
                    categoriaPadreId: categoria.categoriaPadreId || null,
                    activa: categoria.activa
                });
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('No se pudo cargar la categoría');
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
            this.actualizarCategoria(valores);
        } else {
            this.crearCategoria(valores);
        }
    }

    private crearCategoria(valores: Record<string, unknown>): void {
        const datos: CrearCategoriaDto = {
            nombre: valores['nombre'] as string,
            descripcion: (valores['descripcion'] as string) || undefined,
            categoriaPadreId: valores['categoriaPadreId'] ? Number(valores['categoriaPadreId']) : undefined,
        };

        this.categoriasService.crear(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Categoría creada exitosamente');
                this.router.navigate(['/admin/categorias']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private actualizarCategoria(valores: Record<string, unknown>): void {
        const id = this.categoriaId();
        if (!id) return;

        const datos: ActualizarCategoriaDto = {
            nombre: valores['nombre'] as string,
            descripcion: (valores['descripcion'] as string) || undefined,
            activa: valores['activa'] as boolean,
        };

        this.categoriasService.actualizar(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Categoría actualizada exitosamente');
                this.router.navigate(['/admin/categorias']);
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
        this.router.navigate(['/admin/categorias']);
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

    categoriaPadreDisponibles(): Categoria[] {
        const idActual = this.categoriaId();
        return this.categoriasPadre().filter(c => c.id !== idActual);
    }
}
