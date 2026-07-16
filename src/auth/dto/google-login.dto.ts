import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'ID-токен, полученный от Google Identity Services' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
