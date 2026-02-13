import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    PasarelaPago,
    CrearPasarelaDto,
    ActualizarPasarelaDto,
    FiltrosPasarela,
    ResumenPasarelas,
    TipoPasarela,
    ModoIntegracion,
    OpcionSelect,
    RespuestaApi,
    RespuestaPaginada
} from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class MetodosPagoService {
    private readonly apiUrl = `${environment.apiUrl}/admin/metodos-pago`;
    private readonly http = inject(HttpClient);

    private cargando = signal(false);
    private pasarelas = signal<PasarelaPago[]>([]);
    private totalPasarelas = signal(0);
    private resumen = signal<ResumenPasarelas | null>(null);

    readonly estaCargando = this.cargando.asReadonly();
    readonly listaPasarelas = this.pasarelas.asReadonly();
    readonly total = this.totalPasarelas.asReadonly();
    readonly resumenPasarelas = this.resumen.asReadonly();

    obtenerPasarelas(filtros: FiltrosPasarela): Observable<RespuestaPaginada<PasarelaPago>> {
        this.cargando.set(true);

        let params = new HttpParams()
            .set('pagina', (filtros.pagina || 1).toString())
            .set('limite', (filtros.limite || 20).toString());

        if (filtros.busqueda?.trim()) {
            params = params.set('busqueda', filtros.busqueda.trim());
        }
        if (filtros.tipo) {
            params = params.set('tipo', filtros.tipo);
        }
        if (filtros.modoIntegracion) {
            params = params.set('modoIntegracion', filtros.modoIntegracion);
        }
        if (filtros.esActivo !== undefined) {
            params = params.set('esActivo', filtros.esActivo.toString());
        }
        if (filtros.esVisibleCliente !== undefined) {
            params = params.set('esVisibleCliente', filtros.esVisibleCliente.toString());
        }
        if (filtros.orden) {
            params = params.set('orden', filtros.orden);
        }
        if (filtros.direccion) {
            params = params.set('direccion', filtros.direccion);
        }

        return this.http.get<RespuestaApi<RespuestaPaginada<PasarelaPago>>>(this.apiUrl, { params }).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => {
                this.pasarelas.set(datos.datos);
                this.totalPasarelas.set(datos.total);
                this.cargando.set(false);
            }),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    obtenerPasarelaPorId(id: number): Observable<PasarelaPago> {
        return this.http.get<RespuestaApi<PasarelaPago>>(`${this.apiUrl}/${id}`).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => throwError(() => error))
        );
    }

    crearPasarela(datos: CrearPasarelaDto): Observable<PasarelaPago> {
        this.cargando.set(true);
        return this.http.post<RespuestaApi<{ pasarela: PasarelaPago }>>(this.apiUrl, datos).pipe(
            map(respuesta => respuesta.datos.pasarela),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    actualizarPasarela(id: number, datos: ActualizarPasarelaDto): Observable<PasarelaPago> {
        this.cargando.set(true);
        return this.http.patch<RespuestaApi<{ pasarela: PasarelaPago }>>(`${this.apiUrl}/${id}`, datos).pipe(
            map(respuesta => respuesta.datos.pasarela),
            tap(() => this.cargando.set(false)),
            catchError(error => {
                this.cargando.set(false);
                return throwError(() => error);
            })
        );
    }

    cambiarEstadoPasarela(id: number, esActivo: boolean): Observable<PasarelaPago> {
        return this.http.patch<RespuestaApi<{ pasarela: PasarelaPago }>>(`${this.apiUrl}/${id}/estado`, { esActivo }).pipe(
            map(respuesta => respuesta.datos.pasarela),
            catchError(error => throwError(() => error))
        );
    }

    cambiarVisibilidadPasarela(id: number, esVisibleCliente: boolean): Observable<PasarelaPago> {
        return this.http.patch<RespuestaApi<{ pasarela: PasarelaPago }>>(`${this.apiUrl}/${id}/visibilidad`, { esVisibleCliente }).pipe(
            map(respuesta => respuesta.datos.pasarela),
            catchError(error => throwError(() => error))
        );
    }

    actualizarOrdenPrioridad(pasarelas: { id: number; ordenPrioridad: number }[]): Observable<void> {
        return this.http.patch<RespuestaApi<void>>(`${this.apiUrl}/orden-prioridad`, { pasarelas }).pipe(
            map(respuesta => respuesta.datos),
            catchError(error => throwError(() => error))
        );
    }

    obtenerResumen(): Observable<ResumenPasarelas> {
        return this.http.get<RespuestaApi<ResumenPasarelas>>(`${this.apiUrl}/resumen`).pipe(
            map(respuesta => respuesta.datos),
            tap(datos => this.resumen.set(datos)),
            catchError(error => throwError(() => error))
        );
    }

    // Opciones estáticas para selects

    obtenerTiposPasarela(): OpcionSelect[] {
        return [
            { valor: TipoPasarela.TARJETA, etiqueta: 'Tarjeta de Crédito/Débito' },
            { valor: TipoPasarela.TRANSFERENCIA, etiqueta: 'Transferencia Bancaria' },
            { valor: TipoPasarela.WALLET_DIGITAL, etiqueta: 'Billetera Digital' },
            { valor: TipoPasarela.EFECTIVO, etiqueta: 'Efectivo' },
            { valor: TipoPasarela.CRIPTOMONEDA, etiqueta: 'Criptomoneda' },
            { valor: TipoPasarela.BNPL, etiqueta: 'Compra Ahora, Paga Después' },
            { valor: TipoPasarela.OTRO, etiqueta: 'Otro' }
        ];
    }

    obtenerModosIntegracion(): OpcionSelect[] {
        return [
            { valor: ModoIntegracion.API, etiqueta: 'API Directa' },
            { valor: ModoIntegracion.REDIRECT, etiqueta: 'Redirección' },
            { valor: ModoIntegracion.IFRAME, etiqueta: 'iFrame' },
            { valor: ModoIntegracion.SDK, etiqueta: 'SDK' },
            { valor: ModoIntegracion.WEBHOOK, etiqueta: 'Webhook' }
        ];
    }

    obtenerTipoTexto(tipo: TipoPasarela): string {
        const mapa: Record<TipoPasarela, string> = {
            [TipoPasarela.TARJETA]: 'Tarjeta',
            [TipoPasarela.TRANSFERENCIA]: 'Transferencia',
            [TipoPasarela.WALLET_DIGITAL]: 'Billetera Digital',
            [TipoPasarela.EFECTIVO]: 'Efectivo',
            [TipoPasarela.CRIPTOMONEDA]: 'Criptomoneda',
            [TipoPasarela.BNPL]: 'Compra Ahora, Paga Después',
            [TipoPasarela.OTRO]: 'Otro'
        };
        return mapa[tipo] || tipo;
    }

    obtenerModoTexto(modo: ModoIntegracion): string {
        const mapa: Record<ModoIntegracion, string> = {
            [ModoIntegracion.API]: 'API Directa',
            [ModoIntegracion.REDIRECT]: 'Redirección',
            [ModoIntegracion.IFRAME]: 'iFrame',
            [ModoIntegracion.SDK]: 'SDK',
            [ModoIntegracion.WEBHOOK]: 'Webhook'
        };
        return mapa[modo] || modo;
    }

    obtenerIconoTipo(tipo: TipoPasarela): string {
        const mapa: Record<TipoPasarela, string> = {
            [TipoPasarela.TARJETA]: 'bi-credit-card-2-front',
            [TipoPasarela.TRANSFERENCIA]: 'bi-bank',
            [TipoPasarela.WALLET_DIGITAL]: 'bi-wallet2',
            [TipoPasarela.EFECTIVO]: 'bi-cash-stack',
            [TipoPasarela.CRIPTOMONEDA]: 'bi-currency-bitcoin',
            [TipoPasarela.BNPL]: 'bi-calendar2-check',
            [TipoPasarela.OTRO]: 'bi-three-dots'
        };
        return mapa[tipo] || 'bi-question-circle';
    }

    formatearMonto(monto: number): string {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto);
    }
}
