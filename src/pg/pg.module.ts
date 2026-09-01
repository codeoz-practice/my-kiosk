import { Module } from '@nestjs/common';
import { PgService } from './pg.service';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [PgService],
  exports: [PgService],
})
export class PgModule {}
