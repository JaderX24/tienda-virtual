import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio-publico',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio-publico.component.html',
  styleUrl: './inicio-publico.component.scss'
})
export class InicioPublicoComponent {
  titulo = 'Tienda Virtual';
  anioActual = new Date().getFullYear();
  
  categorias = [
    { nombre: 'Electrónica', icono: 'bi-laptop', cantidad: 150 },
    { nombre: 'Ropa', icono: 'bi-bag', cantidad: 320 },
    { nombre: 'Hogar', icono: 'bi-house', cantidad: 89 },
    { nombre: 'Deportes', icono: 'bi-trophy', cantidad: 75 }
  ];

  productosDestacados = [
    { id: 1, nombre: 'Laptop Gaming Pro', precio: 25999.00, imagen: 'bi-laptop', descuento: 15 },
    { id: 2, nombre: 'Smartphone Ultra', precio: 15499.00, imagen: 'bi-phone', descuento: 0 },
    { id: 3, nombre: 'Auriculares Bluetooth', precio: 1299.00, imagen: 'bi-headphones', descuento: 20 },
    { id: 4, nombre: 'Smart Watch', precio: 4599.00, imagen: 'bi-smartwatch', descuento: 10 }
  ];
}
