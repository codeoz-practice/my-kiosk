import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrderQueryDto } from './dto/get-order-query.dto';
import { OrderOutData } from './order.types';

@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    return await this.service.createOrder(
      dto.shopId,
      dto.userId,
      dto.orderedProducts,
    );
  }

  @Get()
  async queryOrder(@Query() query: GetOrderQueryDto): Promise<OrderOutData[]> {
    return await this.service.getOrder(query.id, query.shopId, query.userId);
  }
}
