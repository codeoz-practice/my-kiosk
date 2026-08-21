import { TicketSummaryOutData } from 'src/ticket/ticket.types';

export interface OrderItemOutData {
  productId: string;
  originalPrice: number;
  discountAmount: number;
  price: number;
  purchasedMinutes: number | null;
  purchasedDurationDays: number | null;
  ticket: TicketSummaryOutData | null;
}
