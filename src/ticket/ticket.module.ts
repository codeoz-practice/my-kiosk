import { Module } from '@nestjs/common';
import { TicketRepository } from './ticket.repository';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';

@Module({
  providers: [TicketRepository, TicketService],
  controllers: [TicketController],
  exports: [TicketRepository, TicketService],
})
export class TicketModule {}
