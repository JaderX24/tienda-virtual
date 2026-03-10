import { generarLayoutBase } from './base.plantilla';

export interface DatosCodigo2FA {
    nombre: string;
    codigo: string;
    minutosExpiracion: number;
}

export function generarPlantillaCodigo2FA(datos: DatosCodigo2FA, nombreApp: string): string {
    const contenido = `
        <tr>
            <td style="background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); padding: 35px 40px; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">
                    🔐 Código de verificación
                </h1>
                <p style="color: #cfe2ff; margin: 8px 0 0; font-size: 14px;">
                    Autenticación de dos factores - ${nombreApp}
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 35px 40px;">
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                    Hola <strong>${datos.nombre}</strong>,
                </p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                    Tu código de verificación para iniciar sesión es:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #0d6efd; border-radius: 12px; padding: 20px 40px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0d6efd; font-family: 'Courier New', monospace;">
                            ${datos.codigo}
                        </span>
                    </div>
                </div>
                <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0 0 25px;">
                    Este código expira en <strong>${datos.minutosExpiracion} minutos</strong>.
                </p>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 0 6px 6px 0; margin: 20px 0;">
                    <p style="color: #92400e; font-size: 13px; margin: 0;">
                        <strong>⚠️ Importante:</strong> Si no solicitaste este código, alguien podría estar intentando acceder a tu cuenta. Cambia tu contraseña inmediatamente.
                    </p>
                </div>
            </td>
        </tr>`;

    return generarLayoutBase(contenido, nombreApp);
}
