import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizarHtmlPipe implements PipeTransform {
    transform(valor: unknown): unknown {
        if (typeof valor === 'string') {
            return sanitizeHtml(valor, {
                allowedTags: [],
                allowedAttributes: {},
            });
        }

        if (typeof valor === 'object' && valor !== null) {
            return this.sanitizarObjeto(valor as Record<string, unknown>);
        }

        return valor;
    }

    private sanitizarObjeto(obj: Record<string, unknown>): Record<string, unknown> {
        const resultado: Record<string, unknown> = {};

        for (const [clave, valor] of Object.entries(obj)) {
            if (typeof valor === 'string') {
                resultado[clave] = sanitizeHtml(valor, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
            } else if (typeof valor === 'object' && valor !== null) {
                resultado[clave] = this.sanitizarObjeto(valor as Record<string, unknown>);
            } else {
                resultado[clave] = valor;
            }
        }

        return resultado;
    }
}
