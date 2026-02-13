import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarPermisosDto {
    @ApiProperty({
        description: 'Array de IDs de permisos a asignar al rol',
        example: [1, 2, 3, 5],
        type: [Number],
    })
    @IsArray()
    @IsInt({ each: true })
    permisoIds: number[] = [];
}
