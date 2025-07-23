// src/profile/dto/profile-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Уникальный ID пользователя',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @ApiProperty({
    example: 'Ахмад',
    description: 'Имя пользователя',
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: '2023-05-15T10:00:00Z',
    description: 'Дата регистрации',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-06-20T15:30:00Z',
    description: 'Дата последнего обновления',
    required: false,
  })
  updatedAt?: Date;
}
