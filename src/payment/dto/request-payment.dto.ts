import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RequestPaymentDto {
  @ApiProperty({ description: '주문 아이디' })
  @IsUUID('4')
  orderId!: string;

  // TODO: 인증 도입 후 토큰에서 추출하도록 변경하고 이 필드는 제거한다.
  @ApiProperty({ description: '결제 요청자 아이디(임시 — 인증 도입 전)' })
  @IsUUID('4')
  userId!: string;
}
