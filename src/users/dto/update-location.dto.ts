import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';

export class UpdateLocationDto {
    @ApiProperty({
        example: 43.238293,
        description: 'Широта (latitude)',
    })
    @IsNumber()
    @IsLatitude()
    latitude: number;

    @ApiProperty({
        example: 76.945465,
        description: 'Долгота (longitude)',
    })
    @IsNumber()
    @IsLongitude()
    longitude: number;
}
