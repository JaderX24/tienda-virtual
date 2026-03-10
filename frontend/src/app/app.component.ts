import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TemaService } from './core/services/tema.service';
import { IdiomaService } from './core/services/idioma.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  titulo = 'Tienda Virtual';
  private temaService = inject(TemaService);
  private idiomaService = inject(IdiomaService);

  ngOnInit(): void {
    this.temaService.inicializar();
    this.idiomaService.inicializar();
  }
}
