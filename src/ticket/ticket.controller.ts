import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('tickets')
export class TicketController {
  constructor(private readonly service: TicketService) {}

  // 티켓의 생성은 결재 완료 후 이루워지므로 api 앤드포인트는 제공하지 않는다.

  // 티켓 조회(사용자별)
  @Get('user')
  async getTicketsByUser(@CurrentUser('userId') userId: string) {
    console.log(`🚀 | TicketController | getTicketsByUser | userId:`, userId);
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    console.log(`🚀 | TicketController | getTicket | getTicket:`);

    return this.service.getTicket(id);
  }

  // 티켓 조회(매장별)
  @Get('shops/:shopId')
  async getTicketsByShop(@Param('shopId', ParseUUIDPipe) shopId: string) {
    // TODO: TicketService에 매장별 조회 메서드 추가 필요
  }
}
