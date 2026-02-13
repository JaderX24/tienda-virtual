import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoProveedorDto {
    @ApiProperty({ description: 'Estado activo del proveedor' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    esActivo!: boolean;
}
