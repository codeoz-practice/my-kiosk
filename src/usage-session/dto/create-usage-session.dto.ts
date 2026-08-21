import { IsUUID } from 'class-validator';

export class CreateUsageSessionDto {
  @IsUUID('4')
  ticketId!: string;

  @IsUUID('4')
  shopId!: string;

  @IsUUID('4')
  seatId!: string;

  @IsUUID('4')
  userId!: string;
}
