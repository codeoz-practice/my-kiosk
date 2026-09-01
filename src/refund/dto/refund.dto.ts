import { IsNumber, IsUUID, Min } from 'class-validator';
export class RefundDto {
  @IsUUID('4', { message: '티켓 아이디는 유효한 UUID 형식이어야 합니다' })
  ticketId!: string;

  @IsNumber()
  @Min(0)
  refundAmount!: number; // 환불 금액
}
