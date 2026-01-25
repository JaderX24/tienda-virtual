import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiracion: process.env.JWT_ACCESS_EXPIRACION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiracion: process.env.JWT_REFRESH_EXPIRACION || '7d',
}));
