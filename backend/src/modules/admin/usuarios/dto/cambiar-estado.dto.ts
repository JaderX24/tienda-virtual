import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoDto {
    @ApiProperty({ description: 'Estado activo del usuario' })
    @IsBoolean()
    activo!: boolean;
}
