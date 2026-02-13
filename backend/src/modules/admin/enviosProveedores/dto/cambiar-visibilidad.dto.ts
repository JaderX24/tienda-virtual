import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarVisibilidadProveedorDto {
    @ApiProperty({ description: 'Visibilidad del proveedor para los clientes' })
    @IsBoolean({ message: 'La visibilidad debe ser verdadero o falso' })
    esVisible!: boolean;
}
