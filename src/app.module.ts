import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LedgerModule } from './ledger/ledger.module';
import { ShopModule } from './shop/shop.module';
import { SeatModule } from './seat/seat.module';
import { UsageSessionModule } from './usage-session/usage-session.module';
import { PaymentModule } from './payment/payment.module';
import { ProductModule } from './product/product.module';
import { TicketModule } from './ticket/ticket.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // .env 로드 — 반드시 가장 앞에
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),
    PrismaModule, // @Global()이므로 한 번만 등록
    LedgerModule,
    ShopModule,
    SeatModule,
    UsageSessionModule,
    PaymentModule,
    ProductModule,
    TicketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
