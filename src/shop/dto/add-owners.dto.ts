import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsUUID } from 'class-validator';

export class AddOwnersDto {
  @ApiProperty({ description: '점주 아이디', required: true })
  @IsUUID('4', { message: '점주 ID는 유효한 UUID 형식이어야 합니다' })
  ownerId!: string;
}
