import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MetodosPagoService } from '../../services';
import {
    PasarelaPago,
    CrearPasarelaDto,
    ActualizarPasarelaDto,
    TipoPasarela,
    ModoIntegracion
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';
import { OpcionesCatalogoService } from '../../../../../core/services';

@Component({
    selector: 'app-formulario-metodo-pago',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-metodo-pago.component.html',
    styleUrl: './formulario-metodo-pago.component.scss'
})
export class FormularioMetodoPagoComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private metodosPagoService = inject(MetodosPagoService);
    private toastService = inject(ToastService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);

    formulario!: FormGroup;
    cargando = signal(true);
    guardando = signal(false);

    pasarelaId = signal<number | null>(null);
    pasarela = signal<PasarelaPago | null>(null);

    esEdicion = computed(() => this.pasarelaId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Método de Pago' : 'Nuevo Método de Pago');

    pasoActual = signal(1);
    totalPasos = 3;

    tiposPasarela = this.metodosPagoService.obtenerTiposPasarela();
    modosIntegracion = this.metodosPagoService.obtenerModosIntegracion();

    get monedasDisponibles() { return this.opcionesCatalogo.obtenerGrupo('monedas'); }

    ngOnInit(): void {
        this.inicializarFormulario();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.pasarelaId.set(parseInt(id, 10));
            this.cargarPasarela();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            // Paso 1: Información básica
            codigo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-z0-9_]+$/)]],
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            descripcion: ['', [Validators.maxLength(500)]],
            tipo: ['', [Validators.required]],
            proveedor: ['', [Validators.maxLength(100)]],
            logoUrl: ['', [Validators.maxLength(500)]],
            urlDocumentacion: ['', [Validators.maxLength(500)]],

            // Paso 2: Configuración técnica
            modoIntegracion: ['api', [Validators.required]],
            urlApiSandbox: ['', [Validators.maxLength(500)]],
            urlApiProduccion: ['', [Validators.maxLength(500)]],
            versionApi: ['', [Validators.maxLength(20)]],

            // Capacidades
            soportaTokenizacion: [false],
            soporta3ds: [false],
            soportaReembolsos: [true],
            soportaReembolsosParciales: [false],
            soportaSuscripciones: [false],
            soportaSplitPayment: [false],
            soportaPreautorizacion: [false],
            soportaCapturaDiferida: [false],

            // Paso 3: Configuración operativa
            monedasSoportadas: [[]],
            montoMinimo: [1.00, [Validators.required, Validators.min(0.01), Validators.max(999999.99)]],
            montoMaximo: [999999.99, [Validators.required, Validators.min(0.01), Validators.max(999999999.99)]],
            ordenPrioridad: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
            esActivo: [true],
            esVisibleCliente: [true],
            requiereConfiguracion: [true]
        });
    }

    private cargarPasarela(): void {
        const id = this.pasarelaId();
        if (!id) return;

        this.metodosPagoService.obtenerPasarelaPorId(id).subscribe({
            next: (pasarela) => {
                this.pasarela.set(pasarela);
                this.formulario.patchValue({
                    codigo: pasarela.codigo,
                    nombre: pasarela.nombre,
                    descripcion: pasarela.descripcion || '',
                    tipo: pasarela.tipo,
                    proveedor: pasarela.proveedor || '',
                    logoUrl: pasarela.logoUrl || '',
                    urlDocumentacion: pasarela.urlDocumentacion || '',
                    modoIntegracion: pasarela.modoIntegracion,
                    urlApiSandbox: pasarela.urlApiSandbox || '',
                    urlApiProduccion: pasarela.urlApiProduccion || '',
                    versionApi: pasarela.versionApi || '',
                    soportaTokenizacion: pasarela.soportaTokenizacion,
                    soporta3ds: pasarela.soporta3ds,
                    soportaReembolsos: pasarela.soportaReembolsos,
                    soportaReembolsosParciales: pasarela.soportaReembolsosParciales,
                    soportaSuscripciones: pasarela.soportaSuscripciones,
                    soportaSplitPayment: pasarela.soportaSplitPayment,
                    soportaPreautorizacion: pasarela.soportaPreautorizacion,
                    soportaCapturaDiferida: pasarela.soportaCapturaDiferida,
                    monedasSoportadas: pasarela.monedasSoportadas || [],
                    montoMinimo: pasarela.montoMinimo,
                    montoMaximo: pasarela.montoMaximo,
                    ordenPrioridad: pasarela.ordenPrioridad,
                    esActivo: pasarela.esActivo,
                    esVisibleCliente: pasarela.esVisibleCliente,
                    requiereConfiguracion: pasarela.requiereConfiguracion
                });
                // En edición el código no se modifica
                this.formulario.get('codigo')?.disable();
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('No se pudo cargar el método de pago');
                this.cargando.set(false);
                this.router.navigate(['/admin/configuracion/pagos']);
            }
        });
    }

    irAPaso(paso: number): void {
        if (paso < 1 || paso > this.totalPasos) return;

        if (paso > this.pasoActual()) {
            if (!this.validarPasoActual()) return;
        }
        this.pasoActual.set(paso);
    }

    siguientePaso(): void {
        this.irAPaso(this.pasoActual() + 1);
    }

    pasoAnterior(): void {
        this.irAPaso(this.pasoActual() - 1);
    }

    private validarPasoActual(): boolean {
        const paso = this.pasoActual();
        let camposDelPaso: string[] = [];

        if (paso === 1) {
            camposDelPaso = ['codigo', 'nombre', 'tipo'];
        } else if (paso === 2) {
            camposDelPaso = ['modoIntegracion'];
        }

        let valido = true;
        camposDelPaso.forEach(campo => {
            const control = this.formulario.get(campo);
            if (control && control.invalid) {
                control.markAsTouched();
                valido = false;
            }
        });

        if (!valido) {
            this.toastService.warning('Completa los campos requeridos antes de continuar');
        }
        return valido;
    }

    guardar(): void {
        if (this.guardando()) return;

        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            this.toastService.warning('Revisa los campos marcados en rojo');
            this.enfocarPrimerError();
            return;
        }

        // Validar que monto mínimo < máximo
        const montoMinimo = this.formulario.get('montoMinimo')?.value;
        const montoMaximo = this.formulario.get('montoMaximo')?.value;
        if (montoMinimo >= montoMaximo) {
            this.toastService.warning('El monto mínimo debe ser menor al monto máximo');
            return;
        }

        this.guardando.set(true);
        const valores = this.formulario.getRawValue();

        if (this.esEdicion()) {
            this.actualizarPasarela(valores);
        } else {
            this.crearPasarela(valores);
        }
    }

    private crearPasarela(valores: Record<string, any>): void {
        const datos: CrearPasarelaDto = this.construirDto(valores);

        this.metodosPagoService.crearPasarela(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Método de pago creado exitosamente');
                this.router.navigate(['/admin/configuracion/pagos']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private actualizarPasarela(valores: Record<string, any>): void {
        const id = this.pasarelaId();
        if (!id) return;

        const datos: ActualizarPasarelaDto = this.construirDto(valores);

        this.metodosPagoService.actualizarPasarela(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Método de pago actualizado exitosamente');
                this.router.navigate(['/admin/configuracion/pagos']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private construirDto(v: Record<string, any>): CrearPasarelaDto {
        return {
            codigo: v['codigo'],
            nombre: v['nombre'],
            descripcion: v['descripcion'] || undefined,
            tipo: v['tipo'] as TipoPasarela,
            proveedor: v['proveedor'] || undefined,
            logoUrl: v['logoUrl'] || undefined,
            urlDocumentacion: v['urlDocumentacion'] || undefined,
            modoIntegracion: v['modoIntegracion'] as ModoIntegracion,
            urlApiSandbox: v['urlApiSandbox'] || undefined,
            urlApiProduccion: v['urlApiProduccion'] || undefined,
            versionApi: v['versionApi'] || undefined,
            soportaTokenizacion: v['soportaTokenizacion'],
            soporta3ds: v['soporta3ds'],
            soportaReembolsos: v['soportaReembolsos'],
            soportaReembolsosParciales: v['soportaReembolsosParciales'],
            soportaSuscripciones: v['soportaSuscripciones'],
            soportaSplitPayment: v['soportaSplitPayment'],
            soportaPreautorizacion: v['soportaPreautorizacion'],
            soportaCapturaDiferida: v['soportaCapturaDiferida'],
            monedasSoportadas: v['monedasSoportadas'],
            montoMinimo: parseFloat(v['montoMinimo']),
            montoMaximo: parseFloat(v['montoMaximo']),
            ordenPrioridad: parseInt(v['ordenPrioridad'], 10),
            esActivo: v['esActivo'],
            esVisibleCliente: v['esVisibleCliente'],
            requiereConfiguracion: v['requiereConfiguracion']
        };
    }

    private procesarError(err: any): void {
        this.guardando.set(false);
        const mensaje = err?.error?.message || err?.error?.mensaje || 'Ocurrió un error al guardar';
        this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
    }

    private enfocarPrimerError(): void {
        const primerInvalido = document.querySelector('.ng-invalid[formControlName]') as HTMLElement;
        if (primerInvalido) {
            primerInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
            primerInvalido.focus();
        }
    }

    // Validadores de campos
    esInvalido(campo: string): boolean {
        const control = this.formulario.get(campo);
        return !!(control && control.invalid && control.touched);
    }

    obtenerError(campo: string): string {
        const control = this.formulario.get(campo);
        if (!control || !control.errors) return '';

        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
        if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
        if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
        if (control.errors['max']) return `El valor máximo es ${control.errors['max'].max}`;
        if (control.errors['pattern']) return 'Solo letras minúsculas, números y guiones bajos';
        if (control.errors['email']) return 'Correo electrónico inválido';
        return 'Campo inválido';
    }

    toggleMoneda(codigo: string): void {
        const monedasActuales: string[] = this.formulario.get('monedasSoportadas')?.value || [];
        const indice = monedasActuales.indexOf(codigo);

        if (indice === -1) {
            this.formulario.get('monedasSoportadas')?.setValue([...monedasActuales, codigo]);
        } else {
            if (monedasActuales.length > 1) {
                this.formulario.get('monedasSoportadas')?.setValue(monedasActuales.filter(m => m !== codigo));
            } else {
                this.toastService.warning('Debe haber al menos una moneda seleccionada');
            }
        }
    }

    tieneMoneda(codigo: string): boolean {
        const monedas: string[] = this.formulario.get('monedasSoportadas')?.value || [];
        return monedas.includes(codigo);
    }

    obtenerIconoTipo(tipo: string): string {
        return this.metodosPagoService.obtenerIconoTipo(tipo as TipoPasarela);
    }
}
