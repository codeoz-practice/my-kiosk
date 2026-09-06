import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtValidationResult } from 'src/auth/interfaces/jwt-payload.interface';
import { RefundService } from './refund.service';
import { GetRefundQueryDto, RefundDto, PgRefundCallbackDto } from './dto';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@Controller('refund')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  async refund(
    @CurrentUser() user: JwtValidationResult,
    @Body() dto: RefundDto,
  ) {
    return await this.refundService.refund(
      user.userId,
      dto.ticketId,
      dto.refundAmount,
    );
  }

  @Post('callback')
  async callbackRefund(@Body() dto: PgRefundCallbackDto) {
    await this.refundService.callback(
      dto.success,
      dto.paymentCancelId,
      dto.orderItemId,
      dto.amount,
      dto.reason,
    );
  }

  // 매장의 환불 내역 (status 미지정 시 전체 상태 조회)
  @Get('/shop/:shopId')
  async getRefundHistoryByShop(
    @Param('shopId') shopId: string,
    @Query() query?: GetRefundQueryDto,
  ) {
    return this.refundService.getRefundHistoryByShop(shopId, query?.status);
  }

  // 사용자의 환불 내역
  @Get('/user/:userId')
  async getRefundHistoryByUser(
    @Param('userId') userId: string,
    @Query() query?: GetRefundQueryDto,
  ) {
    return this.refundService.getRefundHistoryByUser(userId, query?.status);
  }
}
