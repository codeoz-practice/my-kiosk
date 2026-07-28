import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerCommandService } from 'src/command/ledger-command.service';
import { LedgerQueryService } from 'src/query/ledget-query.service';

@Module({
  controllers: [LedgerController],
  providers: [LedgerCommandService, LedgerQueryService],
})
export class LedgerModule {}