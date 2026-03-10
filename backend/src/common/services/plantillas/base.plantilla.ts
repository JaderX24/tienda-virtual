// Layout HTML base reutilizable para todos los correos
export function generarLayoutBase(contenido: string, nombreApp: string): string {
    const anio = new Date().getFullYear();
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
    <title>${nombreApp}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ${contenido}
                    <tr>
                        <td style="background-color: #f8fafc; padding: 25px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
                                Este correo fue enviado el ${fechaActual}.<br>
                                &copy; ${anio} ${nombreApp}. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}
