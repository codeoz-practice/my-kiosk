import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TicketRepository } from './ticket.repository';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TicketPauseRepository } from './ticket-pause/ticket-pause.repository';
import { TicketPauseService } from './ticket-pause/ticket-pause.service';
import { TicketPauseController } from './ticket-pause/ticket-pause.controller';
import { SessionLifecycleModule } from 'src/session-lifecycle/session-lifecycle.module';

@Module({
  imports: [
    SessionLifecycleModule,
    BullModule.registerQueue({ name: 'usage-session' }),
  ],
  providers: [
    TicketRepository,
    TicketService,
    TicketPauseRepository,
    TicketPauseService,
  ],
  controllers: [TicketController, TicketPauseController],
  exports: [TicketRepository, TicketService, TicketPauseService],
})
export class TicketModule {}
