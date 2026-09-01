import { Module } from '@nestjs/common';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { RefundRepository } from './refund.repository';
import { LoggerModule } from 'src/logger/logger.module';
import { PgModule } from 'src/pg/pg.module';

@Module({
  imports: [LoggerModule, PgModule],
  providers: [RefundService, RefundRepository],
  controllers: [RefundController],
})
export class RefundModule {}
