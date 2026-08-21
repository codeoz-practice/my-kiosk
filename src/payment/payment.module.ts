import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrderModule } from 'src/order/order.module';
import { PaymentRepository } from './payment.repository';
import { OrderItemModule } from 'src/order-item/order-item.module';

@Module({
  imports: [OrderModule, OrderItemModule],
  providers: [PaymentService, PaymentRepository],
  controllers: [PaymentController],
})
export class PaymentModule {}
