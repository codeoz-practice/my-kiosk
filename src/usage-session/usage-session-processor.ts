import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UsageSessionService } from './usage-session.service';
import { Job } from 'bullmq';

@Processor('usage-session')
export class UsageSessionProcessor extends WorkerHost {
  constructor(private readonly usageSessionService: UsageSessionService) {
    super();
  }

  async process(job: Job<{ sessionId: string }>): Promise<void> {
    if (job.name === 'expire-session') {
      // 만료 시점 도달 -> 세션 종료 처리 (endSession 재사용)
      await this.usageSessionService.endUsageSession(job.data.sessionId);
    }
  }
}
