import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CambiarEstadoRolDto {
    @ApiProperty({
        description: 'Nuevo estado del rol',
        example: true,
    })
    @IsBoolean()
    activo: boolean = true;
}
