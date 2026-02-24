import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoCategoriaDto {
    @ApiProperty({ description: 'Estado activo de la categoría' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activa!: boolean;
}
