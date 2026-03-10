import { registerAs } from '@nestjs/config';

export default registerAs('correo', () => ({
    host: process.env.SMTP_HOST,
    puerto: parseInt(process.env.SMTP_PUERTO!, 10),
    seguro: process.env.SMTP_SEGURO === 'true',
    usuario: process.env.SMTP_USUARIO,
    contrasena: process.env.SMTP_CONTRASENA,
    remitente: process.env.SMTP_REMITENTE,
}));
