import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class PgCallbackDto {
  @IsBoolean()
  success!: boolean;

  @IsString()
  @IsNotEmpty()
  pgTransactionId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string | null;
}
