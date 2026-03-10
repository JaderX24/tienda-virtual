import { Injectable, signal } from '@angular/core';
import { ES, EN, Traducciones } from './idiomas/colaboradoresPortal';

const CLAVE_IDIOMA = 'idioma-portal';
const TRADUCCIONES: Record<string, Traducciones> = { es: ES, en: EN };

@Injectable({ providedIn: 'root' })
export class IdiomaService {
    idiomaActual = signal<string>('es');

    private traducciones: Traducciones = ES;

    inicializar(): void {
        const guardado = localStorage.getItem(CLAVE_IDIOMA);
        if (guardado && TRADUCCIONES[guardado]) {
            this.cambiarIdioma(guardado);
        }
    }

    cambiarIdioma(idioma: string): void {
        if (!TRADUCCIONES[idioma]) return;
        this.idiomaActual.set(idioma);
        this.traducciones = TRADUCCIONES[idioma];
        localStorage.setItem(CLAVE_IDIOMA, idioma);
    }

    t(clave: string): string {
        return this.traducciones[clave] || clave;
    }
}