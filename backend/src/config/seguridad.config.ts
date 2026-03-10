import { registerAs } from '@nestjs/config';

export default registerAs('seguridad', () => ({
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL!, 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX!, 10),
    corsOrigen: process.env.CORS_ORIGEN,
    cookieSegura: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: process.env.COOKIE_SAMESITE,
}));
