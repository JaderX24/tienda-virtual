import { registerAs } from '@nestjs/config';

export default registerAs('archivos', () => ({
    directorio: process.env.UPLOAD_DIRECTORIO || './uploads',
    tamanoMaximo: parseInt(process.env.UPLOAD_TAMANO_MAXIMO || '5242880', 10),
    tiposPermitidos: (process.env.UPLOAD_TIPOS_PERMITIDOS || 'image/jpeg,image/png,image/webp').split(','),
}));
