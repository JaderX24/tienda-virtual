import { registerAs } from '@nestjs/config';

export default registerAs('archivos', () => ({
    directorio: process.env.UPLOAD_DIRECTORIO,
    tamanoMaximo: parseInt(process.env.UPLOAD_TAMANO_MAXIMO!, 10),
    tiposPermitidos: process.env.UPLOAD_TIPOS_PERMITIDOS?.split(',') || [],
}));
