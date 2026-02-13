import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoPasarelaDto {
    @ApiProperty({ description: 'Estado activo de la pasarela' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    esActivo!: boolean;
}
