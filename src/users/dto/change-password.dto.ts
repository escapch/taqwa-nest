import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'oldPassword123',
        description: 'Текущий пароль',
    })
    @IsString()
    currentPassword: string;

    @ApiProperty({
        example: 'newPassword456',
        description: 'Новый пароль (минимум 6 символов)',
    })
    @IsString()
    @MinLength(6)
    newPassword: string;
}
