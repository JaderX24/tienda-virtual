import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../services';
import {
    Producto,
    CategoriaResumen,
    MarcaResumen,
    CrearProductoDto,
    ActualizarProductoDto
} from '../../interfaces';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-formulario-producto',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './formulario-producto.component.html',
    styleUrl: './formulario-producto.component.scss'
})
export class FormularioProductoComponent implements OnInit {
    private productosService = inject(ProductosService);
    private toastService = inject(ToastService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    modoEdicion = signal(false);
    productoId = signal<number | null>(null);
    cargando = signal(false);
    guardando = signal(false);
    cargandoDatos = signal(true);

    categorias = signal<CategoriaResumen[]>([]);
    marcas = signal<MarcaResumen[]>([]);

    nombre = signal('');
    sku = signal('');
    descripcionCorta = signal('');
    descripcion = signal('');
    precio = signal<number | null>(null);
    precioComparacion = signal<number | null>(null);
    costo = signal<number | null>(null);
    categoriaId = signal<number | null>(null);
    marcaId = signal<number | null>(null);
    peso = signal<number | null>(null);
    activo = signal(true);
    destacado = signal(false);

    errores = signal<Record<string, string>>({});

    ngOnInit(): void {
        this.cargarDatosIniciales();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.modoEdicion.set(true);
            this.productoId.set(Number(id));
            this.cargarProducto(Number(id));
        } else {
            this.cargandoDatos.set(false);
        }
    }

    cargarDatosIniciales(): void {
        this.productosService.obtenerCategorias().subscribe({
            next: (categorias) => this.categorias.set(categorias),
            error: () => this.toastService.error('Error al cargar las categorías')
        });

        this.productosService.obtenerMarcas().subscribe({
            next: (marcas) => this.marcas.set(marcas),
            error: () => this.toastService.error('Error al cargar las marcas')
        });
    }

    cargarProducto(id: number): void {
        this.cargandoDatos.set(true);

        this.productosService.obtenerProductoPorId(id).subscribe({
            next: (producto) => {
                this.nombre.set(producto.nombre);
                this.sku.set(producto.sku);
                this.descripcionCorta.set(producto.descripcionCorta || '');
                this.descripcion.set(producto.descripcion || '');
                this.precio.set(Number(producto.precio));
                this.precioComparacion.set(producto.precioComparacion ? Number(producto.precioComparacion) : null);
                this.costo.set(producto.costo ? Number(producto.costo) : null);
                this.categoriaId.set(producto.categoriaId);
                this.marcaId.set(producto.marcaId);
                this.peso.set(producto.peso ? Number(producto.peso) : null);
                this.activo.set(producto.activo);
                this.destacado.set(producto.destacado);
                this.cargandoDatos.set(false);
            },
            error: (err) => {
                this.cargandoDatos.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo cargar el producto';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
                this.router.navigate(['/admin/productos']);
            }
        });
    }

    validarFormulario(): boolean {
        const erroresTemp: Record<string, string> = {};

        if (!this.nombre().trim()) {
            erroresTemp['nombre'] = 'El nombre es obligatorio';
        } else if (this.nombre().trim().length < 2) {
            erroresTemp['nombre'] = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!this.sku().trim()) {
            erroresTemp['sku'] = 'El SKU es obligatorio';
        } else if (!/^[A-Z0-9\-_]+$/.test(this.sku().trim())) {
            erroresTemp['sku'] = 'El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos';
        }

        if (this.precio() === null || this.precio()! <= 0) {
            erroresTemp['precio'] = 'El precio debe ser mayor a 0';
        }

        if (this.precioComparacion() !== null && this.precioComparacion()! <= 0) {
            erroresTemp['precioComparacion'] = 'El precio de comparación debe ser mayor a 0';
        }

        if (this.costo() !== null && this.costo()! < 0) {
            erroresTemp['costo'] = 'El costo no puede ser negativo';
        }

        if (!this.categoriaId()) {
            erroresTemp['categoriaId'] = 'La categoría es obligatoria';
        }

        if (this.peso() !== null && this.peso()! < 0) {
            erroresTemp['peso'] = 'El peso no puede ser negativo';
        }

        this.errores.set(erroresTemp);
        return Object.keys(erroresTemp).length === 0;
    }

    guardar(): void {
        if (!this.validarFormulario()) {
            this.toastService.warning('Corrige los errores del formulario');
            return;
        }

        this.guardando.set(true);

        if (this.modoEdicion()) {
            this.actualizarProducto();
        } else {
            this.crearProducto();
        }
    }

    private crearProducto(): void {
        const datos: CrearProductoDto = {
            nombre: this.nombre().trim(),
            sku: this.sku().trim(),
            precio: this.precio()!,
            categoriaId: this.categoriaId()!,
        };

        if (this.descripcionCorta().trim()) datos.descripcionCorta = this.descripcionCorta().trim();
        if (this.descripcion().trim()) datos.descripcion = this.descripcion().trim();
        if (this.precioComparacion() !== null) datos.precioComparacion = this.precioComparacion()!;
        if (this.costo() !== null) datos.costo = this.costo()!;
        if (this.marcaId()) datos.marcaId = this.marcaId()!;
        if (this.peso() !== null) datos.peso = this.peso()!;
        datos.activo = this.activo();
        datos.destacado = this.destacado();

        this.productosService.crearProducto(datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Producto creado exitosamente');
                this.router.navigate(['/admin/productos']);
            },
            error: (err) => {
                this.guardando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo crear el producto';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    private actualizarProducto(): void {
        const id = this.productoId();
        if (!id) return;

        const datos: ActualizarProductoDto = {
            nombre: this.nombre().trim(),
            sku: this.sku().trim(),
            precio: this.precio()!,
            categoriaId: this.categoriaId()!,
            descripcionCorta: this.descripcionCorta().trim() || undefined,
            descripcion: this.descripcion().trim() || undefined,
            precioComparacion: this.precioComparacion() ?? undefined,
            costo: this.costo() ?? undefined,
            marcaId: this.marcaId() ?? undefined,
            peso: this.peso() ?? undefined,
            activo: this.activo(),
            destacado: this.destacado(),
        };

        this.productosService.actualizarProducto(id, datos).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toastService.success('Producto actualizado exitosamente');
                this.router.navigate(['/admin/productos']);
            },
            error: (err) => {
                this.guardando.set(false);
                const mensaje = err?.error?.message || err?.error?.mensaje || 'No se pudo actualizar el producto';
                this.toastService.error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
            }
        });
    }

    tieneError(campo: string): boolean {
        return !!this.errores()[campo];
    }

    obtenerError(campo: string): string {
        return this.errores()[campo] || '';
    }

    cancelar(): void {
        this.router.navigate(['/admin/productos']);
    }
}
