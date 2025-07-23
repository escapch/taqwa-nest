import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Пароль (минимум 6 символов)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Ахмад',
    description: 'Имя пользователя (опционально)',
    required: false,
  })
  @IsString()
  name?: string;
}
