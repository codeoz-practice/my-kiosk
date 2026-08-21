import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSeatDto {
  @ApiProperty({ description: '좌석 이름', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '이름은 100자 이하여야 합니다' })
  name?: string;

  @ApiProperty({ description: '좌석 번호', required: false })
  @IsOptional()
  @IsNumber()
  number?: number;
}
