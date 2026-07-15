import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateHadithContentDto {
  @ApiProperty({ example: 'Поистине, дела оцениваются по намерениям...' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ example: ['хадис', 'ахляк'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'Сахих аль-Бухари, №1', required: false })
  @IsOptional()
  @IsString()
  source?: string;
}
