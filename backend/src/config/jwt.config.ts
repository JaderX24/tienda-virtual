import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
    // Admin
    adminAccessSecret: process.env.JWT_ADMIN_ACCESS_SECRET,
    adminAccessExpiracion: process.env.JWT_ADMIN_ACCESS_EXPIRACION,
    adminRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET,
    adminRefreshExpiracion: process.env.JWT_ADMIN_REFRESH_EXPIRACION,

    // Colaboradores
    colabAccessSecret: process.env.JWT_COLAB_ACCESS_SECRET,
    colabAccessExpiracion: process.env.JWT_COLAB_ACCESS_EXPIRACION,
    colabRefreshSecret: process.env.JWT_COLAB_REFRESH_SECRET,
    colabRefreshExpiracion: process.env.JWT_COLAB_REFRESH_EXPIRACION,
}));
