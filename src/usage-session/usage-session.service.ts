import { Injectable } from '@nestjs/common';
import { UsageSessionRepository } from './usage-session.repository';
import { TicketRepository } from 'src/ticket/ticket.repository';
import { addDays, addMinutes } from 'date-fns';
import { withRetry } from 'src/common/utils/retry.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SortOrder } from './usage-session.types';
import { assertDefined } from 'src/common/utils/assert.util';

const mockExternalApi = async (waitMs: number = 1000) => {
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  if (Math.random() < 0.3) {
    return false;
  }
  return true;
};

@Injectable()
export class UsageSessionService {
  constructor(
    private readonly repository: UsageSessionRepository,
    private readonly ticketRepository: TicketRepository,
    @InjectQueue('usage-session')
    private readonly jobQueue: Queue<{ sessionId: string }>,
  ) {}

  private async addJob(sessionId: string, plannedEndAt: Date): Promise<string> {
    const delay = plannedEndAt.getTime() - Date.now();

    const job = await this.jobQueue.add(
      'expire-session',
      { sessionId }, // payload
      {
        delay: Math.max(delay, 0), // 만료 시점까지 지연
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return job.id!; // queue.add() 결과에서는 id 항상 존재 (런타임 보장)
  }

  private async removeJob(jobId: string): Promise<boolean> {
    const job = await this.jobQueue.getJob(jobId);
    if (!job) return false;
    await job.remove();
    return true;
  }

  // 세션 생성
  async createSession(
    ticketId: string,
    shopId: string,
    seatId: string,
    userId: string,
  ): Promise<void> {
    const ticket = await this.ticketRepository.getTicketById(ticketId);

    if (ticket.status === 'UNUSED' && ticket.type === 'PERIOD') {
      const now = new Date();
      ticket.activatedAt = now;
      ticket.expiresAt = addDays(now, ticket.purchasedDurationDays!);
    }

    let updateTicketData:
      | {
          activatedAt: Date;
          expiresAt: Date;
        }
      | undefined;

    let plannedEndAt: Date;

    // 만료 예상 시간 계산
    if (ticket.type === 'PERIOD') {
      assertDefined(ticket.expiresAt, 'PERIOD 티켓에 expiresAt이 없습니다');
      plannedEndAt = ticket.expiresAt;
    } else {
      assertDefined(
        ticket.remainingMinutes,
        'TIME 티켓에 remainingMinutes가 없습니다',
      );
      plannedEndAt = addMinutes(new Date(), ticket.remainingMinutes);
    }

    if (ticket.status === 'UNUSED' && ticket.type === 'PERIOD') {
      const now = new Date();
      ticket.activatedAt = now;
      ticket.expiresAt = addDays(now, ticket.purchasedDurationDays!);
      updateTicketData = {
        activatedAt: now,
        expiresAt: ticket.expiresAt,
      };
    }

    // Step 1. 세션 생성 (정기권 첫 입장이면 티켓 활성화도 같은 트랜잭션)
    const sessionId = await this.repository.createSession(
      ticketId,
      shopId,
      seatId,
      userId,
      plannedEndAt,
      new Date(),
      updateTicketData,
    );

    let bullmqJobId: string;
    try {
      // Step 2. BullMQ Job 생성 (이용권 만료 시 종료 처리 등록)
      bullmqJobId = await this.addJob(sessionId, plannedEndAt);
    } catch (error) {
      await this.repository.failSession(
        sessionId,
        'JOB_CREATION_FAILED',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }

    try {
      // Step 3. BullMQ Job Id를 session에 등록
      await this.repository.registerJobId(sessionId, bullmqJobId);
    } catch (error) {
      await this.removeJob(bullmqJobId);
      await this.repository.failSession(
        sessionId,
        'JOB_REGISTER_FAILED',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }

    try {
      // Step 4. 외부 api 호출(문열림 등) - 실패 시 최대 3회 재시도
      await withRetry(() => mockExternalApi(), {
        maxRetries: 3,
        delayMs: 500,
        isSuccess: (success) => success,
      });
    } catch (error) {
      // 보상: Job 취소 + session 실패 처리
      await this.removeJob(bullmqJobId);
      await this.repository.failSession(
        sessionId,
        'EXTERNAL_API_FAILED',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  // 세션 종료(퇴실)
  async endUsageSession(sessionId: string) {
    const { bullmqJobId } = await this.repository.endUsageSession(
      sessionId,
      new Date(),
    );
    if (bullmqJobId) await this.removeJob(bullmqJobId);
  }

  async getUsageSessionByShop(
    shopId: string,
    sortOrder: SortOrder = 'desc',
    limit: number = 10,
  ) {
    return await this.repository.getUsageSessionByShop(
      shopId,
      sortOrder,
      limit,
    );
  }

  async getUsageSessionByUser(
    userId: string,
    sortOrder: SortOrder = 'desc',
    limit: number = 10,
  ) {
    return await this.repository.getUsageSessionByUser(
      userId,
      sortOrder,
      limit,
    );
  }
}
