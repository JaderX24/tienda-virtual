import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoEmpresaDto {
    @ApiProperty({ description: 'Estado activa de la empresa' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activa!: boolean;
}
