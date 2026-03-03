import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthColaboradorService } from '../services/auth-colaborador.service';

@Component({
    selector: 'app-inicio-sesion-colaborador',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './inicio-sesion-colaborador.component.html',
    styleUrl: './inicio-sesion-colaborador.component.scss'
})
export class InicioSesionColaboradorComponent implements OnInit {
    formularioInicioSesion: FormGroup;
    cargando = false;
    mostrarContrasena = false;
    mensajeError = '';
    correoEnfocado = false;
    contrasenaEnfocado = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthColaboradorService,
        private router: Router,
    ) {
        this.formularioInicioSesion = this.fb.group({
            correo: ['', [Validators.required, Validators.email]],
            contrasena: ['', [Validators.required, Validators.minLength(12)]],
            recordarme: [false]
        });
    }

    ngOnInit(): void {
        if (this.authService.estaAutenticado()) {
            this.router.navigate(['/colaborador/dashboard']);
        }
    }

    get correo() {
        return this.formularioInicioSesion.get('correo');
    }

    get contrasena() {
        return this.formularioInicioSesion.get('contrasena');
    }

    alternarVisibilidadContrasena(): void {
        this.mostrarContrasena = !this.mostrarContrasena;
    }

    iniciarSesion(): void {
        if (this.formularioInicioSesion.invalid) {
            this.formularioInicioSesion.markAllAsTouched();
            return;
        }

        this.cargando = true;
        this.mensajeError = '';

        const credenciales = {
            correo: this.formularioInicioSesion.value.correo,
            contrasena: this.formularioInicioSesion.value.contrasena,
        };

        this.authService.iniciarSesion(credenciales).subscribe({
            next: (respuesta) => {
                this.cargando = false;
                if (respuesta.exito) {
                    this.router.navigate(['/colaborador/dashboard']);
                } else {
                    if (respuesta.errores && Array.isArray(respuesta.errores)) {
                        this.mensajeError = respuesta.errores.join('. ');
                    } else {
                        this.mensajeError = respuesta.mensaje || 'Error al iniciar sesión';
                    }
                }
            },
            error: (error) => {
                this.cargando = false;

                if (error?.message === 'ROL_NO_PERMITIDO') {
                    this.mensajeError = 'Tu cuenta no tiene acceso al portal de colaboradores. Verifica que tu rol sea el correcto.';
                    return;
                }

                const mensaje = error?.error?.mensaje || error?.mensaje;
                this.mensajeError = mensaje || 'Error de conexión con el servidor';
            }
        });
    }
}
