import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrdenPasarelaItem {
    @ApiProperty({ description: 'ID de la pasarela' })
    @IsNumber({}, { message: 'El ID debe ser un número' })
    @Min(1, { message: 'El ID debe ser mayor a 0' })
    id!: number;

    @ApiProperty({ description: 'Nuevo orden de prioridad' })
    @IsNumber({}, { message: 'El orden de prioridad debe ser un número' })
    @Min(0, { message: 'El orden de prioridad no puede ser negativo' })
    ordenPrioridad!: number;
}

export class ActualizarOrdenDto {
    @ApiProperty({ description: 'Lista de pasarelas con su nuevo orden', type: [OrdenPasarelaItem] })
    @IsArray({ message: 'Se requiere un arreglo de pasarelas' })
    @ValidateNested({ each: true })
    @Type(() => OrdenPasarelaItem)
    pasarelas!: OrdenPasarelaItem[];
}
