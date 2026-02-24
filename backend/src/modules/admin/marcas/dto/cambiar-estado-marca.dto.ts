import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoMarcaDto {
    @ApiProperty({ description: 'Estado activo de la marca' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activa!: boolean;
}
