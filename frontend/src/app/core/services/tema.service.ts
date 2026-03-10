import { inject, Injectable, signal } from '@angular/core';
import { IdiomaService } from './idioma.service';
import {
    TEMAS_PORTAL,
    TEMA_POR_DEFECTO,
    ZONA_POR_DEFECTO,
    IDIOMA_POR_DEFECTO,
} from './temas/colaboradoresPortal';

export { ZONAS_HORARIAS, IDIOMAS_DISPONIBLES } from './temas/colaboradoresPortal';
export type { ZonaHorariaOpcion, IdiomaOpcion } from './temas/colaboradoresPortal';

const CLAVE_STORAGE = 'tema-color-portal';
const CLAVE_SIDEBAR = 'sidebar-compacto-portal';
const CLAVE_IDIOMA = 'idioma-portal';
const CLAVE_ZONA = 'zona-horaria-portal';

@Injectable({ providedIn: 'root' })
export class TemaService {
    private temaActual = TEMA_POR_DEFECTO;
    private idiomaService = inject(IdiomaService);

    sidebarCompacto = signal(false);
    idiomaActual = signal(IDIOMA_POR_DEFECTO);
    zonaHorariaActual = signal(ZONA_POR_DEFECTO);

    obtenerTemaActual(): string {
        return this.temaActual;
    }

    inicializar(): void {
        const temaGuardado = localStorage.getItem(CLAVE_STORAGE);
        if (temaGuardado && TEMAS_PORTAL[temaGuardado]) {
            this.aplicarTema(temaGuardado);
        } else {
            this.aplicarTema(TEMA_POR_DEFECTO);
        }

        const sidebarGuardado = localStorage.getItem(CLAVE_SIDEBAR);
        if (sidebarGuardado !== null) {
            this.sidebarCompacto.set(sidebarGuardado === 'true');
        }

        const idiomaGuardado = localStorage.getItem(CLAVE_IDIOMA);
        if (idiomaGuardado) {
            this.idiomaActual.set(idiomaGuardado);
        }

        const zonaGuardada = localStorage.getItem(CLAVE_ZONA);
        if (zonaGuardada) {
            this.zonaHorariaActual.set(zonaGuardada);
        }
    }

    aplicarSidebarCompacto(compacto: boolean): void {
        this.sidebarCompacto.set(compacto);
        localStorage.setItem(CLAVE_SIDEBAR, String(compacto));
    }

    aplicarIdioma(idioma: string): void {
        this.idiomaActual.set(idioma);
        localStorage.setItem(CLAVE_IDIOMA, idioma);
        this.idiomaService.cambiarIdioma(idioma);
    }

    aplicarZonaHoraria(zona: string): void {
        this.zonaHorariaActual.set(zona);
        localStorage.setItem(CLAVE_ZONA, zona);
    }

    aplicarTema(nombreTema: string): void {
        const tema = TEMAS_PORTAL[nombreTema];
        if (!tema) return;

        this.temaActual = nombreTema;
        localStorage.setItem(CLAVE_STORAGE, nombreTema);

        const raiz = document.documentElement;
        raiz.style.setProperty('--tema-primario', tema.primario);
        raiz.style.setProperty('--tema-primario-oscuro', tema.primarioOscuro);
        raiz.style.setProperty('--tema-primario-claro', tema.primarioClaro);
        raiz.style.setProperty('--tema-primario-rgb', tema.primarioRgb);
        raiz.style.setProperty('--tema-sidebar-bg', tema.sidebarBg);
        raiz.style.setProperty('--tema-sidebar-bg-oscuro', tema.sidebarBgOscuro);
        raiz.style.setProperty('--tema-sidebar-activo-bg', tema.sidebarActivoBg);
        raiz.style.setProperty('--tema-sidebar-texto-activo', tema.sidebarTextoActivo);
    }
}