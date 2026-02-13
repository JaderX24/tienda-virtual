import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoTiendaDto {
    @ApiProperty({ description: 'Estado activa de la tienda' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activa!: boolean;
}
