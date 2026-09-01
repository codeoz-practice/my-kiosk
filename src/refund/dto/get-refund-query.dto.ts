import { IsEnum } from 'class-validator';
import { PaymentCancelStatus } from '../refund.types';

export class GetRefundQueryDto {
  @IsEnum(PaymentCancelStatus)
  status?: PaymentCancelStatus;
}
