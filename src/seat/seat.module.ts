import { Module } from '@nestjs/common';
import { SeatRepository } from './seat.repository';
import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';
import { ShopSeatController } from './shop-seat.controller';

@Module({
  providers: [SeatRepository, SeatService],
  controllers: [SeatController, ShopSeatController],
  exports: [SeatRepository],
})
export class SeatModule {}
