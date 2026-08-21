import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { RequestPaymentDto } from './dto/request-payment.dto';
import { PgCallbackDto } from './dto/pg-callback.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post()
  async requestPayment(
    @Body() dto: RequestPaymentDto,
  ): Promise<{ paymentId: string }> {
    return await this.service.requestPayment(dto.orderId, dto.userId);
  }

  @Get(':id')
  async getPayment(@Param('id', ParseUUIDPipe) id: string) {
    return await this.service.getPayment(id);
  }

  @Post('callback')
  async callbackPayment(@Body() dto: PgCallbackDto) {
    await this.service.callbackPayment({
      success: dto.success,
      pgTransactionId: dto.pgTransactionId,
      amount: dto.amount,
      reason: dto.reason ?? null,
    });
  }
}
