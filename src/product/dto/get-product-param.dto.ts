import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ProductParamDto {
  @ApiProperty({ description: '매장 아이디' })
  @IsUUID('4', { message: '매장 아이디는 유효한 UUID 형식이어야 합니다' })
  shopId!: string;
}
