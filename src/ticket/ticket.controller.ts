import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { TicketService } from './ticket.service';

@Controller('tickets')
export class TicketController {
  constructor(private readonly service: TicketService) {}

  // 티켓의 생성은 결재 완료 후 이루워지므로 api 앤드포인트는 제공하지 않는다.

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return this.service.getTicket(id);
  }

  // 티켓 조회(매장별)
  @Get('shops/:shopId')
  async getTicketsByShop(@Param('shopId', ParseUUIDPipe) shopId: string) {
    // TODO: TicketService에 매장별 조회 메서드 추가 필요
  }

  // 티켓 조회(사용자별)
  @Get('users/:userId')
  async getTicketsByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    // TODO: TicketService에 사용자별 조회 메서드 연결 필요 (Repository.getTicketByUser는 이미 존재)
  }
}
