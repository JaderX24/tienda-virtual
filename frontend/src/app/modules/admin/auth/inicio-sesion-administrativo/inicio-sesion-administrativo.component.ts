import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio-sesion-administrativo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './inicio-sesion-administrativo.component.html',
  styleUrl: './inicio-sesion-administrativo.component.scss'
})
export class InicioSesionAdministrativoComponent {
  formularioInicioSesion: FormGroup;
  cargando = false;
  mostrarContrasena = false;
  mensajeError = '';
  correoEnfocado = false;
  contrasenaEnfocado = false;

  constructor(private fb: FormBuilder) {
    this.formularioInicioSesion = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      recordarme: [false]
    });
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

    const credenciales = this.formularioInicioSesion.value;
    
    // TODO: Implementar llamada al servicio de autenticación
    console.log('Credenciales:', credenciales);
    
    setTimeout(() => {
      this.cargando = false;
    }, 1500);
  }
}
