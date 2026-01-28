import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Token de actualización',
    })
    @IsString()
    refreshToken!: string;
}
