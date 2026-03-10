import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Claves de parametro_sistema — solo identificadores, los valores viven en BD
export const CLAVES_PARAMETRO = {
    INTENTOS_MAXIMOS_LOGIN: 'INTENTOS_MAXIMOS_LOGIN',
    TIEMPO_BLOQUEO_MINUTOS: 'TIEMPO_BLOQUEO_MINUTOS',
    MAXIMO_SESIONES_USUARIO: 'MAXIMO_SESIONES_USUARIO',
    LONGITUD_MINIMA_CONTRASENA: 'LONGITUD_MINIMA_CONTRASENA',
    LONGITUD_MAXIMA_CONTRASENA: 'LONGITUD_MAXIMA_CONTRASENA',
    REQUIERE_MAYUSCULA: 'REQUIERE_MAYUSCULA',
    REQUIERE_MINUSCULA: 'REQUIERE_MINUSCULA',
    REQUIERE_NUMERO: 'REQUIERE_NUMERO',
    REQUIERE_CARACTER_ESPECIAL: 'REQUIERE_CARACTER_ESPECIAL',
    HISTORIAL_CONTRASENA_CANTIDAD: 'HISTORIAL_CONTRASENA_CANTIDAD',
    BCRYPT_SALT_ROUNDS: 'BCRYPT_SALT_ROUNDS',
    CODIGO_2FA_LONGITUD: 'CODIGO_2FA_LONGITUD',
    CODIGO_2FA_EXPIRACION_MINUTOS: 'CODIGO_2FA_EXPIRACION_MINUTOS',
    TOKEN_2FA_EXPIRACION_MINUTOS: 'TOKEN_2FA_EXPIRACION_MINUTOS',
    INTENTOS_MAXIMOS_2FA: 'INTENTOS_MAXIMOS_2FA',
    TURNO_TOLERANCIA_MINUTOS: 'TURNO_TOLERANCIA_MINUTOS',
    LONGITUD_CONTRASENA_GENERACION: 'LONGITUD_CONTRASENA_GENERACION',
} as const;

interface CacheParametro {
    valor: string;
    expiraEn: Date;
}

// TTL del caché en milisegundos (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

@Injectable()
export class ParametrosSeguridadService {
    private readonly logger = new Logger(ParametrosSeguridadService.name);
    private cache: Map<string, CacheParametro> = new Map();

    constructor(private prisma: PrismaService) {}

    async obtenerNumero(clave: string): Promise<number> {
        const valor = await this.obtenerValor(clave);
        const numero = parseInt(valor, 10);

        if (isNaN(numero)) {
            this.logger.error(`Parámetro '${clave}' no es numérico o no existe en BD. Valor: '${valor}'`);
            return 0;
        }

        return numero;
    }

    async obtenerBooleano(clave: string): Promise<boolean> {
        const valor = await this.obtenerValor(clave);
        return valor === 'true';
    }

    async obtenerValor(clave: string): Promise<string> {
        const cacheado = this.cache.get(clave);
        if (cacheado && new Date() < cacheado.expiraEn) {
            return cacheado.valor;
        }

        try {
            const parametro = await this.prisma.parametroSistema.findUnique({
                where: { clave },
                select: { valor: true },
            });

            if (!parametro) {
                this.logger.warn(`Parámetro '${clave}' no encontrado en tabla parametros_sistema. Ejecute la inicialización de parámetros.`);
                return '';
            }

            this.cache.set(clave, {
                valor: parametro.valor,
                expiraEn: new Date(Date.now() + CACHE_TTL),
            });

            return parametro.valor;
        } catch (error) {
            this.logger.error(`Error al consultar parámetro '${clave}' en BD: ${error}`);
            return '';
        }
    }

    async validarContrasena(contrasena: string): Promise<{ valida: boolean; errores: string[] }> {
        const errores: string[] = [];

        const longitudMinima = await this.obtenerNumero(CLAVES_PARAMETRO.LONGITUD_MINIMA_CONTRASENA);
        if (longitudMinima > 0 && contrasena.length < longitudMinima) {
            errores.push(`La contraseña debe tener al menos ${longitudMinima} caracteres`);
        }

        const longitudMaxima = await this.obtenerNumero(CLAVES_PARAMETRO.LONGITUD_MAXIMA_CONTRASENA);
        if (longitudMaxima > 0 && contrasena.length > longitudMaxima) {
            errores.push(`La contraseña no debe exceder ${longitudMaxima} caracteres`);
        }

        if (await this.obtenerBooleano(CLAVES_PARAMETRO.REQUIERE_MAYUSCULA)) {
            if (!/[A-Z]/.test(contrasena)) {
                errores.push('Debe contener al menos una mayúscula');
            }
        }

        if (await this.obtenerBooleano(CLAVES_PARAMETRO.REQUIERE_MINUSCULA)) {
            if (!/[a-z]/.test(contrasena)) {
                errores.push('Debe contener al menos una minúscula');
            }
        }

        if (await this.obtenerBooleano(CLAVES_PARAMETRO.REQUIERE_NUMERO)) {
            if (!/[0-9]/.test(contrasena)) {
                errores.push('Debe contener al menos un número');
            }
        }

        if (await this.obtenerBooleano(CLAVES_PARAMETRO.REQUIERE_CARACTER_ESPECIAL)) {
            if (!/[!@#$%^&*()_+\-=]/.test(contrasena)) {
                errores.push('Debe contener al menos un carácter especial (!@#$%^&*()_+-=)');
            }
        }

        return { valida: errores.length === 0, errores };
    }

    limpiarCache(): void {
        this.cache.clear();
    }
}
