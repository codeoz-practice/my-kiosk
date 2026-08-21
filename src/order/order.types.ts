import { OrderItemOutData } from 'src/order-item/order-item.types';
import { PaymentOutData } from 'src/payment/payment.types';
import { TicketSummaryOutData } from 'src/ticket/ticket.types';

export interface OrderOutData {
  id: string;
  shopId: string;
  userId: string;
  originalPrice: number;
  discountAmount: number;
  totalAmount: number;
  orderItems: OrderItemOutData[];
  payments: PaymentOutData[];
}
