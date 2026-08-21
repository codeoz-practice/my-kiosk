import { TicketType } from '@prisma/client';

export class GetProductOutDto {
  id!: string;
  name!: string;
  ticketType!: TicketType;
  price!: number;
  purchasedMinutes?: number | null;
  purchasedDurationDays?: number | null;
  usableDays!: number;
  isActive!: boolean;
}
