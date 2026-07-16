import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
    @ApiProperty({
        example: 'Ахмад',
        description: 'Новое имя пользователя',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        example: 'new@example.com',
        description: 'Новый email пользователя',
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail()
    email?: string;
}
