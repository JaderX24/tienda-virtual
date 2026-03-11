import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../../services';
import { Rol, CrearRolDto, ActualizarRolDto } from '../../interfaces';
import { OpcionesCatalogoService } from '../../../../../core/services';

@Component({
    selector: 'app-formulario-rol',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './formulario-rol.component.html',
    styleUrl: './formulario-rol.component.scss'
})
export class FormularioRolComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private rolesService = inject(RolesService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);

    formulario!: FormGroup;
    modoEdicion = signal(false);
    rolId = signal<number | null>(null);
    cargando = signal(false);
    guardando = signal(false);
    rolActual = signal<Rol | null>(null);

    ngOnInit(): void {
        this.inicializarFormulario();
        this.verificarModoEdicion();
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            codigo: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50),
                Validators.pattern(/^[a-z_]+$/)
            ]],
            nombre: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(100)
            ]],
            descripcion: ['', [
                Validators.maxLength(255)
            ]],
            activo: [true]
        });
    }

    private verificarModoEdicion(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.modoEdicion.set(true);
            this.rolId.set(+id);
            this.cargarRol(+id);
        }
    }

    private cargarRol(id: number): void {
        this.cargando.set(true);
        this.rolesService.obtenerRolPorId(id).subscribe({
            next: (rol) => {
                this.rolActual.set(rol);
                this.formulario.patchValue({
                    codigo: rol.codigo,
                    nombre: rol.nombre,
                    descripcion: rol.descripcion || '',
                    activo: rol.activo
                });
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.router.navigate(['/admin/roles']);
            }
        });
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        this.guardando.set(true);
        const datos = this.formulario.value;

        if (this.modoEdicion()) {
            this.actualizarRol(datos);
        } else {
            this.crearRol(datos);
        }
    }

    private crearRol(datos: CrearRolDto): void {
        this.rolesService.crearRol(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/roles']);
            },
            error: () => {
                this.guardando.set(false);
            }
        });
    }

    private actualizarRol(datos: ActualizarRolDto): void {
        const id = this.rolId();
        if (!id) return;

        this.rolesService.actualizarRol(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/roles']);
            },
            error: () => {
                this.guardando.set(false);
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/admin/roles']);
    }

    tieneError(campo: string): boolean {
        const control = this.formulario.get(campo);
        return !!(control && control.invalid && control.touched);
    }

    obtenerError(campo: string): string {
        const control = this.formulario.get(campo);
        if (!control || !control.errors) return '';

        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['minlength']) {
            return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
        }
        if (control.errors['maxlength']) {
            return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
        }
        if (control.errors['pattern']) {
            if (campo === 'codigo') {
                return 'Solo letras minúsculas y guiones bajos';
            }
        }

        return 'Campo inválido';
    }

    esRolProtegido(): boolean {
        const rol = this.rolActual();
        if (!rol) return false;
        const rolesProtegidos = this.opcionesCatalogo.obtenerGrupo('rolesProtegidos').map(o => o.valor);
        return rolesProtegidos.includes(rol.codigo);
    }
}
