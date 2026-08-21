import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetOrderQueryDto {
  @ApiProperty({ description: '주문 아이디', required: false })
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiProperty({ description: '매장 아이디', required: false })
  @IsOptional()
  @IsUUID('4')
  shopId?: string;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsOptional()
  @IsUUID('4')
  userId?: string;
}
