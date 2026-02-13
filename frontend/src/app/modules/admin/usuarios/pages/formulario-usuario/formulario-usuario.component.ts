import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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

    tiposDocumento = [
        { valor: 'DNI', etiqueta: 'DNI / Cédula de Identidad' },
        { valor: 'Pasaporte', etiqueta: 'Pasaporte' },
        { valor: 'Licencia', etiqueta: 'Licencia de Conducir' },
        { valor: 'NIE', etiqueta: 'NIE (Número de Identidad de Extranjero)' },
        { valor: 'NIF', etiqueta: 'NIF / Número de Identificación Fiscal' },
        { valor: 'RTN', etiqueta: 'RTN / Registro Tributario' },
        { valor: 'RUC', etiqueta: 'RUC (Registro Único de Contribuyente)' },
        { valor: 'CURP', etiqueta: 'CURP (México)' },
        { valor: 'CPF', etiqueta: 'CPF (Brasil)' },
        { valor: 'SSN', etiqueta: 'SSN (Social Security Number)' },
        { valor: 'Otro', etiqueta: 'Otro documento' }
    ];

    generos = [
        { valor: 'Masculino', etiqueta: 'Masculino' },
        { valor: 'Femenino', etiqueta: 'Femenino' },
        { valor: 'No binario', etiqueta: 'No binario' },
        { valor: 'Otro', etiqueta: 'Otro' },
        { valor: 'Prefiero no decir', etiqueta: 'Prefiero no decir' }
    ];

    paisesLista = [
        { codigo: 'HN', nombre: 'Honduras', bandera: '🇭🇳' },
        { codigo: 'US', nombre: 'Estados Unidos', bandera: '🇺🇸' },
        { codigo: 'CA', nombre: 'Canadá', bandera: '🇨🇦' },
        { codigo: 'MX', nombre: 'México', bandera: '🇲🇽' },
        { codigo: 'GT', nombre: 'Guatemala', bandera: '🇬🇹' },
        { codigo: 'SV', nombre: 'El Salvador', bandera: '🇸🇻' },
        { codigo: 'NI', nombre: 'Nicaragua', bandera: '🇳🇮' },
        { codigo: 'CR', nombre: 'Costa Rica', bandera: '🇨🇷' },
        { codigo: 'PA', nombre: 'Panamá', bandera: '🇵🇦' },
        { codigo: 'CO', nombre: 'Colombia', bandera: '🇨🇴' },
        { codigo: 'PE', nombre: 'Perú', bandera: '🇵🇪' },
        { codigo: 'CL', nombre: 'Chile', bandera: '🇨🇱' },
        { codigo: 'AR', nombre: 'Argentina', bandera: '🇦🇷' },
        { codigo: 'VE', nombre: 'Venezuela', bandera: '🇻🇪' },
        { codigo: 'EC', nombre: 'Ecuador', bandera: '🇪🇨' },
        { codigo: 'BO', nombre: 'Bolivia', bandera: '🇧🇴' },
        { codigo: 'PY', nombre: 'Paraguay', bandera: '🇵🇾' },
        { codigo: 'UY', nombre: 'Uruguay', bandera: '🇺🇾' },
        { codigo: 'BR', nombre: 'Brasil', bandera: '🇧🇷' },
        { codigo: 'ES', nombre: 'España', bandera: '🇪🇸' },
        { codigo: 'DE', nombre: 'Alemania', bandera: '🇩🇪' },
        { codigo: 'FR', nombre: 'Francia', bandera: '🇫🇷' },
        { codigo: 'GB', nombre: 'Reino Unido', bandera: '🇬🇧' },
        { codigo: 'IT', nombre: 'Italia', bandera: '🇮🇹' },
        { codigo: 'PT', nombre: 'Portugal', bandera: '🇵🇹' },
        { codigo: 'NL', nombre: 'Países Bajos', bandera: '🇳🇱' },
        { codigo: 'BE', nombre: 'Bélgica', bandera: '🇧🇪' },
        { codigo: 'CH', nombre: 'Suiza', bandera: '🇨🇭' },
        { codigo: 'AT', nombre: 'Austria', bandera: '🇦🇹' },
        { codigo: 'CN', nombre: 'China', bandera: '🇨🇳' },
        { codigo: 'JP', nombre: 'Japón', bandera: '🇯🇵' },
        { codigo: 'KR', nombre: 'Corea del Sur', bandera: '🇰🇷' },
        { codigo: 'IN', nombre: 'India', bandera: '🇮🇳' },
        { codigo: 'AU', nombre: 'Australia', bandera: '🇦🇺' },
        { codigo: 'NZ', nombre: 'Nueva Zelanda', bandera: '🇳🇿' },
    ];

    estadosPorPais: Record<string, string[]> = {
        'HN': ['Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro'],
        'US': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
        'CA': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
        'MX': ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'],
        'GT': ['Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula', 'El Progreso', 'Escuintla', 'Guatemala', 'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa', 'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez', 'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa'],
        'SV': ['Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad', 'La Paz', 'La Unión', 'Morazán', 'San Miguel', 'San Salvador', 'San Vicente', 'Santa Ana', 'Sonsonate', 'Usulután'],
        'NI': ['Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada', 'Jinotega', 'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa', 'Nueva Segovia', 'Río San Juan', 'Rivas'],
        'CR': ['Alajuela', 'Cartago', 'Guanacaste', 'Heredia', 'Limón', 'Puntarenas', 'San José'],
        'PA': ['Bocas del Toro', 'Chiriquí', 'Coclé', 'Colón', 'Darién', 'Herrera', 'Los Santos', 'Panamá', 'Panamá Oeste', 'Veraguas'],
        'CO': ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'],
        'ES': ['Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria', 'Castilla y León', 'Castilla-La Mancha', 'Cataluña', 'Comunidad Valenciana', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 'País Vasco'],
        'AR': ['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad de Buenos Aires', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'],
        'CL': ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana de Santiago', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'],
        'PE': ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'],
        'BR': ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
    };

    paisSeleccionado = signal(this.paisesLista[0]);
    estadosDisponibles = signal<string[]>(this.estadosPorPais['HN'] || []);

    paises = [
        { codigo: '+504', pais: 'Honduras', bandera: '🇭🇳', formato: '####-####', digitos: 8 },
        { codigo: '+1', pais: 'Estados Unidos', bandera: '🇺🇸', formato: '(###) ###-####', digitos: 10 },
        { codigo: '+1', pais: 'Canadá', bandera: '🇨🇦', formato: '(###) ###-####', digitos: 10 },
        { codigo: '+52', pais: 'México', bandera: '🇲🇽', formato: '## #### ####', digitos: 10 },
        { codigo: '+502', pais: 'Guatemala', bandera: '🇬🇹', formato: '####-####', digitos: 8 },
        { codigo: '+503', pais: 'El Salvador', bandera: '🇸🇻', formato: '####-####', digitos: 8 },
        { codigo: '+505', pais: 'Nicaragua', bandera: '🇳🇮', formato: '####-####', digitos: 8 },
        { codigo: '+506', pais: 'Costa Rica', bandera: '🇨🇷', formato: '####-####', digitos: 8 },
        { codigo: '+507', pais: 'Panamá', bandera: '🇵🇦', formato: '####-####', digitos: 8 },
        { codigo: '+57', pais: 'Colombia', bandera: '🇨🇴', formato: '### ### ####', digitos: 10 },
        { codigo: '+51', pais: 'Perú', bandera: '🇵🇪', formato: '### ### ###', digitos: 9 },
        { codigo: '+56', pais: 'Chile', bandera: '🇨🇱', formato: '# #### ####', digitos: 9 },
        { codigo: '+54', pais: 'Argentina', bandera: '🇦🇷', formato: '## ####-####', digitos: 10 },
        { codigo: '+58', pais: 'Venezuela', bandera: '🇻🇪', formato: '###-###-####', digitos: 10 },
        { codigo: '+593', pais: 'Ecuador', bandera: '🇪🇨', formato: '## ###-####', digitos: 9 },
        { codigo: '+591', pais: 'Bolivia', bandera: '🇧🇴', formato: '########', digitos: 8 },
        { codigo: '+595', pais: 'Paraguay', bandera: '🇵🇾', formato: '### ######', digitos: 9 },
        { codigo: '+598', pais: 'Uruguay', bandera: '🇺🇾', formato: '## ### ###', digitos: 8 },
        { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷', formato: '## #####-####', digitos: 11 },
        { codigo: '+34', pais: 'España', bandera: '🇪🇸', formato: '### ## ## ##', digitos: 9 },
        { codigo: '+49', pais: 'Alemania', bandera: '🇩🇪', formato: '### ########', digitos: 11 },
        { codigo: '+33', pais: 'Francia', bandera: '🇫🇷', formato: '# ## ## ## ##', digitos: 9 },
        { codigo: '+44', pais: 'Reino Unido', bandera: '🇬🇧', formato: '#### ######', digitos: 10 },
        { codigo: '+39', pais: 'Italia', bandera: '🇮🇹', formato: '### ### ####', digitos: 10 },
        { codigo: '+86', pais: 'China', bandera: '🇨🇳', formato: '### #### ####', digitos: 11 },
        { codigo: '+81', pais: 'Japón', bandera: '🇯🇵', formato: '##-####-####', digitos: 10 },
        { codigo: '+82', pais: 'Corea del Sur', bandera: '🇰🇷', formato: '##-####-####', digitos: 10 },
        { codigo: '+91', pais: 'India', bandera: '🇮🇳', formato: '##### #####', digitos: 10 },
    ];

    paisSeleccionadoTelefono = signal(this.paises[0]);
    paisSeleccionadoCelular = signal(this.paises[0]);

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
        this.formulario.patchValue({ codigoPaisTelefono: this.paises[indicePais].codigo });
        this.formulario.get('telefono')?.updateValueAndValidity();
    }

    seleccionarPaisCelular(indicePais: number): void {
        this.paisSeleccionadoCelular.set(this.paises[indicePais]);
        this.formulario.patchValue({ codigoPaisCelular: this.paises[indicePais].codigo });
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
            error: () => this.roles.set(this.rolesMock)
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

    private rolesMock: Rol[] = [
        { id: 1, codigo: 'admin', nombre: 'Administrador', activo: true },
        { id: 2, codigo: 'vendedor', nombre: 'Vendedor', activo: true },
        { id: 3, codigo: 'inventario', nombre: 'Encargado de Inventario', activo: true },
        { id: 4, codigo: 'soporte', nombre: 'Soporte al Cliente', activo: true }
    ];
}
