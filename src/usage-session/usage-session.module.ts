import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsageSessionRepository } from './usage-session.repository';
import { UsageSessionController } from './usage-session.controller';
import { UsageSessionProcessor } from './usage-session-processor';
import { UsageSessionService } from './usage-session.service';
import { TicketModule } from 'src/ticket/ticket.module';

@Module({
  imports: [
    TicketModule,
    BullModule.registerQueue({ name: 'usage-session' }),
  ],
  providers: [UsageSessionRepository, UsageSessionService, UsageSessionProcessor],
  controllers: [UsageSessionController],
  exports: [UsageSessionRepository],
})
export class UsageSessionModule {}
