import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ColaboradoresService } from '../../services';
import { Colaborador, ColaboradorRol, CrearColaboradorDto, ActualizarColaboradorDto } from '../../interfaces';

@Component({
    selector: 'app-formulario-colaborador',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-colaborador.component.html',
    styleUrl: './formulario-colaborador.component.scss'
})
export class FormularioColaboradorComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private colaboradoresService = inject(ColaboradoresService);

    formulario!: FormGroup;
    empresas = signal<{ id: number; nombre: string }[]>([]);
    cargando = signal(true);
    guardando = signal(false);
    errorServidor = signal<string | null>(null);
    correoEnviado = signal(false);
    correoColaboradorCreado = signal<string>('');
    mostrarInfoCreacion = signal(false);

    colaboradorId = signal<number | null>(null);
    colaborador = signal<Colaborador | null>(null);

    esEdicion = computed(() => this.colaboradorId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Colaborador' : 'Nuevo Colaborador');

    fechaMaximaIngreso = new Date().toISOString().split('T')[0];
    fechaMaximaNacimiento = new Date(
        new Date().getFullYear() - 18,
        new Date().getMonth(),
        new Date().getDate()
    ).toISOString().split('T')[0];

    tiposContrato = [
        { valor: 'permanente', etiqueta: 'Permanente' },
        { valor: 'temporal', etiqueta: 'Temporal' },
        { valor: 'medio_tiempo', etiqueta: 'Medio Tiempo' },
        { valor: 'practicante', etiqueta: 'Practicante' }
    ];

    generos = [
        { valor: 'masculino', etiqueta: 'Masculino' },
        { valor: 'femenino', etiqueta: 'Femenino' },
        { valor: 'otro', etiqueta: 'Otro' },
        { valor: 'no_especificado', etiqueta: 'Prefiero no decir' }
    ];

    metodos2fa = [
        { valor: 'ninguno', etiqueta: 'Ninguno' },
        { valor: 'app', etiqueta: 'Aplicación Autenticadora' },
        { valor: 'sms', etiqueta: 'SMS' },
        { valor: 'correo', etiqueta: 'Correo Electrónico' }
    ];

    paises = [
        { codigo: '+504', pais: 'Honduras', bandera: '🇭🇳', digitos: 8 },
        { codigo: '+502', pais: 'Guatemala', bandera: '🇬🇹', digitos: 8 },
        { codigo: '+503', pais: 'El Salvador', bandera: '🇸🇻', digitos: 8 },
        { codigo: '+505', pais: 'Nicaragua', bandera: '🇳🇮', digitos: 8 },
        { codigo: '+506', pais: 'Costa Rica', bandera: '🇨🇷', digitos: 8 },
        { codigo: '+52', pais: 'México', bandera: '🇲🇽', digitos: 10 },
        { codigo: '+1', pais: 'Estados Unidos', bandera: '🇺🇸', digitos: 10 }
    ];

    paisSeleccionadoTelefono = signal(this.paises[0]);
    paisSeleccionadoEmergencia = signal(this.paises[0]);

    ngOnInit(): void {
        this.inicializarFormulario();
        this.cargarEmpresas();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.colaboradorId.set(parseInt(id, 10));
            this.cargarColaborador();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasValidator()]],
            apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasValidator()]],
            correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            codigoColaborador: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            numeroIdentidad: ['', [Validators.maxLength(20)]],
            fechaNacimiento: ['', [this.fechaNacimientoValidator()]],
            genero: ['no_especificado'],

            codigoPaisTelefono: ['+504'],
            telefono: [''],
            codigoPaisEmergencia: ['+504'],
            telefonoEmergencia: [''],
            contactoEmergenciaNombre: ['', [Validators.maxLength(200)]],

            cargo: ['', [Validators.maxLength(150)]],
            fechaIngreso: [new Date().toISOString().split('T')[0], [this.fechaNoFuturaValidator()]],
            tipoContrato: ['permanente', [Validators.required]],
            empresaId: [null],

            requiere2fa: [false],
            metodo2fa: ['ninguno'],
            accesoSoloHorarioTurno: [false],
            maxSesionesSimultaneas: [1, [Validators.min(1), Validators.max(5)]]
        });
    }

    private soloLetrasValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
            if (!regex.test(valor)) {
                return { soloLetras: true };
            }
            return null;
        };
    }

    private fechaNoFuturaValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor) return null;
            const fecha = new Date(valor);
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999);
            if (fecha > hoy) {
                return { fechaFutura: true };
            }
            return null;
        };
    }

    private fechaNacimientoValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor) return null;
            const fechaNac = new Date(valor);
            const hoy = new Date();
            if (fechaNac > hoy) {
                return { fechaFutura: true };
            }
            const edadMinima = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
            if (fechaNac > edadMinima) {
                return { menorDeEdad: true };
            }
            return null;
        };
    }

    seleccionarPaisTelefono(indicePais: number): void {
        this.paisSeleccionadoTelefono.set(this.paises[indicePais]);
        this.formulario.patchValue({ codigoPaisTelefono: this.paises[indicePais].codigo });
    }

    seleccionarPaisEmergencia(indicePais: number): void {
        this.paisSeleccionadoEmergencia.set(this.paises[indicePais]);
        this.formulario.patchValue({ codigoPaisEmergencia: this.paises[indicePais].codigo });
    }

    private cargarEmpresas(): void {
        this.colaboradoresService.obtenerEmpresas().subscribe({
            next: (empresas) => this.empresas.set(empresas),
            error: () => this.empresas.set([
                { id: 1, nombre: 'TiendaVirtual HN' }
            ])
        });
    }

    private cargarColaborador(): void {
        const id = this.colaboradorId();
        if (!id) return;

        this.colaboradoresService.obtenerColaboradorPorId(id).subscribe({
            next: (colaborador) => {
                this.colaborador.set(colaborador);
                this.formulario.patchValue({
                    nombre: colaborador.nombre,
                    apellido: colaborador.apellido,
                    correo: colaborador.correo,
                    codigoColaborador: colaborador.codigoColaborador,
                    numeroIdentidad: colaborador.numeroIdentidad || '',
                    fechaNacimiento: colaborador.fechaNacimiento
                        ? new Date(colaborador.fechaNacimiento).toISOString().split('T')[0]
                        : '',
                    genero: colaborador.genero || 'no_especificado',
                    telefono: colaborador.telefono || '',
                    telefonoEmergencia: colaborador.telefonoEmergencia || '',
                    contactoEmergenciaNombre: colaborador.contactoEmergenciaNombre || '',
                    cargo: colaborador.cargo || '',
                    fechaIngreso: colaborador.fechaIngreso
                        ? new Date(colaborador.fechaIngreso).toISOString().split('T')[0]
                        : '',
                    tipoContrato: colaborador.tipoContrato,
                    empresaId: colaborador.empresaId,
                    requiere2fa: colaborador.requiere2fa,
                    metodo2fa: colaborador.metodo2fa || 'ninguno',
                    accesoSoloHorarioTurno: colaborador.accesoSoloHorarioTurno,
                    maxSesionesSimultaneas: colaborador.maxSesionesSimultaneas
                });
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.router.navigate(['/admin/colaboradores']);
            }
        });
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const valores = this.formulario.value;
        this.guardando.set(true);

        if (this.esEdicion()) {
            this.actualizarColaborador(valores);
        } else {
            this.crearColaborador(valores);
        }
    }

    private construirTelefono(codigo: string, numero: string): string | undefined {
        if (!numero || numero.trim() === '') return undefined;
        return `${codigo}${numero.replace(/\D/g, '')}`;
    }

    private crearColaborador(valores: any): void {
        this.errorServidor.set(null);

        const datos: CrearColaboradorDto = {
            nombre: valores.nombre.trim(),
            apellido: valores.apellido.trim(),
            correo: valores.correo.trim(),
            codigoColaborador: valores.codigoColaborador.trim(),
            tipoContrato: valores.tipoContrato
        };

        if (valores.numeroIdentidad?.trim()) datos.numeroIdentidad = valores.numeroIdentidad.trim();
        if (valores.fechaNacimiento) datos.fechaNacimiento = valores.fechaNacimiento;
        if (valores.genero) datos.genero = valores.genero;

        const telefonoCompleto = this.construirTelefono(valores.codigoPaisTelefono, valores.telefono);
        if (telefonoCompleto) datos.telefono = telefonoCompleto;

        const emergenciaCompleto = this.construirTelefono(valores.codigoPaisEmergencia, valores.telefonoEmergencia);
        if (emergenciaCompleto) datos.telefonoEmergencia = emergenciaCompleto;
        if (valores.contactoEmergenciaNombre?.trim()) {
            datos.contactoEmergenciaNombre = valores.contactoEmergenciaNombre.trim();
        }

        if (valores.cargo?.trim()) datos.cargo = valores.cargo.trim();
        if (valores.fechaIngreso) datos.fechaIngreso = valores.fechaIngreso;
        if (valores.empresaId) datos.empresaId = Number(valores.empresaId);
        if (valores.requiere2fa) datos.requiere2fa = valores.requiere2fa;
        if (valores.metodo2fa && valores.metodo2fa !== 'ninguno') datos.metodo2fa = valores.metodo2fa;
        if (valores.accesoSoloHorarioTurno) datos.accesoSoloHorarioTurno = valores.accesoSoloHorarioTurno;
        if (valores.maxSesionesSimultaneas) datos.maxSesionesSimultaneas = valores.maxSesionesSimultaneas;

        this.colaboradoresService.crearColaborador(datos).subscribe({
            next: (respuesta) => {
                this.guardando.set(false);
                this.correoEnviado.set(respuesta.correoEnviado);
                this.correoColaboradorCreado.set(datos.correo);
                this.mostrarInfoCreacion.set(true);
            },
            error: (err) => {
                this.guardando.set(false);
                this.procesarErrorServidor(err);
            }
        });
    }

    private actualizarColaborador(valores: any): void {
        const id = this.colaboradorId();
        if (!id) return;

        const datos: ActualizarColaboradorDto = {};

        if (valores.nombre?.trim()) datos.nombre = valores.nombre.trim();
        if (valores.apellido?.trim()) datos.apellido = valores.apellido.trim();
        if (valores.correo?.trim()) datos.correo = valores.correo.trim();
        if (valores.numeroIdentidad?.trim()) datos.numeroIdentidad = valores.numeroIdentidad.trim();
        if (valores.fechaNacimiento) datos.fechaNacimiento = valores.fechaNacimiento;
        if (valores.genero) datos.genero = valores.genero;

        const telefonoCompleto = this.construirTelefono(valores.codigoPaisTelefono, valores.telefono);
        if (telefonoCompleto) datos.telefono = telefonoCompleto;

        const emergenciaCompleto = this.construirTelefono(valores.codigoPaisEmergencia, valores.telefonoEmergencia);
        if (emergenciaCompleto) datos.telefonoEmergencia = emergenciaCompleto;
        if (valores.contactoEmergenciaNombre?.trim()) {
            datos.contactoEmergenciaNombre = valores.contactoEmergenciaNombre.trim();
        }

        if (valores.cargo?.trim()) datos.cargo = valores.cargo.trim();
        if (valores.fechaIngreso) datos.fechaIngreso = valores.fechaIngreso;
        if (valores.tipoContrato) datos.tipoContrato = valores.tipoContrato;
        if (valores.empresaId) datos.empresaId = Number(valores.empresaId);
        datos.requiere2fa = valores.requiere2fa;
        datos.metodo2fa = valores.metodo2fa;
        datos.accesoSoloHorarioTurno = valores.accesoSoloHorarioTurno;
        datos.maxSesionesSimultaneas = valores.maxSesionesSimultaneas;

        this.colaboradoresService.actualizarColaborador(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/colaboradores']);
            },
            error: (err) => {
                this.guardando.set(false);
                this.procesarErrorServidor(err);
            }
        });
    }

    private procesarErrorServidor(err: any): void {
        if (err.error?.message) {
            const mensajes = Array.isArray(err.error.message)
                ? err.error.message.join(', ')
                : err.error.message;
            this.errorServidor.set(mensajes);
        } else if (err.error?.mensaje) {
            this.errorServidor.set(err.error.mensaje);
        } else {
            this.errorServidor.set('Error al procesar la solicitud. Intente nuevamente.');
        }
    }

    toggleEstadoColaborador(event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        const id = this.colaboradorId();
        if (!id) return;

        this.colaboradoresService.cambiarEstado(id, checkbox.checked).subscribe({
            next: (actualizado) => this.colaborador.set(actualizado),
            error: () => { checkbox.checked = !checkbox.checked; }
        });
    }

    cancelar(): void {
        this.router.navigate(['/admin/colaboradores']);
    }

    irAListaColaboradores(): void {
        this.router.navigate(['/admin/colaboradores']);
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
        if (errores['soloLetras']) return 'Solo puede contener letras';
        if (errores['fechaFutura']) return 'La fecha no puede ser futura';
        if (errores['menorDeEdad']) return 'Debe tener al menos 18 años';
        if (errores['min']) return `El valor mínimo es ${errores['min'].min}`;
        if (errores['max']) return `El valor máximo es ${errores['max'].max}`;

        return 'Campo inválido';
    }

    obtenerIniciales(nombre: string, apellido?: string): string {
        if (!nombre) return '?';
        let iniciales = nombre.charAt(0);
        if (apellido) {
            iniciales += apellido.charAt(0);
        }
        return iniciales.toUpperCase();
    }

    obtenerNombreCompleto(): string {
        const nombre = this.formulario.get('nombre')?.value || '';
        const apellido = this.formulario.get('apellido')?.value || '';
        return `${nombre} ${apellido}`.trim() || 'Nombre del colaborador';
    }
}
