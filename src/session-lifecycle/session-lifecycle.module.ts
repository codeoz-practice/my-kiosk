import { Module } from '@nestjs/common';
import { SessionLifecycleService } from './session-lifecycle.service';

@Module({
  providers: [SessionLifecycleService],
  exports: [SessionLifecycleService],
})
export class SessionLifecycleModule {}
