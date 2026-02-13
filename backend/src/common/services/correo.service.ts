import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface DatosCorreoBienvenida {
    nombre: string;
    correo: string;
    contrasena: string;
    nombreRol?: string;
    urlAcceso: string;
}

@Injectable()
export class CorreoService {
    private readonly logger = new Logger(CorreoService.name);
    private transporter: Transporter | null = null;
    private readonly remitente: string;
    private readonly nombreApp: string;

    constructor(private configService: ConfigService) {
        this.remitente = this.configService.get<string>('correo.remitente') || 'no-responder@jynops.com';
        this.nombreApp = this.configService.get<string>('app.nombre') || 'JynOps';
        this.inicializarTransporter();
    }

    private inicializarTransporter(): void {
        const host = this.configService.get<string>('correo.host');
        const puerto = this.configService.get<number>('correo.puerto');
        const usuario = this.configService.get<string>('correo.usuario');
        const contrasena = this.configService.get<string>('correo.contrasena');

        if (!host || !usuario || !contrasena) {
            this.logger.warn('Configuración de correo incompleta. El servicio de correo no estará disponible.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host,
            port: puerto || 587,
            secure: this.configService.get<boolean>('correo.seguro') || false,
            auth: {
                user: usuario,
                pass: contrasena,
            },
        });

        this.logger.log('Servicio de correo inicializado correctamente');
    }

    async enviarCorreoBienvenidaUsuario(datos: DatosCorreoBienvenida): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn('No se puede enviar correo: transporter no configurado');
            return false;
        }

        const asunto = `Bienvenido(a) a ${this.nombreApp} - Credenciales de acceso`;
        const html = this.generarPlantillaBienvenida(datos);

        try {
            await this.transporter.sendMail({
                from: this.remitente,
                to: datos.correo,
                subject: asunto,
                html,
            });

            this.logger.log(`Correo de bienvenida enviado a: ${datos.correo}`);
            return true;
        } catch (error) {
            this.logger.error(`Error al enviar correo a ${datos.correo}:`, error);
            return false;
        }
    }

    private generarPlantillaBienvenida(datos: DatosCorreoBienvenida): string {
        const fechaActual = new Date().toLocaleDateString('es-HN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a ${this.nombreApp}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                                ${this.nombreApp}
                            </h1>
                            <p style="color: #dbeafe; margin: 5px 0 0 0; font-size: 14px;">
                                Panel de Administración
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">
                                ¡Bienvenido(a), ${datos.nombre}!
                            </h2>
                            
                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                Se ha creado tu cuenta de usuario en el sistema de administración. 
                                A continuación encontrarás tus credenciales de acceso:
                            </p>
                            
                            <!-- Credentials Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Correo electrónico</span>
                                                    <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 5px 0 0 0;">${datos.correo}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 8px 0; border-top: 1px solid #e2e8f0;">
                                                    <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña temporal</span>
                                                    <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 5px 0 0 0; font-family: 'Courier New', monospace; background-color: #fef3c7; padding: 8px 12px; border-radius: 4px; display: inline-block;">${datos.contrasena}</p>
                                                </td>
                                            </tr>
                                            ${datos.nombreRol ? `
                                            <tr>
                                                <td style="padding: 15px 0 0 0; border-top: 1px solid #e2e8f0;">
                                                    <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Rol asignado</span>
                                                    <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 5px 0 0 0;">${datos.nombreRol}</p>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 10px 0 25px 0;">
                                        <a href="${datos.urlAcceso}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 15px;">
                                            Acceder al Sistema
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Notice -->
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 0 6px 6px 0; margin-bottom: 25px;">
                                <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">
                                    ⚠️ Importante - Seguridad
                                </p>
                                <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5; margin: 0;">
                                    Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión. 
                                    No compartas estas credenciales con nadie.
                                </p>
                            </div>
                            
                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador del sistema.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 25px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
                                Este correo fue enviado el ${fechaActual}.<br>
                                © ${new Date().getFullYear()} ${this.nombreApp}. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }
}
