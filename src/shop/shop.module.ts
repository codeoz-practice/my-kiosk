import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { ShopRepository } from './shop.repository';

@Module({
  controllers: [ShopController],
  providers: [ShopService, ShopRepository],
})
export class ShopModule {}