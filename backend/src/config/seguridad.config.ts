import { registerAs } from '@nestjs/config';

export default registerAs('seguridad', () => ({
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    corsOrigen: process.env.CORS_ORIGEN || 'http://localhost:4200',
    cookieSegura: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
}));
