import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrderItem() {}

  async getOrderItem(orderId: string) {
    return await this.prisma.orderItem.findMany({
      where: { orderId },
    });
  }
}
