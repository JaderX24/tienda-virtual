import { IsInt, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarPermisosRolDto {
    @ApiProperty({ description: 'IDs de permisos a asignar al rol (reemplaza los existentes)', type: [Number] })
    @IsArray()
    @IsInt({ each: true })
    permisoIds!: number[];
}

export class AgregarPermisosRolDto {
    @ApiProperty({ description: 'IDs de permisos a agregar al rol (sin eliminar los existentes)', type: [Number] })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    permisoIds!: number[];
}

export class RemoverPermisosRolDto {
    @ApiProperty({ description: 'IDs de permisos a remover del rol', type: [Number] })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    permisoIds!: number[];
}
