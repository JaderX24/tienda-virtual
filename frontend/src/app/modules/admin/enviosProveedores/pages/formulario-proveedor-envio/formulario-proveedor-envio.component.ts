import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProveedoresEnvioService } from '../../services';
import {
    ProveedorEnvio,
    CrearProveedorEnvioDto,
    ActualizarProveedorEnvioDto,
    ContactoProveedor,
    TipoProveedor,
    TipoServicio,
    ZonaCobertura
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';
import { OpcionesCatalogoService } from '../../../../../core/services';

@Component({
    selector: 'app-formulario-proveedor-envio',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './formulario-proveedor-envio.component.html',
    styleUrl: './formulario-proveedor-envio.component.scss'
})
export class FormularioProveedorEnvioComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private proveedoresService = inject(ProveedoresEnvioService);
    private toastService = inject(ToastService);
    private opcionesCatalogo = inject(OpcionesCatalogoService);

    formulario!: FormGroup;
    cargando = signal(true);
    guardando = signal(false);

    proveedorId = signal<number | null>(null);
    proveedor = signal<ProveedorEnvio | null>(null);

    esEdicion = computed(() => this.proveedorId() !== null);
    titulo = computed(() => this.esEdicion() ? 'Editar Proveedor de Envío' : 'Nuevo Proveedor de Envío');

    pasoActual = signal(1);
    totalPasos = 4;

    tiposProveedor = this.proveedoresService.obtenerTiposProveedor();
    tiposServicio = this.proveedoresService.obtenerTiposServicio();
    zonasCobertura = this.proveedoresService.obtenerZonasCobertura();
    departamentosHonduras = this.opcionesCatalogo.obtenerGrupo('departamentos');

    ngOnInit(): void {
        this.inicializarFormulario();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.proveedorId.set(parseInt(id, 10));
            this.cargarProveedor();
        } else {
            this.cargando.set(false);
        }
    }

    private inicializarFormulario(): void {
        this.formulario = this.fb.group({
            // Paso 1: Información básica
            codigo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20), Validators.pattern(/^[a-z0-9_]+$/)]],
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            razonSocial: ['', [Validators.maxLength(200)]],
            rtn: ['', [Validators.maxLength(20)]],
            tipo: ['', [Validators.required]],
            descripcion: ['', [Validators.maxLength(500)]],
            logoUrl: ['', [Validators.maxLength(500)]],
            sitioWeb: ['', [Validators.maxLength(500)]],

            // Paso 1: Ubicación
            direccion: ['', [Validators.maxLength(300)]],
            ciudad: ['', [Validators.maxLength(100)]],
            departamento: ['', [Validators.maxLength(100)]],
            pais: ['Honduras'],
            codigoPostal: ['', [Validators.maxLength(10)]],

            // Paso 2: Contacto
            telefonoPrincipal: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            telefonoSecundario: ['', [Validators.maxLength(20)]],
            correoGeneral: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            correoOperaciones: ['', [Validators.email, Validators.maxLength(255)]],

            // Paso 2: Contactos (personas a cargo)
            contactos: this.fb.array([]),

            // Paso 3: Servicios y cobertura
            servicios: [[] as TipoServicio[]],
            zonasCobertura: [[] as ZonaCobertura[]],
            departamentosCobertura: [[] as string[]],

            // Paso 3: Operativa
            tiempoEntregaMinimo: [1, [Validators.required, Validators.min(1), Validators.max(365)]],
            tiempoEntregaMaximo: [5, [Validators.required, Validators.min(1), Validators.max(365)]],
            costoBase: [0, [Validators.required, Validators.min(0), Validators.max(999999.99)]],
            costoKgAdicional: [0, [Validators.min(0), Validators.max(99999.99)]],
            moneda: ['HNL'],
            capacidadDiaria: [null, [Validators.min(1)]],
            pesoMaximoPaquete: [null, [Validators.min(0.1)]],
            horarioAtencion: ['', [Validators.maxLength(100)]],

            // Paso 4: Capacidades
            soportaRastreo: [false],
            soportaSeguro: [false],
            soportaContraEntrega: [false],
            soportaDevolucion: [false],
            soportaEntregaProgramada: [false],
            soportaRecogidaDomicilio: [false],

            // Paso 4: Integración
            urlRastreo: ['', [Validators.maxLength(500)]],
            apiUrl: ['', [Validators.maxLength(500)]],

            // Paso 4: Estado
            ordenPrioridad: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
            esActivo: [true],
            esVisible: [true],
            notas: ['', [Validators.maxLength(1000)]]
        });
    }

    get contactosFormArray(): FormArray {
        return this.formulario.get('contactos') as FormArray;
    }

    agregarContacto(): void {
        const contactoGroup = this.fb.group({
            nombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
            cargo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            departamento: ['', [Validators.maxLength(100)]],
            telefonoPrincipal: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
            telefonoSecundario: ['', [Validators.maxLength(20)]],
            correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            correoSecundario: ['', [Validators.email, Validators.maxLength(255)]],
            esPrincipal: [this.contactosFormArray.length === 0],
            notas: ['', [Validators.maxLength(500)]]
        });

        this.contactosFormArray.push(contactoGroup);
    }

    eliminarContacto(indice: number): void {
        const contacto = this.contactosFormArray.at(indice);
        const eraPrincipal = contacto.get('esPrincipal')?.value;

        this.contactosFormArray.removeAt(indice);

        if (eraPrincipal && this.contactosFormArray.length > 0) {
            this.contactosFormArray.at(0).get('esPrincipal')?.setValue(true);
        }
    }

    marcarComoPrincipal(indice: number): void {
        this.contactosFormArray.controls.forEach((control, i) => {
            control.get('esPrincipal')?.setValue(i === indice);
        });
    }

    private cargarProveedor(): void {
        const id = this.proveedorId();
        if (!id) return;

        this.proveedoresService.obtenerProveedorPorId(id).subscribe({
            next: (proveedor) => {
                this.proveedor.set(proveedor);
                this.formulario.patchValue({
                    codigo: proveedor.codigo,
                    nombre: proveedor.nombre,
                    razonSocial: proveedor.razonSocial || '',
                    rtn: proveedor.rtn || '',
                    tipo: proveedor.tipo,
                    descripcion: proveedor.descripcion || '',
                    logoUrl: proveedor.logoUrl || '',
                    sitioWeb: proveedor.sitioWeb || '',
                    direccion: proveedor.direccion || '',
                    ciudad: proveedor.ciudad || '',
                    departamento: proveedor.departamento || '',
                    pais: proveedor.pais || 'Honduras',
                    codigoPostal: proveedor.codigoPostal || '',
                    telefonoPrincipal: proveedor.telefonoPrincipal,
                    telefonoSecundario: proveedor.telefonoSecundario || '',
                    correoGeneral: proveedor.correoGeneral,
                    correoOperaciones: proveedor.correoOperaciones || '',
                    servicios: proveedor.servicios || [],
                    zonasCobertura: proveedor.zonasCobertura || [],
                    departamentosCobertura: proveedor.departamentosCobertura || [],
                    tiempoEntregaMinimo: proveedor.tiempoEntregaMinimo,
                    tiempoEntregaMaximo: proveedor.tiempoEntregaMaximo,
                    costoBase: proveedor.costoBase,
                    costoKgAdicional: proveedor.costoKgAdicional,
                    moneda: proveedor.moneda || 'HNL',
                    capacidadDiaria: proveedor.capacidadDiaria,
                    pesoMaximoPaquete: proveedor.pesoMaximoPaquete,
                    horarioAtencion: proveedor.horarioAtencion || '',
                    soportaRastreo: proveedor.soportaRastreo,
                    soportaSeguro: proveedor.soportaSeguro,
                    soportaContraEntrega: proveedor.soportaContraEntrega,
                    soportaDevolucion: proveedor.soportaDevolucion,
                    soportaEntregaProgramada: proveedor.soportaEntregaProgramada,
                    soportaRecogidaDomicilio: proveedor.soportaRecogidaDomicilio,
                    urlRastreo: proveedor.urlRastreo || '',
                    apiUrl: proveedor.apiUrl || '',
                    ordenPrioridad: proveedor.ordenPrioridad,
                    esActivo: proveedor.esActivo,
                    esVisible: proveedor.esVisible,
                    notas: proveedor.notas || ''
                });

                // Cargar contactos existentes
                if (proveedor.contactos && proveedor.contactos.length > 0) {
                    proveedor.contactos.forEach(contacto => {
                        const contactoGroup = this.fb.group({
                            nombreCompleto: [contacto.nombreCompleto, [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
                            cargo: [contacto.cargo, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
                            departamento: [contacto.departamento || '', [Validators.maxLength(100)]],
                            telefonoPrincipal: [contacto.telefonoPrincipal, [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
                            telefonoSecundario: [contacto.telefonoSecundario || '', [Validators.maxLength(20)]],
                            correo: [contacto.correo, [Validators.required, Validators.email, Validators.maxLength(255)]],
                            correoSecundario: [contacto.correoSecundario || '', [Validators.email, Validators.maxLength(255)]],
                            esPrincipal: [contacto.esPrincipal],
                            notas: [contacto.notas || '', [Validators.maxLength(500)]]
                        });
                        this.contactosFormArray.push(contactoGroup);
                    });
                }

                this.formulario.get('codigo')?.disable();
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('No se pudo cargar el proveedor de envío');
                this.cargando.set(false);
                this.router.navigate(['/admin/configuracion/envios']);
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
            camposDelPaso = ['telefonoPrincipal', 'correoGeneral'];
        } else if (paso === 3) {
            camposDelPaso = ['tiempoEntregaMinimo', 'tiempoEntregaMaximo', 'costoBase'];
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

        const tiempoMin = this.formulario.get('tiempoEntregaMinimo')?.value;
        const tiempoMax = this.formulario.get('tiempoEntregaMaximo')?.value;
        if (tiempoMin > tiempoMax) {
            this.toastService.warning('El tiempo mínimo de entrega no puede ser mayor al máximo');
            return;
        }

        this.guardando.set(true);
        const valores = this.formulario.getRawValue();

        if (this.esEdicion()) {
            this.actualizarProveedor(valores);
        } else {
            this.crearProveedor(valores);
        }
    }

    private crearProveedor(valores: Record<string, any>): void {
        const datos: CrearProveedorEnvioDto = this.construirDto(valores);

        this.proveedoresService.crearProveedor(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Proveedor de envío creado exitosamente');
                this.router.navigate(['/admin/configuracion/envios']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private actualizarProveedor(valores: Record<string, any>): void {
        const id = this.proveedorId();
        if (!id) return;

        const datos: ActualizarProveedorEnvioDto = this.construirDto(valores);

        this.proveedoresService.actualizarProveedor(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Proveedor de envío actualizado exitosamente');
                this.router.navigate(['/admin/configuracion/envios']);
            },
            error: (err) => this.procesarError(err)
        });
    }

    private construirDto(v: Record<string, any>): CrearProveedorEnvioDto {
        const contactosRaw = this.contactosFormArray.value;
        const contactos = contactosRaw.length > 0
            ? contactosRaw.map((c: Record<string, any>) => ({
                nombreCompleto: c['nombreCompleto'],
                cargo: c['cargo'],
                departamento: c['departamento'] || undefined,
                telefonoPrincipal: c['telefonoPrincipal'],
                telefonoSecundario: c['telefonoSecundario'] || undefined,
                correo: c['correo'],
                correoSecundario: c['correoSecundario'] || undefined,
                esPrincipal: c['esPrincipal'] ?? false,
                notas: c['notas'] || undefined
            }))
            : undefined;

        return {
            codigo: v['codigo'],
            nombre: v['nombre'],
            razonSocial: v['razonSocial'] || undefined,
            rtn: v['rtn'] || undefined,
            tipo: v['tipo'] as TipoProveedor,
            descripcion: v['descripcion'] || undefined,
            logoUrl: v['logoUrl'] || undefined,
            sitioWeb: v['sitioWeb'] || undefined,
            direccion: v['direccion'] || undefined,
            ciudad: v['ciudad'] || undefined,
            departamento: v['departamento'] || undefined,
            pais: v['pais'] || 'Honduras',
            codigoPostal: v['codigoPostal'] || undefined,
            telefonoPrincipal: v['telefonoPrincipal'],
            telefonoSecundario: v['telefonoSecundario'] || undefined,
            correoGeneral: v['correoGeneral'],
            correoOperaciones: v['correoOperaciones'] || undefined,
            servicios: v['servicios']?.length > 0 ? v['servicios'] : undefined,
            zonasCobertura: v['zonasCobertura']?.length > 0 ? v['zonasCobertura'] : undefined,
            departamentosCobertura: v['departamentosCobertura']?.length > 0 ? v['departamentosCobertura'] : undefined,
            tiempoEntregaMinimo: parseInt(v['tiempoEntregaMinimo'], 10),
            tiempoEntregaMaximo: parseInt(v['tiempoEntregaMaximo'], 10),
            costoBase: parseFloat(v['costoBase']) || 0,
            costoKgAdicional: v['costoKgAdicional'] ? parseFloat(v['costoKgAdicional']) : undefined,
            moneda: v['moneda'] || 'HNL',
            capacidadDiaria: v['capacidadDiaria'] ? parseInt(v['capacidadDiaria'], 10) : undefined,
            pesoMaximoPaquete: v['pesoMaximoPaquete'] ? parseFloat(v['pesoMaximoPaquete']) : undefined,
            horarioAtencion: v['horarioAtencion'] || undefined,
            soportaRastreo: v['soportaRastreo'],
            soportaSeguro: v['soportaSeguro'],
            soportaContraEntrega: v['soportaContraEntrega'],
            soportaDevolucion: v['soportaDevolucion'],
            soportaEntregaProgramada: v['soportaEntregaProgramada'],
            soportaRecogidaDomicilio: v['soportaRecogidaDomicilio'],
            urlRastreo: v['urlRastreo'] || undefined,
            apiUrl: v['apiUrl'] || undefined,
            ordenPrioridad: parseInt(v['ordenPrioridad'], 10),
            esActivo: v['esActivo'],
            esVisible: v['esVisible'],
            notas: v['notas'] || undefined,
            contactos
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

    esInvalido(campo: string): boolean {
        const control = this.formulario.get(campo);
        return !!(control && control.invalid && control.touched);
    }

    esInvalidoContacto(indice: number, campo: string): boolean {
        const control = this.contactosFormArray.at(indice)?.get(campo);
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

    obtenerErrorContacto(indice: number, campo: string): string {
        const control = this.contactosFormArray.at(indice)?.get(campo);
        if (!control || !control.errors) return '';

        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
        if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
        if (control.errors['email']) return 'Correo electrónico inválido';
        return 'Campo inválido';
    }

    toggleServicio(servicio: string): void {
        const serviciosActuales: string[] = this.formulario.get('servicios')?.value || [];
        const indice = serviciosActuales.indexOf(servicio);

        if (indice === -1) {
            this.formulario.get('servicios')?.setValue([...serviciosActuales, servicio]);
        } else {
            this.formulario.get('servicios')?.setValue(serviciosActuales.filter(s => s !== servicio));
        }
    }

    tieneServicio(servicio: string): boolean {
        const servicios: string[] = this.formulario.get('servicios')?.value || [];
        return servicios.includes(servicio);
    }

    toggleZona(zona: string): void {
        const zonasActuales: string[] = this.formulario.get('zonasCobertura')?.value || [];
        const indice = zonasActuales.indexOf(zona);

        if (indice === -1) {
            this.formulario.get('zonasCobertura')?.setValue([...zonasActuales, zona]);
        } else {
            this.formulario.get('zonasCobertura')?.setValue(zonasActuales.filter(z => z !== zona));
        }
    }

    tieneZona(zona: string): boolean {
        const zonas: string[] = this.formulario.get('zonasCobertura')?.value || [];
        return zonas.includes(zona);
    }

    toggleDepartamento(codigo: string): void {
        const deptosActuales: string[] = this.formulario.get('departamentosCobertura')?.value || [];
        const indice = deptosActuales.indexOf(codigo);

        if (indice === -1) {
            this.formulario.get('departamentosCobertura')?.setValue([...deptosActuales, codigo]);
        } else {
            this.formulario.get('departamentosCobertura')?.setValue(deptosActuales.filter(d => d !== codigo));
        }
    }

    tieneDepartamento(codigo: string): boolean {
        const deptos: string[] = this.formulario.get('departamentosCobertura')?.value || [];
        return deptos.includes(codigo);
    }

    seleccionarTodosDepartamentos(): void {
        const todos = this.departamentosHonduras.map(d => d.valor);
        this.formulario.get('departamentosCobertura')?.setValue(todos);
    }

    limpiarDepartamentos(): void {
        this.formulario.get('departamentosCobertura')?.setValue([]);
    }

    obtenerIconoTipo(tipo: string): string {
        return this.proveedoresService.obtenerIconoTipo(tipo as TipoProveedor);
    }

    obtenerIconoServicio(servicio: string): string {
        return this.proveedoresService.obtenerIconoServicio(servicio as TipoServicio);
    }
}
