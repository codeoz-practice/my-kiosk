import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { TicketService } from 'src/ticket/ticket.service';
import { OrderOutData } from './order.types';

type OrderRow = Awaited<ReturnType<OrderRepository['getOrder']>>[number];

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly ticketService: TicketService,
  ) {}

  async createOrder(
    shopId: string,
    userId: string,
    products: { productId: string; quantity: number }[],
  ) {
    return await this.repository.createOrder(shopId, userId, products);
  }

  async getOrder(id?: string, shopId?: string, userId?: string) {
    const orders = await this.repository.getOrder(id, shopId, userId);
    return orders.map((order) => this.toOrderOutData(order));
  }

  private toOrderOutData(order: OrderRow): OrderOutData {
    return {
      id: order.id,
      shopId: order.shopId,
      userId: order.userId,
      originalPrice: order.originalPrice,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      orderItems: order.orderItems.map((item) => ({
        productId: item.productId,
        originalPrice: item.originalPrice,
        discountAmount: item.discountAmount,
        price: item.price,
        purchasedMinutes: item.purchasedMinutes,
        purchasedDurationDays: item.purchasedDurationDays,
        ticket: item.ticket
          ? this.ticketService.toTicketSummaryOutData(item.ticket)
          : null,
      })),
      payments: order.payments.map((payment) => ({
        type: payment.type,
        status: payment.status,
        price: payment.price,
        approvedAt: payment.approvedAt,
      })),
    };
  }
}
