import * as crypto from 'crypto';

/**
 * Genera un hash SHA-256 de un token para almacenamiento seguro.
 * Nunca almacenar tokens en texto plano en la base de datos.
 */
export function hashearToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}
