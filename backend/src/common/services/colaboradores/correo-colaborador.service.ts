import { Injectable, Logger } from '@nestjs/common';
import { CorreoService } from '../global/correo.service';
import {
    DatosBienvenidaUsuario,
    generarPlantillaBienvenidaColaborador,
} from '../plantillas/bienvenida.plantilla';
import {
    DatosCodigo2FA,
    generarPlantillaCodigo2FA,
} from '../plantillas/codigo-2fa.plantilla';

export { DatosBienvenidaUsuario as DatosBienvenidaColaborador };

@Injectable()
export class CorreoColaboradorService {
    private readonly logger = new Logger(CorreoColaboradorService.name);

    constructor(private readonly correoService: CorreoService) {}

    async enviarBienvenidaColaborador(datos: DatosBienvenidaUsuario): Promise<boolean> {
        const html = generarPlantillaBienvenidaColaborador(datos, this.correoService.nombreApp);

        return this.correoService.enviar({
            destinatario: datos.correo,
            asunto: `Bienvenido(a) al equipo de ${this.correoService.nombreApp} - Credenciales de acceso`,
            html,
        });
    }

    async enviarCodigo2FA(correo: string, datos: DatosCodigo2FA): Promise<boolean> {
        const html = generarPlantillaCodigo2FA(datos, this.correoService.nombreApp);

        return this.correoService.enviar({
            destinatario: correo,
            asunto: `Código de verificación - ${this.correoService.nombreApp}`,
            html,
        });
    }
}
