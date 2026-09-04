import { TicketSummaryOutData } from 'src/ticket/ticket.types';

export interface OrderItemOutData {
  productId: string;
  originalAmount: number;
  discountAmount: number;
  amount: number;
  purchasedMinutes: number | null;
  purchasedDurationDays: number | null;
  ticket: TicketSummaryOutData | null;
}
