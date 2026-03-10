import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface OpcionesCorreo {
    destinatario: string;
    asunto: string;
    html: string;
    adjuntos?: Array<{
        filename: string;
        content?: Buffer;
        path?: string;
    }>;
}

@Injectable()
export class CorreoService {
    private readonly logger = new Logger(CorreoService.name);
    private transporter: Transporter | null = null;
    readonly remitente: string;
    readonly nombreApp: string;

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

    async enviar(opciones: OpcionesCorreo): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn('No se puede enviar correo: transporter no configurado');
            return false;
        }

        try {
            await this.transporter.sendMail({
                from: this.remitente,
                to: opciones.destinatario,
                subject: opciones.asunto,
                html: opciones.html,
                attachments: opciones.adjuntos,
            });

            this.logger.log(`Correo enviado a: ${opciones.destinatario} (${opciones.asunto})`);
            return true;
        } catch (error) {
            this.logger.error(`Error al enviar correo a ${opciones.destinatario}:`, error);
            return false;
        }
    }

    estaDisponible(): boolean {
        return this.transporter !== null;
    }
}
