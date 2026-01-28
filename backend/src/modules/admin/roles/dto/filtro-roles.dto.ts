import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FiltroRolesDto {
    @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    activo?: boolean;
}
