import { TicketType } from '@prisma/client';

interface BaseProductData {
  name: string;
  amount: number;
  // shopId: string;
  usableDays: number;
  isActive: boolean;
}

export interface CreateTimeProductData extends BaseProductData {
  ticketType: typeof TicketType.TIME;
  purchasedMinutes: number;
}

export interface CreatePeriodProductData extends BaseProductData {
  ticketType: typeof TicketType.PERIOD;
  purchasedDurationDays: number;
}
