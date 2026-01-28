import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthAdminService } from '../services/auth-admin.service';

@Component({
  selector: 'app-inicio-sesion-administrativo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './inicio-sesion-administrativo.component.html',
  styleUrl: './inicio-sesion-administrativo.component.scss'
})
export class InicioSesionAdministrativoComponent implements OnInit {
  formularioInicioSesion: FormGroup;
  cargando = false;
  mostrarContrasena = false;
  mensajeError = '';
  correoEnfocado = false;
  contrasenaEnfocado = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthAdminService,
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
      this.router.navigate(['/admin/dashboard']);
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
          this.router.navigate(['/admin/dashboard']);
        } else {
          // Manejar errores que vienen como respuesta exitosa HTTP pero con exito: false
          if (respuesta.errores && Array.isArray(respuesta.errores)) {
            this.mensajeError = respuesta.errores.join('. ');
          } else {
            this.mensajeError = respuesta.mensaje || 'Error al iniciar sesión';
          }
        }
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = error.mensaje || 'Error de conexión con el servidor';
      }
    });
  }
}
