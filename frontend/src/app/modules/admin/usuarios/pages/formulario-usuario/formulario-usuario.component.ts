import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuariosService } from '../../services';
import { Usuario, Rol, CrearUsuarioDto, ActualizarUsuarioDto } from '../../interfaces';
import { OpcionesCatalogoService } from '../../../../../core/services/opciones-catalogo.service';
import { ToastService } from '../../../../../core/services/toast.service';
import {
    PAISES_REFERENCIA, ESTADOS_POR_PAIS, CODIGOS_TELEFONICOS,
    PaisReferencia, CodigoTelefonicoPais
} from '../../../../../core/data/datos-geograficos';

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
    private opcionesCatalogo = inject(OpcionesCatalogoService);
    private toastService = inject(ToastService);

    formulario!: FormGroup;
    roles = signal<Rol[]>([]);
    cargando = signal(true);
    guardando = signal(false);
    mostrarContrasena = signal(false);
    mostrarInfoContrasena = signal(false);
    errorServidor = signal<string | null>(null);
    correoEnviado = signal(false);
    correoUsuarioCreado = signal<string>('');
    
    usuarioId = signal<number | null>(null);
    usuario = signal<Usuario | null>(null);
    
    esEdicion = computed(() => this.usuarioId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Usuario' : 'Nuevo Usuario');

    fechaMaximaIngreso = new Date().toISOString().split('T')[0];
    fechaMaximaNacimiento = new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0];

    tiposDocumento = computed(() => this.opcionesCatalogo.obtenerGrupo('tiposDocumento'));

    generos = computed(() => this.opcionesCatalogo.obtenerGrupo('generos'));

    paisesLista = PAISES_REFERENCIA;

    estadosPorPais = ESTADOS_POR_PAIS;

    paisSeleccionado = signal<PaisReferencia>(PAISES_REFERENCIA[0]);
    estadosDisponibles = signal<string[]>(ESTADOS_POR_PAIS['HN'] || []);

    paises = CODIGOS_TELEFONICOS;
    paisSeleccionadoTelefono = signal<CodigoTelefonicoPais>(CODIGOS_TELEFONICOS[0]);
    paisSeleccionadoCelular = signal<CodigoTelefonicoPais>(CODIGOS_TELEFONICOS[0]);

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
        const hoy = new Date();
        const fechaMaximaNacimiento = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
        
        this.formulario = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasValidator()]],
            apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasValidator()]],
            correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            codigoPaisCelular: ['+504'],
            celular: ['', [Validators.required, this.validarTelefonoInternacional('celular')]],
            codigoPaisTelefono: ['+504'],
            telefono: ['', [this.validarTelefonoInternacional('telefono')]],
            
            tipoDocumento: ['', [Validators.required]],
            numeroDocumento: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(30), this.soloAlfanumericoGuionValidator()]],
            
            cargo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasConEspaciosValidator()]],
            departamento: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasConEspaciosValidator()]],
            fechaIngreso: ['', [this.fechaNoFuturaValidator()]],
            
            pais: ['HN', [Validators.required]],
            direccion: ['', [this.direccionValidator()]],
            ciudad: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), this.soloLetrasConEspaciosValidator()]],
            estado: ['', [Validators.required]],
            codigoPostal: ['', [Validators.required, this.codigoPostalValidator()]],
            
            fechaNacimiento: ['', [this.fechaNacimientoValidator()]],
            genero: [''],
            notas: ['', [Validators.maxLength(500)]],
            
            rolId: [null, [Validators.required]]
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

    private soloLetrasConEspaciosValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/;
            if (!regex.test(valor)) {
                return { soloLetras: true };
            }
            return null;
        };
    }

    private soloAlfanumericoGuionValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            const regex = /^[a-zA-Z0-9\-]+$/;
            if (!regex.test(valor)) {
                return { soloAlfanumerico: true };
            }
            return null;
        };
    }

    private codigoPostalValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            
            if (valor.length < 3 || valor.length > 15) {
                return { longitudInvalida: { min: 3, max: 15 } };
            }
            
            const regex = /^[a-zA-Z0-9\-\s]+$/;
            if (!regex.test(valor)) {
                return { codigoPostalInvalido: true };
            }
            return null;
        };
    }

    private direccionValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            
            if (valor.trim().length < 10) {
                return { direccionMuyCorta: true };
            }
            
            if (valor.length > 255) {
                return { maxlength: { requiredLength: 255, actualLength: valor.length } };
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
            
            const edadMaxima = new Date(hoy.getFullYear() - 120, hoy.getMonth(), hoy.getDate());
            if (fechaNac < edadMaxima) {
                return { fechaInvalida: true };
            }
            
            return null;
        };
    }

    seleccionarPais(codigoPais: string): void {
        this.formulario.patchValue({ pais: codigoPais, estado: '' });
        const pais = this.paisesLista.find(p => p.codigo === codigoPais);
        if (pais) {
            this.paisSeleccionado.set(pais);
        }
        this.estadosDisponibles.set(this.estadosPorPais[codigoPais] || []);
    }

    private validarTelefonoInternacional(tipo: 'telefono' | 'celular'): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') {
                return null;
            }
            
            const soloNumeros = valor.replace(/\D/g, '');
            const pais = tipo === 'telefono' ? this.paisSeleccionadoTelefono() : this.paisSeleccionadoCelular();
            
            if (soloNumeros.length !== pais.digitos) {
                return { telefonoInvalido: { digitosRequeridos: pais.digitos, digitosActuales: soloNumeros.length } };
            }
            
            return null;
        };
    }

    seleccionarPaisTelefono(indicePais: number): void {
        this.paisSeleccionadoTelefono.set(this.paises[indicePais]);
        this.formulario.patchValue({ codigoPaisTelefono: this.paises[indicePais]?.codigo });
        this.formulario.get('telefono')?.updateValueAndValidity();
    }

    seleccionarPaisCelular(indicePais: number): void {
        this.paisSeleccionadoCelular.set(this.paises[indicePais]);
        this.formulario.patchValue({ codigoPaisCelular: this.paises[indicePais]?.codigo });
        this.formulario.get('celular')?.updateValueAndValidity();
    }

    formatearNumeroTelefono(event: Event, tipo: 'telefono' | 'celular'): void {
        const input = event.target as HTMLInputElement;
        let valor = input.value.replace(/\D/g, '');
        const pais = tipo === 'telefono' ? this.paisSeleccionadoTelefono() : this.paisSeleccionadoCelular();
        
        valor = valor.substring(0, pais.digitos);
        
        this.formulario.patchValue({ [tipo]: valor });
    }

    obtenerPlaceholder(tipo: 'telefono' | 'celular'): string {
        const pais = tipo === 'telefono' ? this.paisSeleccionadoTelefono() : this.paisSeleccionadoCelular();
        return pais.formato.replace(/#/g, '0');
    }

    private validarTelefonoHonduras(control: AbstractControl): ValidationErrors | null {
        const valor = control.value;
        if (!valor || valor.trim() === '') {
            return null;
        }
        const regex = /^(\+504)?[2389]\d{7}$/;
        if (!regex.test(valor.trim())) {
            return { telefonoInvalido: true };
        }
        return null;
    }

    private cargarRoles(): void {
        this.usuariosService.obtenerRoles().subscribe({
            next: (roles) => this.roles.set(roles),
            error: () => this.toastService.error('Error al cargar los roles')
        });
    }

    private cargarUsuario(): void {
        const id = this.usuarioId();
        if (!id) return;

        this.usuariosService.obtenerUsuarioPorId(id).subscribe({
            next: (usuario) => {
                this.usuario.set(usuario);
                
                const telefonoParseado = this.parsearTelefonoConCodigo(usuario.telefono);
                const celularParseado = this.parsearTelefonoConCodigo(usuario.celular);
                
                if (telefonoParseado.indicePais >= 0) {
                    this.paisSeleccionadoTelefono.set(this.paises[telefonoParseado.indicePais]);
                }
                if (celularParseado.indicePais >= 0) {
                    this.paisSeleccionadoCelular.set(this.paises[celularParseado.indicePais]);
                }

                const paisUsuario = usuario.pais || 'HN';
                this.seleccionarPais(paisUsuario);
                
                this.formulario.patchValue({
                    nombre: usuario.nombre,
                    apellido: usuario.apellido || '',
                    correo: usuario.correo,
                    codigoPaisTelefono: telefonoParseado.codigo,
                    telefono: telefonoParseado.numero,
                    codigoPaisCelular: celularParseado.codigo,
                    celular: celularParseado.numero,
                    tipoDocumento: usuario.tipoDocumento || '',
                    numeroDocumento: usuario.numeroDocumento || '',
                    cargo: usuario.cargo || '',
                    departamento: usuario.departamento || '',
                    fechaIngreso: usuario.fechaIngreso ? this.formatearFechaInput(usuario.fechaIngreso) : '',
                    pais: paisUsuario,
                    direccion: usuario.direccion || '',
                    ciudad: usuario.ciudad || '',
                    estado: usuario.estado || usuario.departamentoGeo || '',
                    codigoPostal: usuario.codigoPostal || '',
                    fechaNacimiento: usuario.fechaNacimiento ? this.formatearFechaInput(usuario.fechaNacimiento) : '',
                    genero: usuario.genero || '',
                    notas: usuario.notas || '',
                    rolId: usuario.rolId
                });
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.router.navigate(['/admin/usuarios']);
            }
        });
    }

    private parsearTelefonoConCodigo(telefono?: string): { codigo: string; numero: string; indicePais: number } {
        if (!telefono) {
            return { codigo: '+504', numero: '', indicePais: 0 };
        }
        
        for (let i = 0; i < this.paises.length; i++) {
            const pais = this.paises[i];
            if (telefono.startsWith(pais.codigo)) {
                return {
                    codigo: pais.codigo,
                    numero: telefono.substring(pais.codigo.length),
                    indicePais: i
                };
            }
        }
        
        return { codigo: '+504', numero: telefono, indicePais: 0 };
    }

    private formatearFechaInput(fecha: Date | string): string {
        const d = new Date(fecha);
        return d.toISOString().split('T')[0];
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const valores = this.formulario.value;
        this.guardando.set(true);

        if (this.esEdicion()) {
            this.actualizarUsuario(valores);
        } else {
            this.crearUsuario(valores);
        }
    }

    private construirTelefonoCompleto(codigo: string, numero: string): string | null {
        if (!numero || numero.trim() === '') return null;
        return `${codigo}${numero.replace(/\D/g, '')}`;
    }

    private crearUsuario(valores: any): void {
        this.errorServidor.set(null);
        
        const datos: Record<string, any> = {
            nombre: valores.nombre.trim(),
            apellido: valores.apellido.trim(),
            correo: valores.correo.trim(),
            tipoDocumento: valores.tipoDocumento,
            numeroDocumento: valores.numeroDocumento.trim(),
            cargo: valores.cargo.trim(),
            departamento: valores.departamento.trim(),
            rolId: Number(valores.rolId)
        };

        // Celular es obligatorio y único
        const celularCompleto = this.construirTelefonoCompleto(valores.codigoPaisCelular, valores.celular);
        if (celularCompleto) {
            datos['celular'] = celularCompleto;
        }
        
        // Teléfono fijo es opcional
        const telefonoCompleto = this.construirTelefonoCompleto(valores.codigoPaisTelefono, valores.telefono);
        if (telefonoCompleto) datos['telefono'] = telefonoCompleto;
        
        if (valores.fechaIngreso) datos['fechaIngreso'] = valores.fechaIngreso;
        
        // Campos de dirección obligatorios
        datos['pais'] = valores.pais;
        datos['ciudad'] = valores.ciudad.trim();
        datos['estado'] = valores.estado;
        datos['codigoPostal'] = valores.codigoPostal.trim();
        
        // Dirección completa opcional
        if (valores.direccion?.trim()) datos['direccion'] = valores.direccion.trim();
        if (valores.fechaNacimiento) datos['fechaNacimiento'] = valores.fechaNacimiento;
        if (valores.genero) datos['genero'] = valores.genero;
        if (valores.notas?.trim()) datos['notas'] = valores.notas.trim();

        this.usuariosService.crearUsuario(datos as CrearUsuarioDto).subscribe({
            next: (respuesta) => {
                this.guardando.set(false);
                this.correoEnviado.set(respuesta.correoEnviado);
                this.correoUsuarioCreado.set(datos['correo']);
                this.mostrarInfoContrasena.set(true);
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

    private actualizarUsuario(valores: any): void {
        const id = this.usuarioId();
        if (!id) return;

        const datos: ActualizarUsuarioDto = {};

        if (valores.nombre?.trim()) datos.nombre = valores.nombre.trim();
        if (valores.apellido?.trim()) datos.apellido = valores.apellido.trim();
        if (valores.correo?.trim()) datos.correo = valores.correo.trim();
        
        const telefonoCompleto = this.construirTelefonoCompleto(valores.codigoPaisTelefono, valores.telefono);
        if (telefonoCompleto) datos.telefono = telefonoCompleto;
        
        const celularCompleto = this.construirTelefonoCompleto(valores.codigoPaisCelular, valores.celular);
        if (celularCompleto) datos.celular = celularCompleto;
        
        if (valores.tipoDocumento) datos.tipoDocumento = valores.tipoDocumento;
        if (valores.numeroDocumento?.trim()) datos.numeroDocumento = valores.numeroDocumento.trim();
        if (valores.cargo?.trim()) datos.cargo = valores.cargo.trim();
        if (valores.departamento?.trim()) datos.departamento = valores.departamento.trim();
        if (valores.fechaIngreso) datos.fechaIngreso = valores.fechaIngreso;
        if (valores.pais) datos.pais = valores.pais;
        if (valores.direccion?.trim()) datos.direccion = valores.direccion.trim();
        if (valores.ciudad?.trim()) datos.ciudad = valores.ciudad.trim();
        if (valores.estado) datos.estado = valores.estado;
        if (valores.codigoPostal?.trim()) datos.codigoPostal = valores.codigoPostal.trim();
        if (valores.fechaNacimiento) datos.fechaNacimiento = valores.fechaNacimiento;
        if (valores.genero) datos.genero = valores.genero;
        if (valores.notas?.trim()) datos.notas = valores.notas.trim();
        if (valores.rolId) datos.rolId = Number(valores.rolId);

        this.usuariosService.actualizarUsuario(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.router.navigate(['/admin/usuarios']);
            },
            error: (err) => {
                this.guardando.set(false);
                this.procesarErrorServidor(err);
            }
        });
    }

    toggleEstadoUsuario(event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        const id = this.usuarioId();
        if (!id) return;

        this.usuariosService.cambiarEstado(id, checkbox.checked).subscribe({
            next: (usuarioActualizado) => {
                this.usuario.set(usuarioActualizado);
            },
            error: () => {
                checkbox.checked = !checkbox.checked;
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/admin/usuarios']);
    }

    irAListaUsuarios(): void {
        this.router.navigate(['/admin/usuarios']);
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
        if (errores['telefonoInvalido']) {
            const { digitosRequeridos, digitosActuales } = errores['telefonoInvalido'];
            return `Debe tener ${digitosRequeridos} dígitos (actualmente ${digitosActuales || 0})`;
        }
        if (errores['soloLetras']) return 'Solo puede contener letras';
        if (errores['soloAlfanumerico']) return 'Solo puede contener letras, números y guiones';
        if (errores['codigoPostalInvalido']) return 'Solo letras, números, espacios y guiones';
        if (errores['longitudInvalida']) return `Debe tener entre ${errores['longitudInvalida'].min} y ${errores['longitudInvalida'].max} caracteres`;
        if (errores['fechaFutura']) return 'La fecha no puede ser futura';
        if (errores['menorDeEdad']) return 'El usuario debe tener al menos 18 años';
        if (errores['fechaInvalida']) return 'La fecha no es válida';
        if (errores['direccionMuyCorta']) return 'La dirección debe tener al menos 10 caracteres';

        return 'Campo inválido';
    }

    obtenerTelefonoFormateado(tipo: 'telefono' | 'celular'): string {
        const pais = tipo === 'telefono' ? this.paisSeleccionadoTelefono() : this.paisSeleccionadoCelular();
        const numero = this.formulario.get(tipo)?.value;
        if (!numero) return '';
        return `${pais.bandera} ${pais.codigo} ${numero}`;
    }

    obtenerIniciales(nombre: string, apellido?: string): string {
        if (!nombre) return '?';
        let iniciales = nombre.charAt(0);
        if (apellido) {
            iniciales += apellido.charAt(0);
        } else {
            const partes = nombre.split(' ');
            if (partes.length > 1) {
                iniciales += partes[1].charAt(0);
            }
        }
        return iniciales.toUpperCase();
    }

    obtenerNombreCompleto(): string {
        const nombre = this.formulario.get('nombre')?.value || '';
        const apellido = this.formulario.get('apellido')?.value || '';
        return `${nombre} ${apellido}`.trim() || 'Nombre del usuario';
    }
}
