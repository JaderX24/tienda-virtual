import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { PrismaService } from '../../../prisma/prisma.service';
import { CorreoColaboradorService, ParametrosSeguridadService, CLAVES_PARAMETRO } from '../../../common/services';

// Almacén temporal de códigos por correo (en memoria, por usuario)
interface CodigoTemporal {
    codigo: string;
    expiraEn: Date;
    intentos: number;
}

@Injectable()
export class DobleFactorService {
    private readonly logger = new Logger(DobleFactorService.name);
    private codigosTemporales: Map<number, CodigoTemporal> = new Map();

    constructor(
        private prisma: PrismaService,
        private correoService: CorreoColaboradorService,
        private parametrosSeguridad: ParametrosSeguridadService,
    ) {}

    // Generar secreto TOTP para app autenticadora
    generarSecretoApp(): { secreto: string; otpauthUrl: string } {
        const secreto = generateSecret();
        const otpauthUrl = generateURI({
            secret: secreto,
            issuer: 'TiendaVirtual',
            label: 'colaborador',
        });
        return { secreto, otpauthUrl };
    }

    // Generar imagen QR como Data URL
    async generarCodigoQR(otpauthUrl: string): Promise<string> {
        return QRCode.toDataURL(otpauthUrl, {
            width: 256,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
        });
    }

    // Verificar código TOTP de app autenticadora
    verificarCodigoApp(secreto: string, codigo: string): boolean {
        const resultado = verifySync({ token: codigo, secret: secreto });
        return resultado.valid;
    }

    // Generar y enviar código por correo electrónico
    async enviarCodigoCorreo(usuarioId: number, correo: string, nombre: string): Promise<boolean> {
        const codigoLongitud = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.CODIGO_2FA_LONGITUD);
        const codigoExpiracionMinutos = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.CODIGO_2FA_EXPIRACION_MINUTOS);

        const codigo = this.generarCodigoNumerico(codigoLongitud);

        this.codigosTemporales.set(usuarioId, {
            codigo: this.hashearCodigo(codigo),
            expiraEn: new Date(Date.now() + codigoExpiracionMinutos * 60 * 1000),
            intentos: 0,
        });

        const enviado = await this.correoService.enviarCodigo2FA(correo, {
            nombre,
            codigo,
            minutosExpiracion: codigoExpiracionMinutos,
        });

        if (!enviado) {
            this.logger.error(`Error al enviar código 2FA a ${correo}`);
            this.codigosTemporales.delete(usuarioId);
        }

        return enviado;
    }

    // Verificar código enviado por correo
    async verificarCodigoCorreo(usuarioId: number, codigo: string): Promise<boolean> {
        const registro = this.codigosTemporales.get(usuarioId);

        if (!registro) return false;

        if (new Date() > registro.expiraEn) {
            this.codigosTemporales.delete(usuarioId);
            return false;
        }

        const intentosMaximos2FA = await this.parametrosSeguridad.obtenerNumero(CLAVES_PARAMETRO.INTENTOS_MAXIMOS_2FA);
        if (registro.intentos >= intentosMaximos2FA) {
            this.codigosTemporales.delete(usuarioId);
            return false;
        }

        registro.intentos += 1;

        const codigoHasheado = this.hashearCodigo(codigo);
        if (codigoHasheado !== registro.codigo) {
            return false;
        }

        this.codigosTemporales.delete(usuarioId);
        return true;
    }

    //  Activar 2FA para un usuario
    async activar2FA(
        usuarioId: number,
        metodo: 'correo' | 'app',
        secreto?: string,
    ): Promise<void> {
        const datos: Record<string, any> = {
            requiere2fa: true,
            metodo2fa: metodo,
        };

        if (metodo === 'app' && secreto) {
            datos.secreto2fa = secreto;
        }

        await this.prisma.colabUsuario.update({
            where: { id: usuarioId },
            data: datos,
        });
    }

    // Desactivar 2FA para un usuario
    async desactivar2FA(usuarioId: number): Promise<void> {
        await this.prisma.colabUsuario.update({
            where: { id: usuarioId },
            data: {
                requiere2fa: false,
                secreto2fa: null,
                metodo2fa: 'ninguno',
            },
        });
    }

    // Obtener información 2FA del usuario
    async obtenerEstado2FA(usuarioId: number) {
        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { id: usuarioId },
            select: {
                requiere2fa: true,
                metodo2fa: true,
                secreto2fa: true,
            },
        });
        return usuario;
    }

    private generarCodigoNumerico(longitud: number): string {
        const buffer = crypto.randomBytes(4);
        const modulo = Math.pow(10, longitud);
        const numero = buffer.readUInt32BE(0) % modulo;
        return numero.toString().padStart(longitud, '0');
    }

    private hashearCodigo(codigo: string): string {
        return crypto.createHash('sha256').update(codigo).digest('hex');
    }
}
