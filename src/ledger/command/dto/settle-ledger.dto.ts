import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

// export class SettleLedgerDto {
//   @ApiPropertyOptional({ description: '중복 요청 방지를 위한 멱등성 키' })
//   @IsOptional()
//   @IsString()
//   idempotencyKey?: string;
// }

export class SettleLedgerParamDto {
  @ApiProperty({ description: '정산할 Ledger ID' })
  @IsUUID('4')
  id: string;
}
