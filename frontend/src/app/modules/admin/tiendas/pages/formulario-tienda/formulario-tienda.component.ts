import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TiendasService } from '../../services';
import {
    Tienda, 
    CrearTiendaDto, 
    ActualizarTiendaDto,
    TipoNegocioTienda, 
    TipoTienda,
    PlanSuscripcionTienda, 
    RangoEmpleadosTienda,
    EstadoTienda,
    RedesSocialesTienda
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-formulario-tienda',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-tienda.component.html',
    styleUrl: './formulario-tienda.component.scss'
})
export class FormularioTiendaComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private tiendasService = inject(TiendasService);
    private toastService = inject(ToastService);

    formulario!: FormGroup;
    cargando = signal(true);
    guardando = signal(false);
    validandoRtn = signal(false);

    tiendaId = signal<number | null>(null);
    tienda = signal<Tienda | null>(null);

    esEdicion = computed(() => this.tiendaId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Tienda' : 'Nueva Tienda');

    // Opciones para selects
    tiposNegocio = [
        { valor: TipoNegocioTienda.TIENDA_ROPA, etiqueta: 'Tienda de Ropa' },
        { valor: TipoNegocioTienda.RESTAURANTE, etiqueta: 'Restaurante' },
        { valor: TipoNegocioTienda.SUPERMERCADO, etiqueta: 'Supermercado' },
        { valor: TipoNegocioTienda.FARMACIA, etiqueta: 'Farmacia' },
        { valor: TipoNegocioTienda.TECNOLOGIA, etiqueta: 'Tecnología' },
        { valor: TipoNegocioTienda.FERRETERIA, etiqueta: 'Ferretería' },
        { valor: TipoNegocioTienda.LIBRERIA, etiqueta: 'Librería' },
        { valor: TipoNegocioTienda.SERVICIOS, etiqueta: 'Servicios' },
        { valor: TipoNegocioTienda.MAYORISTA, etiqueta: 'Mayorista' },
        { valor: TipoNegocioTienda.OTRO, etiqueta: 'Otro' }
    ];

    tiposTienda = [
        { valor: TipoTienda.TIENDA_FISICA, etiqueta: 'Tienda Física' },
        { valor: TipoTienda.TIENDA_VIRTUAL, etiqueta: 'Tienda Virtual' },
        { valor: TipoTienda.TIENDA_HIBRIDA, etiqueta: 'Tienda Híbrida' },
        { valor: TipoTienda.QUIOSCO, etiqueta: 'Quiosco' },
        { valor: TipoTienda.SUCURSAL, etiqueta: 'Sucursal' },
        { valor: TipoTienda.FRANQUICIA, etiqueta: 'Franquicia' },
        { valor: TipoTienda.POPUP_STORE, etiqueta: 'Pop-up Store' },
        { valor: TipoTienda.OUTLET, etiqueta: 'Outlet' }
    ];

    planesSuscripcion = [
        { valor: PlanSuscripcionTienda.BASICO, etiqueta: 'Básico', descripcion: 'Funcionalidades básicas' },
        { valor: PlanSuscripcionTienda.PROFESIONAL, etiqueta: 'Profesional', descripcion: 'Funcionalidades avanzadas' },
        { valor: PlanSuscripcionTienda.EMPRESARIAL, etiqueta: 'Empresarial', descripcion: 'Para empresas grandes' },
        { valor: PlanSuscripcionTienda.PREMIUM, etiqueta: 'Premium', descripcion: 'Todas las funcionalidades' }
    ];

    rangosEmpleados = [
        { valor: RangoEmpleadosTienda.UNO_CINCO, etiqueta: '1-5 empleados' },
        { valor: RangoEmpleadosTienda.SEIS_VEINTE, etiqueta: '6-20 empleados' },
        { valor: RangoEmpleadosTienda.VEINTIUNO_CINCUENTA, etiqueta: '21-50 empleados' },
        { valor: RangoEmpleadosTienda.CINCUENTA_UNO_CIEN, etiqueta: '51-100 empleados' },
        { valor: RangoEmpleadosTienda.CIEN_UNO_QUINIENTOS, etiqueta: '101-500 empleados' },
        { valor: RangoEmpleadosTienda.MAS_QUINIENTOS, etiqueta: '500+ empleados' }
    ];

    monedas = [
        { codigo: 'HNL', nombre: 'Lempira (HNL)' },
        { codigo: 'USD', nombre: 'Dólar (USD)' },
        { codigo: 'EUR', nombre: 'Euro (EUR)' },
        { codigo: 'MXN', nombre: 'Peso Mexicano (MXN)' },
        { codigo: 'GTQ', nombre: 'Quetzal (GTQ)' }
    ];

    zonasHorarias = [
        { valor: 'America/Tegucigalpa', etiqueta: 'Honduras (UTC-6)' },
        { valor: 'America/Guatemala', etiqueta: 'Guatemala (UTC-6)' },
        { valor: 'America/El_Salvador', etiqueta: 'El Salvador (UTC-6)' },
        { valor: 'America/Mexico_City', etiqueta: 'México (UTC-6)' },
        { valor: 'America/New_York', etiqueta: 'Este EEUU (UTC-5)' },
        { valor: 'America/Chicago', etiqueta: 'Centro EEUU (UTC-6)' },
        { valor: 'America/Bogota', etiqueta: 'Colombia (UTC-5)' },
        { valor: 'America/Lima', etiqueta: 'Perú (UTC-5)' },
        { valor: 'Europe/Madrid', etiqueta: 'España (UTC+1)' }
    ];

    departamentosHN = [
        'Francisco Morazán', 'Cortés', 'Atlántida', 'Choluteca', 'Comayagua',
        'Copán', 'El Paraíso', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía',
        'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara',
        'Valle', 'Yoro', 'Colón'
    ];

    ngOnInit(): void {
        this.inicializarFormulario();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.tiendaId.set(parseInt(id, 10));
            this.cargarTienda();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            // Información básica
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
            nombreComercial: ['', [Validators.maxLength(200)]],
            rtn: ['', [Validators.required, this.rtnValidator()], [this.rtnUnicoValidator()]],
            nit: ['', [Validators.maxLength(50)]],
            tipoNegocio: ['', [Validators.required]],
            tipoTienda: [TipoTienda.TIENDA_FISICA, [Validators.required]],
            descripcion: ['', [Validators.maxLength(500)]],

            // Contacto
            correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            telefono: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            celular: ['', [Validators.maxLength(20)]],
            sitioWeb: ['', [this.urlValidator()]],

            // Ubicación
            pais: ['HN', [Validators.required]],
            departamento: ['', [Validators.required]],
            ciudad: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            codigoPostal: ['', [Validators.maxLength(15)]],
            direccion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
            referenciasUbicacion: ['', [Validators.maxLength(255)]],

            // Redes sociales
            facebook: ['', [this.urlRedSocialValidator('facebook')]],
            instagram: ['', [this.urlRedSocialValidator('instagram')]],
            twitter: ['', [this.urlRedSocialValidator('twitter')]],
            whatsapp: ['', [this.telefonoWhatsappValidator()]],
            tiktok: ['', [this.urlRedSocialValidator('tiktok')]],

            // Configuración empresarial
            representanteLegal: ['', [Validators.maxLength(200)]],
            planSuscripcion: [PlanSuscripcionTienda.BASICO, [Validators.required]],
            moneda: ['HNL', [Validators.required]],
            zonaHoraria: ['America/Tegucigalpa', [Validators.required]],
            cantidadEmpleados: [''],

            // Configuración operativa
            permitePedidosOnline: [false],
            permitePagosOnline: [false],
            permitePedidosDomicilio: [false],
            minimoCompraPublica: ['', [Validators.min(0)]],
            costoEnvioDomicilio: ['', [Validators.min(0)]],
            radioPedidosKm: ['', [Validators.min(1), Validators.max(50)]],

            // Horarios básicos (simplificados para el formulario)
            horarioLunes: ['08:00-18:00'],
            horarioMartes: ['08:00-18:00'],
            horarioMiercoles: ['08:00-18:00'],
            horarioJueves: ['08:00-18:00'],
            horarioViernes: ['08:00-18:00'],
            horarioSabado: ['08:00-12:00'],
            horarioDomingo: ['Cerrado'],

            // Estado
            activa: [true]
        });
    }

    private cargarTienda(): void {
        const id = this.tiendaId();
        if (!id) return;

        this.tiendasService.obtenerTiendaPorId(id).subscribe({
            next: (tienda) => {
                this.tienda.set(tienda);
                this.formulario.patchValue({
                    nombre: tienda.nombre,
                    nombreComercial: tienda.nombreComercial || '',
                    rtn: tienda.rtn,
                    nit: tienda.nit || '',
                    tipoNegocio: tienda.tipoNegocio,
                    tipoTienda: tienda.tipoTienda || TipoTienda.TIENDA_FISICA,
                    descripcion: tienda.descripcion || '',
                    
                    correo: tienda.correo,
                    telefono: tienda.telefono,
                    celular: tienda.celular || '',
                    sitioWeb: tienda.sitioWeb || '',

                    pais: tienda.ubicacion.pais || 'HN',
                    departamento: tienda.ubicacion.departamento || '',
                    ciudad: tienda.ubicacion.ciudad || '',
                    codigoPostal: tienda.ubicacion.codigoPostal || '',
                    direccion: tienda.ubicacion.direccion || '',
                    referenciasUbicacion: tienda.ubicacion.referenciasUbicacion || '',

                    facebook: tienda.redesSociales?.facebook || '',
                    instagram: tienda.redesSociales?.instagram || '',
                    twitter: tienda.redesSociales?.twitter || '',
                    whatsapp: tienda.redesSociales?.whatsapp || '',
                    tiktok: tienda.redesSociales?.tiktok || '',

                    representanteLegal: tienda.representanteLegal || '',
                    planSuscripcion: tienda.planSuscripcion || PlanSuscripcionTienda.BASICO,
                    moneda: tienda.moneda || 'HNL',
                    zonaHoraria: tienda.zonaHoraria || 'America/Tegucigalpa',
                    cantidadEmpleados: tienda.cantidadEmpleados || '',

                    permitePedidosOnline: tienda.configuracion?.permitePedidosOnline || false,
                    permitePagosOnline: tienda.configuracion?.permitePagosOnline || false,
                    permitePedidosDomicilio: tienda.configuracion?.permitePedidosDomicilio || false,
                    minimoCompraPublica: tienda.configuracion?.minimoCompraPublica || '',
                    costoEnvioDomicilio: tienda.configuracion?.costoEnvioDomicilio || '',
                    radioPedidosKm: tienda.configuracion?.radioPedidosKm || '',

                    activa: tienda.activa
                });
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('No se pudo cargar la tienda');
                this.cargando.set(false);
                this.router.navigate(['/admin/tiendas']);
            }
        });
    }

    guardar(): void {
        if (this.guardando()) return;

        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            this.toastService.warning('Revisa los campos marcados en rojo');
            this.enfocarPrimerError();
            return;
        }

        this.guardando.set(true);
        const valores = this.formulario.value;

        if (this.esEdicion()) {
            this.actualizarTienda(valores);
        } else {
            this.crearTienda(valores);
        }
    }

    private crearTienda(valores: Record<string, any>): void {
        const datos: CrearTiendaDto = this.construirDto(valores);
        
        this.tiendasService.crearTienda(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Tienda creada exitosamente');
                this.router.navigate(['/admin/tiendas']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private actualizarTienda(valores: Record<string, any>): void {
        const id = this.tiendaId();
        if (!id) return;

        const datos: ActualizarTiendaDto = {
            ...this.construirDto(valores),
            activa: valores['activa'] as boolean
        };

        this.tiendasService.actualizarTienda(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Tienda actualizada exitosamente');
                this.router.navigate(['/admin/tiendas']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private construirDto(v: Record<string, any>): CrearTiendaDto {
        // Construir redes sociales
        const redesSociales: RedesSocialesTienda = {};
        if (v['facebook']) redesSociales.facebook = v['facebook'];
        if (v['instagram']) redesSociales.instagram = v['instagram'];
        if (v['twitter']) redesSociales.twitter = v['twitter'];
        if (v['whatsapp']) redesSociales.whatsapp = v['whatsapp'];
        if (v['tiktok']) redesSociales.tiktok = v['tiktok'];

        // Construir configuración
        const configuracion = {
            permitePedidosOnline: v['permitePedidosOnline'] || false,
            permitePagosOnline: v['permitePagosOnline'] || false,
            permitePedidosDomicilio: v['permitePedidosDomicilio'] || false,
            minimoCompraPublica: v['minimoCompraPublica'] ? parseFloat(v['minimoCompraPublica']) : undefined,
            costoEnvioDomicilio: v['costoEnvioDomicilio'] ? parseFloat(v['costoEnvioDomicilio']) : undefined,
            radioPedidosKm: v['radioPedidosKm'] ? parseInt(v['radioPedidosKm']) : undefined,
            tiempoPreparacion: 30, // Valor por defecto
            metodosPagoAceptados: ['efectivo'], // Valor por defecto
            configuracionNotificaciones: {
                emailNuevosPedidos: true,
                emailStockBajo: true,
                smsNuevosPedidos: false,
                whatsappNuevosPedidos: false
            }
        };

        // Construir ubicación
        const ubicacion = {
            direccion: v['direccion'],
            departamento: v['departamento'],
            ciudad: v['ciudad'],
            codigoPostal: v['codigoPostal'] || undefined,
            pais: v['pais'] || 'HN',
            referenciasUbicacion: v['referenciasUbicacion'] || undefined
        };

        return {
            nombre: v['nombre'],
            nombreComercial: v['nombreComercial'] || undefined,
            rtn: v['rtn'],
            nit: v['nit'] || undefined,
            correo: v['correo'],
            telefono: v['telefono'],
            celular: v['celular'] || undefined,
            tipoTienda: v['tipoTienda'] as TipoTienda,
            ubicacion,
            logo: undefined,
            sitioWeb: v['sitioWeb'] || undefined,
            tipoNegocio: v['tipoNegocio'] as TipoNegocioTienda,
            descripcion: v['descripcion'] || undefined,
            redesSociales: Object.keys(redesSociales).length > 0 ? redesSociales : undefined,
            representanteLegal: v['representanteLegal'] || undefined,
            planSuscripcion: v['planSuscripcion'] as PlanSuscripcionTienda,
            cantidadEmpleados: v['cantidadEmpleados'] as RangoEmpleadosTienda || undefined,
            configuracion,
            horarioAtencion: this.construirHorarios(v)
        };
    }

    private construirHorarios(v: Record<string, string>) {
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        const horario: any = {};

        dias.forEach(dia => {
            const valorHorario = v[`horario${dia.charAt(0).toUpperCase() + dia.slice(1)}`];
            if (valorHorario === 'Cerrado') {
                horario[dia] = { abierto: false };
            } else if (valorHorario && valorHorario.includes('-')) {
                const [apertura, cierre] = valorHorario.split('-');
                horario[dia] = {
                    abierto: true,
                    horaApertura: apertura.trim(),
                    horaCierre: cierre.trim()
                };
            }
        });

        return horario;
    }

    private procesarError(err: any): void {
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

    private enfocarPrimerError(): void {
        const primerElementoConError = document.querySelector('.form-control.is-invalid, .form-select.is-invalid');
        if (primerElementoConError) {
            (primerElementoConError as HTMLElement).focus();
        }
    }

    cancelar(): void {
        this.router.navigate(['/admin/tiendas']);
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
        if (errores['email']) return 'Ingresa un correo válido';
        if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres`;
        if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres`;
        if (errores['min']) return `Valor mínimo: ${errores['min'].min}`;
        if (errores['max']) return `Valor máximo: ${errores['max'].max}`;
        if (errores['rtnInvalido']) return 'Formato RTN inválido (XXXX-XXXX-XXXXXX)';
        if (errores['rtnNoUnico']) return 'Ya existe una tienda con este RTN';
        if (errores['urlInvalida']) return 'Ingresa una URL válida';
        if (errores['urlRedSocialInvalida']) return 'URL de red social inválida';
        if (errores['whatsappInvalido']) return 'Formato de teléfono inválido';
        return 'Campo inválido';
    }

    // Validadores personalizados
    private rtnValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            const regex = /^\d{4}-\d{4}-\d{6}$/;
            if (!regex.test(valor)) return { rtnInvalido: true };
            return null;
        };
    }

    private rtnUnicoValidator(): (control: AbstractControl) => Promise<ValidationErrors | null> {
        return async (control: AbstractControl): Promise<ValidationErrors | null> => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;

            this.validandoRtn.set(true);
            try {
                const resultado = await this.tiendasService.validarRtnUnico(valor, this.tiendaId() || undefined).toPromise();
                this.validandoRtn.set(false);
                return resultado?.valido ? null : { rtnNoUnico: true };
            } catch {
                this.validandoRtn.set(false);
                return null; // En caso de error de red, no bloquear
            }
        };
    }

    private urlValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            try {
                new URL(valor.startsWith('http') ? valor : `https://${valor}`);
                return null;
            } catch {
                return { urlInvalida: true };
            }
        };
    }

    private urlRedSocialValidator(redSocial: string): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;

            const patrones = {
                facebook: /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9._-]+/,
                instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/,
                twitter: /^(https?:\/\/)?(www\.)?(twitter|x)\.com\/[a-zA-Z0-9._-]+/,
                tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/
            };

            const patron = patrones[redSocial as keyof typeof patrones];
            if (patron && !patron.test(valor)) {
                return { urlRedSocialInvalida: true };
            }
            return null;
        };
    }

    private telefonoWhatsappValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            
            // Permitir formato +504XXXXXXXX o solo números
            const regex = /^(\+504)?[0-9]{8,9}$/;
            if (!regex.test(valor.replace(/\s/g, ''))) {
                return { whatsappInvalido: true };
            }
            return null;
        };
    }

    // Métodos de utilidad
    obtenerIniciales(nombre: string): string {
        if (!nombre) return '';
        return nombre.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
    }
}