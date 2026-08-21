import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { ShopRepository } from './shop.repository';
import { SeatModule } from 'src/seat/seat.module';
import { UsageSessionModule } from 'src/usage-session/usage-session.module';

@Module({
  imports: [SeatModule, UsageSessionModule],
  controllers: [ShopController],
  providers: [ShopService, ShopRepository],
})
export class ShopModule {}