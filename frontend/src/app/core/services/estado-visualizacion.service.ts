import { Injectable, inject } from '@angular/core';
import { IdiomaService } from './idioma.service';

interface ConfigEstado {
    clase: string;
    icono: string;
    etiqueta: string;
}

@Injectable({ providedIn: 'root' })
export class EstadoVisualizacionService {
    private idiomaService = inject(IdiomaService);

    private configuracion: Record<string, Record<string, ConfigEstado>> = {
        transferencia: {
            pendiente: { clase: 'bg-warning text-dark', icono: 'bi-clock', etiqueta: 'comun.pendiente' },
            en_transito: { clase: 'bg-info', icono: 'bi-truck', etiqueta: 'etiqueta.enTransito' },
            completada: { clase: 'bg-success', icono: 'bi-check-circle', etiqueta: 'comun.completada' },
            cancelada: { clase: 'bg-danger', icono: 'bi-x-circle', etiqueta: 'comun.cancelada' },
        },
        conteo: {
            programado: { clase: 'bg-primary', icono: 'bi-calendar-check', etiqueta: 'etiqueta.programado' },
            en_progreso: { clase: 'bg-warning text-dark', icono: 'bi-arrow-repeat', etiqueta: 'etiqueta.enProgresoLabel' },
            completado: { clase: 'bg-success', icono: 'bi-check-circle', etiqueta: 'etiqueta.completado' },
            aprobado: { clase: 'bg-info', icono: 'bi-hand-thumbs-up', etiqueta: 'etiqueta.aprobado' },
            rechazado: { clase: 'bg-danger', icono: 'bi-x-octagon', etiqueta: 'etiqueta.rechazado' },
            cancelado: { clase: 'bg-secondary', icono: 'bi-slash-circle', etiqueta: 'etiqueta.cancelado' },
        },
        turno: {
            programado: { clase: 'bg-primary', icono: 'bi-calendar', etiqueta: 'comun.programado' },
            en_curso: { clase: 'bg-success', icono: 'bi-play-circle', etiqueta: 'etiqueta.enCurso' },
            finalizado: { clase: 'bg-secondary', icono: 'bi-stop-circle', etiqueta: 'etiqueta.finalizado' },
        },
        puntualidad: {
            anticipado: { clase: 'text-info', icono: 'bi-arrow-up-circle', etiqueta: 'etiqueta.anticipado' },
            puntual: { clase: 'text-success', icono: 'bi-check-circle', etiqueta: 'etiqueta.puntual' },
            leve_retraso: { clase: 'text-warning', icono: 'bi-exclamation-circle', etiqueta: 'etiqueta.leveRetraso' },
            retraso: { clase: 'text-danger', icono: 'bi-x-circle', etiqueta: 'etiqueta.retraso' },
            pendiente: { clase: 'text-muted', icono: 'bi-clock', etiqueta: 'comun.pendiente' },
        },
        tipo_operacion: {
            entrada: { clase: 'bg-success', icono: 'bi-box-arrow-in-down', etiqueta: 'reportes.entrada' },
            salida: { clase: 'bg-danger', icono: 'bi-box-arrow-up', etiqueta: 'reportes.salida' },
            ajuste_positivo: { clase: 'bg-info', icono: 'bi-plus-circle', etiqueta: 'reportes.ajusteMas' },
            ajuste_negativo: { clase: 'bg-warning text-dark', icono: 'bi-dash-circle', etiqueta: 'reportes.ajusteMenos' },
            transf_salida: { clase: 'bg-primary', icono: 'bi-arrow-left-right', etiqueta: 'etiqueta.transfSalida' },
            transf_entrada: { clase: 'bg-primary', icono: 'bi-arrow-left-right', etiqueta: 'etiqueta.transfEntrada' },
            conteo: { clase: 'bg-secondary', icono: 'bi-clipboard-data', etiqueta: 'actividad.conteo' },
            recepcion: { clase: 'bg-success', icono: 'bi-box-arrow-in-down', etiqueta: 'reportes.recepcion' },
            despacho: { clase: 'bg-info', icono: 'bi-truck', etiqueta: 'reportes.despacho' },
        },
        tipo_movimiento: {
            entrada: { clase: 'bg-success', icono: 'bi-box-arrow-in-down', etiqueta: 'reportes.entrada' },
            salida: { clase: 'bg-danger', icono: 'bi-box-arrow-up', etiqueta: 'reportes.salida' },
            ajuste_positivo: { clase: 'bg-info', icono: 'bi-plus-circle', etiqueta: 'reportes.ajusteMas' },
            ajuste_negativo: { clase: 'bg-warning text-dark', icono: 'bi-dash-circle', etiqueta: 'reportes.ajusteMenos' },
            transferencia: { clase: 'bg-primary', icono: 'bi-arrow-left-right', etiqueta: 'etiqueta.transferencia' },
        },
        stock: {
            disponible: { clase: 'bg-success', icono: 'bi-check-circle', etiqueta: 'etiqueta.disponible' },
            bajo: { clase: 'bg-warning text-dark', icono: 'bi-exclamation-triangle', etiqueta: 'productos.stockBajo' },
            agotado: { clase: 'bg-danger', icono: 'bi-x-circle', etiqueta: 'reportes.agotado' },
        },
        severidad: {
            info: { clase: 'bg-info', icono: 'bi-info-circle', etiqueta: 'comun.informacion' },
            warning: { clase: 'bg-warning text-dark', icono: 'bi-exclamation-triangle', etiqueta: 'comun.advertencia' },
            error: { clase: 'bg-danger', icono: 'bi-exclamation-circle', etiqueta: 'comun.error' },
            critical: { clase: 'bg-danger', icono: 'bi-x-octagon', etiqueta: 'comun.critico' },
        },
        notificacion: {
            info: { clase: 'bg-info', icono: 'bi-info-circle', etiqueta: 'notif.informacion' },
            success: { clase: 'bg-success', icono: 'bi-check-circle', etiqueta: 'notif.exito' },
            warning: { clase: 'bg-warning text-dark', icono: 'bi-exclamation-triangle', etiqueta: 'notif.advertencia' },
            danger: { clase: 'bg-danger', icono: 'bi-exclamation-circle', etiqueta: 'notif.importante' },
            sistema: { clase: 'bg-dark', icono: 'bi-gear', etiqueta: 'notif.sistema' },
        },
        tienda: {
            activa: { clase: 'bg-success', icono: 'bi-check-circle-fill', etiqueta: 'comun.activa' },
            inactiva: { clase: 'bg-secondary', icono: 'bi-x-circle-fill', etiqueta: 'comun.inactiva' },
            en_construccion: { clase: 'bg-warning text-dark', icono: 'bi-tools', etiqueta: 'comun.enConstruccion' },
            mantenimiento: { clase: 'bg-info', icono: 'bi-gear-fill', etiqueta: 'comun.mantenimiento' },
            cerrada_temporal: { clase: 'bg-danger', icono: 'bi-pause-circle-fill', etiqueta: 'comun.cerrada' },
        },
        activo_inactivo: {
            true: { clase: 'badge-estado activo', icono: 'bi-check-circle-fill', etiqueta: 'comun.activo' },
            false: { clase: 'badge-estado inactivo', icono: 'bi-x-circle-fill', etiqueta: 'comun.inactivo' },
        },
        tienda_badge: {
            activa: { clase: 'badge-estado activo', icono: 'bi-check-circle-fill', etiqueta: 'comun.activa' },
            inactiva: { clase: 'badge-estado inactivo', icono: 'bi-x-circle-fill', etiqueta: 'comun.inactiva' },
            en_construccion: { clase: 'badge-estado construccion', icono: 'bi-tools', etiqueta: 'comun.enConstruccion' },
            mantenimiento: { clase: 'badge-estado mantenimiento', icono: 'bi-gear-fill', etiqueta: 'comun.mantenimiento' },
            cerrada_temporal: { clase: 'badge-estado cerrada', icono: 'bi-pause-circle-fill', etiqueta: 'comun.cerrada' },
        },
        plan_suscripcion: {
            basico: { clase: '#6c757d', icono: 'bi-star', etiqueta: 'comun.basico' },
            profesional: { clase: '#0d6efd', icono: 'bi-star-fill', etiqueta: 'comun.profesional' },
            empresarial: { clase: '#198754', icono: 'bi-award', etiqueta: 'comun.empresarial' },
            premium: { clase: '#dc3545', icono: 'bi-gem', etiqueta: 'comun.premium' },
        },
        origen_timeline: {
            bitacora: { clase: 'timeline-bitacora', icono: 'bi-journal-text', etiqueta: 'actividad.bitacora' },
            inventario: { clase: 'timeline-inventario', icono: 'bi-boxes', etiqueta: 'actividad.inventario' },
            conteo: { clase: 'timeline-conteo', icono: 'bi-clipboard-check', etiqueta: 'actividad.conteo' },
        },
        tipo_notificacion: {
            info: { clase: 'icono-info', icono: 'bi-info-circle', etiqueta: 'notif.informacion' },
            success: { clase: 'icono-success', icono: 'bi-check-circle', etiqueta: 'notif.exito' },
            warning: { clase: 'icono-warning', icono: 'bi-exclamation-triangle', etiqueta: 'notif.advertencia' },
            danger: { clase: 'icono-danger', icono: 'bi-exclamation-circle', etiqueta: 'notif.importante' },
            sistema: { clase: 'icono-sistema', icono: 'bi-gear', etiqueta: 'notif.sistema' },
        },
        tipo_proveedor_envio: {
            interno: { clase: '', icono: 'bi-building-fill', etiqueta: 'comun.interno' },
            externo: { clase: '', icono: 'bi-box-seam', etiqueta: 'comun.externo' },
            freelance: { clase: '', icono: 'bi-person-badge', etiqueta: 'comun.freelance' },
            empresa_courier: { clase: '', icono: 'bi-truck', etiqueta: 'comun.empresaCourier' },
        },
        tipo_servicio_envio: {
            local: { clase: '', icono: 'bi-geo-alt', etiqueta: 'comun.local' },
            nacional: { clase: '', icono: 'bi-map', etiqueta: 'comun.nacional' },
            internacional: { clase: '', icono: 'bi-globe-americas', etiqueta: 'comun.internacional' },
            express: { clase: '', icono: 'bi-lightning-charge', etiqueta: 'comun.express' },
            standard: { clase: '', icono: 'bi-clock', etiqueta: 'comun.standard' },
            economico: { clase: '', icono: 'bi-piggy-bank', etiqueta: 'comun.economico' },
        },
        tipo_pasarela: {
            tarjeta: { clase: '', icono: 'bi-credit-card-2-front', etiqueta: 'comun.tarjeta' },
            transferencia: { clase: '', icono: 'bi-bank', etiqueta: 'comun.transferencia' },
            wallet_digital: { clase: '', icono: 'bi-wallet2', etiqueta: 'comun.walletDigital' },
            efectivo: { clase: '', icono: 'bi-cash-stack', etiqueta: 'comun.efectivo' },
            criptomoneda: { clase: '', icono: 'bi-currency-bitcoin', etiqueta: 'comun.criptomoneda' },
            bnpl: { clase: '', icono: 'bi-calendar2-check', etiqueta: 'comun.bnpl' },
            otro: { clase: '', icono: 'bi-three-dots', etiqueta: 'comun.otro' },
        },
        tipo_parametro: {
            texto: { clase: '', icono: 'bi-fonts', etiqueta: 'comun.texto' },
            numero: { clase: '', icono: 'bi-123', etiqueta: 'comun.numero' },
            booleano: { clase: '', icono: 'bi-toggle-on', etiqueta: 'comun.booleano' },
            json: { clase: '', icono: 'bi-braces', etiqueta: 'comun.json' },
        },
        categoria_parametro: {
            seguridad: { clase: '', icono: 'bi-shield-lock', etiqueta: 'comun.seguridad' },
            archivos: { clase: '', icono: 'bi-folder', etiqueta: 'comun.archivos' },
            sistema: { clase: '', icono: 'bi-gear', etiqueta: 'comun.sistema' },
            correo: { clase: '', icono: 'bi-envelope', etiqueta: 'comun.correo' },
            pago: { clase: '', icono: 'bi-credit-card', etiqueta: 'comun.pago' },
            notificaciones: { clase: '', icono: 'bi-bell', etiqueta: 'comun.notificaciones' },
            apariencia: { clase: '', icono: 'bi-palette', etiqueta: 'comun.apariencia' },
        },
    };

    obtenerClase(dominio: string, estado: string): string {
        return this.configuracion[dominio]?.[estado]?.clase ?? 'bg-secondary';
    }

    obtenerEtiqueta(dominio: string, estado: string): string {
        const config = this.configuracion[dominio]?.[estado];
        if (!config) return estado;
        return this.idiomaService.t(config.etiqueta);
    }

    obtenerIcono(dominio: string, estado: string): string {
        return this.configuracion[dominio]?.[estado]?.icono ?? 'bi-circle';
    }
}
