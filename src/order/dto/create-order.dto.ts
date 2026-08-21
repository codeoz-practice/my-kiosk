import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: '매장 아이디', required: true })
  @IsUUID('4', { message: '매장 아이디는 유효한 UUID 형식이어야 합니다' })
  shopId!: string;

  @ApiProperty({ description: '사용자 아이디', required: true })
  @IsUUID('4', { message: '사용자 아이디는 유효한 UUID 형식이어야 합니다' })
  userId!: string;

  @IsArray()
  orderedProducts!: { productId: string; quantity: number }[];
}
