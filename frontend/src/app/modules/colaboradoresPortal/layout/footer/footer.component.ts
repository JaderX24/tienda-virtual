import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraducirPipe } from '../../../../core/pipes/colaboradoresPortal/traducir.pipe';

@Component({
    selector: 'app-footer-colab',
    standalone: true,
    imports: [CommonModule, TraducirPipe],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterColabComponent {
    anioActual = new Date().getFullYear();
    version = '1.0.0';
}
