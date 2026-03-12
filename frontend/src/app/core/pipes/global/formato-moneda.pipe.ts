import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { OpcionesCatalogoService } from '../../services/opciones-catalogo.service';

@Pipe({ name: 'formatoMoneda', standalone: true })
export class FormatoMonedaPipe implements PipeTransform {
    private locale = inject(LOCALE_ID);
    private opcionesCatalogo = inject(OpcionesCatalogoService);

    transform(valor: number | null | undefined, moneda?: string): string {
        if (valor === null || valor === undefined) return '';
        const codigoMoneda = moneda || this.opcionesCatalogo.obtenerGrupo('monedas')[0]?.valor;
        if (!codigoMoneda) {
            return new Intl.NumberFormat(this.locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(valor);
        }
        return new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency: codigoMoneda,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valor);
    }
}
