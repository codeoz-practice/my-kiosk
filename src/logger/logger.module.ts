import { Module } from '@nestjs/common';
import { TransactionLoggerService } from './transaction-logger.service';

/**
 * 로거 모듈
 *
 * TransactionLoggerService를 다른 모듈에서 사용할 수 있도록 export합니다.
 *
 * 사용 방법:
 * @Module({ imports: [LoggerModule], providers: [YourService] })
 * export class YourModule {}
 */
@Module({
  providers: [TransactionLoggerService],
  exports: [TransactionLoggerService],
})
export class LoggerModule {}
