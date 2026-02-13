import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CambiarEstadoColaboradorDto {
    @ApiProperty({ description: 'Estado activo del colaborador' })
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    activo!: boolean;

    @ApiPropertyOptional({ description: 'Motivo de inactivación' })
    @IsOptional()
    @IsString({ message: 'El motivo debe ser texto' })
    @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres' })
    motivoInactivacion?: string;
}
