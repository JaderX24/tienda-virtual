import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthColaboradorService } from '../services/auth-colaborador.service';
import { IdiomaService } from '../../../../core/services/idioma.service';

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

    // Estado 2FA
    requiere2FA = false;
    metodo2fa = '';
    token2FA = '';
    codigo2FA = '';
    mensaje2FA = '';
    reenviando = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthColaboradorService,
        private router: Router,
        private idiomaService: IdiomaService,
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

                if (respuesta.requiere2FA) {
                    this.requiere2FA = true;
                    this.metodo2fa = respuesta.metodo2fa || 'correo';
                    this.token2FA = respuesta.token2FA || '';
                    this.mensaje2FA = respuesta.mensaje;
                    return;
                }

                if (respuesta.exito) {
                    this.router.navigate(['/colaborador/dashboard']);
                } else {
                    if (respuesta.errores && Array.isArray(respuesta.errores)) {
                        this.mensajeError = respuesta.errores.join('. ');
                    } else {
                        this.mensajeError = respuesta.mensaje || this.idiomaService.t('login.errorInicioSesion');
                    }
                }
            },
            error: (error) => {
                this.cargando = false;

                if (error?.message === 'ROL_NO_PERMITIDO') {
                    this.mensajeError = this.idiomaService.t('login.sinAcceso');
                    return;
                }

                const mensaje = error?.error?.mensaje || error?.mensaje;
                this.mensajeError = mensaje || this.idiomaService.t('login.errorConexion');
            }
        });
    }

    verificarCodigo2FA(): void {
        if (!this.codigo2FA || this.codigo2FA.length !== 6) {
            this.mensajeError = 'Ingresa el código de 6 dígitos';
            return;
        }

        this.cargando = true;
        this.mensajeError = '';

        this.authService.verificar2FA(this.token2FA, this.codigo2FA).subscribe({
            next: (respuesta) => {
                this.cargando = false;
                if (respuesta.exito) {
                    this.router.navigate(['/colaborador/dashboard']);
                } else {
                    this.mensajeError = respuesta.mensaje || 'Código incorrecto';
                    this.codigo2FA = '';
                }
            },
            error: (error) => {
                this.cargando = false;
                this.mensajeError = error?.error?.mensaje || 'Error al verificar el código';
                this.codigo2FA = '';
            },
        });
    }

    reenviarCodigo(): void {
        if (this.reenviando) return;

        this.reenviando = true;
        this.mensajeError = '';

        this.authService.reenviarCodigo2FA(this.token2FA).subscribe({
            next: (respuesta) => {
                this.reenviando = false;
                this.mensaje2FA = respuesta.mensaje;
            },
            error: () => {
                this.reenviando = false;
                this.mensajeError = 'No se pudo reenviar el código';
            },
        });
    }

    volver(): void {
        this.requiere2FA = false;
        this.codigo2FA = '';
        this.token2FA = '';
        this.mensajeError = '';
        this.mensaje2FA = '';
    }

    alIngresarCodigo(event: Event): void {
        const input = event.target as HTMLInputElement;
        input.value = input.value.replace(/\D/g, '').substring(0, 6);
        this.codigo2FA = input.value;
    }
}
