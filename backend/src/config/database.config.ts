import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    puerto: parseInt(process.env.DB_PUERTO || '3306', 10),
    usuario: process.env.DB_USUARIO,
    contrasena: process.env.DB_CONTRASENA,
    nombre: process.env.DB_NOMBRE || 'tienda_virtual',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
}));
