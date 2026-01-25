import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParsearIdPipe implements PipeTransform<string, number> {
    transform(valor: string): number {
        const id = parseInt(valor, 10);

        if (isNaN(id) || id < 1) {
            throw new BadRequestException('El ID debe ser un número entero positivo');
        }

        return id;
    }
}
