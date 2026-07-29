import { Controller, Get, Param, Post } from '@nestjs/common';
import { SettleLedgerParamDto } from 'src/command/dto/settle-ledger.dto';
import { LedgerCommandService } from 'src/command/ledger-command.service';
import { SellerDashboardDto } from 'src/query/dto/seller-dashboard.dto';
import { LedgerQueryService } from 'src/query/ledger-query.service';

@Controller('ledgers')
export class LedgerController {
  constructor(
    private readonly commandService: LedgerCommandService,
    private readonly queryService: LedgerQueryService
  ) {}

  @Post(':id/settle')
  async settle(@Param() params: SettleLedgerParamDto): Promise<void> {
    await this.commandService.settle(params.id);
  }

  @Get('seller/:sellerId/dashboard')
  async getDashboard(@Param('sellerId') sellerId: string): Promise<SellerDashboardDto> {
    return this.queryService.getSellerDashboard(sellerId);
  }
}
