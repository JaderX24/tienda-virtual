import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoProductoDto {
    @ApiProperty({ description: 'Estado activo del producto' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activo!: boolean;
}
