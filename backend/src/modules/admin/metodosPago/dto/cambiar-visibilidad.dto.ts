import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarVisibilidadPasarelaDto {
    @ApiProperty({ description: 'Visibilidad de la pasarela para el cliente' })
    @IsBoolean({ message: 'La visibilidad debe ser verdadero o falso' })
    esVisibleCliente!: boolean;
}
