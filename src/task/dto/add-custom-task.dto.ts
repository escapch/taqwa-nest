import { IsString, MinLength } from 'class-validator';

export class AddCustomTaskDto {
  @IsString()
  @MinLength(2)
  title: string;
}
