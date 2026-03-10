import { Injectable, Logger } from '@nestjs/common';
import { CorreoService } from '../global/correo.service';
import {
    DatosBienvenidaUsuario,
    generarPlantillaBienvenidaAdmin,
} from '../plantillas/bienvenida.plantilla';

export { DatosBienvenidaUsuario };

@Injectable()
export class CorreoAdminService {
    private readonly logger = new Logger(CorreoAdminService.name);

    constructor(private readonly correoService: CorreoService) {}

    async enviarBienvenidaUsuario(datos: DatosBienvenidaUsuario): Promise<boolean> {
        const html = generarPlantillaBienvenidaAdmin(datos, this.correoService.nombreApp);

        return this.correoService.enviar({
            destinatario: datos.correo,
            asunto: `Bienvenido(a) a ${this.correoService.nombreApp} - Credenciales de acceso`,
            html,
        });
    }
}
