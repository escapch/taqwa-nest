import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Машаллах, прекрасный хадис' })
  @IsString()
  @MinLength(1)
  text: string;
}
