import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
@ValidatorConstraint({ async: true, name: 'esCatalogoValido' })
export class EsCatalogoValidoConstraint implements ValidatorConstraintInterface {
    private cache = new Map<string, { valores: Set<string>; expira: number }>();
    private readonly TTL_MS = 5 * 60 * 1000;

    constructor(private readonly prisma: PrismaService) {}

    async validate(valor: string, args: ValidationArguments): Promise<boolean> {
        if (!valor) return true;

        const [grupo] = args.constraints;
        const valores = await this.obtenerValoresGrupo(grupo);
        return valores.has(valor);
    }

    defaultMessage(args: ValidationArguments): string {
        const [grupo] = args.constraints;
        return `El valor '$value' no es válido para el catálogo '${grupo}'`;
    }

    private async obtenerValoresGrupo(grupo: string): Promise<Set<string>> {
        const ahora = Date.now();
        const enCache = this.cache.get(grupo);

        if (enCache && enCache.expira > ahora) {
            return enCache.valores;
        }

        const registros = await this.prisma.catalogo.findMany({
            where: { grupo, activo: true },
            select: { valor: true },
        });

        const valores = new Set(registros.map((r) => r.valor));
        this.cache.set(grupo, { valores, expira: ahora + this.TTL_MS });
        return valores;
    }
}

export function EsCatalogoValido(grupo: string, opciones?: ValidationOptions) {
    return function (objeto: object, propiedad: string) {
        registerDecorator({
            target: objeto.constructor,
            propertyName: propiedad,
            options: opciones,
            constraints: [grupo],
            validator: EsCatalogoValidoConstraint,
        });
    };
}
