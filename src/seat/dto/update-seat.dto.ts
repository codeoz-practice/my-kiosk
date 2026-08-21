import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateSeatDto {
  @ApiProperty({ description: '좌석 번호', required: false })
  @IsOptional()
  @IsNumber()
  number?: number;

  @ApiProperty({ description: '좌석 이름', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '좌석 이름은 100자 이하 여야 합니다' })
  name?: string;
}
