import {
    PipeTransform,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ArchivoSubido {
    mimetype: string;
    size: number;
    originalname: string;
}

@Injectable()
export class ValidarArchivoPipe implements PipeTransform {
    private readonly tamanoMaximo: number;
    private readonly tiposPermitidos: string[];

    constructor(private readonly configService: ConfigService) {
        this.tamanoMaximo = this.configService.get<number>('archivos.tamanoMaximo') || 5242880;
        const tipos = this.configService.get<string>('archivos.tiposPermitidos') || 'image/jpeg,image/png,image/webp';
        this.tiposPermitidos = tipos.split(',').map((t: string) => t.trim());
    }

    transform(archivo: ArchivoSubido): ArchivoSubido {
        if (!archivo) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        if (!this.tiposPermitidos.includes(archivo.mimetype)) {
            throw new BadRequestException(
                `Tipo de archivo no permitido: ${archivo.mimetype}. Tipos aceptados: ${this.tiposPermitidos.join(', ')}`,
            );
        }

        if (archivo.size > this.tamanoMaximo) {
            const tamanoMb = (this.tamanoMaximo / (1024 * 1024)).toFixed(1);
            throw new BadRequestException(
                `El archivo excede el tamaño máximo permitido (${tamanoMb} MB)`,
            );
        }

        const extensionesSeguras = /\.(jpg|jpeg|png|webp|gif|pdf|svg)$/i;
        if (!extensionesSeguras.test(archivo.originalname)) {
            throw new BadRequestException('Extensión de archivo no permitida');
        }

        return archivo;
    }
}
