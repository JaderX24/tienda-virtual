import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { EmpresasService } from '../../services';
import {
    Empresa, CrearEmpresaDto, ActualizarEmpresaDto,
    TipoNegocio, PlanSuscripcion, RangoEmpleados
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-formulario-empresa',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-empresa.component.html',
    styleUrl: './formulario-empresa.component.scss'
})
export class FormularioEmpresaComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private empresasService = inject(EmpresasService);
    private toastService = inject(ToastService);

    formulario!: FormGroup;
    cargando = signal(true);
    guardando = signal(false);

    empresaId = signal<number | null>(null);
    empresa = signal<Empresa | null>(null);

    esEdicion = computed(() => this.empresaId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Empresa' : 'Nueva Empresa');

    tiposNegocio = [
        { valor: TipoNegocio.TIENDA_ROPA, etiqueta: 'Tienda de Ropa' },
        { valor: TipoNegocio.RESTAURANTE, etiqueta: 'Restaurante' },
        { valor: TipoNegocio.SUPERMERCADO, etiqueta: 'Supermercado' },
        { valor: TipoNegocio.FARMACIA, etiqueta: 'Farmacia' },
        { valor: TipoNegocio.TECNOLOGIA, etiqueta: 'Tecnologia' },
        { valor: TipoNegocio.FERRETERIA, etiqueta: 'Ferreteria' },
        { valor: TipoNegocio.LIBRERIA, etiqueta: 'Libreria' },
        { valor: TipoNegocio.SERVICIOS, etiqueta: 'Servicios' },
        { valor: TipoNegocio.MAYORISTA, etiqueta: 'Mayorista' },
        { valor: TipoNegocio.OTRO, etiqueta: 'Otro' }
    ];

    planesSuscripcion = [
        { valor: PlanSuscripcion.BASICO, etiqueta: 'Basico' },
        { valor: PlanSuscripcion.PROFESIONAL, etiqueta: 'Profesional' },
        { valor: PlanSuscripcion.EMPRESARIAL, etiqueta: 'Empresarial' },
        { valor: PlanSuscripcion.PREMIUM, etiqueta: 'Premium' }
    ];

    rangosEmpleados = [
        { valor: RangoEmpleados.UNO_CINCO, etiqueta: '1-5 empleados' },
        { valor: RangoEmpleados.SEIS_VEINTE, etiqueta: '6-20 empleados' },
        { valor: RangoEmpleados.VEINTIUNO_CINCUENTA, etiqueta: '21-50 empleados' },
        { valor: RangoEmpleados.CINCUENTA_UNO_CIEN, etiqueta: '51-100 empleados' },
        { valor: RangoEmpleados.CIEN_UNO_QUINIENTOS, etiqueta: '101-500 empleados' },
        { valor: RangoEmpleados.MAS_QUINIENTOS, etiqueta: '500+ empleados' }
    ];

    monedas = [
        { codigo: 'HNL', nombre: 'Lempira (HNL)' },
        { codigo: 'USD', nombre: 'Dolar (USD)' },
        { codigo: 'EUR', nombre: 'Euro (EUR)' },
        { codigo: 'MXN', nombre: 'Peso Mexicano (MXN)' },
        { codigo: 'GTQ', nombre: 'Quetzal (GTQ)' }
    ];

    zonasHorarias = [
        { valor: 'America/Tegucigalpa', etiqueta: 'Honduras (UTC-6)' },
        { valor: 'America/Guatemala', etiqueta: 'Guatemala (UTC-6)' },
        { valor: 'America/El_Salvador', etiqueta: 'El Salvador (UTC-6)' },
        { valor: 'America/Mexico_City', etiqueta: 'Mexico (UTC-6)' },
        { valor: 'America/New_York', etiqueta: 'Este EEUU (UTC-5)' },
        { valor: 'America/Chicago', etiqueta: 'Centro EEUU (UTC-6)' },
        { valor: 'America/Bogota', etiqueta: 'Colombia (UTC-5)' },
        { valor: 'America/Lima', etiqueta: 'Peru (UTC-5)' },
        { valor: 'Europe/Madrid', etiqueta: 'Espana (UTC+1)' }
    ];

    departamentosHN = [
        'Atlantida', 'Choluteca', 'Colon', 'Comayagua', 'Copan', 'Cortes',
        'El Paraiso', 'Francisco Morazan', 'Gracias a Dios', 'Intibuca',
        'Islas de la Bahia', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho',
        'Santa Barbara', 'Valle', 'Yoro'
    ];

    ngOnInit(): void {
        this.inicializarFormulario();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.empresaId.set(parseInt(id, 10));
            this.cargarEmpresa();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
            rtn: ['', [Validators.required, this.rtnValidator()]],
            nit: [''],
            tipoNegocio: ['', [Validators.required]],
            descripcion: ['', [Validators.maxLength(500)]],

            correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            telefono: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            celular: ['', [Validators.maxLength(20)]],
            sitioWeb: ['', [this.urlValidator()]],

            pais: ['HN', [Validators.required]],
            departamento: ['', [Validators.required]],
            ciudad: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            codigoPostal: ['', [Validators.maxLength(15)]],
            direccion: ['', [Validators.maxLength(255)]],

            facebook: [''],
            instagram: [''],
            whatsapp: [''],

            representanteLegal: ['', [Validators.maxLength(200)]],
            planSuscripcion: [''],
            moneda: ['HNL'],
            zonaHoraria: ['America/Tegucigalpa'],
            cantidadEmpleados: [''],

            activa: [true]
        });
    }

    private cargarEmpresa(): void {
        const id = this.empresaId();
        if (!id) return;

        this.empresasService.obtenerEmpresaPorId(id).subscribe({
            next: (empresa) => {
                this.empresa.set(empresa);
                this.formulario.patchValue({
                    nombre: empresa.nombre,
                    rtn: empresa.rtn,
                    nit: empresa.nit || '',
                    tipoNegocio: empresa.tipoNegocio,
                    descripcion: empresa.descripcion || '',
                    correo: empresa.correo,
                    telefono: empresa.telefono,
                    celular: empresa.celular || '',
                    sitioWeb: empresa.sitioWeb || '',
                    pais: empresa.pais || 'HN',
                    departamento: empresa.departamento || '',
                    ciudad: empresa.ciudad || '',
                    codigoPostal: empresa.codigoPostal || '',
                    direccion: empresa.direccion || '',
                    facebook: empresa.redesSociales?.facebook || '',
                    instagram: empresa.redesSociales?.instagram || '',
                    whatsapp: empresa.redesSociales?.whatsapp || '',
                    representanteLegal: empresa.representanteLegal || '',
                    planSuscripcion: empresa.planSuscripcion || '',
                    moneda: empresa.moneda || 'HNL',
                    zonaHoraria: empresa.zonaHoraria || 'America/Tegucigalpa',
                    cantidadEmpleados: empresa.cantidadEmpleados || '',
                    activa: empresa.activa
                });
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('No se pudo cargar la empresa');
                this.cargando.set(false);
            }
        });
    }

    guardar(): void {
        if (this.guardando()) return;

        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            this.toastService.warning('Revisa los campos marcados en rojo');
            return;
        }

        this.guardando.set(true);
        const valores = this.formulario.value;

        if (this.esEdicion()) {
            this.actualizarEmpresa(valores);
        } else {
            this.crearEmpresa(valores);
        }
    }

    private crearEmpresa(valores: Record<string, string | boolean>): void {
        const datos: CrearEmpresaDto = this.construirDto(valores);
        this.empresasService.crearEmpresa(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Empresa creada exitosamente');
                this.router.navigate(['/admin/empresas']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private actualizarEmpresa(valores: Record<string, string | boolean>): void {
        const id = this.empresaId();
        if (!id) return;

        const datos: ActualizarEmpresaDto = { ...this.construirDto(valores), activa: valores['activa'] as boolean };
        this.empresasService.actualizarEmpresa(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Empresa actualizada exitosamente');
                this.router.navigate(['/admin/empresas']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private construirDto(v: Record<string, string | boolean>): CrearEmpresaDto {
        const redesSociales: Record<string, string> = {};
        if (v['facebook']) redesSociales['facebook'] = v['facebook'] as string;
        if (v['instagram']) redesSociales['instagram'] = v['instagram'] as string;
        if (v['whatsapp']) redesSociales['whatsapp'] = v['whatsapp'] as string;

        return {
            nombre: v['nombre'] as string,
            rtn: v['rtn'] as string,
            nit: (v['nit'] as string) || undefined,
            correo: v['correo'] as string,
            telefono: v['telefono'] as string,
            celular: (v['celular'] as string) || undefined,
            sitioWeb: (v['sitioWeb'] as string) || undefined,
            tipoNegocio: v['tipoNegocio'] as TipoNegocio,
            descripcion: (v['descripcion'] as string) || undefined,
            redesSociales: Object.keys(redesSociales).length > 0 ? redesSociales : undefined,
            pais: v['pais'] as string,
            departamento: v['departamento'] as string,
            ciudad: v['ciudad'] as string,
            codigoPostal: (v['codigoPostal'] as string) || undefined,
            direccion: (v['direccion'] as string) || undefined,
            representanteLegal: (v['representanteLegal'] as string) || undefined,
            planSuscripcion: (v['planSuscripcion'] as PlanSuscripcion) || undefined,
            moneda: (v['moneda'] as string) || undefined,
            zonaHoraria: (v['zonaHoraria'] as string) || undefined,
            cantidadEmpleados: (v['cantidadEmpleados'] as RangoEmpleados) || undefined
        };
    }

    private procesarError(err: { error?: { message?: string | string[]; mensaje?: string } }): void {
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

    cancelar(): void {
        this.router.navigate(['/admin/empresas']);
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
        if (errores['email']) return 'Ingresa un correo valido';
        if (errores['minlength']) return `Minimo ${errores['minlength'].requiredLength} caracteres`;
        if (errores['maxlength']) return `Maximo ${errores['maxlength'].requiredLength} caracteres`;
        if (errores['rtnInvalido']) return 'Formato RTN invalido (XXXX-XXXX-XXXXXX)';
        if (errores['urlInvalida']) return 'Ingresa una URL valida';
        return 'Campo invalido';
    }

    obtenerIniciales(nombre: string): string {
        if (!nombre) return '';
        return nombre.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
    }

    obtenerEtiquetaTipo(tipo: string): string {
        const encontrado = this.tiposNegocio.find(t => t.valor === tipo);
        return encontrado ? encontrado.etiqueta : tipo;
    }

    private rtnValidator(): (control: AbstractControl) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = control.value;
            if (!valor || valor.trim() === '') return null;
            const regex = /^\d{4}-\d{4}-\d{6}$/;
            if (!regex.test(valor)) return { rtnInvalido: true };
            return null;
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
}
