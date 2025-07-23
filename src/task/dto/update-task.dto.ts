import { IsString, MinLength } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @MinLength(2)
  title: string;
}
