import * as crypto from 'crypto';

const CARACTERES_MAYUSCULAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CARACTERES_MINUSCULAS = 'abcdefghijklmnopqrstuvwxyz';
const CARACTERES_NUMEROS = '0123456789';
const CARACTERES_ESPECIALES = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const LONGITUD_CONTRASENA_DEFAULT = 16;

export function generarContrasenaSegura(longitud: number = LONGITUD_CONTRASENA_DEFAULT): string {
    if (longitud < 12) {
        longitud = 12;
    }

    const todosLosCaracteres = CARACTERES_MAYUSCULAS + CARACTERES_MINUSCULAS + CARACTERES_NUMEROS + CARACTERES_ESPECIALES;
    
    const contrasenaArray: string[] = [];
    
    // Garantizar al menos un carácter de cada tipo
    contrasenaArray.push(obtenerCaracterAleatorio(CARACTERES_MAYUSCULAS));
    contrasenaArray.push(obtenerCaracterAleatorio(CARACTERES_MINUSCULAS));
    contrasenaArray.push(obtenerCaracterAleatorio(CARACTERES_NUMEROS));
    contrasenaArray.push(obtenerCaracterAleatorio(CARACTERES_ESPECIALES));
    
    // Completar el resto de la contraseña
    for (let i = contrasenaArray.length; i < longitud; i++) {
        contrasenaArray.push(obtenerCaracterAleatorio(todosLosCaracteres));
    }
    
    // Mezclar el array para que los caracteres obligatorios no estén siempre al inicio
    return mezclarArray(contrasenaArray).join('');
}

function obtenerCaracterAleatorio(caracteres: string): string {
    const indiceAleatorio = crypto.randomInt(0, caracteres.length);
    return caracteres[indiceAleatorio];
}

function mezclarArray<T>(array: T[]): T[] {
    const resultado = [...array];
    for (let i = resultado.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
    }
    return resultado;
}
