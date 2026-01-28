import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuariosService } from '../../services';
import { Usuario, Rol, CrearUsuarioDto, ActualizarUsuarioDto } from '../../interfaces';

@Component({
    selector: 'app-formulario-usuario',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-usuario.component.html',
    styleUrl: './formulario-usuario.component.scss'
})
export class FormularioUsuarioComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private usuariosService = inject(UsuariosService);

    formulario!: FormGroup;
    roles = signal<Rol[]>([]);
    cargando = signal(true);
    guardando = signal(false);
    mostrarContrasena = signal(false);
    
    usuarioId = signal<number | null>(null);
    usuario = signal<Usuario | null>(null);
    
    esEdicion = computed(() => this.usuarioId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Usuario' : 'Nuevo Usuario');

    ngOnInit(): void {
        this.inicializarFormulario();
        this.cargarRoles();
        
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.usuarioId.set(parseInt(id, 10));
            this.cargarUsuario();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            telefono: ['', [Validators.maxLength(20)]],
            rolId: [null, [Validators.required]],
            activo: [true],
            contrasena: ['', [Validators.minLength(12)]],
            confirmarContrasena: ['']
        });
    }

    private cargarRoles(): void {
        this.usuariosService.obtenerRoles().subscribe({
            next: (roles) => this.roles.set(roles),
            error: () => this.roles.set(this.rolesMock)
        });
    }

    private cargarUsuario(): void {
        const id = this.usuarioId();
        if (!id) return;

        this.usuariosService.obtenerUsuarioPorId(id).subscribe({
            next: (usuario) => {
                this.usuario.set(usuario);
                this.formulario.patchValue({
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    telefono: usuario.telefono || '',
                    rolId: usuario.rolId,
                    activo: usuario.activo
                });
                this.formulario.get('contrasena')?.clearValidators();
                this.formulario.get('contrasena')?.updateValueAndValidity();
                this.cargando.set(false);
            },
            error: () => {
                const usuarioMock = this.obtenerUsuarioMock(id);
                if (usuarioMock) {
                    this.usuario.set(usuarioMock);
                    this.formulario.patchValue({
                        nombre: usuarioMock.nombre,
                        correo: usuarioMock.correo,
                        telefono: usuarioMock.telefono || '',
                        rolId: usuarioMock.rolId,
                        activo: usuarioMock.activo
                    });
                }
                this.cargando.set(false);
            }
        });
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const valores = this.formulario.value;

        if (!this.esEdicion() && valores.contrasena !== valores.confirmarContrasena) {
            return;
        }

        this.guardando.set(true);

        if (this.esEdicion()) {
            this.actualizarUsuario(valores);
        } else {
            this.crearUsuario(valores);
        }
    }

    private crearUsuario(valores: any): void {
        const datos: CrearUsuarioDto = {
            nombre: valores.nombre,
            correo: valores.correo,
            contrasena: valores.contrasena,
            telefono: valores.telefono || undefined,
            rolId: valores.rolId,
            activo: valores.activo
        };

        this.usuariosService.crearUsuario(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/usuarios']);
            },
            error: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/usuarios']);
            }
        });
    }

    private actualizarUsuario(valores: any): void {
        const id = this.usuarioId();
        if (!id) return;

        const datos: ActualizarUsuarioDto = {
            nombre: valores.nombre,
            correo: valores.correo,
            telefono: valores.telefono || undefined,
            rolId: valores.rolId,
            activo: valores.activo
        };

        this.usuariosService.actualizarUsuario(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/usuarios']);
            },
            error: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/usuarios']);
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/admin/usuarios']);
    }

    toggleContrasena(): void {
        this.mostrarContrasena.update(valor => !valor);
    }

    tieneError(campo: string): boolean {
        const control = this.formulario.get(campo);
        return control ? control.invalid && control.touched : false;
    }

    obtenerError(campo: string): string {
        const control = this.formulario.get(campo);
        if (!control || !control.errors) return '';

        const errores = control.errors;
        
        if (errores['required']) return 'Este campo es obligatorio';
        if (errores['email']) return 'Ingresa un correo electrónico válido';
        if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres`;
        if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres`;

        return 'Campo inválido';
    }

    contrasenasCoinciden(): boolean {
        const contrasena = this.formulario.get('contrasena')?.value;
        const confirmar = this.formulario.get('confirmarContrasena')?.value;
        return contrasena === confirmar;
    }

    obtenerIniciales(nombre: string): string {
        if (!nombre) return '?';
        return nombre
            .split(' ')
            .map(palabra => palabra.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    private rolesMock: Rol[] = [
        { id: 1, codigo: 'admin', nombre: 'Administrador', activo: true },
        { id: 2, codigo: 'vendedor', nombre: 'Vendedor', activo: true },
        { id: 3, codigo: 'inventario', nombre: 'Encargado de Inventario', activo: true },
        { id: 4, codigo: 'soporte', nombre: 'Soporte al Cliente', activo: true }
    ];

    private obtenerUsuarioMock(id: number): Usuario | null {
        const usuarios: Usuario[] = [
            {
                id: 1,
                nombre: 'Administrador Sistema',
                correo: 'admin@tiendavirtual.com',
                telefono: '+504 9999-0001',
                activo: true,
                rolId: 1,
                rol: { id: 1, codigo: 'admin', nombre: 'Administrador', activo: true },
                creadoEn: new Date('2024-01-15'),
                actualizadoEn: new Date()
            },
            {
                id: 2,
                nombre: 'María García López',
                correo: 'maria.garcia@tiendavirtual.com',
                telefono: '+504 9999-0002',
                activo: true,
                rolId: 2,
                rol: { id: 2, codigo: 'vendedor', nombre: 'Vendedor', activo: true },
                creadoEn: new Date('2024-03-20'),
                actualizadoEn: new Date()
            }
        ];
        return usuarios.find(u => u.id === id) || null;
    }
}
