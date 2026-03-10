import { generarLayoutBase } from './base.plantilla';

export interface DatosBienvenidaUsuario {
    nombre: string;
    correo: string;
    contrasena: string;
    nombreRol?: string;
    urlAcceso: string;
}

export function generarPlantillaBienvenidaAdmin(
    datos: DatosBienvenidaUsuario,
    nombreApp: string,
): string {
    const contenido = `
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                                ${nombreApp}
                            </h1>
                            <p style="color: #dbeafe; margin: 5px 0 0 0; font-size: 14px;">
                                Panel de Administración
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">
                                ¡Bienvenido(a), ${datos.nombre}!
                            </h2>
                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                Se ha creado tu cuenta de usuario en el sistema de administración.
                                A continuación encontrarás tus credenciales de acceso:
                            </p>
                            ${generarBloqueCrendenciales(datos)}
                            ${generarBotonAcceso(datos.urlAcceso)}
                            ${generarAvisoSeguridad()}
                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador del sistema.
                            </p>
                        </td>
                    </tr>`;

    return generarLayoutBase(contenido, nombreApp);
}

export function generarPlantillaBienvenidaColaborador(
    datos: DatosBienvenidaUsuario,
    nombreApp: string,
): string {
    const contenido = `
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                                ${nombreApp}
                            </h1>
                            <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 14px;">
                                Portal de Colaboradores
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">
                                ¡Bienvenido(a) al equipo, ${datos.nombre}!
                            </h2>
                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                Se ha creado tu cuenta de colaborador. Aquí encontrarás tus credenciales para acceder al portal:
                            </p>
                            ${generarBloqueCrendenciales(datos)}
                            ${generarBotonAcceso(datos.urlAcceso, '#10b981', '#059669')}
                            ${generarAvisoSeguridad()}
                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                                Si necesitas ayuda, contacta a tu supervisor o al administrador del sistema.
                            </p>
                        </td>
                    </tr>`;

    return generarLayoutBase(contenido, nombreApp);
}

function generarBloqueCrendenciales(datos: DatosBienvenidaUsuario): string {
    return `
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
                            </table>`;
}

function generarBotonAcceso(
    url: string,
    colorInicio = '#3b82f6',
    colorFin = '#1d4ed8',
): string {
    return `
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 10px 0 25px 0;">
                                        <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, ${colorInicio} 0%, ${colorFin} 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 15px;">
                                            Acceder al Sistema
                                        </a>
                                    </td>
                                </tr>
                            </table>`;
}

function generarAvisoSeguridad(): string {
    return `
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 0 6px 6px 0; margin-bottom: 25px;">
                                <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">
                                    ⚠️ Importante - Seguridad
                                </p>
                                <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5; margin: 0;">
                                    Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.
                                    No compartas estas credenciales con nadie.
                                </p>
                            </div>`;
}
