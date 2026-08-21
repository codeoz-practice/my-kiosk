import { Module } from '@nestjs/common';
import { OrderItemRepository } from './order-item.repository';

@Module({
  providers: [OrderItemRepository],
  exports: [OrderItemRepository],
})
export class OrderItemModule {}
