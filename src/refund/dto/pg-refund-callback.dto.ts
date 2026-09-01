import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class PgRefundCallbackDto {
  @IsBoolean()
  success!: boolean;

  @IsString()
  @IsNotEmpty()
  pgTransactionId!: string;

  @IsUUID()
  orderItemId!: string;

  @IsUUID()
  paymentCancelId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string | null;
}
